'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface InventoryItem {
  id: string;
  owner_type: string;
  owner_id: string;
  srd_item?: { name: string; rarity: string; item_type: string } | null;
  custom_item?: { name: string; image_url: string } | null;
}

interface UseRealtimeInventoryProps {
  campaignId: string;
  characterId: string;
}

export function useRealtimeInventory({ campaignId, characterId }: UseRealtimeInventoryProps) {
  const [newLoot, setNewLoot] = useState<InventoryItem | null>(null);
  const [stashUpdated, setStashUpdated] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel(`inventory-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_instances',
          filter: `campaign_id=eq.${campaignId}`,
        },
        async (payload) => {
          console.log('Inventory change:', payload);

          if (payload.eventType === 'INSERT') {
            const item = payload.new as Record<string, unknown>;

            // If item was given directly to this player
            if (item.owner_type === 'player' && item.owner_id === characterId) {
              // Fetch full item details for loot reveal
              const { data: fullItem } = await supabase
                .from('inventory_instances')
                .select(`
                  id, owner_type, owner_id,
                  srd_item:srd_items!srd_item_id (name, rarity, item_type),
                  custom_item:entities!custom_entity_id (name, image_url)
                `)
                .eq('id', item.id as string)
                .single();

              if (fullItem) {
                setNewLoot(fullItem as InventoryItem);
              }
              // Refresh page data to show the new item in inventory
              router.refresh();
            }

            // If item added to party stash
            if (item.owner_type === 'party') {
              setStashUpdated(true);
              router.refresh();
            }
          }

          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            // Refresh the page data
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, characterId, supabase, router]);

  const clearNewLoot = useCallback(() => {
    setNewLoot(null);
  }, []);

  const clearStashUpdate = useCallback(() => {
    setStashUpdated(false);
  }, []);

  return {
    newLoot,
    stashUpdated,
    clearNewLoot,
    clearStashUpdate,
  };
}
