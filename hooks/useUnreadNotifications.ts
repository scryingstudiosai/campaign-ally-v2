'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseUnreadNotificationsOptions {
  campaignId?: string;
  type?: string; // Filter by notification type
  pollInterval?: number; // Polling interval in ms (default: 30000)
  enableRealtime?: boolean; // Enable realtime subscription (default: true)
}

export function useUnreadNotifications(options: UseUnreadNotificationsOptions = {}) {
  const {
    campaignId,
    type,
    pollInterval = 30000,
    enableRealtime = true,
  } = options;

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

    // Subscribe to different table based on type
    const tableName = type === 'player_message' ? 'portal_messages' : 'dm_notifications';
    const channelName = type === 'player_message'
      ? `portal-messages:${campaignId}`
      : `dm-notifications:${campaignId}`;

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
        () => {
          // New notification/message received, increment count
          setCount((prev) => prev + 1);
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
          const newRecord = payload.new as { is_read: boolean };
          const oldRecord = payload.old as { is_read: boolean };

          if (!oldRecord.is_read && newRecord.is_read) {
            setCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
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
