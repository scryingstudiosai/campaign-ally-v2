'use client';

import { useState, useEffect, useCallback } from 'react';
import { InventoryInstanceWithItem, OwnerType, AddToInventoryInput } from '@/types/inventory';

export function useInventory(campaignId: string, ownerType?: OwnerType, ownerId?: string) {
  const [items, setItems] = useState<InventoryInstanceWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ campaignId });
      if (ownerType && ownerId) {
        params.append('ownerType', ownerType);
        params.append('ownerId', ownerId);
      }

      const res = await fetch(`/api/inventory?${params}`);
      if (!res.ok) throw new Error('Failed to fetch inventory');

      const data = await res.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [campaignId, ownerType, ownerId]);

  useEffect(() => {
    if (campaignId) {
      fetchInventory();
    }
  }, [fetchInventory, campaignId]);

  const addItem = async (input: AddToInventoryInput) => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add item');
    }
    await fetchInventory();
    return res.json();
  };

  const updateItem = async (id: string, updates: Partial<InventoryInstanceWithItem>) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update item');
    }
    await fetchInventory();
    return res.json();
  };

  const removeItem = async (id: string) => {
    const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to remove item');
    }
    await fetchInventory();
  };

  const transferItem = async (
    instanceId: string,
    newOwnerType: OwnerType,
    newOwnerId: string,
    quantity?: number
  ) => {
    const res = await fetch('/api/inventory/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance_id: instanceId,
        new_owner_type: newOwnerType,
        new_owner_id: newOwnerId,
        quantity,
      }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to transfer item');
    }
    await fetchInventory();
    return res.json();
  };

  const consumeItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (item.quantity > 1) {
      await updateItem(id, { quantity: item.quantity - 1 });
    } else {
      await removeItem(id);
    }
  };

  const spendCharge = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.charges === null || item.charges <= 0) return;

    await updateItem(id, { charges: item.charges - 1 });
  };

  const reorderItems = async (reorderedItems: { id: string; sort_order: number }[]) => {
    // Batch update sort orders
    await Promise.all(
      reorderedItems.map(({ id, sort_order }) =>
        fetch(`/api/inventory/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order }),
        })
      )
    );
    await fetchInventory();
  };

  // Computed values
  const totalWeight = items.reduce((sum, item) => {
    const itemMechanics = item.custom_entity?.mechanics as Record<string, unknown> | undefined;
    const weight = item.srd_item?.weight || (itemMechanics?.weight as number) || 0;
    return sum + weight * item.quantity;
  }, 0);

  const totalValue = items.reduce((sum, item) => {
    const itemMechanics = item.custom_entity?.mechanics as Record<string, unknown> | undefined;
    const value =
      item.value_override ?? item.srd_item?.value_gp ?? (itemMechanics?.value_gp as number) ?? 0;
    return sum + value * item.quantity;
  }, 0);

  return {
    items,
    loading,
    error,
    refetch: fetchInventory,
    addItem,
    updateItem,
    removeItem,
    transferItem,
    consumeItem,
    spendCharge,
    reorderItems,
    totalWeight,
    totalValue,
  };
}
