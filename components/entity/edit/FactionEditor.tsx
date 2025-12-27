'use client';

import { useState, useEffect } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
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
  Users,
  Building,
  Target,
  Crown,
  BookOpen,
  Wrench,
  EyeOff,
  Swords,
} from 'lucide-react';

interface FactionEditorProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
    subtype?: string;
    summary?: string;
    description?: string;
    soul?: Record<string, unknown>;
    brain?: Record<string, unknown>;
    mechanics?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
    structure?: Record<string, unknown>;
  };
  campaignId: string;
}

interface FactionFormData {
  name: string;
  summary: string;
  sub_type: string;
  motto: string;
  symbol: string;

  soul: {
    description: string;
    public_perception: string;
    history: string;
  };

  brain: {
    goals: string;
    beliefs: string;
    methods: string;
    secrets: string;
    allies: string;
    rivals: string;
    dm_notes: string;
  };

  structure: {
    leader_name: string;
    leader_title: string;
    headquarters: string;
    ranks: string[];
    resources: string[];
    size: string;
    reach: string;
  };
}

export function FactionEditor({ entity, campaignId }: FactionEditorProps): JSX.Element {
  const [formData, setFormData] = useState<FactionFormData>(() => {
    const soul = entity.soul || {};
    const brain = entity.brain || {};
    const mechanics = entity.mechanics || {};
    const attributes = entity.attributes || {};
    const structure = entity.structure || {};

    // Helper to extract ranks array
    const extractRanks = (): string[] => {
      if (Array.isArray(structure.ranks)) return structure.ranks as string[];
      if (Array.isArray(mechanics.ranks)) return mechanics.ranks as string[];
      if (Array.isArray(brain.ranks)) return brain.ranks as string[];
      if (typeof structure.ranks === 'string') return [structure.ranks];
      return [];
    };

    // Helper to extract resources array
    const extractResources = (): string[] => {
      if (Array.isArray(structure.resources)) return structure.resources as string[];
      if (Array.isArray(mechanics.resources)) return mechanics.resources as string[];
      if (Array.isArray(mechanics.assets)) return mechanics.assets as string[];
      if (Array.isArray(brain.resources)) return brain.resources as string[];
      if (typeof structure.resources === 'string') return [structure.resources];
      return [];
    };

    return {
      name: entity.name || '',
      summary: entity.summary || '',
      sub_type: entity.sub_type || entity.subtype || (attributes.subtype as string) || 'guild',

      // Basic identity - check multiple locations
      motto: (soul.motto as string) ||
        (attributes.motto as string) ||
        (brain.motto as string) ||
        '',
      symbol: (soul.symbol as string) ||
        (soul.insignia as string) ||
        (attributes.symbol as string) ||
        (brain.symbol as string) ||
        '',

      soul: {
        description: (soul.description as string) ||
          entity.description ||
          '',
        public_perception: (soul.public_perception as string) ||
          (soul.reputation as string) ||
          (brain.reputation as string) ||
          '',
        history: (soul.history as string) ||
          (soul.origin as string) ||
          (brain.history as string) ||
          (brain.origin as string) ||
          '',
      },

      brain: {
        // Goals - might be array or string
        goals: (() => {
          if (typeof brain.goals === 'string') return brain.goals;
          if (Array.isArray(brain.goals)) return (brain.goals as string[]).join('\n');
          if (typeof brain.objectives === 'string') return brain.objectives as string;
          if (Array.isArray(brain.objectives)) return (brain.objectives as string[]).join('\n');
          return '';
        })(),
        beliefs: (brain.beliefs as string) ||
          (brain.tenets as string) ||
          (brain.ideology as string) ||
          (soul.beliefs as string) ||
          '',
        methods: (brain.methods as string) ||
          (brain.tactics as string) ||
          '',
        secrets: (brain.secrets as string) ||
          (brain.secret as string) ||
          (brain.hidden_agenda as string) ||
          '',
        allies: (brain.allies as string) ||
          (brain.alliances as string) ||
          '',
        rivals: (brain.rivals as string) ||
          (brain.enemies as string) ||
          '',
        dm_notes: (brain.dm_notes as string) ||
          (brain.notes as string) ||
          '',
      },

      structure: {
        leader_name: (structure.leader_name as string) ||
          (structure.leader as string) ||
          (brain.leader as string) ||
          (mechanics.leader as string) ||
          (brain.leader_name as string) ||
          '',
        leader_title: (structure.leader_title as string) ||
          (mechanics.leader_title as string) ||
          (brain.leader_title as string) ||
          '',
        headquarters: (structure.headquarters as string) ||
          (structure.base as string) ||
          (structure.base_of_operations as string) ||
          (mechanics.headquarters as string) ||
          (brain.headquarters as string) ||
          '',
        ranks: extractRanks(),
        resources: extractResources(),
        size: (structure.size as string) ||
          (mechanics.size as string) ||
          (attributes.size as string) ||
          (brain.size as string) ||
          '',
        reach: (structure.reach as string) ||
          (mechanics.influence as string) ||
          (mechanics.reach as string) ||
          (brain.reach as string) ||
          (brain.influence as string) ||
          '',
      },
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Debug: Find where faction data is stored
  useEffect(() => {
    console.log('========== FACTION EDITOR DEBUG ==========');
    console.log('Full entity:', JSON.stringify(entity, null, 2));
    console.log('');
    console.log('--- SOUL ---');
    if (entity.soul) {
      Object.keys(entity.soul).forEach(key => {
        console.log(`  soul.${key}:`, (entity.soul as Record<string, unknown>)[key]);
      });
    }
    console.log('--- BRAIN ---');
    if (entity.brain) {
      Object.keys(entity.brain).forEach(key => {
        console.log(`  brain.${key}:`, (entity.brain as Record<string, unknown>)[key]);
      });
    }
    console.log('--- STRUCTURE ---');
    if (entity.structure) {
      Object.keys(entity.structure).forEach(key => {
        console.log(`  structure.${key}:`, (entity.structure as Record<string, unknown>)[key]);
      });
    }
    console.log('--- MECHANICS ---');
    if (entity.mechanics) {
      Object.keys(entity.mechanics).forEach(key => {
        console.log(`  mechanics.${key}:`, (entity.mechanics as Record<string, unknown>)[key]);
      });
    }
    console.log('--- ATTRIBUTES ---');
    if (entity.attributes) {
      Object.keys(entity.attributes).forEach(key => {
        console.log(`  attributes.${key}:`, (entity.attributes as Record<string, unknown>)[key]);
      });
    }
    console.log('==========================================');
  }, [entity]);

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

  const updateStructure = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      structure: { ...prev.structure, [field]: value },
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
        motto: formData.motto,
        symbol: formData.symbol,
        history: formData.soul.history,
        public_perception: formData.soul.public_perception,
      },

      brain: {
        goals: formData.brain.goals,
        beliefs: formData.brain.beliefs,
        methods: formData.brain.methods,
        secrets: formData.brain.secrets,
        allies: formData.brain.allies,
        rivals: formData.brain.rivals,
        dm_notes: formData.brain.dm_notes,
      },

      structure: {
        leader_name: formData.structure.leader_name,
        leader_title: formData.structure.leader_title,
        headquarters: formData.structure.headquarters,
        ranks: formData.structure.ranks,
        resources: formData.structure.resources,
        size: formData.structure.size,
        reach: formData.structure.reach,
      },
    };

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FactionEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }
  };

  // Define the tabs
  const tabs = [
    {
      id: 'identity',
      label: 'Identity',
      icon: <Users className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label>Faction Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateBasic('name', e.target.value)}
              placeholder="The Shadow Syndicate"
            />
          </div>

          {/* Type */}
          <div>
            <Label>Faction Type</Label>
            <Select
              value={formData.sub_type}
              onValueChange={(val) => updateBasic('sub_type', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guild">Guild</SelectItem>
                <SelectItem value="cult">Cult</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="military">Military Order</SelectItem>
                <SelectItem value="criminal">Criminal Organization</SelectItem>
                <SelectItem value="religious">Religious Order</SelectItem>
                <SelectItem value="mercantile">Mercantile Company</SelectItem>
                <SelectItem value="secret_society">Secret Society</SelectItem>
                <SelectItem value="noble_house">Noble House</SelectItem>
                <SelectItem value="tribe">Tribe / Clan</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div>
            <Label>Summary</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => updateBasic('summary', e.target.value)}
              rows={2}
              placeholder="A brief summary for faction lists..."
            />
          </div>

          {/* Motto */}
          <div>
            <Label>Motto / Slogan</Label>
            <Input
              value={formData.motto}
              onChange={(e) => updateBasic('motto', e.target.value)}
              placeholder="In shadows we thrive..."
            />
          </div>

          {/* Description */}
          <div>
            <Label>Public Description</Label>
            <Textarea
              value={formData.soul.description}
              onChange={(e) => updateSoul('description', e.target.value)}
              rows={4}
              placeholder="What is publicly known about this faction?"
            />
          </div>

          {/* Symbol */}
          <div>
            <Label>Symbol / Insignia</Label>
            <Textarea
              value={formData.symbol}
              onChange={(e) => updateBasic('symbol', e.target.value)}
              rows={2}
              placeholder="Describe their symbol, banner, or identifying marks..."
            />
          </div>

          {/* Public Perception */}
          <div>
            <Label>Public Perception / Reputation</Label>
            <Textarea
              value={formData.soul.public_perception}
              onChange={(e) => updateSoul('public_perception', e.target.value)}
              rows={2}
              placeholder="How are they perceived by the general public?"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'structure',
      label: 'Structure',
      icon: <Building className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Leadership Section */}
          <div className="p-4 border border-amber-900/30 bg-amber-950/10 rounded-lg space-y-4">
            <h3 className="text-amber-400 font-semibold flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Leadership
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Leader Name</Label>
                <Input
                  value={formData.structure.leader_name}
                  onChange={(e) => updateStructure('leader_name', e.target.value)}
                  placeholder="Lord Vexis Shadowmere"
                />
              </div>
              <div>
                <Label>Leader Title</Label>
                <Input
                  value={formData.structure.leader_title}
                  onChange={(e) => updateStructure('leader_title', e.target.value)}
                  placeholder="Guildmaster, High Priest, etc."
                />
              </div>
            </div>

            <div>
              <Label>Headquarters / Base of Operations</Label>
              <Input
                value={formData.structure.headquarters}
                onChange={(e) => updateStructure('headquarters', e.target.value)}
                placeholder="The Obsidian Tower in Waterdeep"
              />
            </div>
          </div>

          {/* Organization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Size / Membership</Label>
              <Input
                value={formData.structure.size}
                onChange={(e) => updateStructure('size', e.target.value)}
                placeholder="~200 members, Small cell structure..."
              />
            </div>
            <div>
              <Label>Reach / Influence</Label>
              <Input
                value={formData.structure.reach}
                onChange={(e) => updateStructure('reach', e.target.value)}
                placeholder="Regional, City-wide, Continental..."
              />
            </div>
          </div>

          {/* Ranks */}
          <StringArrayInput
            label="Ranks / Hierarchy"
            value={formData.structure.ranks}
            onChange={(val) => updateStructure('ranks', val)}
            placeholder="Add rank (e.g., Initiate, Acolyte, Master)..."
          />

          {/* Resources */}
          <StringArrayInput
            label="Resources / Assets"
            value={formData.structure.resources}
            onChange={(val) => updateStructure('resources', val)}
            placeholder="Add resource (e.g., Safehouses, Political influence, Spy network)..."
          />
        </div>
      ),
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: <Target className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Goals */}
          <div>
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4 text-red-400" />
              Goals
            </Label>
            <Textarea
              value={formData.brain.goals}
              onChange={(e) => updateBrain('goals', e.target.value)}
              rows={3}
              placeholder="What does this faction want to achieve?"
            />
          </div>

          {/* Beliefs */}
          <div>
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Beliefs / Tenets
            </Label>
            <Textarea
              value={formData.brain.beliefs}
              onChange={(e) => updateBrain('beliefs', e.target.value)}
              rows={3}
              placeholder="What do they believe? What drives them?"
            />
          </div>

          {/* Methods */}
          <div>
            <Label className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-400" />
              Methods
            </Label>
            <Textarea
              value={formData.brain.methods}
              onChange={(e) => updateBrain('methods', e.target.value)}
              rows={3}
              placeholder="How do they pursue their goals? (Diplomacy, violence, subterfuge...)"
            />
          </div>

          {/* Secrets */}
          <div className="p-4 border border-red-900/30 bg-red-950/10 rounded-lg">
            <Label className="flex items-center gap-2 text-red-400">
              <EyeOff className="w-4 h-4" />
              Secrets (DM Only)
            </Label>
            <Textarea
              value={formData.brain.secrets}
              onChange={(e) => updateBrain('secrets', e.target.value)}
              rows={3}
              placeholder="Dark truths known only to leadership..."
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">
              Hidden agendas, true motives, or dark secrets
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'relations',
      label: 'Relations',
      icon: <Swords className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Allies */}
          <div>
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              Allies
            </Label>
            <Textarea
              value={formData.brain.allies}
              onChange={(e) => updateBrain('allies', e.target.value)}
              rows={3}
              placeholder="Who are their allies? What alliances do they maintain?"
            />
            <p className="text-xs text-slate-500 mt-1">
              Formal relationships can be added via the Relationships panel
            </p>
          </div>

          {/* Rivals */}
          <div>
            <Label className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400" />
              Rivals / Enemies
            </Label>
            <Textarea
              value={formData.brain.rivals}
              onChange={(e) => updateBrain('rivals', e.target.value)}
              rows={3}
              placeholder="Who opposes them? What conflicts are they engaged in?"
            />
          </div>

          {/* History */}
          <div>
            <Label>History / Origin</Label>
            <Textarea
              value={formData.soul.history}
              onChange={(e) => updateSoul('history', e.target.value)}
              rows={3}
              placeholder="How was this faction founded? Key historical events..."
            />
          </div>

          {/* DM Notes */}
          <div>
            <Label>DM Notes</Label>
            <Textarea
              value={formData.brain.dm_notes}
              onChange={(e) => updateBrain('dm_notes', e.target.value)}
              rows={3}
              placeholder="Private notes for running this faction..."
            />
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
      title={`Edit Faction: ${entity.name}`}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} defaultTab="identity" />
    </EditEntityShell>
  );
}
