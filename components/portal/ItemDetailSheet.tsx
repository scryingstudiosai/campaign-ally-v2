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
                <p className="text-sm text-slate-400">
                  {rarity} {itemType}
                  {item.quantity > 1 && ` • Qty: ${item.quantity}`}
                </p>
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

          {/* Stats Row */}
          <div className="flex gap-4 flex-wrap">
            {mechanics.damage && (
              <div className="flex items-center gap-2 text-sm bg-slate-800/50 px-3 py-2 rounded-lg">
                <Sword className="w-4 h-4 text-red-400" />
                <span className="text-slate-300">{String(mechanics.damage)}</span>
              </div>
            )}
            {mechanics.armor_class && (
              <div className="flex items-center gap-2 text-sm bg-slate-800/50 px-3 py-2 rounded-lg">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">AC {String(mechanics.armor_class)}</span>
              </div>
            )}
            {weight && (
              <div className="flex items-center gap-2 text-sm bg-slate-800/50 px-3 py-2 rounded-lg">
                <Scale className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{weight} lb</span>
              </div>
            )}
            {value && (
              <div className="flex items-center gap-2 text-sm bg-slate-800/50 px-3 py-2 rounded-lg">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">{value} gp</span>
              </div>
            )}
          </div>

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
              <h3 className="text-sm font-mono uppercase text-slate-500">Description</h3>
              <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                {description}
              </p>
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
              <h3 className="text-sm font-mono uppercase text-slate-500">Notes</h3>
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
