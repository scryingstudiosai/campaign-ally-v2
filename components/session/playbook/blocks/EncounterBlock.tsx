'use client';

import { useState } from 'react';
import { BlockWrapper } from './BlockWrapper';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Swords, MapPin, Skull, Crosshair, Gift, AlertTriangle,
  Plus, X
} from 'lucide-react';

interface EncounterBlockProps {
  block: {
    id: string;
    title: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    content: {
      location_name?: string;
      difficulty?: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';
      creatures?: { id?: string; name: string; count: number; cr?: string }[];
      tactics?: string;
      loot?: { name: string; quantity: number }[];
      environmental?: string;
    };
  };
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRunEncounter: (creatures: any[]) => void;
}

const DIFFICULTY_OPTIONS = [
  { value: 'trivial', label: 'Trivial', color: 'bg-slate-700 text-slate-300' },
  { value: 'easy', label: 'Easy', color: 'bg-green-900 text-green-300' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-900 text-amber-300' },
  { value: 'hard', label: 'Hard', color: 'bg-orange-900 text-orange-300' },
  { value: 'deadly', label: 'Deadly', color: 'bg-red-900 text-red-300' },
];

export function EncounterBlock({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  onRunEncounter
}: EncounterBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  const content = block.content || {};
  const creatures = content.creatures || [];
  const loot = content.loot || [];

  const handleUpdateContent = (field: string, value: any) => {
    onUpdate({ content: { ...content, [field]: value } });
  };

  // Creature management
  const addCreature = () => {
    const newCreatures = [...creatures, { name: '', count: 1, cr: '' }];
    handleUpdateContent('creatures', newCreatures);
  };

  const updateCreature = (index: number, field: string, value: any) => {
    const newCreatures = [...creatures];
    newCreatures[index] = { ...newCreatures[index], [field]: value };
    handleUpdateContent('creatures', newCreatures);
  };

  const removeCreature = (index: number) => {
    const newCreatures = creatures.filter((_, i) => i !== index);
    handleUpdateContent('creatures', newCreatures);
  };

  // Loot management
  const addLoot = () => {
    const newLoot = [...loot, { name: '', quantity: 1 }];
    handleUpdateContent('loot', newLoot);
  };

  const updateLoot = (index: number, field: string, value: any) => {
    const newLoot = [...loot];
    newLoot[index] = { ...newLoot[index], [field]: value };
    handleUpdateContent('loot', newLoot);
  };

  const removeLoot = (index: number) => {
    const newLoot = loot.filter((_, i) => i !== index);
    handleUpdateContent('loot', newLoot);
  };

  const handleRunEncounter = () => {
    onUpdate({ status: 'active' });
    onRunEncounter(creatures);
  };

  const difficultyConfig = DIFFICULTY_OPTIONS.find(d => d.value === content.difficulty) || DIFFICULTY_OPTIONS[2];

  return (
    <BlockWrapper
      id={block.id}
      type="encounter"
      title={block.title}
      status={block.status}
      icon={<Swords className="w-4 h-4 text-orange-400" />}
      color="bg-orange-900/50"
      isEditing={isEditing}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onStatusChange={(status) => onUpdate({ status })}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      isRunnable={true}
      onRun={handleRunEncounter}
    >
      {isEditing ? (
        // === EDIT MODE ===
        <div className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Encounter Title</label>
            <Input
              placeholder="e.g. Goblin Ambush"
              value={block.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="bg-slate-800 border-slate-700 font-medium"
            />
          </div>

          {/* Location & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location
              </label>
              <Input
                placeholder="e.g. Forest Clearing"
                value={content.location_name || ''}
                onChange={(e) => handleUpdateContent('location_name', e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Difficulty</label>
              <Select
                value={content.difficulty || 'medium'}
                onValueChange={(value) => handleUpdateContent('difficulty', value)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Creatures */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Skull className="w-3 h-3" />
              Creatures
            </label>
            {creatures.map((creature, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={creature.name}
                  onChange={(e) => updateCreature(i, 'name', e.target.value)}
                  placeholder="Creature name..."
                  className="bg-slate-800 border-slate-700 flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  value={creature.count}
                  onChange={(e) => updateCreature(i, 'count', parseInt(e.target.value) || 1)}
                  className="bg-slate-800 border-slate-700 w-16"
                />
                <Input
                  value={creature.cr || ''}
                  onChange={(e) => updateCreature(i, 'cr', e.target.value)}
                  placeholder="CR"
                  className="bg-slate-800 border-slate-700 w-20"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeCreature(i)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={addCreature}
              className="w-full border-slate-700 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Creature
            </Button>
          </div>

          {/* Tactics */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Crosshair className="w-3 h-3" />
              Tactics
            </label>
            <Textarea
              placeholder="How do these creatures fight? What strategies do they use?"
              value={content.tactics || ''}
              onChange={(e) => handleUpdateContent('tactics', e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {/* Environmental */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Environmental Factors
            </label>
            <Input
              placeholder="e.g. Difficult terrain, dim light, hazards..."
              value={content.environmental || ''}
              onChange={(e) => handleUpdateContent('environmental', e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {/* Loot */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Gift className="w-3 h-3" />
              Loot
            </label>
            {loot.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateLoot(i, 'name', e.target.value)}
                  placeholder="Item name..."
                  className="bg-slate-800 border-slate-700 flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateLoot(i, 'quantity', parseInt(e.target.value) || 1)}
                  placeholder="Qty"
                  className="bg-slate-800 border-slate-700 w-20"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeLoot(i)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={addLoot}
              className="w-full border-slate-700 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Loot
            </Button>
          </div>
        </div>
      ) : (
        // === VIEW MODE ===
        <div className="space-y-4 mt-4">
          {/* Location & Difficulty */}
          <div className="flex flex-wrap items-center gap-3">
            {content.location_name && (
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-green-400" />
                {content.location_name}
              </div>
            )}
            {content.difficulty && (
              <Badge className={difficultyConfig.color}>
                {difficultyConfig.label}
              </Badge>
            )}
          </div>

          {/* Creatures */}
          {creatures.length > 0 && (
            <div>
              <p className="text-xs text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Skull className="w-3 h-3" />
                Enemies
              </p>
              <div className="space-y-1">
                {creatures.filter(c => c.name).map((creature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-red-950/30 border border-red-900/50"
                  >
                    <span className="text-slate-300">
                      {creature.count > 1 ? `${creature.count}× ` : ''}{creature.name}
                    </span>
                    {creature.cr && (
                      <Badge variant="outline" className="border-red-800 text-red-400 text-xs">
                        CR {creature.cr}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tactics */}
          {content.tactics && (
            <div className="p-3 rounded bg-amber-950/30 border border-amber-900/50">
              <p className="text-xs text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Crosshair className="w-3 h-3" />
                Tactics
              </p>
              <p className="text-sm text-slate-300">{content.tactics}</p>
            </div>
          )}

          {/* Environmental */}
          {content.environmental && (
            <div className="p-2 rounded bg-slate-800/50 border border-slate-700 text-sm">
              <span className="text-amber-400 mr-2">⚠️</span>
              <span className="text-slate-400">{content.environmental}</span>
            </div>
          )}

          {/* Loot */}
          {loot.length > 0 && (
            <div>
              <p className="text-xs text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Gift className="w-3 h-3" />
                Loot
              </p>
              <div className="flex flex-wrap gap-2">
                {loot.filter(l => l.name).map((item, index) => (
                  <Badge key={index} variant="outline" className="border-amber-800 text-amber-300">
                    {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Run Button */}
          {block.status !== 'completed' && block.status !== 'active' && creatures.length > 0 && (
            <Button
              onClick={handleRunEncounter}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Swords className="w-4 h-4 mr-2" />
              Run This Encounter
            </Button>
          )}

          {/* Empty State */}
          {creatures.length === 0 && !content.tactics && loot.length === 0 && (
            <p className="text-slate-500 text-sm italic">
              Click the edit button to add creatures and details.
            </p>
          )}
        </div>
      )}
    </BlockWrapper>
  );
}
