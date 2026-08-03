
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
    <div className={`${hideHeader ? 'h-full' : 'h-72 shadow-lg border-t'} flex flex-col font-mono text-sm ${
      isDark ? 'bg-[#0d1117] border-gray-800 text-gray-300' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {!hideHeader && (
        <div className={`flex items-center justify-between px-4 py-2 border-b ${
          isDark ? 'bg-[#161b22] border-gray-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
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
              className="ml-2 text-gray-500 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40">
        {isLoading ? (
          <div className="flex items-center gap-3 text-indigo-400 animate-pulse">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold uppercase">Processing...</span>
          </div>
        ) : output.length === 0 ? (
          <div className="text-gray-700 italic">
            <span className="text-indigo-500/50 mr-2">$</span> Ready for execution. Click "Run Code" above.
          </div>
        ) : (
          <div className="space-y-1.5">
            {output.map((line, i) => {
              if (i === 0) {
                return (
                  <div key={i} className="text-indigo-300 font-bold mb-2 pb-2 border-b border-gray-800/30">
                    <span className="text-indigo-500 mr-2">$</span>
                    {line}
                  </div>
                );
              }

              const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail');
              const isSystem = line.startsWith('[System]');

              return (
                <div key={i} className={`flex gap-2 ${isError ? 'text-red-400' : isSystem ? 'text-indigo-400/80 italic' : 'text-gray-300'}`}>
                  {!isSystem && <span className="text-gray-700 opacity-50">›</span>}
                  <span className="whitespace-pre-wrap">{line}</span>
                </div>
              );
            })}
            <div className="mt-4 pt-4 border-t border-gray-800/30 flex items-center gap-2 select-none opacity-50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Process completed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal;
