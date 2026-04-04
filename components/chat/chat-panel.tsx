'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { ChatMessage } from './chat-message';
import { X, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type ChatPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: m.content || 'Xatolik yuz berdi. Qayta urinib ko\'ring.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      className={`
        bg-gray-50 border-l border-gray-200 flex flex-col
        transition-all duration-300 ease-in-out
        fixed right-0 top-[68px] bottom-0 z-30
        ${isCollapsed ? 'w-16' : 'w-[380px]'}
      `}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium text-sm text-gray-900">AI Assistant</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors ml-auto"
        >
          {isCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {!isCollapsed ? (
        <>
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">AI yordamchi</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Mahsulotlar bo&apos;yicha savollaringizni bering. Tavsif yozish, narx belgilash, marketing — hammasida yordam beraman.
                </p>
              </div>
            ) : (
              <div className="py-2">
                {messages.map((message) => (
                  <ChatMessage key={message.id} content={message.content} role={message.role} />
                ))}
                {isLoading && (
                  <div className="flex gap-3 px-4 py-3 justify-start">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Xabar yozing..."
                rows={1}
                name="prompt"
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 min-h-[40px] max-h-[120px]"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="shrink-0 h-[40px] w-[40px] rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white flex items-center justify-center transition-colors"
              >
                {isLoading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                )}
              </button>
            </div>
          </form>

          {messages.length > 0 && (
            <div className="px-3 pb-2">
              <button
                type="button"
                onClick={() => setMessages([])}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear chat
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-4 gap-4">
          <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">AI</span>
        </div>
      )}
    </aside>
  );
}
