import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';

interface LandingPageProps {
  onJoin: (username: string, roomId: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onJoin }) => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Only load if user previously saved a valid, non-mock username
    const saved = sessionStorage.getItem('goat_username') || localStorage.getItem('goat_username');
    if (saved && !saved.startsWith('Dev-')) {
      setUsername(saved);
    }
  }, []);

  const sanitizeRoomId = (raw: string): string => {
    const trimmed = raw.trim();
    if (trimmed.includes('/editor/')) {
      const parts = trimmed.split('/editor/');
      return (parts[1] || '').split('?')[0].split('#')[0].trim().toUpperCase();
    }
    return trimmed.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  };

  const handleCreateRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalUsername = username.trim();
    if (!finalUsername) {
      setError('Please enter your name before creating a workspace.');
      return;
    }

    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    sessionStorage.setItem('goat_username', finalUsername);
    localStorage.setItem('goat_username', finalUsername);
    onJoin(finalUsername, newRoomId);
    navigate(`/editor/${newRoomId}`);
  };

  const handleJoinRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalUsername = username.trim();
    if (!finalUsername) {
      setError('Please enter your name before joining.');
      return;
    }

    const cleanRoomId = sanitizeRoomId(roomId);
    if (!cleanRoomId) {
      setError('Please enter a Room ID or paste an invite link.');
      return;
    }

    if (cleanRoomId.length < 2 || cleanRoomId.length > 20) {
      setError('Room ID must be between 2 and 20 characters.');
      return;
    }

    setError(null);
    sessionStorage.setItem('goat_username', finalUsername);
    localStorage.setItem('goat_username', finalUsername);
    onJoin(finalUsername, cleanRoomId);
    navigate(`/editor/${cleanRoomId}`);
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden flex items-center justify-center p-4 sm:p-6 relative selection:bg-indigo-500 selection:text-white" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 40%, #e2e8f0 100%)' }}>

      {/* Dynamic Ambient Background Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full blur-[140px] opacity-40" style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] opacity-35" style={{ background: 'radial-gradient(circle, #34d399, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[160px] opacity-25" style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }} />

        {/* High-tech Grid Mesh */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
            backgroundSize: '36px 36px'
          }}
        />

        {/* Ambient floating particles */}
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-[1px] animate-float-slow"
            style={{
              width: `${(i % 3) * 2 + 3}px`,
              height: `${(i % 3) * 2 + 3}px`,
              background: ['#6366f1', '#10b981', '#3b82f6', '#8b5cf6'][i % 4],
              opacity: 0.35,
              top: `${(i * 17) % 100}%`,
              left: `${(i * 23) % 100}%`,
              animationDelay: `${(i * 1.5) % 10}s`,
              animationDuration: `${20 + (i % 10)}s`
            }}
          />
        ))}
      </div>

      {/* Main Glassmorphic Workspace Card */}
      <div className="w-full max-w-[460px] sm:max-w-[480px] relative z-10 my-auto">
        <div className="bg-white/90 backdrop-blur-2xl border border-white/80 rounded-[2rem] shadow-[0_24px_70px_rgba(79,70,229,0.14),0_10px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6 transition-all">

          {/* Header Section */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-teal-400 to-indigo-500 opacity-60 blur-md group-hover:opacity-100 transition-opacity animate-pulse" />
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-xl relative z-10 p-1 border-2 border-white">
                  {ICONS.Logo}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-[10px] font-black tracking-widest text-indigo-600 uppercase mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Collaborative IDE
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                GOAT <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500 font-extrabold">Code Editor</span>
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                Real-time code editing with 1-to-1 WebRTC voice calling &amp; AI
              </p>
            </div>
          </div>

          {/* Inline Error Alert */}
          {error && (
            <div className="p-3 rounded-2xl bg-red-50/90 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleJoinRoom}>
            <div className="space-y-3">
              {/* Username Input */}
              <div className="group space-y-1.5">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                  Developer Profile
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                    placeholder="Enter your name"
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-400 shadow-inner"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Room ID Input */}
              <div className="group space-y-1.5">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                  Room ID <span className="text-slate-400 font-normal normal-case">(To join existing room)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => { setRoomId(e.target.value); setError(null); }}
                    placeholder="e.g. 12345 OR PASTE INVITE LINK"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 focus:bg-white transition-all font-mono placeholder:text-slate-400 uppercase tracking-widest text-center text-xs sm:text-sm font-semibold shadow-inner"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Join Room & Create Room */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Join Existing Room Button */}
              <button
                type="submit"
                className="group relative w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-[0_8px_25px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_32px_rgba(79,70,229,0.4)] active:scale-[0.98] overflow-hidden flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Join Room</span>
              </button>

              {/* Create New Room Button */}
              <button
                type="button"
                onClick={() => handleCreateRoom()}
                className="group relative w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-[0_8px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.35)] active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider overflow-hidden"
              >
                <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Room</span>
              </button>
            </div>
          </form>

          {/* Feature Highlight Badges */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center select-none">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
              <span className="text-base">🎙️</span>
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight">Voice Calls</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
              <span className="text-base">⚡</span>
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight">Monaco IDE</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
              <span className="text-base">🤖</span>
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight">AI Assistant</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-25px) translateX(12px); }
        }
        .animate-float-slow {
          animation: float-slow 22s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
