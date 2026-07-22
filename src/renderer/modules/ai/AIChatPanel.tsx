import React, { useCallback, useMemo } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ProChat } from '@ant-design/pro-chat';
import type { ChatRequest } from '@ant-design/pro-chat';
import { useStore } from '../../store';
import './ai-chat.css';

const AIChatPanel: React.FC = () => {
  const toggleAIChat = useStore((s) => s.toggleAIChat);
  const currentCode = useStore((s) => s.currentCode);
  const currentName = useStore((s) => s.currentName);
  const resolvedTheme = useStore((s) => s.resolvedTheme);

  const isDark = resolvedTheme === 'dark';

  const request: ChatRequest = useCallback(async (messages, _config, signal) => {
    const api = (window as any).bangAPI;
    if (!api?.aiChat) {
      return 'AI 未配置，请在设置中配置 API Key';
    }

    const chatMessages = messages.map((m: any) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : '',
    }));

    const textEncoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        if (signal?.aborted) {
          controller.close();
          return;
        }

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
        <span>AI 分析助手</span>
        <button className="ai-chat-close" onClick={toggleAIChat}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
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
