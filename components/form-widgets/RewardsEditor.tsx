'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Coins, Sparkles, Package, Star, X, Plus } from 'lucide-react';

export interface QuestRewards {
  gold?: number;
  xp?: number;
  items?: string[];
  special?: string;
}

interface RewardsEditorProps {
  value: QuestRewards;
  onChange: (rewards: QuestRewards) => void;
}

export function RewardsEditor({ value = {}, onChange }: RewardsEditorProps): JSX.Element {
  const [itemInput, setItemInput] = useState('');

  const updateField = <K extends keyof QuestRewards>(field: K, fieldValue: QuestRewards[K]): void => {
    onChange({ ...value, [field]: fieldValue });
  };

  const addItem = (): void => {
    const trimmed = itemInput.trim();
    if (trimmed) {
      const currentItems = value.items || [];
      if (!currentItems.includes(trimmed)) {
        updateField('items', [...currentItems, trimmed]);
        setItemInput('');
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

      {/* Items */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm text-teal-400">
          <Package className="w-4 h-4" />
          Items
        </Label>

        {/* Current Items */}
        {(value.items?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 rounded-lg">
            {value.items?.map((item, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-teal-950/50 text-teal-300 border border-teal-800/50 pl-2 pr-1 py-1 flex items-center gap-1"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="ml-1 hover:bg-teal-800/50 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add Item Input */}
        <div className="flex gap-2">
          <Input
            value={itemInput}
            onChange={(e) => setItemInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add an item reward..."
            className="flex-1"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!itemInput.trim()}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
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
