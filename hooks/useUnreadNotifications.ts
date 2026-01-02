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

        await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        // Optimistically update count
        if (notificationIds) {
          setCount((prev) => Math.max(0, prev - notificationIds.length));
        } else {
          setCount(0);
        }

        // Refresh to get accurate count
        fetchCount();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    },
    [campaignId, type, fetchCount]
  );

  // Initial fetch and polling
  useEffect(() => {
    fetchCount();

    // Poll for updates
    const interval = setInterval(fetchCount, pollInterval);

    return () => clearInterval(interval);
  }, [fetchCount, pollInterval]);

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
