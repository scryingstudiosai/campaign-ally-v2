'use client';

import { useState, useEffect, useCallback, KeyboardEvent, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Coins, Sparkles, Package, Star, X, Plus, Loader2 } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Item can be either a string or an object with name/type/rarity
export interface RewardItem {
  name: string;
  type?: string;
  rarity?: string;
  description?: string;
  srd_id?: string;
  is_custom?: boolean;
}

export type RewardItemInput = string | RewardItem;

export interface QuestRewards {
  gold?: number;
  xp?: number;
  items?: RewardItemInput[];
  special?: string;
}

interface RewardsEditorProps {
  value: QuestRewards;
  onChange: (rewards: QuestRewards) => void;
  campaignId?: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'memory' | 'srd';
  rarity?: string;
  itemType?: string;
}

// Helper to get display name from item (handles both string and object)
function getItemName(item: RewardItemInput): string {
  if (typeof item === 'string') return item;
  return item.name || 'Unknown Item';
}

// Helper to check if item is an object with properties
function isItemObject(item: RewardItemInput): item is RewardItem {
  return typeof item === 'object' && item !== null;
}

export function RewardsEditor({ value = {}, onChange, campaignId }: RewardsEditorProps): JSX.Element {
  const [itemInput, setItemInput] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateField = <K extends keyof QuestRewards>(field: K, fieldValue: QuestRewards[K]): void => {
    onChange({ ...value, [field]: fieldValue });
  };

  // Search for items in Memory and SRD
  const searchItems = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const supabase = createClient();
    const results: SearchResult[] = [];

    try {
      // Search Memory items (campaign entities of type 'item')
      if (campaignId) {
        const { data: memoryItems } = await supabase
          .from('entities')
          .select('id, name, soul')
          .eq('campaign_id', campaignId)
          .eq('entity_type', 'item')
          .ilike('name', `%${query}%`)
          .is('deleted_at', null)
          .limit(5);

        if (memoryItems) {
          memoryItems.forEach((item) => {
            results.push({
              id: item.id,
              name: item.name,
              type: 'memory',
              rarity: (item.soul as Record<string, unknown>)?.rarity as string | undefined,
              itemType: (item.soul as Record<string, unknown>)?.item_type as string | undefined,
            });
          });
        }
      }

      // Search SRD items
      const { data: srdItems } = await supabase
        .from('srd_items')
        .select('slug, name, item_type, rarity')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (srdItems) {
        srdItems.forEach((item) => {
          results.push({
            id: `srd:${item.slug}`,
            name: item.name,
            type: 'srd',
            rarity: item.rarity || undefined,
            itemType: item.item_type || undefined,
          });
        });
      }
    } catch (error) {
      console.error('Error searching items:', error);
    }

    setSearchResults(results);
    setIsSearching(false);
  }, [campaignId]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (itemInput.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchItems(itemInput);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [itemInput, searchItems]);

  const addItem = (item?: SearchResult): void => {
    if (item) {
      const currentItems = value.items || [];
      // Check if item name already exists
      const exists = currentItems.some((i) => getItemName(i) === item.name);
      if (!exists) {
        const newItem: RewardItem = {
          name: item.name,
          rarity: item.rarity,
          srd_id: item.type === 'srd' ? item.id.replace('srd:', '') : undefined,
          is_custom: item.type === 'memory',
        };
        updateField('items', [...currentItems, newItem]);
      }
      setItemInput('');
      setSearchOpen(false);
      // Re-focus input after selection
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      // Add as plain text
      const trimmed = itemInput.trim();
      if (trimmed) {
        const currentItems = value.items || [];
        const exists = currentItems.some((i) => getItemName(i) === trimmed);
        if (!exists) {
          updateField('items', [...currentItems, trimmed]);
        }
        setItemInput('');
        setSearchOpen(false);
        // Re-focus input after adding
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const removeItem = (index: number): void => {
    const currentItems = value.items || [];
    updateField(
      'items',
      currentItems.filter((_, i) => i !== index)
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base">Rewards</Label>

      {/* Gold and XP Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2 text-sm text-amber-400">
            <Coins className="w-4 h-4" />
            Gold
          </Label>
          <Input
            type="number"
            min={0}
            value={value.gold ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              updateField('gold', val === '' ? undefined : parseInt(val, 10));
            }}
            placeholder="0"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="flex items-center gap-2 text-sm text-purple-400">
            <Sparkles className="w-4 h-4" />
            Experience Points
          </Label>
          <Input
            type="number"
            min={0}
            value={value.xp ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              updateField('xp', val === '' ? undefined : parseInt(val, 10));
            }}
            placeholder="0"
            className="mt-1"
          />
        </div>
      </div>

      {/* Items with Typeahead */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm text-teal-400">
          <Package className="w-4 h-4" />
          Items
        </Label>

        {/* Current Items */}
        {(value.items?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 rounded-lg">
            {value.items?.map((item, index) => {
              const itemName = getItemName(item);
              const itemObj = isItemObject(item) ? item : null;

              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className={`pl-2 pr-1 py-1 flex items-center gap-1 ${
                    itemObj?.is_custom
                      ? 'bg-purple-950/50 text-purple-300 border border-purple-800/50'
                      : 'bg-teal-950/50 text-teal-300 border border-teal-800/50'
                  }`}
                >
                  {itemObj?.is_custom && <Sparkles className="w-3 h-3 text-purple-400" />}
                  <span>{itemName}</span>
                  {itemObj?.rarity && (
                    <span className="text-xs text-slate-400 capitalize">
                      ({itemObj.rarity})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="ml-1 hover:bg-slate-700/50 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Add Item Input with Typeahead */}
        <Popover open={searchOpen && (searchResults.length > 0 || isSearching)} onOpenChange={setSearchOpen} modal={false}>
          <PopoverTrigger asChild>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={itemInput}
                onChange={(e) => {
                  setItemInput(e.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => itemInput.length >= 2 && setSearchOpen(true)}
                placeholder={campaignId ? "Search Memory or SRD items..." : "Add an item reward..."}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => addItem()}
                disabled={!itemInput.trim()}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0 bg-slate-900 border-slate-700"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Command shouldFilter={false}>
              <CommandList>
                {isSearching && (
                  <div className="flex items-center justify-center p-4 text-slate-400">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </div>
                )}

                <CommandEmpty className="p-4 text-center text-slate-500 text-sm">
                  No items found. Press Enter to add &quot;{itemInput}&quot; as custom.
                </CommandEmpty>

                {/* Memory Items */}
                {searchResults.filter(r => r.type === 'memory').length > 0 && (
                  <CommandGroup heading="Campaign Items">
                    {searchResults
                      .filter((r) => r.type === 'memory')
                      .map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => addItem(result)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>{result.name}</span>
                          {result.rarity && (
                            <span className="text-xs text-slate-500 capitalize">
                              ({result.rarity})
                            </span>
                          )}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}

                {/* SRD Items */}
                {searchResults.filter(r => r.type === 'srd').length > 0 && (
                  <CommandGroup heading="SRD Items">
                    {searchResults
                      .filter((r) => r.type === 'srd')
                      .map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => addItem(result)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>{result.name}</span>
                          {result.rarity && (
                            <span className="text-xs text-slate-500 capitalize">
                              ({result.rarity})
                            </span>
                          )}
                          {result.itemType && (
                            <span className="text-xs text-slate-600">
                              {result.itemType}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <p className="text-xs text-slate-500">
          {campaignId
            ? "Type to search campaign items and SRD, or press Enter to add custom items"
            : "Type item names and press Enter to add"}
        </p>
      </div>

      {/* Special Rewards */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm text-yellow-400">
          <Star className="w-4 h-4" />
          Special Rewards
        </Label>
        <Textarea
          value={value.special || ''}
          onChange={(e) => updateField('special', e.target.value)}
          placeholder="Titles, reputation gains, access to locations, boons from NPCs..."
          rows={2}
          className="border-yellow-900/30"
        />
        <p className="text-xs text-slate-500">
          Non-material rewards like titles, reputation, contacts, or story benefits
        </p>
      </div>

      {/* Summary */}
      {(value.gold || value.xp || (value.items?.length ?? 0) > 0 || value.special) && (
        <div className="p-3 bg-slate-800/50 rounded-lg text-sm">
          <span className="text-slate-400">Total Rewards: </span>
          {value.gold ? (
            <span className="text-amber-400 mr-2">{value.gold} gp</span>
          ) : null}
          {value.xp ? (
            <span className="text-purple-400 mr-2">{value.xp} XP</span>
          ) : null}
          {(value.items?.length ?? 0) > 0 ? (
            <span className="text-teal-400 mr-2">{value.items?.length} items</span>
          ) : null}
          {value.special ? (
            <span className="text-yellow-400">+ special</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
