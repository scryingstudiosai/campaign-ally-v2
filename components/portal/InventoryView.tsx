'use client';

import { useState } from 'react';
import { Package, Search } from 'lucide-react';
import { InventoryItem } from './InventoryItem';
import { ItemDetailSheet } from './ItemDetailSheet';
import { CurrencyDisplay } from './CurrencyDisplay';

interface SrdItem {
  id: string;
  name: string;
  item_type: string | null;
  subtype: string | null;
  rarity: string | null;
  description: string | null;
  mechanics: Record<string, unknown> | null;
  value_gp: number | null;
  weight: number | null;
  requires_attunement: boolean | null;
}

interface CustomItem {
  id: string;
  name: string;
  sub_type: string | null;
  description: string | null;
  mechanics: Record<string, unknown> | null;
  image_url: string | null;
}

export interface InventoryItemData {
  id: string;
  quantity: number;
  charges: number | null;
  max_charges: number | null;
  is_equipped: boolean;
  is_attuned: boolean;
  is_identified: boolean;
  notes: string | null;
  acquired_from: string | null;
  srd_item: SrdItem | null;
  custom_item: CustomItem | null;
}

interface Props {
  items: InventoryItemData[];
  currency: {
    gold?: number;
    silver?: number;
    copper?: number;
  };
  characterId: string;
}

export function InventoryView({ items, currency }: Props) {
  const [selectedItem, setSelectedItem] = useState<InventoryItemData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'equipped' | 'bag'>('all');

  // Get item name helper
  const getItemName = (item: InventoryItemData) =>
    item.srd_item?.name || item.custom_item?.name || 'Unknown Item';

  // Filter items
  const filteredItems = items.filter(inv => {
    const name = getItemName(inv);
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'equipped' ? inv.is_equipped :
      !inv.is_equipped;
    return matchesSearch && matchesFilter;
  });

  // Count for tabs
  const equippedCount = items.filter(i => i.is_equipped).length;
  const bagCount = items.filter(i => !i.is_equipped).length;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-teal-400" />
          Backpack
        </h1>
        <CurrencyDisplay currency={currency} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: `All (${items.length})` },
          { key: 'equipped', label: `Equipped (${equippedCount})` },
          { key: 'bag', label: `Bag (${bagCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              filter === tab.key
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg text-slate-300 mb-2">Backpack is Empty</h3>
          <p className="text-slate-500">
            Items you receive will appear here.
          </p>
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((inv) => (
            <InventoryItem
              key={inv.id}
              item={inv}
              onClick={() => setSelectedItem(inv)}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {items.length > 0 && filteredItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500">No items match your search.</p>
        </div>
      )}

      {/* Item Detail Sheet */}
      <ItemDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
