'use client';

import { useState, useEffect } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
import { RewardsEditor, QuestRewards, RewardItemInput } from '@/components/form-widgets/RewardsEditor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Swords,
  Eye,
  Brain,
  Gift,
  BookOpen,
  Skull,
  Plus,
  Trash2,
  Clock,
  Target,
  Key,
  EyeOff,
} from 'lucide-react';

interface EncounterEditorProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
    subtype?: string;
    summary?: string;
    description?: string;
    read_aloud?: string;
    soul?: Record<string, unknown>;
    brain?: Record<string, unknown>;
    mechanics?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
    rewards?: Record<string, unknown>;
  };
  campaignId: string;
}

interface CreatureEntry {
  name: string;
  count: number;
  role: string;
  notes: string;
}

interface PhaseEntry {
  trigger: string;
  description: string;
}

interface EncounterFormData {
  name: string;
  summary: string;
  sub_type: string;
  read_aloud: string;
  sights: string[];
  sounds: string[];
  purpose: string;
  trigger: string;
  creatures: CreatureEntry[];
  tactics: string;
  terrain: string;
  hazards: string;
  phases: PhaseEntry[];
  objective: string;
  solution: string;
  secret: string;
  scaling: string;
  fail_state: string;
  dm_notes: string;
  rewards: QuestRewards;
  difficulty: string;
}

export function EncounterEditor({ entity, campaignId }: EncounterEditorProps): JSX.Element {
  const [formData, setFormData] = useState<EncounterFormData>(() => {
    const soul = entity.soul || {};
    const brain = entity.brain || {};
    const mechanics = entity.mechanics || {};
    const attributes = entity.attributes || {};
    const rewards = entity.rewards || {};

    // Helper to extract creatures array and normalize format
    const extractCreatures = (): CreatureEntry[] => {
      const creatures = (mechanics.creatures as unknown[]) ||
        (mechanics.enemies as unknown[]) ||
        (mechanics.monsters as unknown[]) ||
        (brain.creatures as unknown[]) ||
        [];

      if (!Array.isArray(creatures)) return [];

      return creatures.map((c: unknown) => {
        if (typeof c === 'string') {
          return { name: c, count: 1, role: 'minion', notes: '' };
        }
        const creature = c as Record<string, unknown>;
        return {
          name: (creature.name as string) || '',
          count: (creature.count as number) || (creature.quantity as number) || 1,
          role: (creature.role as string) || 'minion',
          notes: (creature.notes as string) || '',
        };
      });
    };

    // Helper to extract phases array
    const extractPhases = (): PhaseEntry[] => {
      const phases = (mechanics.phases as unknown[]) ||
        (brain.phases as unknown[]) ||
        [];

      if (!Array.isArray(phases)) return [];

      return phases.map((p: unknown) => {
        if (typeof p === 'string') {
          return { trigger: '', description: p };
        }
        const phase = p as Record<string, unknown>;
        return {
          trigger: (phase.trigger as string) || (phase.name as string) || '',
          description: (phase.description as string) || (phase.effect as string) || '',
        };
      });
    };

    // Helper to extract sights array
    const extractSights = (): string[] => {
      const sights = (soul.sights as unknown) || (mechanics.sights as unknown) || [];
      if (Array.isArray(sights)) return sights as string[];
      if (typeof sights === 'string') return [sights];
      return [];
    };

    // Helper to extract sounds array
    const extractSounds = (): string[] => {
      const sounds = (soul.sounds as unknown) || (mechanics.sounds as unknown) || [];
      if (Array.isArray(sounds)) return sounds as string[];
      if (typeof sounds === 'string') return [sounds];
      return [];
    };

    // Helper to extract rewards - prioritize attributes.rewards (AI storage location)
    const extractRewards = (): QuestRewards => {
      const attrRewards = (attributes.rewards as Record<string, unknown>) || {};
      const mechRewards = (mechanics.rewards as Record<string, unknown>) || {};

      return {
        // XP - attributes has the real data, mechanics often has 0
        xp: (attrRewards.xp as number) ||
          (mechRewards.xp as number) ||
          (rewards.xp as number) ||
          (mechanics.xp as number) ||
          0,

        // Gold - attributes has real value, mechanics often has 0
        gold: (attrRewards.gold as number) ||
          (mechRewards.gold as number) ||
          (rewards.gold as number) ||
          (mechanics.gold as number) ||
          0,

        items: (() => {
          // Check attributes.rewards.items first (AI storage location)
          const items = (attrRewards.items as unknown[]) ||
            (mechRewards.items as unknown[]) ||
            (rewards.items as unknown[]) ||
            (mechanics.items as unknown[]) ||
            (mechanics.loot as unknown[]) ||
            [];

          if (!Array.isArray(items)) return [];

          // Normalize items - can be strings or RewardItem objects
          return items.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) {
              const obj = item as Record<string, unknown>;
              return {
                name: (obj.name as string) || 'Unknown Item',
                type: obj.type as string | undefined,
                rarity: obj.rarity as string | undefined,
                description: obj.description as string | undefined,
                srd_id: obj.srd_id as string | undefined,
                is_custom: obj.is_custom as boolean | undefined,
              };
            }
            return String(item);
          }) as RewardItemInput[];
        })(),

        // Special - AI uses "story" field name, also check "special"
        special: (attrRewards.special as string) ||
          (attrRewards.story as string) ||
          (mechRewards.special as string) ||
          (rewards.special as string) ||
          '',
      };
    };

    return {
      name: entity.name || '',
      summary: entity.summary || '',
      sub_type: entity.sub_type || entity.subtype || (attributes.subtype as string) || 'combat',

      // Scene Setup
      read_aloud: (entity.read_aloud as string) ||
        (soul.read_aloud as string) ||
        (soul.description as string) ||
        entity.description ||
        '',
      sights: extractSights(),
      sounds: extractSounds(),

      // Context
      purpose: (brain.purpose as string) ||
        (brain.context as string) ||
        '',
      trigger: (brain.trigger as string) ||
        (mechanics.trigger as string) ||
        '',

      // Creatures
      creatures: extractCreatures(),

      // Tactics & Terrain
      tactics: (brain.tactics as string) ||
        (mechanics.tactics as string) ||
        '',
      terrain: (mechanics.terrain as string) ||
        (brain.terrain as string) ||
        '',
      hazards: (mechanics.hazards as string) ||
        (brain.hazards as string) ||
        '',

      // Phases
      phases: extractPhases(),

      // Brain
      objective: (brain.objective as string) ||
        (brain.win_condition as string) ||
        '',
      solution: (brain.solution as string) ||
        (brain.puzzle_solution as string) ||
        '',
      secret: (brain.secret as string) ||
        (brain.secrets as string) ||
        '',
      scaling: (brain.scaling as string) ||
        (brain.difficulty_scaling as string) ||
        '',
      fail_state: (brain.fail_state as string) ||
        (brain.failure_consequence as string) ||
        '',
      dm_notes: (brain.dm_notes as string) ||
        (brain.notes as string) ||
        '',

      // Rewards
      rewards: extractRewards(),

      // Difficulty
      difficulty: (mechanics.difficulty as string) ||
        (attributes.difficulty as string) ||
        'medium',
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Debug: Find where rewards data is stored
  useEffect(() => {
    console.log('========== ENCOUNTER EDITOR DEBUG ==========');
    console.log('Full entity:', JSON.stringify(entity, null, 2));
    console.log('');
    console.log('--- REWARDS LOCATIONS ---');
    console.log('entity.rewards:', entity.rewards);
    console.log('entity.mechanics?.rewards:', entity.mechanics?.rewards);
    console.log('entity.attributes?.rewards:', entity.attributes?.rewards);
    console.log('');
    console.log('--- INDIVIDUAL REWARD FIELDS ---');
    console.log('entity.mechanics?.xp:', entity.mechanics?.xp);
    console.log('entity.mechanics?.gold:', entity.mechanics?.gold);
    console.log('entity.mechanics?.treasure:', entity.mechanics?.treasure);
    console.log('entity.mechanics?.items:', entity.mechanics?.items);
    console.log('entity.mechanics?.loot:', entity.mechanics?.loot);
    console.log('');
    console.log('--- ALL MECHANICS KEYS ---');
    if (entity.mechanics) {
      Object.keys(entity.mechanics).forEach(key => {
        console.log(`  mechanics.${key}:`, (entity.mechanics as Record<string, unknown>)[key]);
      });
    }
    console.log('==========================================');
  }, [entity]);

  // Helper functions to update state
  const updateBasic = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Creature management
  const addCreature = (): void => {
    setFormData((prev) => ({
      ...prev,
      creatures: [...prev.creatures, { name: '', count: 1, role: 'minion', notes: '' }],
    }));
    setHasChanges(true);
  };

  const updateCreature = (index: number, field: string, value: unknown): void => {
    setFormData((prev) => {
      const updated = [...prev.creatures];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, creatures: updated };
    });
    setHasChanges(true);
  };

  const removeCreature = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      creatures: prev.creatures.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  // Phase management
  const addPhase = (): void => {
    setFormData((prev) => ({
      ...prev,
      phases: [...prev.phases, { trigger: '', description: '' }],
    }));
    setHasChanges(true);
  };

  const updatePhase = (index: number, field: string, value: unknown): void => {
    setFormData((prev) => {
      const updated = [...prev.phases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, phases: updated };
    });
    setHasChanges(true);
  };

  const removePhase = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    const saveData = {
      name: formData.name,
      summary: formData.summary,
      sub_type: formData.sub_type,
      read_aloud: formData.read_aloud,
      description: formData.read_aloud,

      soul: {
        description: formData.read_aloud,
        read_aloud: formData.read_aloud,
        sights: formData.sights,
        sounds: formData.sounds,
      },

      brain: {
        purpose: formData.purpose,
        trigger: formData.trigger,
        tactics: formData.tactics,
        objective: formData.objective,
        solution: formData.solution,
        secret: formData.secret,
        scaling: formData.scaling,
        fail_state: formData.fail_state,
        dm_notes: formData.dm_notes,
      },

      mechanics: {
        creatures: formData.creatures,
        difficulty: formData.difficulty,
        terrain: formData.terrain,
        hazards: formData.hazards,
        phases: formData.phases,
        // Save rewards nested in mechanics
        rewards: {
          xp: formData.rewards.xp,
          gold: formData.rewards.gold,
          items: formData.rewards.items,
          special: formData.rewards.special,
          story: formData.rewards.special, // AI uses "story" field name
        },
      },

      // Save to attributes.rewards (where AI originally stores it)
      attributes: {
        ...entity.attributes,
        rewards: {
          xp: formData.rewards.xp,
          gold: formData.rewards.gold,
          items: formData.rewards.items,
          special: formData.rewards.special,
          story: formData.rewards.special, // AI uses "story" field name
        },
      },

      // Also save to top-level rewards for compatibility
      rewards: {
        xp: formData.rewards.xp,
        gold: formData.rewards.gold,
        items: formData.rewards.items,
        special: formData.rewards.special,
      },
    };

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EncounterEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }
  };

  // Define the tabs
  const tabs = [
    {
      id: 'setup',
      label: 'Setup',
      icon: <Eye className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Name & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Encounter Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateBasic('name', e.target.value)}
                placeholder="Ambush at the Bridge"
              />
            </div>
            <div>
              <Label>Encounter Type</Label>
              <Select
                value={formData.sub_type}
                onValueChange={(val) => updateBasic('sub_type', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combat">Combat</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="exploration">Exploration</SelectItem>
                  <SelectItem value="puzzle">Puzzle</SelectItem>
                  <SelectItem value="trap">Trap</SelectItem>
                  <SelectItem value="chase">Chase</SelectItem>
                  <SelectItem value="stealth">Stealth</SelectItem>
                  <SelectItem value="boss">Boss Fight</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div>
            <Label>Summary</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => updateBasic('summary', e.target.value)}
              rows={2}
              placeholder="A brief summary for encounter lists..."
            />
          </div>

          {/* Read Aloud */}
          <div className="p-4 border border-amber-700/30 bg-amber-950/10 rounded-lg">
            <Label className="text-amber-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Read Aloud Text
            </Label>
            <Textarea
              value={formData.read_aloud}
              onChange={(e) => updateBasic('read_aloud', e.target.value)}
              rows={4}
              placeholder="As you round the corner, you see..."
              className="mt-2 italic"
            />
          </div>

          {/* Atmosphere */}
          <div className="grid grid-cols-2 gap-4">
            <StringArrayInput
              label="Sights"
              value={formData.sights}
              onChange={(val) => updateBasic('sights', val)}
              placeholder="Add visual detail..."
            />
            <StringArrayInput
              label="Sounds"
              value={formData.sounds}
              onChange={(val) => updateBasic('sounds', val)}
              placeholder="Add sound..."
            />
          </div>

          {/* Context */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Purpose</Label>
              <Textarea
                value={formData.purpose}
                onChange={(e) => updateBasic('purpose', e.target.value)}
                rows={2}
                placeholder="Why is this encounter happening?"
              />
            </div>
            <div>
              <Label>Trigger</Label>
              <Textarea
                value={formData.trigger}
                onChange={(e) => updateBasic('trigger', e.target.value)}
                rows={2}
                placeholder="What starts this encounter?"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'creatures',
      label: 'Creatures',
      icon: <Swords className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Creature Roster */}
          <div className="p-4 border border-red-900/30 bg-red-950/10 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-red-400 font-semibold flex items-center gap-2">
                <Skull className="w-4 h-4" />
                Creature Roster
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addCreature}
                className="border-red-700 text-red-400"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Creature
              </Button>
            </div>

            {formData.creatures.map((creature, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                <Input
                  value={creature.name}
                  onChange={(e) => updateCreature(index, 'name', e.target.value)}
                  placeholder="Creature name"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={creature.count}
                  onChange={(e) => updateCreature(index, 'count', parseInt(e.target.value) || 1)}
                  className="w-16"
                  min={1}
                />
                <Select
                  value={creature.role}
                  onValueChange={(val) => updateCreature(index, 'role', val)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minion">Minion</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                    <SelectItem value="leader">Leader</SelectItem>
                    <SelectItem value="boss">Boss</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={creature.notes}
                  onChange={(e) => updateCreature(index, 'notes', e.target.value)}
                  placeholder="Notes"
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeCreature(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {formData.creatures.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">
                No creatures added yet
              </p>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <Label>Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(val) => updateBasic('difficulty', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trivial">Trivial</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="deadly">Deadly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tactics */}
          <div>
            <Label className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Enemy Tactics
            </Label>
            <Textarea
              value={formData.tactics}
              onChange={(e) => updateBasic('tactics', e.target.value)}
              rows={3}
              placeholder="How do the enemies fight? Focus targets, retreat conditions..."
            />
          </div>

          {/* Terrain & Hazards */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Terrain</Label>
              <Textarea
                value={formData.terrain}
                onChange={(e) => updateBasic('terrain', e.target.value)}
                rows={2}
                placeholder="Cover, difficult terrain, elevation..."
              />
            </div>
            <div>
              <Label>Hazards</Label>
              <Textarea
                value={formData.hazards}
                onChange={(e) => updateBasic('hazards', e.target.value)}
                rows={2}
                placeholder="Environmental dangers, traps..."
              />
            </div>
          </div>

          {/* Phases */}
          <div className="p-4 border border-purple-900/30 bg-purple-950/10 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-purple-400 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Combat Phases
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addPhase}
                className="border-purple-700 text-purple-400"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Phase
              </Button>
            </div>

            {formData.phases.map((phase, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded">
                <Input
                  value={phase.trigger}
                  onChange={(e) => updatePhase(index, 'trigger', e.target.value)}
                  placeholder="Trigger (e.g., Round 2)"
                  className="w-32"
                />
                <Textarea
                  value={phase.description}
                  onChange={(e) => updatePhase(index, 'description', e.target.value)}
                  placeholder="What happens..."
                  rows={1}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removePhase(index)}
                  className="text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {formData.phases.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-2">
                No phases added - encounter runs as single combat
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'logic',
      label: 'Logic',
      icon: <Brain className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Objective */}
          <div>
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              Objective / Win Condition
            </Label>
            <Textarea
              value={formData.objective}
              onChange={(e) => updateBasic('objective', e.target.value)}
              rows={2}
              placeholder="How do the players 'win' this encounter?"
            />
          </div>

          {/* Solution (for puzzles/traps) */}
          {['puzzle', 'trap'].includes(formData.sub_type) && (
            <div className="p-4 border border-amber-900/30 bg-amber-950/10 rounded-lg">
              <Label className="flex items-center gap-2 text-amber-400">
                <Key className="w-4 h-4" />
                Solution
              </Label>
              <Textarea
                value={formData.solution}
                onChange={(e) => updateBasic('solution', e.target.value)}
                rows={3}
                placeholder="The answer to the puzzle or how to bypass the trap..."
                className="mt-2"
              />
            </div>
          )}

          {/* Scaling */}
          <div>
            <Label>Scaling Notes</Label>
            <Textarea
              value={formData.scaling}
              onChange={(e) => updateBasic('scaling', e.target.value)}
              rows={2}
              placeholder="How to adjust difficulty up or down..."
            />
          </div>

          {/* Fail State */}
          <div>
            <Label>Fail State / Consequences</Label>
            <Textarea
              value={formData.fail_state}
              onChange={(e) => updateBasic('fail_state', e.target.value)}
              rows={2}
              placeholder="What happens if the players fail?"
            />
          </div>

          {/* Secret */}
          <div className="p-4 border border-red-900/30 bg-red-950/10 rounded-lg">
            <Label className="flex items-center gap-2 text-red-400">
              <EyeOff className="w-4 h-4" />
              Secret (DM Only)
            </Label>
            <Textarea
              value={formData.secret}
              onChange={(e) => updateBasic('secret', e.target.value)}
              rows={2}
              placeholder="Hidden information..."
              className="mt-2"
            />
          </div>

          {/* DM Notes */}
          <div>
            <Label>DM Notes</Label>
            <Textarea
              value={formData.dm_notes}
              onChange={(e) => updateBasic('dm_notes', e.target.value)}
              rows={3}
              placeholder="Private notes for running this encounter..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 'rewards',
      label: 'Rewards',
      icon: <Gift className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <RewardsEditor
            value={formData.rewards}
            onChange={(rewards) => {
              setFormData((prev) => ({ ...prev, rewards }));
              setHasChanges(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <EditEntityShell
      entity={entity}
      campaignId={campaignId}
      onSave={handleSave}
      title={`Edit Encounter: ${entity.name}`}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} defaultTab="setup" />
    </EditEntityShell>
  );
}
