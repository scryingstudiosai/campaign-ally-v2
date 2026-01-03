'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SrdItem {
  id: string;
  name: string;
  item_type: string;
  rarity: string | null;
  source: 'srd';
}

interface CampaignItem {
  id: string;
  name: string;
  soul: Record<string, unknown> | null;
  source: 'campaign';
}

type SearchResult = SrdItem | CampaignItem;

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  onItemAdded: () => void;
}

export function AddItemDialog({ open, onOpenChange, campaignId, onItemAdded }: AddItemDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  // Custom item fields
  const [customName, setCustomName] = useState('');
  const [customQuantity, setCustomQuantity] = useState(1);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchItems();
    }, 300);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const searchItems = async () => {
    setSearching(true);
    const supabase = createClient();

    // Search SRD items
    const { data: srdItems } = await supabase
      .from('srd_items')
      .select('id, name, item_type, rarity')
      .ilike('name', `%${searchQuery}%`)
      .limit(5);

    // Search campaign items (entities)
    const { data: campaignItems } = await supabase
      .from('entities')
      .select('id, name, soul')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'item')
      .ilike('name', `%${searchQuery}%`)
      .is('deleted_at', null)
      .limit(5);

    const results: SearchResult[] = [
      ...(srdItems?.map(i => ({ ...i, source: 'srd' as const })) || []),
      ...(campaignItems?.map(i => ({ ...i, source: 'campaign' as const })) || []),
    ];

    setSearchResults(results);
    setSearching(false);
  };

  const addItem = async (item: SearchResult) => {
    setAdding(true);
    const supabase = createClient();

    const insertData: Record<string, unknown> = {
      campaign_id: campaignId,
      owner_id: campaignId, // Party uses campaignId as owner_id
      owner_type: 'party',
      quantity: 1,
      acquired_from: 'Added by DM',
    };

    if (item.source === 'srd') {
      insertData.srd_item_id = item.id;
    } else {
      insertData.custom_entity_id = item.id;
    }

    const { error } = await supabase
      .from('inventory_instances')
      .insert(insertData);

    if (error) {
      toast.error('Failed to add item');
      console.error('Add item error:', error);
      setAdding(false);
      return;
    }

    toast.success(`Added ${item.name} to party stash`);
    setAdding(false);
    setSearchQuery('');
    setSearchResults([]);
    onItemAdded();
    onOpenChange(false);
  };

  const addCustomItem = async () => {
    if (!customName.trim()) {
      toast.error('Enter an item name');
      return;
    }

    setAdding(true);
    const supabase = createClient();

    // First create a custom entity for the item
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .insert({
        campaign_id: campaignId,
        entity_type: 'item',
        name: customName.trim(),
        description: 'Custom item added to party stash',
      })
      .select('id')
      .single();

    if (entityError || !entity) {
      toast.error('Failed to create item');
      console.error('Create entity error:', entityError);
      setAdding(false);
      return;
    }

    // Then add to inventory
    const { error } = await supabase
      .from('inventory_instances')
      .insert({
        campaign_id: campaignId,
        owner_id: campaignId,
        owner_type: 'party',
        custom_entity_id: entity.id,
        quantity: customQuantity,
        acquired_from: 'Added by DM',
      });

    if (error) {
      toast.error('Failed to add item to stash');
      console.error('Add to inventory error:', error);
      setAdding(false);
      return;
    }

    toast.success(`Added ${customName} to party stash`);
    setAdding(false);
    setCustomName('');
    setCustomQuantity(1);
    onItemAdded();
    onOpenChange(false);
  };

  const getRarityColor = (rarity: string | null): string => {
    switch (rarity?.toLowerCase()) {
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'very rare': return 'text-purple-400';
      case 'legendary': return 'text-orange-400';
      case 'artifact': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-400" />
            Add Item to Party Stash
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search for existing items */}
          <div>
            <Label className="text-zinc-400">Search SRD or Campaign Items</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-zinc-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={`${item.source}-${item.id}`}
                    onClick={() => addItem(item)}
                    disabled={adding}
                    className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 text-left border-b border-zinc-700 last:border-0 disabled:opacity-50"
                  >
                    <div>
                      <p className={item.source === 'srd' ? getRarityColor((item as SrdItem).rarity) : 'text-purple-400'}>
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {item.source === 'srd'
                          ? `SRD · ${(item as SrdItem).item_type}${(item as SrdItem).rarity ? ` · ${(item as SrdItem).rarity}` : ''}`
                          : 'Campaign Item'}
                      </p>
                    </div>
                    <span className="text-xs text-teal-400">Add</span>
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <div className="mt-2 text-center text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            )}

            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="mt-2 text-sm text-zinc-500 text-center">No items found</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-zinc-900 text-zinc-500">or add custom</span>
            </div>
          </div>

          {/* Custom Item */}
          <div className="space-y-3">
            <div>
              <Label className="text-zinc-400">Custom Item Name</Label>
              <Input
                placeholder="e.g., Mysterious Key"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-1 bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Quantity</Label>
              <Input
                type="number"
                min={1}
                value={customQuantity}
                onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
                className="mt-1 w-24 bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button
              onClick={addCustomItem}
              disabled={adding || !customName.trim()}
              className="w-full bg-teal-600 hover:bg-teal-500"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Custom Item'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
