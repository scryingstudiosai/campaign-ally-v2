'use client';

import { useState, useEffect } from 'react';
import { Loader2, Coins } from 'lucide-react';
import { InventoryInstanceWithItem } from '@/types/inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getItemPrice, formatPrice } from '@/lib/inventory/price-utils';

interface TransferItemDialogProps {
  item: InventoryInstanceWithItem | null;
  campaignId: string;
  isShopMode?: boolean;
  priceModifier?: number;
  onClose: () => void;
  onTransferComplete: () => void;
}

export function TransferItemDialog({
  item,
  campaignId,
  isShopMode = false,
  priceModifier = 1.0,
  onClose,
  onTransferComplete,
}: TransferItemDialogProps): JSX.Element {
  const [ownerType, setOwnerType] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [owners, setOwners] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const itemName = item?.srd_item?.name || item?.custom_entity?.name || 'Item';
  const maxQuantity = item?.quantity || 1;
  const rarity = item?.srd_item?.rarity?.toLowerCase() || 'common';
  const itemType = item?.srd_item?.item_type || item?.custom_entity?.sub_type || 'item';
  const mechanics = (item?.srd_item?.mechanics || item?.custom_entity?.mechanics) as Record<string, unknown> | undefined;

  // Calculate price for shop mode using price utility
  const explicitValue = item?.value_override ?? item?.srd_item?.value_gp ?? mechanics?.value_gp as number | undefined;
  const itemPrice = getItemPrice(itemName, explicitValue, rarity, itemType, priceModifier);
  const totalPrice = itemPrice != null ? itemPrice * quantity : null;

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setOwnerType('');
      setOwnerId('');
      setQuantity(1);
      setOwners([]);
    }
  }, [item]);

  // Fetch owners when type changes
  useEffect(() => {
    if (!ownerType || ownerType === 'party') {
      setOwners([]);
      return;
    }

    setLoadingOwners(true);
    fetch(`/api/entities?campaignId=${campaignId}&entityType=${ownerType}`)
      .then((res) => res.json())
      .then((data) => setOwners(data))
      .catch((err) => console.error('Failed to fetch owners:', err))
      .finally(() => setLoadingOwners(false));
  }, [ownerType, campaignId]);

  const handleOwnerTypeChange = (value: string) => {
    setOwnerType(value);
    setOwnerId('');
    if (value === 'party') {
      setOwnerId(campaignId);
    }
  };

  const handleTransfer = async () => {
    if (!item || !ownerType) return;

    const targetOwnerId = ownerType === 'party' ? campaignId : ownerId;
    if (!targetOwnerId) return;

    setTransferring(true);
    try {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: item.id,
          new_owner_type: ownerType,
          new_owner_id: targetOwnerId,
          quantity: quantity,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Transfer failed');
      }

      if (isShopMode) {
        if (totalPrice != null) {
          toast.success(`Purchased ${quantity}x ${itemName} for ${formatPrice(totalPrice)}. Remember to deduct gold!`, { duration: 5000 });
        } else {
          toast.success(`Acquired ${quantity}x ${itemName}`);
        }
      } else {
        toast.success(`Transferred ${quantity}x ${itemName}`);
      }
      onTransferComplete();
      onClose();
    } catch (err) {
      console.error('Transfer failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to transfer item');
    } finally {
      setTransferring(false);
    }
  };

  const canTransfer = ownerType && (ownerType === 'party' || ownerId) && !transferring;

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-200">
            {isShopMode ? 'Purchase Item' : 'Transfer Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item being transferred/purchased */}
          <div className="p-3 bg-slate-800 rounded-lg">
            <p className="font-medium text-slate-200">{itemName}</p>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Available: {maxQuantity}</span>
              {isShopMode && (
                <span className={`flex items-center gap-1 ${itemPrice != null ? 'text-amber-400' : 'text-slate-500'}`}>
                  <Coins className="w-3 h-3" />
                  {itemPrice != null ? `${formatPrice(itemPrice)} each` : 'Price not set'}
                </span>
              )}
            </div>
          </div>

          {/* Owner Type */}
          <div className="space-y-2">
            <Label className="text-slate-300">Transfer to</Label>
            <Select value={ownerType} onValueChange={handleOwnerTypeChange}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                <SelectValue placeholder="Select destination..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="npc">NPC</SelectItem>
                <SelectItem value="player">Player Character</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="party">Party Inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Owner Selection */}
          {ownerType && ownerType !== 'party' && (
            <div className="space-y-2">
              <Label className="text-slate-300">Select recipient</Label>
              <Select value={ownerId} onValueChange={setOwnerId} disabled={loadingOwners}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectValue placeholder={loadingOwners ? 'Loading...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {owners.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      {loadingOwners ? 'Loading...' : `No ${ownerType}s found`}
                    </SelectItem>
                  ) : (
                    owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity */}
          {maxQuantity > 1 && (
            <div className="space-y-2">
              <Label className="text-slate-300">Quantity (max {maxQuantity})</Label>
              <Input
                type="number"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))
                }
                className="bg-slate-800 border-slate-700 text-slate-200 w-24"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Total price in shop mode */}
          {isShopMode && (
            <div className={`flex items-center gap-2 mr-auto ${totalPrice != null ? 'text-amber-400' : 'text-slate-500'}`}>
              <Coins className="w-4 h-4" />
              <span className="font-medium">
                {totalPrice != null ? `Total: ${formatPrice(totalPrice)}` : 'Price not set'}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!canTransfer}
              className={isShopMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-teal-600 hover:bg-teal-500'}
            >
              {transferring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {isShopMode ? 'Purchasing...' : 'Transferring...'}
                </>
              ) : isShopMode ? (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Purchase
                </>
              ) : (
                'Transfer'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
