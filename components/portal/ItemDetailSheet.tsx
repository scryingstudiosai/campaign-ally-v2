'use client';

import { useState } from 'react';
import { X, Sword, Shield, Scale, Coins, Sparkles, Zap, Trash2 } from 'lucide-react';
import type { InventoryItemData } from './InventoryView';

interface Props {
  item: InventoryItemData | null;
  onClose: () => void;
  characterId?: string;
  campaignId?: string;
  onDelete?: (itemId: string) => void;
}

// Parse markdown table into structured data
function parseMarkdownTable(content: string): { headers: string[]; rows: string[][] } | null {
  const lines = content.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;

  // Check if first line looks like a header (has |)
  if (!lines[0].includes('|')) return null;

  const headers = lines[0].split('|').map(cell => cell.trim()).filter(Boolean);

  // Skip separator line (---) and get data rows
  const dataLines = lines.slice(2);
  const rows = dataLines.map(line =>
    line.split('|').map(cell => cell.trim()).filter(Boolean)
  );

  return { headers, rows };
}

// Render description with markdown table support
function RenderDescription({ description }: { description: string }) {
  if (!description) return null;

  // Check for markdown table pattern
  if (description.includes('|') && description.includes('---')) {
    // Split into parts: text before table, table, text after
    const tableMatch = description.match(/(\|[^\n]+\|\n\|[-|\s]+\|\n(?:\|[^\n]+\|\n?)+)/);

    if (tableMatch) {
      const beforeTable = description.substring(0, tableMatch.index).trim();
      const tableContent = tableMatch[1];
      const afterTable = description.substring((tableMatch.index || 0) + tableMatch[1].length).trim();

      const parsed = parseMarkdownTable(tableContent);

      return (
        <div className="space-y-3">
          {beforeTable && (
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {beforeTable}
            </p>
          )}

          {parsed && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    {parsed.headers.map((header, i) => (
                      <th key={i} className="text-left py-2 px-3 text-slate-400 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-slate-800">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="py-2 px-3 text-slate-300">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {afterTable && (
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {afterTable}
            </p>
          )}
        </div>
      );
    }
  }

  return (
    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
      {description}
    </p>
  );
}

// Get rarity color
function getRarityColor(rarity: string | null): string {
  switch (rarity?.toLowerCase()) {
    case 'common': return 'bg-slate-600/50 text-slate-300 border-slate-500/30';
    case 'uncommon': return 'bg-green-600/20 text-green-400 border-green-500/30';
    case 'rare': return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
    case 'very rare': return 'bg-purple-600/20 text-purple-400 border-purple-500/30';
    case 'legendary': return 'bg-amber-600/20 text-amber-400 border-amber-500/30';
    case 'artifact': return 'bg-red-600/20 text-red-400 border-red-500/30';
    default: return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
  }
}

export function ItemDetailSheet({ item, onClose, characterId, campaignId, onDelete }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item) return null;

  const handleDelete = async () => {
    if (!characterId || !campaignId) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/portal/inventory/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          characterId,
          campaignId,
        }),
      });

      if (res.ok) {
        onDelete?.(item.id);
        onClose();
      } else {
        console.error('Failed to delete item');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const srd = item.srd_item;
  const custom = item.custom_item;

  // Check SRD item, then custom entity, then custom_name field (for loot items)
  const name = srd?.name || custom?.name || item.custom_name || 'Unknown Item';
  const description = srd?.description || custom?.description || '';
  const mechanics = (srd?.mechanics || custom?.mechanics || {}) as Record<string, unknown>;
  const itemType = srd?.item_type || custom?.sub_type || 'Item';
  const rarity = srd?.rarity || 'Common';
  const weight = srd?.weight;
  const value = srd?.value_gp;
  const imageUrl = custom?.image_url;
  const requiresAttunement = srd?.requires_attunement;

  // Extract weapon properties
  const damage = mechanics.damage || mechanics.damage_dice;
  const damageType = mechanics.damage_type;
  const properties = (mechanics.properties as string[]) || [];
  const versatileDamage = mechanics.versatile || mechanics.two_handed_damage;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="sticky top-0 bg-slate-900 pt-3 pb-2 px-4 border-b border-white/5">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 items-start">
              {imageUrl && (
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                  <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-display text-white">{name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs border ${getRarityColor(rarity)}`}>
                    {rarity}
                  </span>
                  <span className="text-sm text-slate-400">{itemType}</span>
                  {item.quantity > 1 && (
                    <span className="text-sm text-slate-500">× {item.quantity}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg flex-shrink-0"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {item.is_equipped && (
              <span className="px-3 py-1 rounded-lg text-sm bg-teal-500/20 text-teal-400 border border-teal-500/30">
                Equipped
              </span>
            )}
            {item.is_attuned && (
              <span className="px-3 py-1 rounded-lg text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Attuned
              </span>
            )}
            {requiresAttunement && !item.is_attuned && (
              <span className="px-3 py-1 rounded-lg text-sm bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Requires Attunement
              </span>
            )}
            {!item.is_identified && (
              <span className="px-3 py-1 rounded-lg text-sm bg-slate-500/20 text-slate-400 border border-slate-500/30">
                Unidentified
              </span>
            )}
          </div>

          {/* Quick Stats Row */}
          <div className="flex gap-3 flex-wrap py-2 border-b border-white/5">
            {damage && (
              <div className="flex items-center gap-1.5 text-sm">
                <Sword className="w-4 h-4 text-red-400" />
                <span className="text-white font-medium">{String(damage)}</span>
                {damageType && (
                  <span className="text-slate-400">{String(damageType)}</span>
                )}
                {versatileDamage && (
                  <span className="text-slate-500">({String(versatileDamage)} two-handed)</span>
                )}
              </div>
            )}
            {mechanics.armor_class && (
              <div className="flex items-center gap-1.5 text-sm">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium">AC {String(mechanics.armor_class)}</span>
              </div>
            )}
            {weight && (
              <div className="flex items-center gap-1.5 text-sm">
                <Scale className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{weight * (item.quantity || 1)} lb</span>
              </div>
            )}
            {value && (
              <div className="flex items-center gap-1.5 text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300">{value} gp</span>
              </div>
            )}
          </div>

          {/* Weapon/Item Properties */}
          {properties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {properties.map((prop: string) => (
                <span
                  key={prop}
                  className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {prop}
                </span>
              ))}
            </div>
          )}

          {/* Charges */}
          {item.charges !== null && item.max_charges && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Charges
                </span>
                <span className="text-sm text-white">{item.charges} / {item.max_charges}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${(item.charges / item.max_charges) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Description */}
          {description && item.is_identified && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase text-slate-500 tracking-wider">Description</h3>
              <RenderDescription description={description} />
            </div>
          )}

          {/* Unidentified message */}
          {!item.is_identified && (
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">
                This item hasn&apos;t been identified yet.
              </p>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase text-slate-500 tracking-wider">Notes</h3>
              <p className="text-slate-300 text-sm bg-slate-800/50 rounded-lg p-3">
                {item.notes}
              </p>
            </div>
          )}

          {/* Acquired From */}
          {item.acquired_from && (
            <p className="text-xs text-slate-500">
              Acquired from: {item.acquired_from}
            </p>
          )}

          {/* Delete Button */}
          {characterId && campaignId && onDelete && (
            <div className="pt-4 border-t border-white/5">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Item
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300 text-center">
                    Are you sure you want to delete <span className="text-white font-medium">{name}</span>?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom padding for safe area */}
        <div className="h-8" />
      </div>
    </>
  );
}
