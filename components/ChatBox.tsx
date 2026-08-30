import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '../types';
import { UseVoiceCallReturn } from '../hooks/useVoiceCall';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  theme?: 'dark' | 'light';
  voiceCall?: UseVoiceCallReturn;
  currentUser?: User | null;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, theme = 'dark', voiceCall, currentUser }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-transparent min-h-0">
      <div className={`shrink-0 px-3 py-2.5 border-b mb-3 flex items-center justify-between ${isDark ? 'border-gray-800' : 'border-indigo-100'}`}>
        <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Workspace Chat
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isDark ? 'bg-gray-800/60 text-gray-400 border-gray-700/60' : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 min-h-0 pb-3"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 opacity-30">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-slate-200'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: msg.color }}>{msg.sender}</span>
                <span className={`text-[9px] font-mono ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`rounded-xl p-2.5 text-xs border break-words shadow-sm ${
                isDark ? 'bg-[#161b22] text-gray-200 border-gray-800' : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className={`shrink-0 mt-2 pt-2.5 border-t ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className={`w-full rounded-xl py-2.5 pl-3.5 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all border ${
              isDark ? 'bg-[#161b22] border-gray-700 text-white placeholder:text-gray-500' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder:text-slate-400'
            }`}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
            disabled={!inputText.trim()}
            title="Send message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
