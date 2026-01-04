'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Users, ChevronDown, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'dm' | 'player';
  channel: 'party' | 'dm_private';
  recipient_id: string | null;
  content: string;
  created_at: string;
}

interface Player {
  user_id: string;
  character_name: string;
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
  const [players, setPlayers] = useState<Player[]>([]);
  const [whisperTarget, setWhisperTarget] = useState<Player | null>(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch players in campaign
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('campaign_members')
        .select(`
          user_id,
          character:entities!character_entity_id (name)
        `)
        .eq('campaign_id', campaignId);

      if (data) {
        setPlayers(data.map(m => ({
          user_id: m.user_id,
          character_name: (m.character as { name: string } | null)?.name || 'Unknown'
        })));
      }
    };

    fetchPlayers();
  }, [campaignId, supabase]);

  // Fetch messages (party + all DM whispers as DM sees all)
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(50);

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

  // Scroll to bottom on new messages
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

    const channel = whisperTarget ? 'dm_private' : 'party';

    await fetch('/api/portal/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        channel,
        content: newMessage,
        recipientId: whisperTarget?.user_id,
      }),
    });

    setNewMessage('');
  };

  // Find player name for whisper display
  const getPlayerName = (recipientId: string | null) => {
    if (!recipientId) return '';
    const player = players.find(p => p.user_id === recipientId);
    return player?.character_name || 'Player';
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
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-slate-900 rounded-xl border border-white/10 shadow-2xl flex flex-col z-40 overflow-hidden">
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
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === userId;
              const isWhisper = msg.channel === 'dm_private';

              return (
                <div key={msg.id} className="text-sm">
                  <div className="flex items-center gap-1 mb-0.5">
                    {isWhisper && <Lock className="w-3 h-3 text-amber-400" />}
                    <span className={cn(
                      "font-medium",
                      msg.sender_type === 'dm' ? "text-purple-400" : "text-teal-400"
                    )}>
                      {msg.sender_name}
                    </span>
                    {isWhisper && (
                      <span className="text-amber-400 text-xs">
                        → {isOwn ? getPlayerName(msg.recipient_id) : 'you'}
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "ml-4",
                    isWhisper ? "text-amber-200/80" : "text-slate-300"
                  )}>
                    {msg.content}
                  </p>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Whisper Target Indicator */}
          {whisperTarget && (
            <div className="px-3 py-2 bg-amber-500/10 border-t border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400">
                  Whispering to {whisperTarget.character_name}
                </span>
              </div>
              <button
                onClick={() => setWhisperTarget(null)}
                className="text-amber-400 hover:text-amber-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-2 border-t border-white/10">
            {/* Player Select Dropdown */}
            <div className="relative mb-2">
              <button
                onClick={() => setShowPlayerSelect(!showPlayerSelect)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                  whisperTarget
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border border-white/10"
                )}
              >
                <div className="flex items-center gap-2">
                  {whisperTarget ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Whisper to {whisperTarget.character_name}
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Send to Party
                    </>
                  )}
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showPlayerSelect && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPlayerSelect(false)}
                  />
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        setWhisperTarget(null);
                        setShowPlayerSelect(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5",
                        !whisperTarget ? "text-teal-400" : "text-slate-300"
                      )}
                    >
                      <Users className="w-4 h-4" />
                      Send to Party (Public)
                    </button>
                    <div className="border-t border-white/10" />
                    {players.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        No players have joined yet
                      </div>
                    ) : (
                      players.map((player) => (
                        <button
                          key={player.user_id}
                          onClick={() => {
                            setWhisperTarget(player);
                            setShowPlayerSelect(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5",
                            whisperTarget?.user_id === player.user_id
                              ? "text-amber-400"
                              : "text-slate-300"
                          )}
                        >
                          <Lock className="w-4 h-4 text-amber-400" />
                          Whisper to {player.character_name}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={whisperTarget ? `Whisper to ${whisperTarget.character_name}...` : "Message party..."}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className={cn(
                  "p-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  whisperTarget
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-teal-600 hover:bg-teal-500"
                )}
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
