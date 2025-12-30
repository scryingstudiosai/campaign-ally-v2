'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

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

interface UsePortalChatProps {
  campaignId: string;
  userId: string;
  activeChannel: 'party' | 'dm_private' | null;
}

export function usePortalChat({ campaignId, userId, activeChannel }: UsePortalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadParty, setUnreadParty] = useState(0);
  const [unreadDM, setUnreadDM] = useState(0);
  const supabase = createClient();

  // Fetch initial messages
  const fetchMessages = useCallback(async (channel: 'party' | 'dm_private') => {
    const response = await fetch(
      `/api/portal/messages?campaignId=${campaignId}&channel=${channel}`
    );
    const data = await response.json();
    return data.messages || [];
  }, [campaignId]);

  // Load messages when channel changes
  useEffect(() => {
    if (!activeChannel) return;

    fetchMessages(activeChannel).then(setMessages);
  }, [activeChannel, fetchMessages]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'portal_messages',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          // If we're viewing this channel, add to messages
          if (newMsg.channel === activeChannel) {
            setMessages(prev => [...prev, newMsg]);
          }

          // Update unread counts (if not our own message)
          if (newMsg.sender_id !== userId) {
            if (newMsg.channel === 'party' && activeChannel !== 'party') {
              setUnreadParty(prev => prev + 1);
            }
            if (newMsg.channel === 'dm_private' && activeChannel !== 'dm_private') {
              if (newMsg.recipient_id === userId || newMsg.sender_type === 'dm') {
                setUnreadDM(prev => prev + 1);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, userId, activeChannel, supabase]);

  // Clear unread when viewing channel
  useEffect(() => {
    if (activeChannel === 'party') setUnreadParty(0);
    if (activeChannel === 'dm_private') setUnreadDM(0);
  }, [activeChannel]);

  // Send message function
  const sendMessage = async (content: string, recipientId?: string) => {
    if (!activeChannel) return;

    await fetch('/api/portal/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        channel: activeChannel,
        content,
        recipientId,
      }),
    });
  };

  return {
    messages,
    unreadParty,
    unreadDM,
    sendMessage,
  };
}
