import React from 'react';
import { User, VoicePeer } from '../types';

interface VoiceCallPanelProps {
  isInCall: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  localIsSpeaking: boolean;
  voicePeers: VoicePeer[];
  currentUser: User | null;
  error: string | null;
  onJoinCall: () => void;
  onLeaveCall: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  theme?: 'dark' | 'light';
}

const VoiceCallPanel: React.FC<VoiceCallPanelProps> = ({
  isInCall,
  isConnecting,
  isMuted,
  isDeafened,
  localIsSpeaking,
  voicePeers,
  currentUser,
  error,
  onJoinCall,
  onLeaveCall,
  onToggleMute,
  onToggleDeafen,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const totalInCall = (isInCall ? 1 : 0) + voicePeers.length;

  return (
    <div className={`shrink-0 mb-3 rounded-xl border p-3 transition-all ${
      isDark
        ? isInCall
          ? 'bg-[#12161f]/95 border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.1)]'
          : 'bg-[#161b22]/70 border-gray-800/80'
        : isInCall
          ? 'bg-emerald-50/70 border-emerald-200 shadow-sm'
          : 'bg-slate-50 border-slate-200'
    }`}>
      {/* Error alert if any */}
      {error && (
        <div className="mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-medium flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="truncate">{error}</span>
        </div>
      )}

      {!isInCall ? (
        // Idle / Disconnected State
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className={`text-xs font-black uppercase tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Live Voice Call
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${voicePeers.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
                <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  {voicePeers.length > 0 ? `${voicePeers.length} active in call` : 'WebRTC audio mesh'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onJoinCall}
            disabled={isConnecting}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50 shrink-0"
          >
            {isConnecting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Linking...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Join Voice</span>
              </>
            )}
          </button>
        </div>
      ) : (
        // Connected Live Call State
        <div className="space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className={`text-[10px] font-black tracking-wider uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                LIVE CALL ({totalInCall})
              </span>
            </div>
            <span className={`text-[9px] font-mono ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
              Peer-to-Peer
            </span>
          </div>

          {/* Participants Avatar Roster */}
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-1">
            {/* Local User */}
            {currentUser && (
              <div
                className={`relative flex items-center gap-1.5 p-1.5 pr-2 rounded-lg border transition-all ${
                  localIsSpeaking
                    ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/40'
                    : isDark
                      ? 'bg-gray-800/60 border-gray-700/60'
                      : 'bg-white border-slate-200'
                }`}
                title={`${currentUser.username} (You)`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm relative"
                  style={{ backgroundColor: currentUser.color || '#6366f1' }}
                >
                  {currentUser.username.charAt(0).toUpperCase()}
                  {localIsSpeaking && (
                    <span className="absolute -inset-0.5 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none"></span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-[10px] font-bold truncate max-w-[70px] ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                    You
                  </span>
                  <div className="flex items-center gap-1 text-[8px]">
                    {isMuted ? (
                      <span className="text-red-400 font-semibold">Muted</span>
                    ) : isDeafened ? (
                      <span className="text-amber-400 font-semibold">Deaf</span>
                    ) : localIsSpeaking ? (
                      <span className="text-emerald-400 font-bold animate-pulse">Talking</span>
                    ) : (
                      <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Active</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Remote Peers */}
            {voicePeers.map((peer) => (
              <div
                key={peer.socketId}
                className={`relative flex items-center gap-1.5 p-1.5 pr-2 rounded-lg border transition-all ${
                  peer.isSpeaking
                    ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/40'
                    : isDark
                      ? 'bg-gray-800/60 border-gray-700/60'
                      : 'bg-white border-slate-200'
                }`}
                title={peer.user?.username || 'Peer'}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm relative"
                  style={{ backgroundColor: peer.user?.color || '#3b82f6' }}
                >
                  {(peer.user?.username || 'P').charAt(0).toUpperCase()}
                  {peer.isSpeaking && (
                    <span className="absolute -inset-0.5 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none"></span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-[10px] font-bold truncate max-w-[70px] ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
                    {peer.user?.username || 'Peer'}
                  </span>
                  <div className="flex items-center gap-1 text-[8px]">
                    {peer.isMuted ? (
                      <span className="text-red-400 font-semibold">Muted</span>
                    ) : peer.isDeafened ? (
                      <span className="text-amber-400 font-semibold">Deaf</span>
                    ) : peer.isSpeaking ? (
                      <span className="text-emerald-400 font-bold animate-pulse">Talking</span>
                    ) : (
                      <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Active</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Controls Bar */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-gray-800/40">
            <div className="flex items-center gap-1">
              {/* Mute/Unmute */}
              <button
                type="button"
                onClick={onToggleMute}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                  isMuted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : isDark
                      ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                      : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'
                }`}
              >
                {isMuted ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                )}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {/* Deafen/Undeafen */}
              <button
                type="button"
                onClick={onToggleDeafen}
                title={isDeafened ? 'Undeafen audio output' : 'Deafen audio output'}
                className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                  isDeafened
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                    : isDark
                      ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                      : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span>{isDeafened ? 'Deaf' : 'Audio'}</span>
              </button>
            </div>

            {/* Leave / Disconnect */}
            <button
              type="button"
              onClick={onLeaveCall}
              title="Disconnect from voice call"
              className="p-1.5 px-2.5 rounded-lg text-[10px] font-black text-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all flex items-center gap-1 shadow-sm shadow-red-900/30"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
              <span>Leave</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCallPanel;
