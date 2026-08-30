import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { User, VoicePeer, CallStatus } from '../types';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

interface PeerConnectionRecord {
  socketId: string;
  user: User;
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  analyser: AnalyserNode | null;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

export interface IncomingCallInfo {
  callerSocketId: string;
  caller: User;
  isGroup?: boolean;
}

export interface UseVoiceCallReturn {
  callStatus: CallStatus;
  isInCall: boolean;
  activePeer: { socketId: string; user: User } | null;
  voicePeers: VoicePeer[];
  incomingCall: IncomingCallInfo | null;
  isMuted: boolean;
  isDeafened: boolean;
  localIsSpeaking: boolean;
  peerIsSpeaking: boolean;
  callDuration: number;
  error: string | null;
  initiateCall: (targetSocketId: string, targetUser: User) => void;
  callRoom: () => void;
  joinVoiceCall: () => Promise<void>;
  leaveVoiceCall: () => void;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endActiveCall: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
}

export function useVoiceCall(
  socket: Socket | null,
  roomId: string | undefined,
  currentUser: User | null
): UseVoiceCallReturn {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [voicePeers, setVoicePeers] = useState<VoicePeer[]>([]);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const [peerIsSpeaking, setPeerIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // References for WebRTC Mesh and Audio
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerConnectionRecord>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringtoneOscillatorsRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);

  // Keep state refs for async callbacks
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const isDeafenedRef = useRef(isDeafened);
  isDeafenedRef.current = isDeafened;
  const callStatusRef = useRef(callStatus);
  callStatusRef.current = callStatus;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

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

      if (type === 'outgoing') {
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);
      } else {
        osc1.frequency.setValueAtTime(480, ctx.currentTime);
        osc2.frequency.setValueAtTime(520, ctx.currentTime);
      }

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

  // Sync voicePeers state helper
  const syncVoicePeersState = useCallback(() => {
    const list: VoicePeer[] = [];
    peersRef.current.forEach((p) => {
      list.push({
        socketId: p.socketId,
        user: p.user,
        isMuted: p.isMuted,
        isDeafened: p.isDeafened,
        isSpeaking: p.isSpeaking
      });
    });
    setVoicePeers(list);
  }, []);

  // Cleanup all peers and local stream
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

    // Close all WebRTC peer connections
    peersRef.current.forEach((peer) => {
      try {
        peer.pc.close();
        peer.audio.pause();
        peer.audio.srcObject = null;
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    peersRef.current.clear();

    localAnalyserRef.current = null;

    setLocalIsSpeaking(false);
    setPeerIsSpeaking(false);
    setIsMuted(false);
    setIsDeafened(false);
    setVoicePeers([]);
    setIncomingCall(null);
    setCallStatus('idle');
  }, [stopRingtone]);

  // Remove a single peer from the mesh
  const removePeer = useCallback((socketId: string) => {
    const peer = peersRef.current.get(socketId);
    if (peer) {
      try {
        peer.pc.close();
        peer.audio.pause();
        peer.audio.srcObject = null;
      } catch (e) {
        // Ignore
      }
      peersRef.current.delete(socketId);
      syncVoicePeersState();
    }
  }, [syncVoicePeersState]);

  // Voice Activity Detection loop (Volume Pulse) across local mic and all peers
  const startVolumeDetection = useCallback(() => {
    const checkVolume = () => {
      if (callStatusRef.current !== 'connected') return;

      // Local mic speaking volume
      if (localAnalyserRef.current && !isMutedRef.current) {
        const data = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
        localAnalyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const isSpeakingNow = sum / data.length > 15;
        setLocalIsSpeaking(isSpeakingNow);
      } else {
        setLocalIsSpeaking(false);
      }

      // Check each remote peer analyser
      let anyPeerSpeaking = false;
      let peersStateChanged = false;

      peersRef.current.forEach((peer) => {
        if (peer.analyser && !peer.isMuted) {
          const data = new Uint8Array(peer.analyser.frequencyBinCount);
          peer.analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const isPeerSpeaking = sum / data.length > 15;
          if (isPeerSpeaking) anyPeerSpeaking = true;
          if (peer.isSpeaking !== isPeerSpeaking) {
            peer.isSpeaking = isPeerSpeaking;
            peersStateChanged = true;
          }
        } else if (peer.isSpeaking) {
          peer.isSpeaking = false;
          peersStateChanged = true;
        }
      });

      setPeerIsSpeaking(anyPeerSpeaking);
      if (peersStateChanged) {
        syncVoicePeersState();
      }

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(checkVolume);
  }, [syncVoicePeersState]);

  // Acquire local microphone with echo cancellation
  const getMicrophoneStream = useCallback(async () => {
    if (localStreamRef.current && localStreamRef.current.active) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000
      },
      video: false
    });
    localStreamRef.current = stream;

    // Set up AudioContext AnalyserNode for local volume detection
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
      localAnalyserRef.current = analyser;
    } catch (e) {
      console.warn('Audio analyser init error:', e);
    }

    return stream;
  }, []);

  // Helper to create and configure RTCPeerConnection for a specific remote peer
  const createPeerConnection = useCallback((
    targetSocketId: string,
    targetUser: User,
    isInitiator: boolean
  ) => {
    // If peer connection already exists, close old one first
    if (peersRef.current.has(targetSocketId)) {
      removePeer(targetSocketId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    const audio = new Audio();
    audio.autoplay = true;
    (audio as any).playsInline = true;
    audio.volume = isDeafenedRef.current ? 0 : 1.0;

    let analyserNode: AnalyserNode | null = null;

    const record: PeerConnectionRecord = {
      socketId: targetSocketId,
      user: targetUser,
      pc,
      audio,
      analyser: null,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false
    };

    // Add local tracks to this peer connection
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

    // Handle remote track (play audio from this peer)
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (!remoteStream) return;

      audio.srcObject = remoteStream;
      audio.play().catch((err) => {
        console.warn(`Playback blocked for peer ${targetSocketId}:`, err);
      });

      // Volume analysis for remote peer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = audioContextRef.current || new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        audioContextRef.current = ctx;

        if (ctx.state !== 'closed') {
          const remoteSource = ctx.createMediaStreamSource(remoteStream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          remoteSource.connect(analyser);
          record.analyser = analyser;
        }
      } catch (e) {
        console.warn('Remote analyser error:', e);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removePeer(targetSocketId);
      }
    };

    peersRef.current.set(targetSocketId, record);
    syncVoicePeersState();

    return pc;
  }, [socket, removePeer, syncVoicePeersState]);

  // Join Room Voice Mesh (1-to-many)
  const joinVoiceCall = useCallback(async () => {
    if (!socket || !socket.connected || !roomIdRef.current || !currentUserRef.current) {
      setError('Cannot join voice: Not connected to workspace.');
      return;
    }

    try {
      setError(null);
      stopRingtone();
      setIncomingCall(null);

      // Acquire microphone
      await getMicrophoneStream();

      setCallStatus('connected');

      // Start duration timer
      if (!callTimerRef.current) {
        setCallDuration(0);
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }

      // Notify server we joined the room's voice session
      socket.emit('voice-join-room', {
        roomId: roomIdRef.current,
        user: currentUserRef.current
      });

      startVolumeDetection();
    } catch (err: any) {
      console.error('Error joining voice call:', err);
      cleanupCall();
      setError('Could not access microphone to join voice.');
    }
  }, [socket, stopRingtone, getMicrophoneStream, startVolumeDetection, cleanupCall]);

  // Call Room (1-to-Many Group Call: rings everyone in the room & joins voice)
  const callRoom = useCallback(async () => {
    if (!socket || !socket.connected || !roomIdRef.current || !currentUserRef.current) {
      setError('Cannot call room: Not connected to workspace.');
      return;
    }

    try {
      setError(null);
      // Notify all room members that a group call has started
      socket.emit('voice-group-call-initiate', {
        roomId: roomIdRef.current,
        caller: currentUserRef.current
      });

      // Join the room voice mesh
      await joinVoiceCall();
    } catch (err: any) {
      console.error('Error initiating group room call:', err);
      setError('Failed to initiate group call.');
    }
  }, [socket, joinVoiceCall]);

  // Initiate direct 1-to-1 call (rings target peer and joins voice mesh)
  const initiateCall = useCallback(async (targetSocketId: string, targetUser: User) => {
    if (!socket || !socket.connected || !currentUserRef.current) {
      setError('Cannot initiate call: Not connected to workspace.');
      return;
    }
    if (
      targetSocketId === socket.id ||
      targetUser.id === currentUserRef.current.id ||
      targetUser.id === socket.id ||
      targetUser.username.trim().toLowerCase() === currentUserRef.current.username.trim().toLowerCase()
    ) {
      console.warn('Cannot initiate self-call.');
      return;
    }

    try {
      setError(null);
      setCallStatus('calling');
      playRingtone('outgoing');

      // Notify target user via socket
      socket.emit('direct-call-initiate', {
        toSocketId: targetSocketId,
        caller: currentUserRef.current
      });

      // Pre-acquire microphone & join mesh
      await getMicrophoneStream();
    } catch (err: any) {
      console.error('Error initiating call:', err);
      cleanupCall();
      setError('Could not access microphone.');
    }
  }, [socket, playRingtone, getMicrophoneStream, cleanupCall]);

  // Accept incoming call (Group or 1-to-1)
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall || !socket || !socket.connected) return;
    try {
      stopRingtone();
      const callerSocketId = incomingCall.callerSocketId;

      if (!incomingCall.isGroup) {
        socket.emit('direct-call-accept', {
          toSocketId: callerSocketId
        });
      }

      await joinVoiceCall();
    } catch (err: any) {
      console.error('Error accepting call:', err);
      cleanupCall();
      setError('Could not accept voice call.');
    }
  }, [incomingCall, socket, stopRingtone, joinVoiceCall, cleanupCall]);

  // Reject incoming call
  const rejectIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    stopRingtone();

    if (socket?.connected && !incomingCall.isGroup) {
      socket.emit('direct-call-reject', {
        toSocketId: incomingCall.callerSocketId
      });
    }
    setIncomingCall(null);
    if (callStatus === 'incoming') {
      setCallStatus('idle');
    }
  }, [incomingCall, socket, stopRingtone, callStatus]);

  // Leave active voice call
  const leaveVoiceCall = useCallback(() => {
    if (socket?.connected && roomIdRef.current) {
      socket.emit('voice-leave-room', {
        roomId: roomIdRef.current
      });
    }
    cleanupCall();
  }, [socket, cleanupCall]);

  // End active call (alias for leave)
  const endActiveCall = useCallback(() => {
    leaveVoiceCall();
  }, [leaveVoiceCall]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const newMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !newMuted;
    });
    setIsMuted(newMuted);

    if (socket?.connected && roomIdRef.current) {
      socket.emit('voice-status-update', {
        roomId: roomIdRef.current,
        isMuted: newMuted,
        isDeafened
      });
    }
  }, [isMuted, isDeafened, socket]);

  // Toggle Deafen
  const toggleDeafen = useCallback(() => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);

    // Mute/unmute all peer audio elements
    peersRef.current.forEach((peer) => {
      peer.audio.volume = newDeafened ? 0 : 1.0;
    });

    if (socket?.connected && roomIdRef.current) {
      socket.emit('voice-status-update', {
        roomId: roomIdRef.current,
        isMuted,
        isDeafened: newDeafened
      });
    }
  }, [isDeafened, isMuted, socket]);

  // Socket signaling event listeners
  useEffect(() => {
    if (!socket) return;

    // 1. Group Call Incoming Invite from a room peer
    const handleGroupCallIncoming = ({ callerSocketId, caller }: { callerSocketId: string; caller: User }) => {
      if (callStatusRef.current === 'connected') {
        // Already in call, ignore
        return;
      }
      setIncomingCall({ callerSocketId, caller, isGroup: true });
      setCallStatus('incoming');
      playRingtone('incoming');
    };

    // 2. Direct 1-to-1 Incoming Call
    const handleDirectCallIncoming = ({ fromSocketId, caller }: { fromSocketId: string; caller: User }) => {
      if (callStatusRef.current === 'connected') {
        socket.emit('direct-call-reject', { toSocketId: fromSocketId });
        return;
      }
      setIncomingCall({ callerSocketId: fromSocketId, caller, isGroup: false });
      setCallStatus('incoming');
      playRingtone('incoming');
    };

    // 3. Direct Call Accepted
    const handleDirectCallAccepted = async ({ fromSocketId }: { fromSocketId: string }) => {
      stopRingtone();
      await joinVoiceCall();
    };

    // 4. Direct Call Rejected
    const handleDirectCallRejected = () => {
      stopRingtone();
      setError('Call was declined.');
      cleanupCall();
      setTimeout(() => setError(null), 3500);
    };

    // 5. Direct Call Ended
    const handleDirectCallEnded = () => {
      stopRingtone();
      cleanupCall();
    };

    // 6. When joining voice room: received existing peers in the call -> Initiate WebRTC offers to all existing peers
    const handleVoiceRoomPeers = async ({ peers }: { peers: Array<{ socketId: string; user: User; isMuted: boolean; isDeafened: boolean }> }) => {
      if (!localStreamRef.current) {
        await getMicrophoneStream();
      }

      for (const peerInfo of peers) {
        if (peerInfo.socketId === socket.id) continue;
        try {
          const pc = createPeerConnection(peerInfo.socketId, peerInfo.user, true);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('voice-signal', {
            to: peerInfo.socketId,
            signal: {
              type: 'offer',
              sdp: pc.localDescription,
              user: currentUserRef.current
            }
          });
        } catch (err) {
          console.error(`Failed to initiate offer to peer ${peerInfo.socketId}:`, err);
        }
      }
    };

    // 7. Another peer joined the voice room
    const handleVoicePeerJoined = ({ socketId, user }: { socketId: string; user: User }) => {
      if (socketId === socket.id) return;
      // New peer joined: wait for their offer (handled in voice-signal)
    };

    // 8. A peer left voice room
    const handleVoicePeerLeft = ({ socketId }: { socketId: string }) => {
      removePeer(socketId);
    };

    // 9. WebRTC SDP Offer / Answer / ICE Candidate Relay
    const handleVoiceSignal = async ({ from, signal }: { from: string; signal: any }) => {
      if (!from || from === socket.id) return;

      try {
        let peerRecord = peersRef.current.get(from);

        if (signal.type === 'offer') {
          // Received offer: ensure mic stream and create peer connection as responder
          if (!localStreamRef.current) {
            await getMicrophoneStream();
          }

          const senderUser = signal.user || peerRecord?.user || { id: from, username: 'Collaborator', color: '#6366f1' };
          const pc = createPeerConnection(from, senderUser, false);

          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('voice-signal', {
            to: from,
            signal: {
              type: 'answer',
              sdp: pc.localDescription,
              user: currentUserRef.current
            }
          });
        } else if (signal.type === 'answer') {
          if (peerRecord?.pc) {
            await peerRecord.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (peerRecord?.pc) {
            try {
              await peerRecord.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              console.warn('ICE candidate addition error:', e);
            }
          }
        }
      } catch (err) {
        console.error('WebRTC signal handling error:', err);
      }
    };

    // 10. Voice peer status updates (Mute / Deafen / Speaking)
    const handleVoicePeerStatus = ({ socketId, isMuted: peerMuted, isDeafened: peerDeafened, isSpeaking: peerSpeaking }: any) => {
      const peer = peersRef.current.get(socketId);
      if (peer) {
        if (peerMuted !== undefined) peer.isMuted = peerMuted;
        if (peerDeafened !== undefined) peer.isDeafened = peerDeafened;
        if (peerSpeaking !== undefined) peer.isSpeaking = peerSpeaking;
        syncVoicePeersState();
      }
    };

    socket.on('voice-group-call-incoming', handleGroupCallIncoming);
    socket.on('direct-call-incoming', handleDirectCallIncoming);
    socket.on('direct-call-accepted', handleDirectCallAccepted);
    socket.on('direct-call-rejected', handleDirectCallRejected);
    socket.on('direct-call-ended', handleDirectCallEnded);
    socket.on('voice-room-peers', handleVoiceRoomPeers);
    socket.on('voice-peer-joined', handleVoicePeerJoined);
    socket.on('voice-peer-left', handleVoicePeerLeft);
    socket.on('voice-signal', handleVoiceSignal);
    socket.on('voice-peer-status', handleVoicePeerStatus);

    return () => {
      socket.off('voice-group-call-incoming', handleGroupCallIncoming);
      socket.off('direct-call-incoming', handleDirectCallIncoming);
      socket.off('direct-call-accepted', handleDirectCallAccepted);
      socket.off('direct-call-rejected', handleDirectCallRejected);
      socket.off('direct-call-ended', handleDirectCallEnded);
      socket.off('voice-room-peers', handleVoiceRoomPeers);
      socket.off('voice-peer-joined', handleVoicePeerJoined);
      socket.off('voice-peer-left', handleVoicePeerLeft);
      socket.off('voice-signal', handleVoiceSignal);
      socket.off('voice-peer-status', handleVoicePeerStatus);
    };
  }, [
    socket,
    playRingtone,
    stopRingtone,
    getMicrophoneStream,
    createPeerConnection,
    removePeer,
    joinVoiceCall,
    cleanupCall,
    syncVoicePeersState
  ]);

  // Teardown when unmounting
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  const activePeer = voicePeers.length > 0 ? { socketId: voicePeers[0].socketId, user: voicePeers[0].user } : null;

  return {
    callStatus,
    isInCall: callStatus === 'connected',
    activePeer,
    voicePeers,
    incomingCall,
    isMuted,
    isDeafened,
    localIsSpeaking,
    peerIsSpeaking,
    callDuration,
    error,
    initiateCall,
    callRoom,
    joinVoiceCall,
    leaveVoiceCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endActiveCall,
    toggleMute,
    toggleDeafen
  };
}
