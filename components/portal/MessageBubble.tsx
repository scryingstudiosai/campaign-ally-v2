'use client';

import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

interface Props {
  message: {
    id: string;
    sender_name: string;
    sender_type: 'dm' | 'player';
    content: string;
    created_at: string;
  };
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  const isDM = message.sender_type === 'dm';

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      {/* Sender name */}
      {!isOwn && (
        <div className="flex items-center gap-1.5 px-2">
          {isDM && <Shield className="w-3 h-3 text-purple-400" />}
          <span className={cn(
            "text-xs font-medium",
            isDM ? "text-purple-400" : "text-slate-400"
          )}>
            {message.sender_name}
          </span>
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 rounded-2xl",
          isOwn
            ? "bg-teal-600 text-white rounded-br-md"
            : isDM
              ? "bg-purple-500/20 text-white border border-purple-500/30 rounded-bl-md"
              : "bg-slate-800 text-white rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>

      <span className="text-[10px] text-slate-500 px-2">{time}</span>
    </div>
  );
}
