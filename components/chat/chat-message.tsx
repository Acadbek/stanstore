'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

type ChatMessageProps = {
  content: string;
  role: 'user' | 'assistant';
};

export function ChatMessage({ content, role }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-orange-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        )}
      >
        {content}
      </div>
      {isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}
