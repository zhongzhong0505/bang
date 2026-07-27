import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '../../store';
import './ai-chat.css';
import { useTBatch } from '../../i18n';

interface ChatMsg {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const AIChatPanel: React.FC = () => {
  const toggleAIChat = useStore((s) => s.toggleAIChat);
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);

  const tr = useTBatch([
    'ai.title', 'ai.placeholder', 'ai.notConfigured',
    'ai.thinking', 'ai.send', 'ai.inputPlaceholder',
    'ai.error', 'ai.requestFailed', 'ai.current',
  ]);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const abortedRef = useRef(false);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup stream listener on unmount
  useEffect(() => {
    return () => { unsubRef.current?.(); };
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const api = (window as any).bangAPI;
    if (!api?.aiChat) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'system', content: tr['ai.notConfigured'] },
      ]);
      setInput('');
      return;
    }

    const userMsg: ChatMsg = { role: 'user', content: text };
    const assistantMsg: ChatMsg = { role: 'assistant', content: '' };
    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    abortedRef.current = false;

    // Messages to send to API (exclude the empty assistant placeholder)
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const streamIndex = newMessages.length - 1;

    // Listen for stream chunks
    unsubRef.current?.();
    unsubRef.current = api.onAIStreamChunk((data: any) => {
      if (abortedRef.current) return;
      if (data.done) {
        setIsStreaming(false);
        unsubRef.current?.();
        unsubRef.current = null;
      } else if (data.delta) {
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[streamIndex]) {
            updated[streamIndex] = {
              ...updated[streamIndex],
              content: updated[streamIndex].content + data.delta,
            };
          }
          return updated;
        });
      }
    });

    // Initiate the request
    api.aiChat(apiMessages)
      .then((result: any) => {
        if (abortedRef.current) return;
        if (!result.success) {
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[streamIndex]) {
              updated[streamIndex] = {
                ...updated[streamIndex],
                content: updated[streamIndex].content || tr['ai.error'].replace('{error}', result.error),
              };
            }
            return updated;
          });
        }
        setIsStreaming(false);
        unsubRef.current?.();
        unsubRef.current = null;
      })
      .catch((err: any) => {
        if (abortedRef.current) return;
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[streamIndex]) {
            updated[streamIndex] = {
              ...updated[streamIndex],
              content: updated[streamIndex].content || tr['ai.requestFailed'].replace('{error}', err.message),
            };
          }
          return updated;
        });
        setIsStreaming(false);
        unsubRef.current?.();
        unsubRef.current = null;
      });
  }, [input, isStreaming, messages, tr]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const helloText = useMemo(() =>
    `${tr['ai.current']}: ${currentName} (${currentCode})`,
    [tr, currentName, currentCode]
  );

  return (
    <div className="ai-chat-overlay">
      <div className="ai-chat-header">
        <span>{tr['ai.title']}</span>
        <button className="ai-chat-close" onClick={toggleAIChat}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div className="ai-chat-context">{helloText}</div>
      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-chat-msg ai-chat-msg-system">{tr['ai.placeholder'].replace('{name}', currentName)}</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-chat-msg ai-chat-msg-${msg.role}`}>
            {msg.content}
            {msg.role === 'assistant' && isStreaming && i === messages.length - 1 && !msg.content && (
              <span className="ai-chat-thinking">{tr['ai.thinking']}</span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="ai-chat-input-area">
        <textarea
          className="ai-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tr['ai.inputPlaceholder']}
          rows={1}
          disabled={isStreaming}
        />
        <button className="ai-chat-send" onClick={handleSend} disabled={isStreaming || !input.trim()}>
          {tr['ai.send']}
        </button>
      </div>
    </div>
  );
};

export default AIChatPanel;
