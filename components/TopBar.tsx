
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { EditorLanguage } from '../types';

interface TopBarProps {
  roomId: string;
  language: EditorLanguage;
  onLanguageChange: (lang: EditorLanguage) => void;
  onSave: () => void;
  onRun: () => void;
  toggleSidebar: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  roomId,
  language,
  onLanguageChange,
  onSave,
  onRun,
  toggleSidebar,
  theme,
  onToggleTheme
}) => {
  const [copied, setCopied] = useState(false);
  const isDark = theme === 'dark';

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className={`h-14 border-b flex items-center justify-between px-4 md:px-6 z-30 shadow-sm shrink-0 transition-colors ${isDark ? 'bg-[#0d1117] border-gray-800 text-white' : 'bg-white border-indigo-100 text-slate-800'}`}>
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleSidebar}
          className={`p-2 md:hidden ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <div className={`w-8 h-8 md:w-10 md:h-10 p-1 rounded-full border shadow-inner flex items-center justify-center overflow-hidden shrink-0 ${isDark ? 'bg-[#0d1117] border-gray-700' : 'bg-slate-100 border-slate-300'}`}>
          {ICONS.Logo}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 md:gap-2">
            <h1 className={`text-xs md:text-sm font-black leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>GOAT Code Editor</h1>
            <span className="hidden sm:inline-block bg-indigo-500/10 text-indigo-400 text-[8px] px-1.5 py-0.5 rounded border border-indigo-500/20 font-black uppercase">v1.0</span>
          </div>
          <div className={`flex items-center gap-2 text-[9px] md:text-[10px] mt-0.5 md:mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1 truncate">
              <span className="hidden xs:inline">Room:</span> <span className="text-indigo-400 font-mono select-all cursor-pointer hover:text-indigo-300 transition-colors" onClick={copyRoomId}>{roomId}</span>
            </span>
            {copied && <span className="text-green-500 hidden sm:flex items-center gap-1 font-bold animate-in fade-in zoom-in duration-200">{ICONS.Check} Copied</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3">

        <div className="relative group">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
            className={`appearance-none border text-[10px] md:text-[11px] font-bold py-1.5 md:py-2 px-3 md:px-4 pr-8 md:pr-10 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer shadow-inner ${
              isDark ? 'bg-[#0d1117] border-gray-700 text-gray-300 hover:border-indigo-500/40' : 'bg-slate-100 border-slate-300 text-slate-800 hover:border-indigo-400'
            }`}
          >
            <optgroup label="Mainstream">
              <option value={EditorLanguage.JAVASCRIPT}>JS</option>
              <option value={EditorLanguage.TYPESCRIPT}>TS</option>
              <option value={EditorLanguage.PYTHON}>PY</option>
              <option value={EditorLanguage.JAVA}>JAVA</option>
            </optgroup>
            <optgroup label="System" className="hidden md:block">
              <option value={EditorLanguage.CPP}>C++</option>
              <option value={EditorLanguage.CSHARP}>C#</option>
              <option value={EditorLanguage.RUST}>Rust</option>
              <option value={EditorLanguage.GO}>Go</option>
            </optgroup>
            <optgroup label="Web & Style" className="hidden md:block">
              <option value={EditorLanguage.HTML}>HTML</option>
              <option value={EditorLanguage.CSS}>CSS</option>
              <option value={EditorLanguage.MARKDOWN}>MD</option>
            </optgroup>
          </select>
          <div className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-indigo-400 transition-colors">
            {ICONS.Down}
          </div>
        </div>

        <button
          onClick={onSave}
          className={`flex items-center gap-1.5 md:gap-2 border text-[10px] md:text-xs font-bold py-1.5 md:py-2 px-3 md:px-4 rounded-lg md:rounded-xl transition-all shadow-inner active:scale-95 ${
            isDark ? 'bg-[#0d1117] border-gray-700 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/30' : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-indigo-600 hover:border-indigo-300'
          }`}
        >
          {ICONS.Save} <span className="hidden xs:inline">Save</span>
        </button>

        <button
          onClick={onRun}
          className="flex items-center gap-1.5 md:gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] md:text-xs font-black py-1.5 md:py-2 px-4 md:px-5 rounded-lg md:rounded-xl shadow-xl shadow-indigo-600/30 transition-all active:scale-90"
        >
          {ICONS.Play} RUN
        </button>

        <button
          onClick={onToggleTheme}
          className={`flex items-center justify-center p-2 border rounded-lg md:rounded-xl transition-all shadow-inner active:scale-95 ${
            isDark ? 'bg-[#0d1117] border-gray-700 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/30' : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-indigo-600 hover:border-indigo-300'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? (
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <div className={`hidden sm:block h-6 w-px mx-1 md:mx-2 ${isDark ? 'bg-gray-800' : 'bg-slate-200'}`}></div>

        <button
          onClick={copyRoomId}
          className={`hidden sm:flex p-2 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:text-white hover:bg-gray-800/40' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
          title="Share Workspace Link"
        >
          {ICONS.Share}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
