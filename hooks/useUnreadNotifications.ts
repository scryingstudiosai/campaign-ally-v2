'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseUnreadNotificationsOptions {
  campaignId?: string;
  type?: string; // Filter by notification type
  pollInterval?: number; // Polling interval in ms (default: 60000 - fallback only)
  enableRealtime?: boolean; // Enable realtime subscription (default: true)
}

// Generate unique ID for each hook instance
let hookInstanceId = 0;

export function useUnreadNotifications(options: UseUnreadNotificationsOptions = {}) {
  const {
    campaignId,
    type,
    pollInterval = 60000, // Reduced priority - realtime is primary
    enableRealtime = true,
  } = options;

  const instanceId = useRef(++hookInstanceId);

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      let url = '/api/notifications/unread-count';
      const params = new URLSearchParams();

      if (campaignId) {
        params.set('campaignId', campaignId);
      }
      if (type) {
        params.set('type', type);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  }, [campaignId, type]);

  const markAsRead = useCallback(
    async (notificationIds?: string[]) => {
      try {
        const body = notificationIds
          ? { notificationIds }
          : { campaignId, markAll: true, type };

        const res = await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          // Optimistically update count
          if (notificationIds) {
            setCount((prev) => Math.max(0, prev - notificationIds.length));
          } else {
            setCount(0);
          }

          // Dispatch custom event to notify other hook instances
          // This ensures sidebar updates when Messages page marks as read
          window.dispatchEvent(
            new CustomEvent('notifications-marked-read', {
              detail: { campaignId, type },
            })
          );
        }
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    },
    [campaignId, type]
  );

  // Initial fetch and polling
  useEffect(() => {
    fetchCount();

    // Poll for updates
    const interval = setInterval(fetchCount, pollInterval);

    return () => clearInterval(interval);
  }, [fetchCount, pollInterval]);

  // Listen for cross-instance sync events
  // When one hook instance marks messages as read, others should refetch
  useEffect(() => {
    const handleMarkRead = (event: CustomEvent<{ campaignId?: string; type?: string }>) => {
      const { campaignId: eventCampaignId, type: eventType } = event.detail;

      // Only refetch if this hook is for the same campaign/type that was marked read
      const campaignMatches = !campaignId || !eventCampaignId || campaignId === eventCampaignId;
      const typeMatches = !type || !eventType || type === eventType;

      if (campaignMatches && typeMatches) {
        fetchCount();
      }
    };

    window.addEventListener('notifications-marked-read', handleMarkRead as EventListener);

    return () => {
      window.removeEventListener('notifications-marked-read', handleMarkRead as EventListener);
    };
  }, [campaignId, type, fetchCount]);

  // Realtime subscription
  useEffect(() => {
    if (!enableRealtime || !campaignId) return;

    const supabase = createClient();
    const id = instanceId.current;

    // Subscribe to different table based on type
    const tableName = type === 'player_message' ? 'portal_messages' : 'dm_notifications';
    // Use unique channel name per hook instance to avoid conflicts
    const channelName = type === 'player_message'
      ? `sidebar-messages-${campaignId}-${id}`
      : `sidebar-notifications-${campaignId}-${id}`;

    console.log(`[useUnreadNotifications:${id}] Setting up realtime subscription`, {
      table: tableName,
      channel: channelName,
      campaignId,
      type,
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log(`[useUnreadNotifications:${id}] INSERT received:`, payload.new);

          // For player_message type, only count messages from players
          if (type === 'player_message') {
            const newMsg = payload.new as { sender_type?: string };
            if (newMsg.sender_type === 'player') {
              console.log(`[useUnreadNotifications:${id}] New player message - incrementing count`);
              setCount((prev) => prev + 1);
            }
          } else {
            // For other types, increment count
            setCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          // Check if notification/message was marked as read
          const newRecord = payload.new as { is_read: boolean; sender_type?: string };
          const oldRecord = payload.old as { is_read: boolean };

          // For player_message type, only care about player messages
          if (type === 'player_message' && newRecord.sender_type !== 'player') {
            return;
          }

          if (!oldRecord.is_read && newRecord.is_read) {
            console.log(`[useUnreadNotifications:${id}] Message marked as read - decrementing count`);
            setCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log(`[useUnreadNotifications:${id}] Subscription status:`, status);
      });

    return () => {
      console.log(`[useUnreadNotifications:${id}] Cleaning up subscription`);
      supabase.removeChannel(channel);
    };
  }, [campaignId, enableRealtime, type]);

  return {
    count,
    loading,
    markAsRead,
    refresh: fetchCount,
  };
}
