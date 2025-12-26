'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { InventoryList } from './InventoryList';
import { TransferItemDialog } from './TransferItemDialog';
import { AddItemToInventoryDialog } from './AddItemToInventoryDialog';
import { SrdLinkDialog } from './SrdLinkDialog';
import { OwnerType, InventoryInstanceWithItem } from '@/types/inventory';
import { useInventory } from '@/hooks/use-inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SrdItemDisplay } from '@/components/srd/SrdItemDisplay';
import { Package, RefreshCw, Plus, Store, Link } from 'lucide-react';

interface EntityInventorySectionProps {
  campaignId: string;
  entityId: string;
  entityType: string;
  entityName?: string;
  subType?: string;
  mechanics?: Record<string, unknown>;
}

export function EntityInventorySection({
  campaignId,
  entityId,
  entityType,
  entityName,
  subType,
  mechanics,
}: EntityInventorySectionProps): JSX.Element | null {
  // Only show inventory for entity types that can hold items
  const canHoldItems = ['npc', 'player', 'location'].includes(entityType);

  // State for dialogs
  const [viewingItem, setViewingItem] = useState<InventoryInstanceWithItem | null>(null);
  const [transferringItem, setTransferringItem] = useState<InventoryInstanceWithItem | null>(null);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showSrdLinkDialog, setShowSrdLinkDialog] = useState(false);
  const [isStocking, setIsStocking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use inventory hook for local state (Stock Shelves button visibility)
  const { items, refetch } = useInventory(campaignId, entityType as OwnerType, entityId);

  const handleTransferComplete = useCallback(() => {
    setTransferringItem(null);
    // Increment refreshKey to trigger InventoryList refetch
    setRefreshKey((k) => k + 1);
    refetch(); // Also refresh local state for Stock Shelves button
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
      // Increment refreshKey to trigger InventoryList refetch
      setRefreshKey((k) => k + 1);
      refetch(); // Also refresh local state
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

  // Determine if this is a shop
  // Check: mechanics.is_shop, sub_type, or name/sub_type contains shop keywords
  const shopKeywords = /shop|store|merchant|market|smithy|blacksmith|apothecary|armorer|armourer|weaponsmith|fletcher|tannery|jeweler|jeweller|emporium|bazaar|trading post|general store/i;
  const isShop = entityType === 'location' && (
    Boolean(mechanics?.is_shop) ||
    subType === 'shop' ||
    shopKeywords.test(`${entityName || ''} ${subType || ''}`)
  );

  // Get price modifier from mechanics (default 1.0 = no markup/discount)
  const priceModifier = (mechanics?.price_modifier as number) || 1.0;

  // Determine view mode - shops show prices
  const viewMode = isShop ? 'shop' : 'default';

  // Get item display name
  const viewingItemName = viewingItem?.srd_item?.name || viewingItem?.custom_entity?.name || 'Item';

  // Show Stock Shelves button for ALL locations (any location can be stocked)
  const showStockButton = entityType === 'location';

  return (
    <div className="ca-panel p-4">
      {/* Header with Add Item button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          {isShop ? <Store className="w-5 h-5 text-amber-400" /> : <Package className="w-5 h-5" />}
          {isShop ? 'Shop Inventory' : 'Inventory'}
          <span className="text-sm text-slate-400 font-normal">
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
          {/* Price modifier badge for shops */}
          {isShop && priceModifier !== 1.0 && (
            <Badge
              variant="outline"
              className={priceModifier > 1
                ? 'border-red-500 text-red-400 text-xs'
                : 'border-green-500 text-green-400 text-xs'
              }
            >
              {priceModifier > 1
                ? `${Math.round((priceModifier - 1) * 100)}% Markup`
                : `${Math.round((1 - priceModifier) * 100)}% Discount`
              }
            </Badge>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddItemDialog(true)}
          className="border-slate-700 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Stock Shelves Button for locations */}
      {showStockButton && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Package className="w-5 h-5" />
            <span className="text-sm">
              {isShop
                ? items.length === 0
                  ? 'This shop has empty shelves!'
                  : 'Restock with appropriate items'
                : 'Add shop inventory to this location'}
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
        priceModifier={isShop ? priceModifier : undefined}
        showHeader={false}
        onViewDetails={(item) => setViewingItem(item)}
        onTransfer={(item) => setTransferringItem(item)}
        refreshKey={refreshKey}
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

              {/* Link to SRD option for custom items without SRD link */}
              {viewingItem.custom_entity_id && !viewingItem.srd_item_id && (
                <div className="p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                  <p className="text-sm text-amber-400 mb-2">
                    This is a custom item without official D&D stats.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSrdLinkDialog(true)}
                    className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Link to SRD Item for Stats
                  </Button>
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
        isShopMode={isShop}
        priceModifier={priceModifier}
        onClose={() => setTransferringItem(null)}
        onTransferComplete={handleTransferComplete}
      />

      {/* Add Item Dialog */}
      <AddItemToInventoryDialog
        open={showAddItemDialog}
        onClose={() => setShowAddItemDialog(false)}
        campaignId={campaignId}
        ownerType={entityType}
        ownerId={entityId}
        ownerName={entityName}
        onItemAdded={() => {
          setRefreshKey((k) => k + 1);
          refetch();
          setShowAddItemDialog(false);
        }}
      />

      {/* SRD Link Dialog */}
      {viewingItem && (
        <SrdLinkDialog
          open={showSrdLinkDialog}
          inventoryInstanceId={viewingItem.id}
          customItemName={viewingItem.custom_entity?.name || 'Item'}
          onClose={() => setShowSrdLinkDialog(false)}
          onLinked={() => {
            setShowSrdLinkDialog(false);
            setViewingItem(null);
            setRefreshKey((k) => k + 1);
            refetch();
          }}
        />
      )}
    </div>
  );
}
