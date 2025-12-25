'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [showResults, setShowResults] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-search as user types
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const search = async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/srd/search?q=${encodeURIComponent(debouncedSearch)}&type=item&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.items || data || []);
          setShowResults(true);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    };

    search();
  }, [debouncedSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectItem = (item: SrdItem) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setShowResults(false);
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
    setShowResults(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-200">
            Add Item to {ownerName || 'Inventory'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search with autocomplete */}
          <div className="relative">
            <Label className="text-slate-300 mb-2 block">Search SRD Items</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedItem(null);
                }}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Start typing to search..."
                className="pl-10 bg-slate-800 border-slate-700 text-slate-200"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
              )}
            </div>

            {/* Autocomplete dropdown */}
            {showResults && searchResults.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
              >
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="px-4 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0"
                  >
                    <div className="font-medium text-slate-200">{item.name}</div>
                    <div className="text-xs text-slate-400 flex gap-2">
                      <span>{item.item_type}</span>
                      {item.rarity && <span className="capitalize">• {item.rarity}</span>}
                      {item.value_gp && <span>• {item.value_gp} gp</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showResults &&
              searchResults.length === 0 &&
              searchQuery.length >= 2 &&
              !searching && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-4 text-center text-slate-500">
                  No items found
                </div>
              )}
          </div>

          {/* Selected item + quantity */}
          {selectedItem && (
            <div className="p-3 bg-slate-800 rounded-lg border border-teal-700">
              <div className="font-medium text-slate-200">{selectedItem.name}</div>
              <div className="text-sm text-slate-400">{selectedItem.item_type}</div>

              <div className="flex items-center gap-4 mt-3">
                <div>
                  <Label className="text-slate-400 text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 bg-slate-900 border-slate-600 mt-1 text-slate-200"
                  />
                </div>

                <Button
                  onClick={handleAddItem}
                  disabled={adding}
                  className="bg-teal-600 hover:bg-teal-500 mt-5"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {adding ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
