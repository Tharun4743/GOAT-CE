import React from 'react';
import { User } from '../types';
import { CallStatus } from '../hooks/useVoiceCall';

interface ActiveCallBarProps {
  callStatus: CallStatus;
  activePeer: { socketId: string; user: User } | null;
  isMuted: boolean;
  localIsSpeaking: boolean;
  peerIsSpeaking: boolean;
  callDuration: number;
  onToggleMute: () => void;
  onEndCall: () => void;
  theme?: 'dark' | 'light';
}

const ActiveCallBar: React.FC<ActiveCallBarProps> = ({
  callStatus,
  activePeer,
  isMuted,
  localIsSpeaking,
  peerIsSpeaking,
  callDuration,
  onToggleMute,
  onEndCall,
  theme = 'dark'
}) => {
  if (callStatus === 'idle' || callStatus === 'incoming') return null;

  const isDark = theme === 'dark';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`shrink-0 z-30 px-4 py-2 border-b flex items-center justify-between transition-all ${
      isDark
        ? 'bg-[#12161f] border-emerald-500/30 text-white shadow-md'
        : 'bg-emerald-50 border-emerald-200 text-slate-800 shadow-sm'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        {/* Peer Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-md relative"
            style={{ backgroundColor: activePeer?.user?.color || '#6366f1' }}
          >
            {(activePeer?.user?.username || 'P').charAt(0).toUpperCase()}
            {peerIsSpeaking && (
              <span className="absolute -inset-1 rounded-xl border-2 border-emerald-400 animate-ping pointer-events-none opacity-80" />
            )}
          </div>
        </div>

        {/* Call State & Details */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold truncate">
              {activePeer?.user?.username || 'Collaborator'}
            </span>
            {callStatus === 'calling' ? (
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 animate-pulse">
                Calling...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {formatDuration(callDuration)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {callStatus === 'calling' ? (
              <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Waiting for answer...</span>
            ) : peerIsSpeaking ? (
              <span className="text-emerald-400 font-bold animate-pulse">Speaking...</span>
            ) : localIsSpeaking ? (
              <span className="text-indigo-400 font-bold animate-pulse">You are talking</span>
            ) : (
              <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Voice connected</span>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {callStatus === 'connected' && (
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : isDark
                  ? 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            )}
            <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
        )}

        {/* End / Cancel Call */}
        <button
          onClick={onEndCall}
          className="py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-red-900/30"
          title={callStatus === 'calling' ? 'Cancel Call' : 'End Call'}
        >
          <svg className="w-4 h-4 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{callStatus === 'calling' ? 'Cancel' : 'End'}</span>
        </button>
      </div>
    </div>
  );
};

export default ActiveCallBar;
