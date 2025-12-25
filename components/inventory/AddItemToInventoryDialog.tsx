'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SrdItemDisplay } from '@/components/srd/SrdItemDisplay';
import { Search, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SrdItem {
  id: string;
  name: string;
  item_type: string;
  rarity?: string;
  value_gp?: number;
  weight?: number;
  description?: string;
  mechanics?: Record<string, unknown>;
}

interface AddItemToInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  ownerType: string;
  ownerId: string;
  ownerName?: string;
  onItemAdded: () => void;
}

export function AddItemToInventoryDialog({
  open,
  onClose,
  campaignId,
  ownerType,
  ownerId,
  ownerName,
  onItemAdded,
}: AddItemToInventoryDialogProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SrdItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SrdItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/srd/search?q=${encodeURIComponent(searchQuery)}&type=item`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data.items || data || []);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search items');
    } finally {
      setSearching(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem) return;

    setAdding(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          srd_item_id: selectedItem.id,
          owner_type: ownerType,
          owner_id: ownerId,
          quantity,
          acquired_from: 'Manually added',
        }),
      });

      if (!res.ok) throw new Error('Failed to add item');

      toast.success(`Added ${quantity}x ${selectedItem.name}`);
      onItemAdded();
      handleClose();
    } catch (err) {
      console.error('Add item error:', err);
      toast.error('Failed to add item to inventory');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedItem(null);
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-slate-200">
            Add Item to {ownerName || 'Inventory'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search Section */}
          {!selectedItem && (
            <>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search SRD items..."
                    className="pl-10 bg-slate-800 border-slate-700 text-slate-200"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-teal-600 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">{item.name}</span>
                      <span className="text-xs text-slate-400">{item.item_type}</span>
                    </div>
                    {item.rarity && (
                      <span className="text-xs text-slate-500 capitalize">{item.rarity}</span>
                    )}
                  </div>
                ))}
                {searchResults.length === 0 && searchQuery && !searching && (
                  <p className="text-slate-500 text-center py-4">No items found</p>
                )}
              </div>
            </>
          )}

          {/* Selected Item */}
          {selectedItem && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400"
              >
                ← Back to search
              </Button>

              <div className="border border-slate-700 rounded-lg p-4">
                <SrdItemDisplay item={selectedItem as Parameters<typeof SrdItemDisplay>[0]['item']} />
              </div>

              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 bg-slate-800 border-slate-700 text-slate-200"
                  />
                </div>

                <Button
                  onClick={handleAddItem}
                  disabled={adding}
                  className="bg-teal-600 hover:bg-teal-500"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add {quantity}x to Inventory
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
