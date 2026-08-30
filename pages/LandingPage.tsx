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
    const savedUsername = sessionStorage.getItem('goat_username') || localStorage.getItem('goat_username');
    if (savedUsername) setUsername(savedUsername);
  }, []);

  // Smart Room ID extraction in case user pastes full URL or hash link
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
    const finalUsername = username.trim() || `Dev-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    // Generate a clean 6-character room ID
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    sessionStorage.setItem('goat_username', finalUsername);
    localStorage.setItem('goat_username', finalUsername);
    onJoin(finalUsername, newRoomId);
    navigate(`/editor/${newRoomId}`);
  };

  const handleJoinRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalUsername = username.trim() || `Dev-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const cleanRoomId = sanitizeRoomId(roomId);

    if (!cleanRoomId) {
      // If Room ID is empty, create a new one smoothly
      handleCreateRoom();
      return;
    }

    if (cleanRoomId.length < 2 || cleanRoomId.length > 20) {
      setError('Room ID must be between 2 and 20 characters long.');
      return;
    }

    setError(null);
    sessionStorage.setItem('goat_username', finalUsername);
    localStorage.setItem('goat_username', finalUsername);
    onJoin(finalUsername, cleanRoomId);
    navigate(`/editor/${cleanRoomId}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      handleJoinRoom();
    } else {
      handleCreateRoom();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center p-4 sm:p-6 relative selection:bg-indigo-200" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 40%, #f5f0ff 100%)' }}>

      {/* Soft background orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-40" style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-20" style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }} />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Floating dots */}
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-[1px] animate-float-slow"
            style={{
              width: `${Math.random() * 5 + 2}px`,
              height: `${Math.random() * 5 + 2}px`,
              background: ['#6366f1', '#818cf8', '#a78bfa', '#60a5fa'][i % 4],
              opacity: 0.25,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 20 + 15}s`
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div className="w-[92%] sm:w-[85%] max-w-[440px] md:max-w-[460px] relative z-10 my-auto">
        <div className="bg-white/85 backdrop-blur-2xl border border-white/70 rounded-[1.75rem] sm:rounded-[2rem] shadow-[0_32px_80px_rgba(99,102,241,0.12),0_8px_32px_rgba(0,0,0,0.06)] p-5 sm:p-6 md:p-7 space-y-4 sm:space-y-5">

          {/* Logo + Title */}
          <div className="text-center space-y-2 sm:space-y-2.5">
            <div className="flex justify-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full overflow-hidden flex items-center justify-center shadow-lg">
                {ICONS.Logo}
              </div>
            </div>

            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic flex items-center justify-center gap-1.5">
                GOAT <span className="text-indigo-500 not-italic font-light tracking-widest opacity-90">CE</span>
              </h1>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-200/60" />
                <p className="text-indigo-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em]">Engineered for Teams</p>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-200/60" />
              </div>
            </div>
          </div>

          {/* Inline Error Banner */}
          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <div className="space-y-2.5">
              {/* Username */}
              <div className="group space-y-1">
                <label className="block text-[8px] sm:text-[9px] font-bold text-indigo-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                  Developer Profile
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                    placeholder="Tharunkumar"
                    className="w-full bg-indigo-50/60 border border-indigo-100 rounded-xl px-3.5 sm:px-4 py-2.5 text-gray-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300/60 focus:border-indigo-300 transition-all placeholder:text-gray-300 shadow-inner"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-300 transition-colors group-focus-within:text-indigo-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                </div>
              </div>

              {/* Room ID */}
              <div className="group space-y-1">
                <label className="block text-[8px] sm:text-[9px] font-bold text-indigo-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                  Room ID or Invite Link
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => { setRoomId(e.target.value); setError(null); }}
                  placeholder="ENTER ROOM ID OR PASTE LINK"
                  className="w-full bg-indigo-50/60 border border-indigo-100 rounded-xl px-3.5 sm:px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300/60 focus:border-indigo-300 transition-all font-mono placeholder:text-gray-300 uppercase tracking-[0.15em] text-center text-xs sm:text-sm shadow-inner"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2 pt-0.5">
              <button
                type="submit"
                className="group relative w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 sm:py-3 px-5 rounded-xl transition-all shadow-[0_8px_32px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.45)] active:scale-[0.98] overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 tracking-[0.15em] text-[10px] sm:text-[11px] uppercase font-black">
                  {roomId.trim() ? 'Join Room' : 'Create New Room'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine duration-700" />
              </button>

              <button
                type="button"
                onClick={() => handleCreateRoom()}
                className="w-full bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 font-bold py-2 sm:py-2.5 px-4 rounded-xl transition-all uppercase text-[9px] sm:text-[10px] tracking-[0.15em] shadow-sm active:scale-[0.98]"
              >
                Generate New Instance
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shine {
          100% { transform: translateX(100%); }
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-30px) translateX(15px); }
        }
        .animate-float-slow {
          animation: float-slow 20s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
