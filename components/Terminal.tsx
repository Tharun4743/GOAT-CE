import React from 'react';
import { ICONS } from '../constants';

interface TerminalProps {
  output: string[];
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  hideHeader?: boolean;
  theme?: 'dark' | 'light';
}

const Terminal: React.FC<TerminalProps> = ({ output, isOpen, onClose, isLoading, hideHeader, theme = 'dark' }) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div className={`h-full flex flex-col font-mono text-sm ${
      isDark ? 'bg-[#0d1117] text-gray-200' : 'bg-white text-slate-800'
    }`}>
      {!hideHeader && (
        <div className={`flex items-center justify-between px-4 py-2 border-b shrink-0 ${
          isDark ? 'bg-[#161b22] border-gray-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            {ICONS.Terminal}
            <span className="text-[10px] font-black uppercase tracking-widest">Debug Console</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
            </div>
            <button
              onClick={onClose}
              className={`ml-2 transition-colors p-1 text-xs font-bold ${
                isDark ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${
        isDark ? 'bg-[#0d1117]' : 'bg-slate-50/50'
      }`}>
        {isLoading ? (
          <div className="flex items-center gap-3 text-indigo-500 animate-pulse">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold uppercase tracking-wider">Processing runtime execution...</span>
          </div>
        ) : output.length === 0 ? (
          <div className={`italic text-xs ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
            <span className="text-indigo-500 mr-2 font-bold">$</span> Ready for execution. Click "Run Code" above.
          </div>
        ) : (
          <div className="space-y-1.5 text-xs">
            {output.map((line, i) => {
              if (i === 0) {
                const cleanLine = line.startsWith('$ ') ? line.substring(2) : line.startsWith('$') ? line.substring(1) : line;
                return (
                  <div key={i} className={`font-extrabold pb-2 mb-2 border-b flex items-center gap-2 ${
                    isDark ? 'text-indigo-400 border-gray-800' : 'text-indigo-600 border-slate-200'
                  }`}>
                    <span className="text-indigo-500">$</span>
                    <span>{cleanLine}</span>
                  </div>
                );
              }

              const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail') || line.toLowerCase().includes('exception');
              const isSystem = line.startsWith('[System]');

              return (
                <div key={i} className={`flex gap-2 leading-relaxed ${
                  isError 
                    ? 'text-red-500 font-semibold' 
                    : isSystem 
                      ? isDark ? 'text-indigo-400/90 italic' : 'text-indigo-600/90 italic' 
                      : isDark ? 'text-gray-200' : 'text-slate-800'
                }`}>
                  {!isSystem && <span className={`select-none font-bold ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>›</span>}
                  <span className="whitespace-pre-wrap font-mono">{line}</span>
                </div>
              );
            })}
            
            <div className={`mt-4 pt-3 border-t flex items-center gap-2 select-none ${
              isDark ? 'border-gray-800/80 text-gray-500' : 'border-slate-200 text-slate-400'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] uppercase font-black tracking-widest">Process completed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal;
