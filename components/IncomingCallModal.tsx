import React from 'react';
import { User } from '../types';

interface IncomingCallModalProps {
  caller: User;
  onAccept: () => void;
  onReject: () => void;
  theme?: 'dark' | 'light';
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  caller,
  onAccept,
  onReject,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl flex flex-col items-center text-center transition-all animate-in zoom-in-95 duration-200 ${
        isDark
          ? 'bg-[#12161f] border-indigo-500/40 text-white shadow-[0_10px_40px_rgba(99,102,241,0.25)]'
          : 'bg-white border-indigo-200 text-slate-900 shadow-xl'
      }`}>
        {/* Ringing Avatar Animation */}
        <div className="relative my-4 flex items-center justify-center">
          <span className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping" />
          <span className="absolute w-20 h-20 rounded-full bg-emerald-500/30 animate-pulse" />
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl relative z-10"
            style={{ backgroundColor: caller.color || '#6366f1' }}
          >
            {caller.username.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-lg font-black tracking-tight">{caller.username}</h3>
        <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Incoming Voice Call...
        </p>
        <p className={`text-[11px] mt-2 mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          Real-time collaborative audio link requested.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 w-full justify-center">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
          >
            <svg className="w-4 h-4 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 animate-pulse"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
