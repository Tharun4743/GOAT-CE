import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ICONS } from '../constants';

interface AIAssistantProps {
  currentCode: string;
  language: string;
  onApplyCode?: (code: string) => void;
  theme?: 'dark' | 'light';
}

export interface AIAssistantRef {
  triggerAction: (actionName: string) => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const AIAssistant = forwardRef<AIAssistantRef, AIAssistantProps>(({ currentCode, language, onApplyCode, theme = 'dark' }, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "GOAT CE AI established. I have full context of your code. How can I assist your development today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useImperativeHandle(ref, () => ({
    triggerAction: (actionName: string) => {
      handleQuickAction(actionName);
    }
  }));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const QUICK_ACTIONS = [
    { name: 'Explain', prompt: 'Analyze this code and explain its logic, time complexity, and edge cases concisely.' },
    { name: 'Optimize', prompt: 'Refactor this code for maximum performance and readability. Provide only the updated code block.' },
    { name: 'Debug', prompt: 'Check this code for logical errors or security vulnerabilities and suggest fixes.' },
    { name: 'Test Cases', prompt: 'Generate a set of comprehensive unit test cases for this code logic.' }
  ];

  const handleQuickAction = (actionName: string) => {
    const action = QUICK_ACTIONS.find(a => a.name === actionName);
    if (action) {
      performAISearch(action.prompt, action.name);
    }
  };

  const performAISearch = async (userPrompt: string, actionLabel?: string) => {
    if (isTyping) return;
    
    setMessages(prev => [...prev, { role: 'user', content: actionLabel ? `[Action: ${actionLabel}]` : userPrompt }]);
    setIsTyping(true);

    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'ai', content: "OpenRouter API key is missing. Please set OPENROUTER_API_KEY in your environment configuration." }]);
        return;
      }
      const modelId = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct';
      
      const systemInstruction = `You are a world-class Senior Software Architect. 
Context: You are helping a developer in the GOAT Code Editor.
Current Language: ${language}
Current Code:
\`\`\`${language}
${currentCode}
\`\`\`

Rules:
1. Be concise and professional.
2. Provide code in Markdown blocks.
3. Focus on efficiency and modern best practices.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'GOAT Code Editor'
        },
        body: JSON.stringify({
          model: modelId,
          temperature: 0.4,
          top_p: 0.9,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error?.message || `OpenRouter request failed with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data?.choices?.[0]?.message;
      let responseText = '';
      if (assistantMessage) {
        if (typeof assistantMessage.content === 'string') {
          responseText = assistantMessage.content;
        } else if (Array.isArray(assistantMessage.content)) {
          responseText = assistantMessage.content.map((chunk: any) => chunk?.text || '').join('\n');
        }
      }
      responseText = responseText.trim();

      setMessages(prev => [...prev, { role: 'ai', content: responseText || "The AI returned an empty response." }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const fallbackMessage = error?.message ? `Failed to reach GOAT AI via OpenRouter: ${error.message}` : "Failed to reach GOAT AI via OpenRouter.";
      setMessages(prev => [...prev, { role: 'ai', content: fallbackMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    performAISearch(input.trim());
    setInput('');
  };

  const extractAndApply = (content: string) => {
    const match = content.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (match && match[1] && onApplyCode) {
      onApplyCode(match[1].trim());
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent min-h-0">
      <div className={`shrink-0 px-3 py-2.5 border-b mb-3 flex items-center justify-between ${isDark ? 'border-gray-800' : 'border-indigo-100'}`}>
        <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
          {ICONS.AI} GOAT CE AI
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
        }`}>
          Active
        </span>
      </div>

      <div className="shrink-0 flex gap-2 overflow-x-auto pb-2.5 custom-scrollbar scrollbar-hide">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.name}
            onClick={() => handleQuickAction(action.name)}
            disabled={isTyping}
            className={`whitespace-nowrap text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-30 uppercase border ${
              isDark 
                ? 'bg-[#161b22] hover:bg-indigo-500/10 border-gray-700 hover:border-indigo-500/30 text-gray-300 hover:text-indigo-400' 
                : 'bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700 hover:text-indigo-900 shadow-sm'
            }`}
          >
            {action.name}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 min-h-0 pb-3">
        {messages.map((msg, idx) => {
          const hasCode = msg.role === 'ai' && msg.content.includes('```');
          return (
            <div key={idx} className={`flex flex-col space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[95%] p-3 rounded-xl text-xs border shadow-sm ${
                msg.role === 'user' 
                  ? isDark 
                    ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-100 rounded-tr-none font-medium' 
                    : 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none font-bold shadow-md'
                  : isDark 
                    ? 'bg-[#161b22] border-gray-700 text-gray-200 rounded-tl-none font-medium' 
                    : 'bg-white border-indigo-100 text-gray-900 rounded-tl-none font-medium shadow-md'
              }`}>
                <div className={`whitespace-pre-wrap leading-relaxed max-w-none ${isDark ? 'prose prose-invert text-gray-200' : 'text-gray-900 font-medium'}`}>
                  {msg.content}
                </div>
                {hasCode && onApplyCode && (
                  <button 
                    onClick={() => extractAndApply(msg.content)}
                    className={`mt-2.5 w-full border text-[10px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider ${
                      isDark 
                        ? 'bg-indigo-600/20 hover:bg-indigo-600/40 border-indigo-500/30 text-indigo-400' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 shadow-md'
                    }`}
                  >
                    {ICONS.Copy} Inject to Editor
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex gap-1.5 items-center p-2.5 text-indigo-500 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Processing Logic...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className={`shrink-0 mt-2 pt-2.5 border-t ${isDark ? 'border-gray-800' : 'border-indigo-100'}`}>
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask GOAT CE AI..."
            className={`w-full rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all pr-10 border ${
              isDark 
                ? 'bg-[#161b22] border-gray-700 text-white placeholder:text-gray-500' 
                : 'bg-slate-100 border-slate-300 text-slate-800 placeholder:text-slate-400 font-medium'
            }`}
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-400 transition-all disabled:opacity-30"
            disabled={!input.trim() || isTyping}
          >
            {ICONS.AI}
          </button>
        </div>
      </form>
    </div>
  );
});

export default AIAssistant;
