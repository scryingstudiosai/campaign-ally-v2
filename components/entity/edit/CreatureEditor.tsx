'use client';

import { useState } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
import { StatBlockEditor } from '@/components/form-widgets/StatBlockEditor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bug,
  Swords,
  Brain,
  Gem,
  Castle,
  Target,
  Lightbulb,
} from 'lucide-react';

interface CreatureEditorProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
    summary?: string;
    description?: string;
    read_aloud?: string;
    soul?: Record<string, unknown>;
    brain?: Record<string, unknown>;
    mechanics?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
    treasure?: Record<string, unknown>;
  };
  campaignId: string;
}

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

interface CreatureFormData {
  name: string;
  summary: string;
  sub_type: string;
  size: string;
  creature_type: string;
  alignment: string;

  soul: {
    description: string;
    behavior: string;
    ecology: string;
    habitat: string;
    lore: string;
  };

  brain: {
    tactics: string;
    lair_description: string;
    lair_actions: string;
    regional_effects: string;
    weakness: string;
    dm_notes: string;
    plot_hooks: string[];
  };

  mechanics: StatBlockData;

  treasure: {
    description: string;
    items: string[];
  };
}

export function CreatureEditor({ entity, campaignId }: CreatureEditorProps): JSX.Element {
  const [formData, setFormData] = useState<CreatureFormData>(() => {
    const soul = entity.soul || {};
    const brain = entity.brain || {};
    const mechanics = entity.mechanics || {};
    const attributes = entity.attributes || {};
    const treasure = entity.treasure || {};

    // Helper to extract plot hooks from various locations
    const extractPlotHooks = (): string[] => {
      if (Array.isArray(brain.plot_hooks)) return brain.plot_hooks as string[];
      if (Array.isArray(brain.hooks)) return brain.hooks as string[];
      if (typeof brain.plot_hooks === 'string') return [brain.plot_hooks];
      if (typeof brain.hooks === 'string') return [brain.hooks];
      return [];
    };

    // Helper to extract treasure description - handle multiple data structures
    const extractTreasureDescription = (): string => {
      // Check attributes.treasure.treasure_description first (AI storage location)
      const attrTreasure = attributes.treasure as Record<string, unknown> | undefined;
      if (attrTreasure?.treasure_description && typeof attrTreasure.treasure_description === 'string') {
        return attrTreasure.treasure_description;
      }
      // Direct treasure.description
      if (typeof treasure.description === 'string') {
        return treasure.description;
      }
      // treasure itself might be a string
      if (typeof entity.treasure === 'string') {
        return entity.treasure;
      }
      // brain.treasure might be a string
      if (typeof brain.treasure === 'string') {
        return brain.treasure;
      }
      // attributes.treasure might be a string
      if (typeof attributes.treasure === 'string') {
        return attributes.treasure;
      }
      return '';
    };

    // Helper to extract treasure items - handle multiple data structures
    const extractTreasureItems = (): string[] => {
      // Check attributes.treasure.treasure_items first (AI storage location)
      const attrTreasure = attributes.treasure as Record<string, unknown> | undefined;
      if (attrTreasure?.treasure_items && Array.isArray(attrTreasure.treasure_items)) {
        return attrTreasure.treasure_items as string[];
      }
      // Direct treasure.items
      if (Array.isArray(treasure.items)) return treasure.items as string[];
      // brain.treasure_items
      if (Array.isArray(brain.treasure_items)) return brain.treasure_items as string[];
      return [];
    };

    return {
      name: entity.name || '',
      summary: entity.summary || '',
      sub_type: entity.sub_type || (attributes.subtype as string) || '',

      // Classification - check multiple locations
      size: (mechanics.size as string) ||
        (attributes.size as string) ||
        'medium',
      creature_type: (mechanics.creature_type as string) ||
        (mechanics.type as string) ||
        (attributes.type as string) ||
        (attributes.creature_type as string) ||
        'beast',
      alignment: (mechanics.alignment as string) ||
        (attributes.alignment as string) ||
        'unaligned',

      soul: {
        description: (soul.description as string) ||
          (entity.description as string) ||
          (entity.read_aloud as string) ||
          '',
        behavior: (soul.behavior as string) ||
          (soul.personality as string) ||
          (brain.behavior as string) ||
          '',
        ecology: (soul.ecology as string) ||
          (soul.habitat_behavior as string) ||
          '',
        habitat: (soul.habitat as string) ||
          (soul.environment as string) ||
          (attributes.environment as string) ||
          '',
        lore: (soul.lore as string) ||
          (soul.legend as string) ||
          '',
      },

      brain: {
        tactics: (brain.tactics as string) ||
          (brain.combat_tactics as string) ||
          (brain.strategy as string) ||
          '',
        lair_description: (brain.lair_description as string) ||
          (brain.lair as string) ||
          '',
        lair_actions: (brain.lair_actions as string) || '',
        regional_effects: (brain.regional_effects as string) || '',
        weakness: (brain.weakness as string) ||
          (brain.secret as string) ||
          (brain.hidden_weakness as string) ||
          '',
        dm_notes: (brain.dm_notes as string) ||
          (brain.notes as string) ||
          '',
        plot_hooks: extractPlotHooks(),
      },

      mechanics: {
        // Core stats - check multiple locations
        ac: (mechanics.armor_class as number) ||
          (mechanics.ac as number) ||
          10,
        ac_type: (mechanics.armor_type as string) ||
          (mechanics.ac_type as string) ||
          '',
        hp: (mechanics.hit_points as number) ||
          (mechanics.hp as number) ||
          10,
        hit_dice: (mechanics.hit_dice as string) || '',
        speed: (mechanics.speed as Record<string, number>) || { walk: 30 },

        // Ability scores
        abilities: (mechanics.abilities as Record<string, number>) || {
          str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
        },

        // Proficiencies
        saving_throws: (mechanics.saving_throws as { ability: string; modifier: number }[]) || [],
        skills: (mechanics.skills as { name: string; modifier: number }[]) || [],

        // Resistances/Immunities
        damage_resistances: (mechanics.damage_resistances as string[]) || [],
        damage_immunities: (mechanics.damage_immunities as string[]) || [],
        condition_immunities: (mechanics.condition_immunities as string[]) || [],

        // Senses & Languages
        senses: (mechanics.senses as Record<string, number>) || {},
        languages: (mechanics.languages as string[]) || [],

        // CR
        cr: (mechanics.challenge_rating as string) ||
          (mechanics.cr as string) ||
          '1',

        // Traits, Actions, etc.
        special_abilities: (mechanics.traits as { name: string; description: string }[]) ||
          (mechanics.special_traits as { name: string; description: string }[]) ||
          (mechanics.special_abilities as { name: string; description: string }[]) ||
          [],
        actions: (mechanics.actions as { name: string; description: string }[]) || [],
        bonus_actions: (mechanics.bonus_actions as { name: string; description: string }[]) || [],
        reactions: (mechanics.reactions as { name: string; description: string }[]) || [],
        legendary_actions: (mechanics.legendary_actions as { name: string; description: string }[]) || [],
      },

      treasure: {
        description: extractTreasureDescription(),
        items: extractTreasureItems(),
      },
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Helper functions to update nested state
  const updateBasic = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateSoul = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      soul: { ...prev.soul, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateBrain = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      brain: { ...prev.brain, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateMechanics = (newMechanics: StatBlockData): void => {
    setFormData((prev) => ({
      ...prev,
      mechanics: newMechanics,
    }));
    setHasChanges(true);
  };

  const updateTreasure = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      treasure: { ...prev.treasure, [field]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    const saveData = {
      name: formData.name,
      summary: formData.summary,
      sub_type: formData.sub_type,
      description: formData.soul.description,

      soul: {
        description: formData.soul.description,
        behavior: formData.soul.behavior,
        ecology: formData.soul.ecology,
        habitat: formData.soul.habitat,
        lore: formData.soul.lore,
      },

      brain: {
        tactics: formData.brain.tactics,
        lair_description: formData.brain.lair_description,
        lair_actions: formData.brain.lair_actions,
        regional_effects: formData.brain.regional_effects,
        weakness: formData.brain.weakness,
        dm_notes: formData.brain.dm_notes,
        plot_hooks: formData.brain.plot_hooks,
      },

      mechanics: {
        ...formData.mechanics,
        size: formData.size,
        creature_type: formData.creature_type,
        alignment: formData.alignment,
        // Map StatBlockEditor fields to expected names
        armor_class: formData.mechanics.ac,
        armor_type: formData.mechanics.ac_type,
        hit_points: formData.mechanics.hp,
        challenge_rating: formData.mechanics.cr,
        traits: formData.mechanics.special_abilities,
      },

      // Save treasure to attributes (where AI originally stores it)
      attributes: {
        ...entity.attributes,
        treasure: {
          treasure_description: formData.treasure.description,
          treasure_items: formData.treasure.items,
        },
      },

      // Also save to treasure field for future consistency
      treasure: {
        description: formData.treasure.description,
        items: formData.treasure.items,
      },
    };

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CreatureEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }
  };

  // Check if legendary creature (has legendary actions or CR >= 10)
  const isLegendary = (formData.mechanics.legendary_actions?.length ?? 0) > 0 ||
    parseInt(formData.mechanics.cr || '0') >= 10;

  // Define the tabs
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Bug className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label>Creature Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateBasic('name', e.target.value)}
              placeholder="Ancient Red Dragon"
            />
          </div>

          {/* Classification Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Size</Label>
              <Select
                value={formData.size}
                onValueChange={(val) => updateBasic('size', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiny">Tiny</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="huge">Huge</SelectItem>
                  <SelectItem value="gargantuan">Gargantuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={formData.creature_type}
                onValueChange={(val) => updateBasic('creature_type', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberration">Aberration</SelectItem>
                  <SelectItem value="beast">Beast</SelectItem>
                  <SelectItem value="celestial">Celestial</SelectItem>
                  <SelectItem value="construct">Construct</SelectItem>
                  <SelectItem value="dragon">Dragon</SelectItem>
                  <SelectItem value="elemental">Elemental</SelectItem>
                  <SelectItem value="fey">Fey</SelectItem>
                  <SelectItem value="fiend">Fiend</SelectItem>
                  <SelectItem value="giant">Giant</SelectItem>
                  <SelectItem value="humanoid">Humanoid</SelectItem>
                  <SelectItem value="monstrosity">Monstrosity</SelectItem>
                  <SelectItem value="ooze">Ooze</SelectItem>
                  <SelectItem value="plant">Plant</SelectItem>
                  <SelectItem value="undead">Undead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Alignment</Label>
              <Input
                value={formData.alignment}
                onChange={(e) => updateBasic('alignment', e.target.value)}
                placeholder="chaotic evil"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <Label>Summary</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => updateBasic('summary', e.target.value)}
              rows={2}
              placeholder="A brief description for creature lists..."
            />
          </div>

          {/* Description */}
          <div>
            <Label>Vivid Description (Read Aloud)</Label>
            <Textarea
              value={formData.soul.description}
              onChange={(e) => updateSoul('description', e.target.value)}
              rows={4}
              placeholder="What do the players see when they encounter this creature?"
            />
          </div>

          {/* Behavior & Habitat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Behavior</Label>
              <Textarea
                value={formData.soul.behavior}
                onChange={(e) => updateSoul('behavior', e.target.value)}
                rows={3}
                placeholder="How does this creature typically act?"
              />
            </div>
            <div>
              <Label>Habitat</Label>
              <Textarea
                value={formData.soul.habitat}
                onChange={(e) => updateSoul('habitat', e.target.value)}
                rows={3}
                placeholder="Where is this creature typically found?"
              />
            </div>
          </div>

          {/* Ecology & Lore */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ecology</Label>
              <Textarea
                value={formData.soul.ecology}
                onChange={(e) => updateSoul('ecology', e.target.value)}
                rows={3}
                placeholder="Diet, reproduction, role in the ecosystem..."
              />
            </div>
            <div>
              <Label>Lore</Label>
              <Textarea
                value={formData.soul.lore}
                onChange={(e) => updateSoul('lore', e.target.value)}
                rows={3}
                placeholder="Myths, legends, or history about this creature..."
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'mechanics',
      label: 'Stat Block',
      icon: <Swords className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <StatBlockEditor
            value={formData.mechanics}
            onChange={updateMechanics}
            showLegendary={isLegendary}
          />
        </div>
      ),
    },
    {
      id: 'tactics',
      label: 'Tactics & Lair',
      icon: <Brain className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Combat Tactics */}
          <div>
            <Label className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400" />
              Combat Tactics
            </Label>
            <Textarea
              value={formData.brain.tactics}
              onChange={(e) => updateBrain('tactics', e.target.value)}
              rows={4}
              placeholder="How does this creature fight? Opening moves, preferred targets, retreat conditions..."
            />
          </div>

          {/* Weakness */}
          <div>
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Hidden Weakness
            </Label>
            <Textarea
              value={formData.brain.weakness}
              onChange={(e) => updateBrain('weakness', e.target.value)}
              rows={2}
              placeholder="Secret vulnerabilities players might discover..."
            />
            <p className="text-xs text-slate-500 mt-1">
              DM-only information about exploitable weaknesses
            </p>
          </div>

          {/* Lair Section */}
          <div className="p-4 border border-purple-900/30 bg-purple-950/10 rounded-lg space-y-4">
            <h3 className="text-purple-400 font-semibold flex items-center gap-2">
              <Castle className="w-4 h-4" />
              Lair (Optional)
            </h3>

            <div>
              <Label>Lair Description</Label>
              <Textarea
                value={formData.brain.lair_description}
                onChange={(e) => updateBrain('lair_description', e.target.value)}
                rows={3}
                placeholder="Describe the creature's lair..."
              />
            </div>

            <div>
              <Label>Lair Actions</Label>
              <Textarea
                value={formData.brain.lair_actions}
                onChange={(e) => updateBrain('lair_actions', e.target.value)}
                rows={3}
                placeholder="On initiative count 20, the creature can use one of these lair actions..."
              />
            </div>

            <div>
              <Label>Regional Effects</Label>
              <Textarea
                value={formData.brain.regional_effects}
                onChange={(e) => updateBrain('regional_effects', e.target.value)}
                rows={3}
                placeholder="The region around the lair is warped by the creature's presence..."
              />
            </div>
          </div>

          {/* DM Notes */}
          <div>
            <Label>DM Notes</Label>
            <Textarea
              value={formData.brain.dm_notes}
              onChange={(e) => updateBrain('dm_notes', e.target.value)}
              rows={3}
              placeholder="Private notes about running this creature..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 'treasure',
      label: 'Treasure & Hooks',
      icon: <Gem className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Treasure */}
          <div className="p-4 border border-amber-900/30 bg-amber-950/10 rounded-lg space-y-4">
            <h3 className="text-amber-400 font-semibold flex items-center gap-2">
              <Gem className="w-4 h-4" />
              Treasure
            </h3>

            <div>
              <Label>Treasure Description</Label>
              <Textarea
                value={formData.treasure.description}
                onChange={(e) => updateTreasure('description', e.target.value)}
                rows={2}
                placeholder="What treasure does this creature have or guard?"
              />
            </div>

            <StringArrayInput
              label="Treasure Items"
              value={formData.treasure.items}
              onChange={(val) => updateTreasure('items', val)}
              placeholder="Add item (e.g., 'Potion of Healing', '300 gp')..."
            />
          </div>

          {/* Plot Hooks */}
          <div>
            <h3 className="text-teal-400 font-semibold flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4" />
              Plot Hooks
            </h3>
            <StringArrayInput
              label="Story Hooks"
              value={formData.brain.plot_hooks}
              onChange={(val) => updateBrain('plot_hooks', val)}
              placeholder="Add a plot hook..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Ways this creature could be integrated into your story
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <EditEntityShell
      entity={entity}
      campaignId={campaignId}
      onSave={handleSave}
      title={`Edit Creature: ${entity.name}`}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} defaultTab="overview" />
    </EditEntityShell>
  );
}
