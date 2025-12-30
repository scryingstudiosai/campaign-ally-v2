'use client';

import { cn } from '@/lib/utils';
import { Shield, Lock } from 'lucide-react';

interface Props {
  message: {
    id: string;
    sender_name: string;
    sender_type: 'dm' | 'player';
    channel: 'party' | 'dm_private';
    content: string;
    created_at: string;
  };
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  const isDM = message.sender_type === 'dm';
  const isWhisper = message.channel === 'dm_private';

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      {/* Sender name + indicators */}
      {!isOwn && (
        <div className="flex items-center gap-1.5 px-2">
          {isDM && <Shield className="w-3 h-3 text-purple-400" />}
          {isWhisper && <Lock className="w-3 h-3 text-amber-400" />}
          <span className={cn(
            "text-xs font-medium",
            isDM ? "text-purple-400" : "text-slate-400"
          )}>
            {message.sender_name}
            {isWhisper && <span className="text-amber-400 ml-1">(whisper)</span>}
          </span>
        </div>
      )}

      {/* Whisper indicator for own messages */}
      {isOwn && isWhisper && (
        <div className="flex items-center gap-1 px-2">
          <Lock className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-amber-400">whisper</span>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 rounded-2xl",
          isOwn
            ? isWhisper
              ? "bg-amber-600 text-white rounded-br-md"
              : "bg-teal-600 text-white rounded-br-md"
            : isDM
              ? "bg-purple-500/20 text-white border border-purple-500/30 rounded-bl-md"
              : isWhisper
                ? "bg-amber-500/20 text-white border border-amber-500/30 rounded-bl-md"
                : "bg-slate-800 text-white rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>

      <span className="text-[10px] text-slate-500 px-2">{time}</span>
    </div>
  );
}
