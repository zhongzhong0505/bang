import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import './ai-chat.css';

interface ChatMsg {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const AIChatPanel: React.FC = () => {
  const toggleAIChat = useStore((s) => s.toggleAIChat);
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);
  const klineData = useStore((s) => s.klineData);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<string>('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for AI stream chunks
  useEffect(() => {
    const api = window.bangAPI;
    if (!api?.onAIStreamChunk) return;
    const unsub = api.onAIStreamChunk((data: any) => {
      if (data.done) {
        setStreaming(false);
        const fullText = streamRef.current;
        streamRef.current = '';
        setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
      } else if (data.delta) {
        streamRef.current += data.delta;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && streaming) {
            return [...prev.slice(0, -1), { role: 'assistant', content: streamRef.current }];
          }
          return prev;
        });
      }
    });
    return unsub;
  }, [streaming]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setStreaming(true);
    streamRef.current = '';

    const api = window.bangAPI;
    if (!api?.aiChat) {
      setMessages((prev) => [...prev, { role: 'system', content: 'AI 未配置，请在设置中配置 API Key' }]);
      setStreaming(false);
      return;
    }

    try {
      const chatMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await api.aiChat(chatMessages);
      if (result.success) {
        // Streaming handled by onAIStreamChunk
        if (!streamRef.current) {
          setMessages((prev) => [...prev, { role: 'assistant', content: result.text || '无回复' }]);
          setStreaming(false);
        }
      } else {
        setMessages((prev) => [...prev, { role: 'system', content: `AI 错误: ${result.error}` }]);
        setStreaming(false);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'system', content: `请求失败: ${err.message}` }]);
      setStreaming(false);
    }
  }, [input, messages, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-chat-overlay">
      <div className="ai-chat-header">
        <span>AI 分析助手</span>
        <button className="ai-chat-close" onClick={toggleAIChat}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
      </div>
      <div className="ai-chat-context">
        当前: {currentName} ({currentCode})
      </div>
      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-chat-msg ai-chat-msg-system">
            向 AI 提问关于 {currentName} 的行情分析、技术面解读、交易建议等
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-chat-msg ai-chat-msg-${msg.role}`}>{msg.content}</div>
        ))}
        {streaming && !messages[messages.length - 1]?.content && (
          <div className="ai-chat-msg ai-chat-msg-assistant">思考中...</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="ai-chat-input-area">
        <textarea className="ai-chat-input" rows={1}
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown} placeholder="输入问题..." disabled={streaming} />
        <button className="ai-chat-send" onClick={handleSend} disabled={streaming || !input.trim()}>
          {streaming ? '...' : '发送'}
        </button>
      </div>
    </div>
  );
};

export default AIChatPanel;
