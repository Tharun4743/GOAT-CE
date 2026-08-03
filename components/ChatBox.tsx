import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  theme?: 'dark' | 'light';
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, theme = 'dark' }) => {
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success && data.url) {
        onSendMessage(`🖼️ Image uploaded: ${data.url}`);
      } else {
        alert(`Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      alert('Upload failed. Please check server logs.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderMessageContent = (text: string) => {
    const imageUrlMatch = text.match(/(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp|svg)|https?:\/\/res\.cloudinary\.com\/[^\s]+)/i);
    if (imageUrlMatch) {
      const imageUrl = imageUrlMatch[0];
      const cleanText = text.replace(imageUrl, '').trim();
      return (
        <div className="space-y-2">
          {cleanText && <div>{cleanText}</div>}
          <div className={`rounded-lg overflow-hidden border max-w-xs ${isDark ? 'border-gray-700 bg-gray-900/80' : 'border-slate-300 bg-white'}`}>
            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
              <img src={imageUrl} alt="Attached asset" className="max-h-48 w-auto object-cover hover:opacity-90 transition-opacity" />
            </a>
          </div>
        </div>
      );
    }
    return <div>{text}</div>;
  };

  return (
    <div className="flex flex-col h-full bg-transparent min-h-0">
      <div className={`shrink-0 p-2 border-b mb-2 flex items-center justify-between ${isDark ? 'border-gray-800' : 'border-indigo-100'}`}>
        <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Workspace Chat</h3>
        {isUploading && (
          <span className="text-[9px] text-indigo-500 font-mono animate-pulse">Uploading to Cloudinary...</span>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 opacity-30">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-slate-200'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-tighter">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-tighter" style={{ color: msg.color }}>{msg.sender}</span>
                <span className={`text-[8px] font-mono ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`rounded-lg p-2 text-sm border break-words shadow-sm ${
                isDark ? 'bg-gray-800/40 text-gray-300 border-gray-800/50' : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}>
                {renderMessageContent(msg.text)}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className={`shrink-0 mt-4 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*,.pdf,.doc,.docx" 
          className="hidden" 
        />
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload image/asset to Cloudinary"
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 border ${
              isDark ? 'text-gray-400 hover:text-indigo-400 bg-[#161b22] border-gray-700' : 'text-slate-600 hover:text-indigo-600 bg-slate-100 border-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message or upload image..."
              className={`w-full rounded-lg py-2.5 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all pr-10 border ${
                isDark ? 'bg-[#161b22] border-gray-700 text-white placeholder:text-gray-600' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
              disabled={!inputText.trim()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
