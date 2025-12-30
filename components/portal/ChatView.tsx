'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePortalChat } from '@/hooks/usePortalChat';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/lib/utils';

interface Props {
  campaignId: string;
  userId: string;
  senderName: string;
  dmUserId?: string;
  initialChannel?: 'party' | 'dm_private';
}

export function ChatView({
  campaignId,
  userId,
  dmUserId,
  initialChannel = 'party'
}: Props) {
  const [activeChannel, setActiveChannel] = useState<'party' | 'dm_private'>(initialChannel);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, unreadParty, unreadDM, sendMessage } = usePortalChat({
    campaignId,
    userId,
    activeChannel,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    await sendMessage(content, activeChannel === 'dm_private' ? dmUserId : undefined);
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/portal/${campaignId}`}
            className="p-2 hover:bg-slate-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <h1 className="text-lg font-display text-white">Messages</h1>
        </div>

        {/* Channel Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveChannel('party')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all",
              activeChannel === 'party'
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Users className="w-4 h-4" />
            Party
            {unreadParty > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-xs">
                {unreadParty}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveChannel('dm_private')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all",
              activeChannel === 'dm_private'
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Shield className="w-4 h-4" />
            DM
            {unreadDM > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-xs">
                {unreadDM}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">
              {activeChannel === 'party'
                ? "No party messages yet. Say hello!"
                : "Private channel with your DM"}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_id === userId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-slate-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeChannel === 'party' ? "Message the party..." : "Whisper to DM..."}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className={cn(
              "px-4 py-3 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              activeChannel === 'party'
                ? "bg-teal-600 hover:bg-teal-500"
                : "bg-purple-600 hover:bg-purple-500"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
