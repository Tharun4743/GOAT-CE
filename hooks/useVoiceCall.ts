import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { User } from '../types';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected';

export interface UseVoiceCallReturn {
  callStatus: CallStatus;
  activePeer: { socketId: string; user: User } | null;
  incomingCall: { callerSocketId: string; caller: User } | null;
  isMuted: boolean;
  localIsSpeaking: boolean;
  peerIsSpeaking: boolean;
  callDuration: number;
  error: string | null;
  initiateCall: (targetSocketId: string, targetUser: User) => void;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endActiveCall: () => void;
  toggleMute: () => void;
}

export function useVoiceCall(
  socket: Socket | null,
  roomId: string | undefined,
  currentUser: User | null
): UseVoiceCallReturn {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [activePeer, setActivePeer] = useState<{ socketId: string; user: User } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callerSocketId: string; caller: User } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const [peerIsSpeaking, setPeerIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // References for WebRTC and Audio
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringtoneOscillatorsRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);

  // Keep state refs for async callbacks
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const activePeerRef = useRef(activePeer);
  activePeerRef.current = activePeer;
  const callStatusRef = useRef(callStatus);
  callStatusRef.current = callStatus;

  // --- Web Audio Synthesized Ringtone Generator ---
  const stopRingtone = useCallback(() => {
    if (ringtoneOscillatorsRef.current) {
      try {
        ringtoneOscillatorsRef.current.osc1.stop();
        ringtoneOscillatorsRef.current.osc2.stop();
        ringtoneOscillatorsRef.current.gain.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      ringtoneOscillatorsRef.current = null;
    }
  }, []);

  const playRingtone = useCallback((type: 'outgoing' | 'incoming') => {
    stopRingtone();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      audioContextRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Standard North American / European ringing tone frequencies
      if (type === 'outgoing') {
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);
      } else {
        osc1.frequency.setValueAtTime(480, ctx.currentTime);
        osc2.frequency.setValueAtTime(520, ctx.currentTime);
      }

      // Pulse cadence (ringing rhythm: 1.5s ring, 2.5s silence)
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      const now = ctx.currentTime;
      for (let i = 0; i < 20; i++) {
        const ringStart = now + i * 3.5;
        gainNode.gain.setValueAtTime(0.08, ringStart);
        gainNode.gain.setValueAtTime(0, ringStart + 1.2);
      }

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();

      ringtoneOscillatorsRef.current = { osc1, osc2, gain: gainNode };
    } catch (err) {
      console.warn('Could not initialize audio ringtone:', err);
    }
  }, [stopRingtone]);

  // Cleanup helper
  const cleanupCall = useCallback(() => {
    stopRingtone();

    // Stop duration timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);

    // Stop volume detection
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop local microphone tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close WebRTC peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop and remove remote audio element
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }

    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;

    setLocalIsSpeaking(false);
    setPeerIsSpeaking(false);
    setIsMuted(false);
    setActivePeer(null);
    setIncomingCall(null);
    setCallStatus('idle');
  }, [stopRingtone]);

  // Voice Activity Detection loop (Volume Pulse)
  const startVolumeDetection = useCallback(() => {
    const checkVolume = () => {
      if (callStatusRef.current !== 'connected') return;

      // Local mic speaking volume
      if (localAnalyserRef.current && !isMutedRef.current) {
        const data = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
        localAnalyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setLocalIsSpeaking(sum / data.length > 15);
      } else {
        setLocalIsSpeaking(false);
      }

      // Remote peer speaking volume
      if (remoteAnalyserRef.current) {
        const data = new Uint8Array(remoteAnalyserRef.current.frequencyBinCount);
        remoteAnalyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setPeerIsSpeaking(sum / data.length > 15);
      } else {
        setPeerIsSpeaking(false);
      }

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    };

    animationFrameRef.current = requestAnimationFrame(checkVolume);
  }, []);

  // Helper to get local microphone with strict echo cancellation
  const getMicrophoneStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1, // Mono avoids phase feedback and echo
        sampleRate: 48000
      },
      video: false
    });
    localStreamRef.current = stream;

    // Set up AudioContext AnalyserNode for volume detection
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      // NOTE: Analyser is NEVER connected to ctx.destination to avoid local echo loop!
      localAnalyserRef.current = analyser;
    } catch (e) {
      console.warn('Audio analyser init error:', e);
    }

    return stream;
  }, []);

  // Helper to create and configure RTCPeerConnection
  const setupPeerConnection = useCallback((targetSocketId: string, isInitiator: boolean) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket?.connected) {
        socket.emit('voice-signal', {
          to: targetSocketId,
          signal: {
            type: 'candidate',
            candidate: event.candidate
          }
        });
      }
    };

    // Handle remote track (play audio)
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (!remoteStream) return;

      // Use a single, dedicated audio playback element
      if (!remoteAudioRef.current) {
        const audio = new Audio();
        audio.autoplay = true;
        (audio as any).playsInline = true;
        audio.volume = 1.0;
        remoteAudioRef.current = audio;
      }
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((err) => {
        console.warn('Playback blocked, will resume on interaction:', err);
      });

      // Volume analysis for remote peer
      try {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          const remoteSource = audioContextRef.current.createMediaStreamSource(remoteStream);
          const remoteAnalyser = audioContextRef.current.createAnalyser();
          remoteAnalyser.fftSize = 256;
          remoteSource.connect(remoteAnalyser);
          remoteAnalyserRef.current = remoteAnalyser;
        }
      } catch (e) {
        console.warn('Remote analyser error:', e);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupCall();
      }
    };

    return pc;
  }, [socket, cleanupCall]);

  // 1. User A initiates call to User B
  const initiateCall = useCallback((targetSocketId: string, targetUser: User) => {
    if (!socket || !socket.connected || !currentUser) {
      setError('Cannot initiate call: Not connected to workspace.');
      return;
    }
    if (
      targetSocketId === socket.id ||
      targetUser.id === currentUser.id ||
      targetUser.id === socket.id ||
      targetUser.username.trim().toLowerCase() === currentUser.username.trim().toLowerCase()
    ) {
      console.warn('Cannot initiate self-call.');
      return;
    }

    setError(null);
    setActivePeer({ socketId: targetSocketId, user: targetUser });
    setCallStatus('calling');
    playRingtone('outgoing');

    // Notify target user via socket
    socket.emit('direct-call-initiate', {
      toSocketId: targetSocketId,
      caller: currentUser
    });
  }, [socket, currentUser, playRingtone]);

  // 2. User B accepts incoming call
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall || !socket || !socket.connected) return;

    try {
      stopRingtone();
      setError(null);

      // Acquire microphone
      await getMicrophoneStream();

      const callerSocketId = incomingCall.callerSocketId;
      setActivePeer({ socketId: callerSocketId, user: incomingCall.caller });
      setIncomingCall(null);
      setCallStatus('connected');

      // Set up peer connection
      setupPeerConnection(callerSocketId, false);

      // Notify caller that call was accepted
      socket.emit('direct-call-accept', {
        toSocketId: callerSocketId
      });

      // Start duration timer
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Start volume detection
      startVolumeDetection();
    } catch (err: any) {
      console.error('Error accepting call:', err);
      cleanupCall();
      setError('Could not access microphone to accept call.');
    }
  }, [incomingCall, socket, stopRingtone, getMicrophoneStream, setupPeerConnection, startVolumeDetection, cleanupCall]);

  // 3. User B rejects incoming call
  const rejectIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    stopRingtone();

    if (socket?.connected) {
      socket.emit('direct-call-reject', {
        toSocketId: incomingCall.callerSocketId
      });
    }
    setIncomingCall(null);
    setCallStatus('idle');
  }, [incomingCall, socket, stopRingtone]);

  // 4. End active call or cancel outgoing call
  const endActiveCall = useCallback(() => {
    const peerSocketId = activePeerRef.current?.socketId || incomingCall?.callerSocketId;
    if (socket?.connected && peerSocketId) {
      socket.emit('direct-call-end', {
        toSocketId: peerSocketId
      });
    }
    cleanupCall();
  }, [socket, incomingCall, cleanupCall]);

  // 5. Toggle Mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const newMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !newMuted;
    });
    setIsMuted(newMuted);

    if (socket?.connected && activePeerRef.current) {
      socket.emit('voice-status-update', {
        toSocketId: activePeerRef.current.socketId,
        isMuted: newMuted
      });
    }
  }, [isMuted, socket]);

  // Socket signaling event listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming call received
    const handleDirectCallIncoming = ({ fromSocketId, caller }: { fromSocketId: string; caller: User }) => {
      if (callStatusRef.current !== 'idle') {
        // Already on a call -> auto-reject busy
        socket.emit('direct-call-reject', { toSocketId: fromSocketId });
        return;
      }

      setIncomingCall({ callerSocketId: fromSocketId, caller });
      setCallStatus('incoming');
      playRingtone('incoming');
    };

    // Caller receives notice that call was accepted -> create WebRTC offer
    const handleDirectCallAccepted = async ({ fromSocketId }: { fromSocketId: string }) => {
      stopRingtone();
      setCallStatus('connected');

      try {
        await getMicrophoneStream();
        const pc = setupPeerConnection(fromSocketId, true);

        // Initiate WebRTC offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('voice-signal', {
          to: fromSocketId,
          signal: {
            type: 'offer',
            sdp: pc.localDescription
          }
        });

        // Start duration timer
        setCallDuration(0);
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);

        startVolumeDetection();
      } catch (err) {
        console.error('Failed to establish WebRTC after call accepted:', err);
        cleanupCall();
      }
    };

    // Call was rejected
    const handleDirectCallRejected = () => {
      stopRingtone();
      setError('Call was declined.');
      cleanupCall();
      setTimeout(() => setError(null), 3500);
    };

    // Call was ended by other party
    const handleDirectCallEnded = () => {
      stopRingtone();
      cleanupCall();
    };

    // WebRTC signaling messages: offer, answer, ice-candidate
    const handleVoiceSignal = async ({ from, signal }: { from: string; signal: any }) => {
      if (!from || from === socket.id) return;
      try {
        let pc = peerConnectionRef.current;
        if (!pc && activePeerRef.current) {
          pc = setupPeerConnection(from, false);
        }
        if (!pc) return;

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('voice-signal', {
            to: from,
            signal: {
              type: 'answer',
              sdp: pc.localDescription
            }
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === 'candidate' && signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn('ICE candidate error:', e);
          }
        }
      } catch (err) {
        console.error('WebRTC signal handling error:', err);
      }
    };

    socket.on('direct-call-incoming', handleDirectCallIncoming);
    socket.on('direct-call-accepted', handleDirectCallAccepted);
    socket.on('direct-call-rejected', handleDirectCallRejected);
    socket.on('direct-call-ended', handleDirectCallEnded);
    socket.on('voice-signal', handleVoiceSignal);

    return () => {
      socket.off('direct-call-incoming', handleDirectCallIncoming);
      socket.off('direct-call-accepted', handleDirectCallAccepted);
      socket.off('direct-call-rejected', handleDirectCallRejected);
      socket.off('direct-call-ended', handleDirectCallEnded);
      socket.off('voice-signal', handleVoiceSignal);
    };
  }, [socket, playRingtone, stopRingtone, getMicrophoneStream, setupPeerConnection, startVolumeDetection, cleanupCall]);

  // Teardown when unmounting
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  return {
    callStatus,
    activePeer,
    incomingCall,
    isMuted,
    localIsSpeaking,
    peerIsSpeaking,
    callDuration,
    error,
    initiateCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endActiveCall,
    toggleMute
  };
}
