import React, { useCallback, useMemo } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ProChat } from '@ant-design/pro-chat';
import type { ChatRequest } from '@ant-design/pro-chat';
import { useStore } from '../../store';
import './ai-chat.css';
import { useT, useTBatch } from '../../i18n';

const AIChatPanel: React.FC = () => {
  const toggleAIChat = useStore((s) => s.toggleAIChat);
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);
  const resolvedTheme = useStore((s) => s.resolvedTheme);

  const tr = useTBatch([
    'ai.title', 'ai.current', 'ai.placeholder', 'ai.notConfigured',
    'ai.noReply', 'ai.error', 'ai.requestFailed', 'ai.thinking',
    'ai.send', 'ai.inputPlaceholder',
  ]);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<string>('');

  const request: ChatRequest = useCallback(async (messages, _config, signal) => {
    const api = (window as any).bangAPI;
    if (!api?.aiChat) {
      setMessages((prev) => [...prev, { role: 'system', content: tr['ai.notConfigured'] }]);
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
          setMessages((prev) => [...prev, { role: 'assistant', content: result.text || tr['ai.noReply'] }]);
          setStreaming(false);
        }
      } else {
        setMessages((prev) => [...prev, { role: 'system', content: tr['ai.error'].replace('{error}', result.error) }]);
        setStreaming(false);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'system', content: tr['ai.requestFailed'].replace('{error}', err.message) }]);
      setStreaming(false);
    }
  }, [input, messages, streaming]);

        let closed = false;
        let unsub: (() => void) | null = null;

        const close = () => {
          if (closed) return;
          closed = true;
          unsub?.();
          try { controller.close(); } catch {}
        };

        signal?.addEventListener('abort', () => close());

        unsub = api.onAIStreamChunk((data: any) => {
          if (closed || signal?.aborted) return;
          if (data.done) {
            close();
          } else if (data.delta) {
            try { controller.enqueue(textEncoder.encode(data.delta)); } catch {}
          }
        });

        api.aiChat(chatMessages)
          .then((result: any) => {
            if (closed) return;
            if (!result.success) {
              try {
                controller.enqueue(textEncoder.encode(`AI 错误: ${result.error}`));
              } catch {}
              close();
            }
          })
          .catch((err: any) => {
            if (closed) return;
            try {
              controller.enqueue(textEncoder.encode(`请求失败: ${err.message}`));
            } catch {}
            close();
          });
      },
    });

    return new Response(stream);
  }, []);

  const helloMessage = useMemo(() => (
    <span>当前: {currentName} ({currentCode})。向 AI 提问行情分析、技术面解读、交易建议等</span>
  ), [currentName, currentCode]);

  return (
    <div className="ai-chat-overlay">
      <div className="ai-chat-header">
        <span>{tr['ai.title']}</span>
        <button className="ai-chat-close" onClick={toggleAIChat}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></button>
      </div>
      <div className="ai-chat-context">
        {tr['ai.current']}: {currentName} ({currentCode})
      </div>
      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-chat-msg ai-chat-msg-system">
            {tr['ai.placeholder'].replace('{name}', currentName)}
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
          onKeyDown={handleKeyDown} placeholder={tr['ai.inputPlaceholder']} disabled={streaming} />
        <button className="ai-chat-send" onClick={handleSend} disabled={streaming || !input.trim()}>
          {streaming ? '...' : tr['ai.send']}
        </button>
      </div>
      <div className="ai-chat-body">
        <ConfigProvider
          theme={{
            cssVar: true,
            algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          }}
        >
          <ProChat
            request={request}
            helloMessage={helloMessage}
            placeholder="输入问题..."
            showTitle={false}
            style={{ height: '100%' }}
          />
        </ConfigProvider>
      </div>
    </div>
  );
};

export default AIChatPanel;
