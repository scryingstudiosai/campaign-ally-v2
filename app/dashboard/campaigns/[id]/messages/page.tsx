'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Send,
  Users,
  Loader2,
  ChevronLeft,
  User,
  CheckCheck
} from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'dm' | 'player';
  channel: 'party' | 'dm_private';
  content: string;
  created_at: string;
  recipient_id?: string;
}

interface PlayerConversation {
  userId: string;
  characterName: string;
  characterId: string | null;
  imageUrl: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function DMMessagesPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'party' | 'conversation'>('list');
  const [conversations, setConversations] = useState<PlayerConversation[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partyMessages, setPartyMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [partyUnreadCount, setPartyUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to mark a specific player's messages as read
  const markPlayerMessagesAsRead = useCallback(async (senderId: string) => {
    console.log('[Messages] markPlayerMessagesAsRead called with senderId:', senderId);

    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          type: 'player_message',
          senderId,
        }),
      });

      const result = await res.json();
      console.log('[Messages] mark-read API response:', result);

      if (res.ok) {
        // Dispatch event to update sidebar badge
        window.dispatchEvent(
          new CustomEvent('notifications-marked-read', {
            detail: { campaignId, type: 'player_message' },
          })
        );

        // Also update the local unread count for this conversation
        setConversations(prev => prev.map(conv =>
          conv.userId === senderId ? { ...conv, unreadCount: 0 } : conv
        ));
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [campaignId]);

  // Function to mark party messages as read
  const markPartyMessagesAsRead = useCallback(async () => {
    console.log('[Messages] markPartyMessagesAsRead called');

    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          type: 'party_message',
        }),
      });

      const result = await res.json();
      console.log('[Messages] mark-read party API response:', result);

      if (res.ok) {
        // Dispatch event to update sidebar badge
        window.dispatchEvent(
          new CustomEvent('notifications-marked-read', {
            detail: { campaignId, type: 'party_message' },
          })
        );

        // Clear local party unread count
        setPartyUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark party messages as read:', error);
    }
  }, [campaignId]);

  // Fetch player conversations
  const fetchConversations = useCallback(async () => {
    // Get all private messages for this campaign
    const { data: allMessages } = await supabase
      .from('portal_messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('channel', 'dm_private')
      .order('created_at', { ascending: false });

    // Get campaign members with characters
    const { data: members } = await supabase
      .from('campaign_members')
      .select(`
        user_id,
        character_entity_id,
        character:entities!character_entity_id (id, name, image_url)
      `)
      .eq('campaign_id', campaignId)
      .eq('role', 'player');

    if (!members) return;

    console.log('[Messages] Building conversations from members:', members.map(m => ({
      user_id: m.user_id,
      character_entity_id: m.character_entity_id,
    })));

    // Build conversations list
    const convMap = new Map<string, PlayerConversation>();

    for (const member of members) {
      const charData = member.character as unknown;
      const char = charData
        ? (Array.isArray(charData) ? charData[0] : charData) as { id: string; name: string; image_url: string | null }
        : null;
      const playerMessages = (allMessages || []).filter(
        m => m.sender_id === member.user_id || m.recipient_id === member.user_id
      );
      const lastMsg = playerMessages[0];

      // IMPORTANT: userId is the user's auth ID (from campaign_members.user_id)
      // This is the same as sender_id in portal_messages
      convMap.set(member.user_id, {
        userId: member.user_id,
        characterName: char?.name || 'Unknown Player',
        characterId: char?.id || null,
        imageUrl: char?.image_url || null,
        lastMessage: lastMsg?.content || '',
        lastMessageTime: lastMsg?.created_at || '',
        unreadCount: 0, // Will be updated from notifications
      });
    }

    // Get unread counts from portal_messages (player->DM private messages)
    const { data: unreadMessages } = await supabase
      .from('portal_messages')
      .select('sender_id')
      .eq('campaign_id', campaignId)
      .eq('channel', 'dm_private')
      .eq('sender_type', 'player')
      .eq('is_read', false);

    if (unreadMessages) {
      for (const msg of unreadMessages) {
        const conv = convMap.get(msg.sender_id);
        if (conv) {
          conv.unreadCount++;
        }
      }
    }

    setConversations(Array.from(convMap.values()).sort((a, b) => {
      // Sort by unread first, then by last message time
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    }));

    // Also fetch party chat unread count (messages from players, not DM)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count: partyCount } = await supabase
        .from('portal_messages')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('channel', 'party')
        .eq('is_read', false)
        .neq('sender_id', user.id);  // Exclude DM's own messages

      setPartyUnreadCount(partyCount || 0);
    }
  }, [campaignId, supabase]);

  // Fetch party messages
  const fetchPartyMessages = useCallback(async () => {
    const { data } = await supabase
      .from('portal_messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('channel', 'party')
      .order('created_at', { ascending: true })
      .limit(100);

    setPartyMessages(data || []);
  }, [campaignId, supabase]);

  // Fetch conversation with specific player
  const fetchConversation = useCallback(async (playerId: string) => {
    console.log('[Messages] fetchConversation called with playerId (user_id):', playerId);

    const { data } = await supabase
      .from('portal_messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('channel', 'dm_private')
      .or(`sender_id.eq.${playerId},recipient_id.eq.${playerId}`)
      .order('created_at', { ascending: true })
      .limit(100);

    console.log('[Messages] Loaded messages, first message sender_id:', data?.[0]?.sender_id);

    setMessages(data || []);

    // Mark this player's messages as read (updates sidebar badge)
    // playerId here is the user's auth ID from campaign_members.user_id
    await markPlayerMessagesAsRead(playerId);
  }, [campaignId, supabase, markPlayerMessagesAsRead]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchConversations().then(() => setLoading(false));
  }, [fetchConversations]);

  // Load conversation when player is selected
  useEffect(() => {
    if (selectedPlayer) {
      fetchConversation(selectedPlayer.userId);
    }
  }, [selectedPlayer, fetchConversation]);

  // Load party messages when switching to party view
  useEffect(() => {
    if (activeView === 'party') {
      fetchPartyMessages();
      // Mark party messages as read when opening party chat
      markPartyMessagesAsRead();
    }
  }, [activeView, fetchPartyMessages, markPartyMessagesAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partyMessages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          channel: activeView === 'party' ? 'party' : 'dm_private',
          content,
          recipientId: selectedPlayer?.userId,
        }),
      });

      if (response.ok) {
        const { message } = await response.json();
        if (activeView === 'party') {
          setPartyMessages(prev => [...prev, message]);
        } else {
          setMessages(prev => [...prev, message]);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // Conversation view
  if (activeView === 'conversation' && selectedPlayer) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setActiveView('list');
                setSelectedPlayer(null);
                fetchConversations();
              }}
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {selectedPlayer.imageUrl ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-700">
                <Image
                  src={selectedPlayer.imageUrl}
                  alt={selectedPlayer.characterName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-400" />
              </div>
            )}
            <div>
              <h2 className="font-medium text-white">{selectedPlayer.characterName}</h2>
              <p className="text-xs text-slate-500">Private messages</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No messages yet. Start a conversation!</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender_type === 'dm' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2",
                  msg.sender_type === 'dm'
                    ? "bg-purple-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm"
                )}
              >
                <p className="text-sm">{msg.content}</p>
                <div className={cn(
                  "flex items-center gap-1 mt-1",
                  msg.sender_type === 'dm' ? "justify-end" : "justify-start"
                )}>
                  <span className="text-[10px] opacity-60">
                    {formatTime(msg.created_at)}
                  </span>
                  {msg.sender_type === 'dm' && (
                    <CheckCheck className="h-3 w-3 opacity-60" />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply to player..."
              className="flex-1 bg-slate-800 border-slate-700"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="bg-purple-600 hover:bg-purple-500"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Party messages view
  if (activeView === 'party') {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveView('list')}
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-teal-900/50 flex items-center justify-center">
              <Users className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h2 className="font-medium text-white">Party Chat</h2>
              <p className="text-xs text-slate-500">All players can see this</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {partyMessages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No party messages yet.</p>
            </div>
          )}

          {partyMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender_type === 'dm' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2",
                  msg.sender_type === 'dm'
                    ? "bg-teal-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm"
                )}
              >
                {msg.sender_type !== 'dm' && (
                  <p className="text-xs text-teal-400 font-medium mb-1">{msg.sender_name}</p>
                )}
                <p className="text-sm">{msg.content}</p>
                <span className="text-[10px] opacity-60 block mt-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message the party..."
              className="flex-1 bg-slate-800 border-slate-700"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="bg-teal-600 hover:bg-teal-500"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-teal-400" />
          Messages
        </h1>
        <p className="text-slate-400 mt-1">Chat with your players</p>
      </div>

      {/* Party Chat Card */}
      <Card
        className={cn(
          "bg-slate-900 border-slate-800 hover:border-teal-500/30 transition-colors cursor-pointer",
          partyUnreadCount > 0 && "border-teal-500/50"
        )}
        onClick={() => setActiveView('party')}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-900/50 flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white">Party Chat</h3>
              <p className="text-sm text-slate-400 truncate">
                Group chat with all players
              </p>
            </div>
            {partyUnreadCount > 0 && (
              <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{partyUnreadCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Player Conversations */}
      <div>
        <h2 className="text-lg font-medium text-slate-300 mb-3">Private Messages</h2>

        {conversations.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No player conversations yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Players can start private chats from the portal
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.userId}
                className={cn(
                  "bg-slate-900 border-slate-800 hover:border-purple-500/30 transition-colors cursor-pointer",
                  conv.unreadCount > 0 && "border-purple-500/50"
                )}
                onClick={() => {
                  console.log('[Messages] Clicked conversation:', {
                    characterName: conv.characterName,
                    userId: conv.userId,
                    characterId: conv.characterId,
                  });
                  setSelectedPlayer(conv);
                  setActiveView('conversation');
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {conv.imageUrl ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-700">
                        <Image
                          src={conv.imageUrl}
                          alt={conv.characterName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <User className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">{conv.characterName}</h3>
                        {conv.lastMessageTime && (
                          <span className="text-xs text-slate-500">
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        {conv.lastMessage || 'No messages'}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{conv.unreadCount}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
