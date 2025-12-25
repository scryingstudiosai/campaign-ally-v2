'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { InventoryList } from './InventoryList';
import { TransferItemDialog } from './TransferItemDialog';
import { OwnerType, InventoryInstanceWithItem } from '@/types/inventory';
import { useInventory } from '@/hooks/use-inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SrdItemDisplay } from '@/components/srd/SrdItemDisplay';
import { Package, RefreshCw } from 'lucide-react';

interface EntityInventorySectionProps {
  campaignId: string;
  entityId: string;
  entityType: string;
  subType?: string;
  mechanics?: Record<string, unknown>;
}

export function EntityInventorySection({
  campaignId,
  entityId,
  entityType,
  subType,
  mechanics,
}: EntityInventorySectionProps): JSX.Element | null {
  // Only show inventory for entity types that can hold items
  const canHoldItems = ['npc', 'player', 'location'].includes(entityType);

  // State for dialogs
  const [viewingItem, setViewingItem] = useState<InventoryInstanceWithItem | null>(null);
  const [transferringItem, setTransferringItem] = useState<InventoryInstanceWithItem | null>(null);
  const [isStocking, setIsStocking] = useState(false);

  // Use inventory hook for refetching after transfer
  const { items, refetch } = useInventory(campaignId, entityType as OwnerType, entityId);

  const handleTransferComplete = useCallback(() => {
    setTransferringItem(null);
    refetch();
  }, [refetch]);

  // Handle stock shelves action for shops
  const handleStockShelves = useCallback(async () => {
    setIsStocking(true);
    try {
      const response = await fetch('/api/location/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          locationId: entityId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to stock shop');
      }

      const result = await response.json();
      toast.success(`Stocked ${result.itemsAdded} items!`);
      refetch();
    } catch (error) {
      console.error('Error stocking shop:', error);
      toast.error('Failed to stock shelves');
    } finally {
      setIsStocking(false);
    }
  }, [campaignId, entityId, refetch]);

  if (!canHoldItems) {
    return null;
  }

  // Determine if this is a shop (from mechanics or sub_type)
  const isShop = Boolean(mechanics?.is_shop) || subType === 'shop';

  // Determine view mode - shops show prices
  const viewMode = isShop ? 'shop' : 'default';

  // Get item display name
  const viewingItemName = viewingItem?.srd_item?.name || viewingItem?.custom_entity?.name || 'Item';

  // Show Stock Shelves button for shops with empty or low inventory
  const showStockButton = isShop && entityType === 'location' && items.length < 3;

  return (
    <div className="ca-panel p-4">
      {/* Stock Shelves Button for empty shops */}
      {showStockButton && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Package className="w-5 h-5" />
            <span className="text-sm">
              {items.length === 0 ? 'This shop has empty shelves!' : 'Running low on stock!'}
            </span>
          </div>
          <Button
            onClick={handleStockShelves}
            disabled={isStocking}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isStocking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Stocking...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Stock Shelves
              </>
            )}
          </Button>
        </div>
      )}

      <InventoryList
        campaignId={campaignId}
        ownerType={entityType as OwnerType}
        ownerId={entityId}
        viewMode={viewMode}
        onViewDetails={(item) => setViewingItem(item)}
        onTransfer={(item) => setTransferringItem(item)}
      />

      {/* View Item Details Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-200">{viewingItemName}</DialogTitle>
          </DialogHeader>

          {/* SRD Item Display */}
          {viewingItem?.srd_item && (
            <SrdItemDisplay item={viewingItem.srd_item as Parameters<typeof SrdItemDisplay>[0]['item']} />
          )}

          {/* Custom Entity Display */}
          {viewingItem?.custom_entity && (
            <div className="space-y-4">
              <div className="text-sm text-slate-400 capitalize">
                {viewingItem.custom_entity.sub_type}
              </div>
              <p className="text-slate-300">{viewingItem.custom_entity.description}</p>
              {viewingItem.custom_entity.mechanics && Object.keys(viewingItem.custom_entity.mechanics).length > 0 && (
                <div className="p-3 bg-slate-800 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Properties</h4>
                  <dl className="space-y-1 text-sm">
                    {Object.entries(viewingItem.custom_entity.mechanics).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <dt className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</dt>
                        <dd className="text-slate-300">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}

          {/* Instance-specific info */}
          {viewingItem && (
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Quantity:</span>
                <span className="text-slate-200">{viewingItem.quantity}</span>
              </div>
              {viewingItem.charges != null && (
                <div className="flex justify-between text-slate-400">
                  <span>Charges:</span>
                  <span className="text-slate-200">
                    {viewingItem.charges}/{viewingItem.max_charges}
                  </span>
                </div>
              )}
              {viewingItem.is_equipped && (
                <div className="text-amber-400">Equipped</div>
              )}
              {viewingItem.is_attuned && (
                <div className="text-purple-400">Attuned</div>
              )}
              {!viewingItem.is_identified && (
                <div className="text-red-400">Unidentified</div>
              )}
              {viewingItem.notes && (
                <div className="pt-2">
                  <span className="text-slate-400">Notes:</span>
                  <p className="text-slate-300 mt-1">{viewingItem.notes}</p>
                </div>
              )}
              {viewingItem.acquired_from && (
                <div className="text-slate-500 text-xs">
                  Acquired from: {viewingItem.acquired_from}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Item Dialog */}
      <TransferItemDialog
        item={transferringItem}
        campaignId={campaignId}
        onClose={() => setTransferringItem(null)}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  );
}
