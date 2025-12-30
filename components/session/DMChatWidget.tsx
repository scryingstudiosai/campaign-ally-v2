'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Users, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'dm' | 'player';
  channel: 'party' | 'dm_private';
  content: string;
  created_at: string;
}

interface Props {
  campaignId: string;
  userId: string;
}

export function DMChatWidget({ campaignId, userId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('channel', 'party')
        .order('created_at', { ascending: false })
        .limit(20);

      setMessages((data || []).reverse());
    };

    fetchMessages();
  }, [campaignId, supabase]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`dm-chat-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'portal_messages',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => [...prev, msg]);

          if (msg.sender_id !== userId && !isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, userId, isOpen, supabase]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Clear unread when opened
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    await fetch('/api/portal/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        channel: 'party',
        content: newMessage,
      }),
    });

    setNewMessage('');
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 p-3 rounded-full shadow-lg transition-all z-40",
          isOpen
            ? "bg-slate-700 text-slate-300"
            : "bg-teal-600 text-white hover:bg-teal-500"
        )}
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-slate-900 rounded-xl border border-white/10 shadow-2xl flex flex-col z-40 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-white/10 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span className="font-medium text-white">Party Chat</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No messages yet</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "text-sm",
                  msg.sender_type === 'dm' ? "text-purple-400" : "text-slate-300"
                )}
              >
                <span className="font-medium">{msg.sender_name}:</span>{' '}
                <span className="text-slate-400">{msg.content}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message party..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="p-2 rounded-lg bg-teal-600 text-white disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
