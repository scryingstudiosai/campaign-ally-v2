'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface StatBlockData {
  ac?: number;
  ac_type?: string;
  hp?: number;
  hit_dice?: string;
  speed?: Record<string, number>;
  abilities?: Record<string, number>;
  saving_throws?: { ability: string; modifier: number }[];
  skills?: { name: string; modifier: number }[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: string[];
  senses?: Record<string, number>;
  languages?: string[];
  cr?: string;
  actions?: { name: string; description: string }[];
  bonus_actions?: { name: string; description: string }[];
  reactions?: { name: string; description: string }[];
  legendary_actions?: { name: string; description: string }[];
  special_abilities?: { name: string; description: string }[];
}

interface StatBlockEditorProps {
  value: StatBlockData;
  onChange: (value: StatBlockData) => void;
  showLegendary?: boolean;
}

export function StatBlockEditor({
  value,
  onChange,
  showLegendary = false,
}: StatBlockEditorProps): JSX.Element {
  const updateField = (field: string, val: unknown): void => {
    onChange({ ...value, [field]: val });
  };

  const updateAbility = (ability: string, score: number): void => {
    onChange({
      ...value,
      abilities: {
        str: value.abilities?.str ?? 10,
        dex: value.abilities?.dex ?? 10,
        con: value.abilities?.con ?? 10,
        int: value.abilities?.int ?? 10,
        wis: value.abilities?.wis ?? 10,
        cha: value.abilities?.cha ?? 10,
        [ability]: score,
      },
    });
  };

  const updateSpeed = (type: string, speed: number): void => {
    onChange({
      ...value,
      speed: { ...value.speed, [type]: speed },
    });
  };

  const getModifier = (score: number): string => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  // Action list manager component
  function ActionListEditor({
    label,
    actions,
    field,
  }: {
    label: string;
    actions: { name: string; description: string }[];
    field: string;
  }): JSX.Element {
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const addAction = (): void => {
      if (newName.trim()) {
        updateField(field, [...(actions || []), { name: newName, description: newDesc }]);
        setNewName('');
        setNewDesc('');
      }
    };

    const removeAction = (index: number): void => {
      updateField(
        field,
        actions.filter((_, i) => i !== index)
      );
    };

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {actions?.map((action, i) => (
          <div key={i} className="p-2 bg-slate-900/50 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="font-medium text-slate-200">{action.name}</span>
                <p className="text-sm text-slate-400 mt-1">{action.description}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAction(i)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            placeholder="Action name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Button type="button" onClick={addAction} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {newName && (
          <Textarea
            placeholder="Action description..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AC, HP, Speed Row */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Armor Class</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={value.ac ?? 10}
              onChange={(e) => updateField('ac', parseInt(e.target.value) || 10)}
              className="w-20"
            />
            <Input
              placeholder="Type (leather, natural...)"
              value={value.ac_type || ''}
              onChange={(e) => updateField('ac_type', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label>Hit Points</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={value.hp ?? 1}
              onChange={(e) => updateField('hp', parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <Input
              placeholder="Hit dice (2d8+2)"
              value={value.hit_dice || ''}
              onChange={(e) => updateField('hit_dice', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <Label>Challenge Rating</Label>
          <Input
            value={value.cr || ''}
            onChange={(e) => updateField('cr', e.target.value)}
            placeholder="1/4, 1, 5, etc."
          />
        </div>
      </div>

      {/* Speed */}
      <div>
        <Label>Speed (feet)</Label>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 w-12">Walk</span>
            <Input
              type="number"
              value={value.speed?.walk ?? 30}
              onChange={(e) => updateSpeed('walk', parseInt(e.target.value) || 0)}
              className="w-16"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 w-12">Fly</span>
            <Input
              type="number"
              value={value.speed?.fly ?? 0}
              onChange={(e) => updateSpeed('fly', parseInt(e.target.value) || 0)}
              className="w-16"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 w-12">Swim</span>
            <Input
              type="number"
              value={value.speed?.swim ?? 0}
              onChange={(e) => updateSpeed('swim', parseInt(e.target.value) || 0)}
              className="w-16"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 w-12">Climb</span>
            <Input
              type="number"
              value={value.speed?.climb ?? 0}
              onChange={(e) => updateSpeed('climb', parseInt(e.target.value) || 0)}
              className="w-16"
            />
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <div>
        <Label>Ability Scores</Label>
        <div className="grid grid-cols-6 gap-2 mt-2">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((ability) => (
            <div key={ability} className="text-center">
              <span className="text-xs font-medium text-slate-400 uppercase">{ability}</span>
              <Input
                type="number"
                value={value.abilities?.[ability] ?? 10}
                onChange={(e) => updateAbility(ability, parseInt(e.target.value) || 10)}
                className="text-center mt-1"
              />
              <span className="text-xs text-teal-400">
                {getModifier(value.abilities?.[ability] ?? 10)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Senses */}
      <div>
        <Label>Senses</Label>
        <div className="flex gap-3 flex-wrap mt-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">Darkvision</span>
            <Input
              type="number"
              value={value.senses?.darkvision ?? 0}
              onChange={(e) =>
                onChange({
                  ...value,
                  senses: { ...value.senses, darkvision: parseInt(e.target.value) || 0 },
                })
              }
              className="w-16"
            />
            <span className="text-xs text-slate-500">ft</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">Passive Perception</span>
            <Input
              type="number"
              value={value.senses?.passive_perception ?? 10}
              onChange={(e) =>
                onChange({
                  ...value,
                  senses: { ...value.senses, passive_perception: parseInt(e.target.value) || 10 },
                })
              }
              className="w-16"
            />
          </div>
        </div>
      </div>

      {/* Languages */}
      <div>
        <Label>Languages</Label>
        <Input
          value={value.languages?.join(', ') || ''}
          onChange={(e) =>
            updateField(
              'languages',
              e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="Common, Elvish, Draconic..."
        />
      </div>

      {/* Actions */}
      <ActionListEditor label="Actions" actions={value.actions || []} field="actions" />

      {/* Bonus Actions */}
      <ActionListEditor
        label="Bonus Actions"
        actions={value.bonus_actions || []}
        field="bonus_actions"
      />

      {/* Reactions */}
      <ActionListEditor label="Reactions" actions={value.reactions || []} field="reactions" />

      {/* Special Abilities */}
      <ActionListEditor
        label="Special Abilities"
        actions={value.special_abilities || []}
        field="special_abilities"
      />

      {/* Legendary Actions (optional) */}
      {showLegendary && (
        <ActionListEditor
          label="Legendary Actions"
          actions={value.legendary_actions || []}
          field="legendary_actions"
        />
      )}
    </div>
  );
}
