'use client';

import { useState, useEffect } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
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
  Users,
  Building,
  Target,
  Crown,
  BookOpen,
  Wrench,
  EyeOff,
  Swords,
  Shield,
  Plus,
  Trash2,
  Palette,
  Heart,
  MessageSquare,
  Globe,
  Coins,
  Map,
  MapPin,
  Gift,
  Key,
  Compass,
  Clock,
  GitBranch,
  AlertTriangle,
  History,
  FileText,
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

interface KeyMember {
  name: string;
  role: string;
}

interface FactionFormData {
  name: string;
  summary: string;
  sub_type: string;

  identity: {
    motto: string;
    colors: string;
    symbol: string;
    culture_values: string;
    member_greeting: string;
    description: string;
  };

  key_members: KeyMember[];

  structure: {
    leader_name: string;
    leader_title: string;
    headquarters: string;
    hierarchy: string;
    ranks: string[];
    size: string;
  };

  power: {
    influence: string;
    wealth: string;
    military: string;
    reach: string;
    stability: string;
    territory: string;
    resources: string[];
    member_benefits: string;
    joining_requirements: string;
  };

  agenda: {
    purpose: string;
    goals: string;
    current_agenda: string;
    beliefs: string;
    methods: string;
    weakness: string;
    secrets: string;
  };

  relations: {
    allies: string;
    rivals: string;
    history: string;
    dm_notes: string;
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
      if (Array.isArray(mechanics.resources)) return mechanics.resources as string[];
      if (Array.isArray(structure.resources)) return structure.resources as string[];
      if (Array.isArray(mechanics.assets)) return mechanics.assets as string[];
      if (Array.isArray(brain.resources)) return brain.resources as string[];
      if (typeof structure.resources === 'string') return [structure.resources];
      return [];
    };

    // Helper to extract key members
    const extractKeyMembers = (): KeyMember[] => {
      const members = (mechanics.key_members as unknown[]) ||
        (structure.key_members as unknown[]) ||
        (brain.key_members as unknown[]) ||
        [];
      if (!Array.isArray(members)) return [];
      return members.map((m: unknown) => {
        if (typeof m === 'string') return { name: m, role: '' };
        const member = m as Record<string, unknown>;
        return {
          name: (member.name as string) || '',
          role: (member.role as string) || (member.title as string) || '',
        };
      });
    };

    // Helper to extract goals (might be array or string)
    const extractGoals = (): string => {
      if (typeof brain.goals === 'string') return brain.goals;
      if (Array.isArray(brain.goals)) return (brain.goals as string[]).join('\n');
      if (typeof brain.objectives === 'string') return brain.objectives as string;
      if (Array.isArray(brain.objectives)) return (brain.objectives as string[]).join('\n');
      return '';
    };

    return {
      name: entity.name || '',
      summary: entity.summary || '',
      sub_type: entity.sub_type || entity.subtype || (attributes.subtype as string) || 'guild',

      // ========== IDENTITY ==========
      identity: {
        motto: (soul.motto as string) ||
          (mechanics.motto as string) ||
          (attributes.motto as string) ||
          '',
        colors: (soul.colors as string) ||
          (mechanics.colors as string) ||
          (attributes.colors as string) ||
          '',
        symbol: (soul.symbol as string) ||
          (soul.insignia as string) ||
          (mechanics.symbol as string) ||
          '',
        culture_values: (soul.culture_values as string) ||
          (soul.culture as string) ||
          (soul.values as string) ||
          (brain.culture as string) ||
          '',
        member_greeting: (soul.member_greeting as string) ||
          (soul.greeting as string) ||
          (mechanics.greeting as string) ||
          '',
        description: (soul.description as string) ||
          entity.description ||
          '',
      },

      key_members: extractKeyMembers(),

      // ========== STRUCTURE ==========
      structure: {
        leader_name: (structure.leader_name as string) ||
          (structure.leader as string) ||
          (mechanics.leader as string) ||
          (brain.leader as string) ||
          '',
        leader_title: (structure.leader_title as string) ||
          (mechanics.leader_title as string) ||
          '',
        headquarters: (structure.headquarters as string) ||
          (structure.base as string) ||
          (structure.base_of_operations as string) ||
          (mechanics.headquarters as string) ||
          '',
        hierarchy: (structure.hierarchy as string) ||
          (mechanics.hierarchy as string) ||
          (brain.hierarchy as string) ||
          '',
        ranks: extractRanks(),
        size: (structure.size as string) ||
          (mechanics.size as string) ||
          (attributes.size as string) ||
          '',
      },

      // ========== POWER ==========
      power: {
        influence: (mechanics.influence as string) ||
          ((mechanics.power as Record<string, unknown>)?.influence as string) ||
          (attributes.influence as string) ||
          '',
        wealth: (mechanics.wealth as string) ||
          ((mechanics.power as Record<string, unknown>)?.wealth as string) ||
          (attributes.wealth as string) ||
          '',
        military: (mechanics.military as string) ||
          (mechanics.military_strength as string) ||
          ((mechanics.power as Record<string, unknown>)?.military as string) ||
          '',
        reach: (mechanics.reach as string) ||
          (structure.reach as string) ||
          ((mechanics.power as Record<string, unknown>)?.reach as string) ||
          '',
        stability: (mechanics.stability as string) ||
          ((mechanics.power as Record<string, unknown>)?.stability as string) ||
          '',
        territory: (mechanics.territory as string) ||
          (mechanics.territories as string) ||
          (structure.territory as string) ||
          '',
        resources: extractResources(),
        member_benefits: (mechanics.member_benefits as string) ||
          (mechanics.benefits as string) ||
          (brain.member_benefits as string) ||
          '',
        joining_requirements: (mechanics.joining_requirements as string) ||
          (mechanics.requirements as string) ||
          (brain.joining_requirements as string) ||
          '',
      },

      // ========== AGENDA ==========
      agenda: {
        purpose: (brain.purpose as string) ||
          (brain.mission as string) ||
          (soul.purpose as string) ||
          '',
        goals: extractGoals(),
        current_agenda: (brain.current_agenda as string) ||
          (brain.agenda as string) ||
          (brain.current_plans as string) ||
          '',
        beliefs: (brain.beliefs as string) ||
          (brain.tenets as string) ||
          (brain.ideology as string) ||
          '',
        methods: (brain.methods as string) ||
          (brain.tactics as string) ||
          '',
        weakness: (brain.weakness as string) ||
          (brain.weaknesses as string) ||
          (brain.vulnerabilities as string) ||
          '',
        secrets: (brain.secrets as string) ||
          (brain.secret as string) ||
          '',
      },

      // ========== RELATIONS ==========
      relations: {
        allies: (brain.allies as string) ||
          (brain.alliances as string) ||
          (mechanics.allies as string) ||
          '',
        rivals: (brain.rivals as string) ||
          (brain.enemies as string) ||
          (mechanics.rivals as string) ||
          '',
        history: (soul.history as string) ||
          (soul.origin as string) ||
          (brain.history as string) ||
          (brain.origin as string) ||
          '',
        dm_notes: (brain.dm_notes as string) || '',
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

  const updateIdentity = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      identity: { ...prev.identity, [field]: value },
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

  const updatePower = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      power: { ...prev.power, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateAgenda = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      agenda: { ...prev.agenda, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateRelations = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      relations: { ...prev.relations, [field]: value },
    }));
    setHasChanges(true);
  };

  // Key Members management
  const addKeyMember = (): void => {
    setFormData((prev) => ({
      ...prev,
      key_members: [...prev.key_members, { name: '', role: '' }],
    }));
    setHasChanges(true);
  };

  const updateKeyMember = (index: number, field: string, value: string): void => {
    setFormData((prev) => {
      const updated = [...prev.key_members];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, key_members: updated };
    });
    setHasChanges(true);
  };

  const removeKeyMember = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      key_members: prev.key_members.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    const saveData = {
      name: formData.name,
      summary: formData.summary,
      sub_type: formData.sub_type,
      description: formData.identity.description,

      soul: {
        description: formData.identity.description,
        motto: formData.identity.motto,
        colors: formData.identity.colors,
        symbol: formData.identity.symbol,
        culture_values: formData.identity.culture_values,
        member_greeting: formData.identity.member_greeting,
        history: formData.relations.history,
      },

      brain: {
        purpose: formData.agenda.purpose,
        goals: formData.agenda.goals,
        current_agenda: formData.agenda.current_agenda,
        beliefs: formData.agenda.beliefs,
        methods: formData.agenda.methods,
        weakness: formData.agenda.weakness,
        secrets: formData.agenda.secrets,
        allies: formData.relations.allies,
        rivals: formData.relations.rivals,
        dm_notes: formData.relations.dm_notes,
      },

      structure: {
        leader_name: formData.structure.leader_name,
        leader_title: formData.structure.leader_title,
        headquarters: formData.structure.headquarters,
        hierarchy: formData.structure.hierarchy,
        ranks: formData.structure.ranks,
        size: formData.structure.size,
      },

      mechanics: {
        key_members: formData.key_members,
        influence: formData.power.influence,
        wealth: formData.power.wealth,
        military: formData.power.military,
        reach: formData.power.reach,
        stability: formData.power.stability,
        territory: formData.power.territory,
        resources: formData.power.resources,
        member_benefits: formData.power.member_benefits,
        joining_requirements: formData.power.joining_requirements,
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

          {/* Type & Motto Row */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label>Motto / Slogan</Label>
              <Input
                value={formData.identity.motto}
                onChange={(e) => updateIdentity('motto', e.target.value)}
                placeholder="In shadows we thrive..."
              />
            </div>
          </div>

          {/* Colors */}
          <div>
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              Colors
            </Label>
            <Input
              value={formData.identity.colors}
              onChange={(e) => updateIdentity('colors', e.target.value)}
              placeholder="Black and silver, Crimson and gold..."
            />
          </div>

          {/* Symbol */}
          <div>
            <Label>Symbol / Insignia</Label>
            <Textarea
              value={formData.identity.symbol}
              onChange={(e) => updateIdentity('symbol', e.target.value)}
              rows={2}
              placeholder="Describe their symbol, banner, or identifying marks..."
            />
          </div>

          {/* Culture & Values */}
          <div>
            <Label className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              Culture & Values
            </Label>
            <Textarea
              value={formData.identity.culture_values}
              onChange={(e) => updateIdentity('culture_values', e.target.value)}
              rows={3}
              placeholder="What does this faction value? What is their culture like?"
            />
          </div>

          {/* Member Greeting */}
          <div>
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              Member Greeting
            </Label>
            <Input
              value={formData.identity.member_greeting}
              onChange={(e) => updateIdentity('member_greeting', e.target.value)}
              placeholder="How do members greet each other? Secret handshake, phrase..."
            />
          </div>

          {/* Description */}
          <div>
            <Label>Public Description</Label>
            <Textarea
              value={formData.identity.description}
              onChange={(e) => updateIdentity('description', e.target.value)}
              rows={4}
              placeholder="What is publicly known about this faction?"
            />
          </div>

          {/* Key Members */}
          <div className="p-4 border border-amber-900/30 bg-amber-950/10 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-amber-400 font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Key Members
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addKeyMember}
                className="border-amber-700 text-amber-400"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Member
              </Button>
            </div>

            {/* Leader (always first) */}
            <div className="p-3 bg-amber-900/20 rounded border border-amber-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-medium">Leader</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={formData.structure.leader_name}
                  onChange={(e) => updateStructure('leader_name', e.target.value)}
                  placeholder="Name"
                />
                <Input
                  value={formData.structure.leader_title}
                  onChange={(e) => updateStructure('leader_title', e.target.value)}
                  placeholder="Title (Guildmaster, High Priest...)"
                />
              </div>
            </div>

            {/* Other Key Members */}
            {formData.key_members.map((member, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                <Input
                  value={member.name}
                  onChange={(e) => updateKeyMember(index, 'name', e.target.value)}
                  placeholder="Name"
                  className="flex-1"
                />
                <Input
                  value={member.role}
                  onChange={(e) => updateKeyMember(index, 'role', e.target.value)}
                  placeholder="Role"
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeKeyMember(index)}
                  className="text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'power',
      label: 'Power',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Power Ratings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Influence
              </Label>
              <Input
                value={formData.power.influence}
                onChange={(e) => updatePower('influence', e.target.value)}
                placeholder="Political sway, reputation..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                Wealth
              </Label>
              <Input
                value={formData.power.wealth}
                onChange={(e) => updatePower('wealth', e.target.value)}
                placeholder="Financial resources..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-red-400" />
                Military Strength
              </Label>
              <Input
                value={formData.power.military}
                onChange={(e) => updatePower('military', e.target.value)}
                placeholder="Armed forces, enforcers..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Map className="w-4 h-4 text-green-400" />
                Reach
              </Label>
              <Input
                value={formData.power.reach}
                onChange={(e) => updatePower('reach', e.target.value)}
                placeholder="Local, Regional, Continental..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                Stability
              </Label>
              <Input
                value={formData.power.stability}
                onChange={(e) => updatePower('stability', e.target.value)}
                placeholder="Internal cohesion, leadership strength..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                Territory
              </Label>
              <Input
                value={formData.power.territory}
                onChange={(e) => updatePower('territory', e.target.value)}
                placeholder="Controlled areas, strongholds..."
              />
            </div>
          </div>

          {/* Headquarters */}
          <div>
            <Label className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              Headquarters
            </Label>
            <Input
              value={formData.structure.headquarters}
              onChange={(e) => updateStructure('headquarters', e.target.value)}
              placeholder="The Obsidian Tower in Waterdeep"
            />
          </div>

          {/* Size */}
          <div>
            <Label>Size / Membership</Label>
            <Input
              value={formData.structure.size}
              onChange={(e) => updateStructure('size', e.target.value)}
              placeholder="~200 members, Small cell structure..."
            />
          </div>

          {/* Resources */}
          <StringArrayInput
            label="Resources / Assets"
            value={formData.power.resources}
            onChange={(val) => updatePower('resources', val)}
            placeholder="Add resource (Safehouses, Spy network, Trade routes)..."
          />

          {/* Member Benefits */}
          <div>
            <Label className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-teal-400" />
              Member Benefits
            </Label>
            <Textarea
              value={formData.power.member_benefits}
              onChange={(e) => updatePower('member_benefits', e.target.value)}
              rows={3}
              placeholder="What do members gain? Protection, discounts, training..."
            />
          </div>

          {/* Joining Requirements */}
          <div>
            <Label className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Joining Requirements
            </Label>
            <Textarea
              value={formData.power.joining_requirements}
              onChange={(e) => updatePower('joining_requirements', e.target.value)}
              rows={3}
              placeholder="How does one join? Tests, sponsorship, fees..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: <Target className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Purpose */}
          <div>
            <Label className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              Purpose / Mission
            </Label>
            <Textarea
              value={formData.agenda.purpose}
              onChange={(e) => updateAgenda('purpose', e.target.value)}
              rows={3}
              placeholder="Why does this faction exist? Their core mission..."
            />
          </div>

          {/* Current Agenda */}
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Current Agenda
            </Label>
            <Textarea
              value={formData.agenda.current_agenda}
              onChange={(e) => updateAgenda('current_agenda', e.target.value)}
              rows={3}
              placeholder="What are they actively working on right now?"
            />
          </div>

          {/* Goals */}
          <div>
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4 text-red-400" />
              Long-term Goals
            </Label>
            <Textarea
              value={formData.agenda.goals}
              onChange={(e) => updateAgenda('goals', e.target.value)}
              rows={3}
              placeholder="What do they ultimately want to achieve?"
            />
          </div>

          {/* Hierarchy */}
          <div>
            <Label className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              Hierarchy / Structure
            </Label>
            <Textarea
              value={formData.structure.hierarchy}
              onChange={(e) => updateStructure('hierarchy', e.target.value)}
              rows={3}
              placeholder="How is the faction organized? Chain of command..."
            />
          </div>

          {/* Ranks */}
          <StringArrayInput
            label="Ranks"
            value={formData.structure.ranks}
            onChange={(val) => updateStructure('ranks', val)}
            placeholder="Add rank (Initiate, Acolyte, Master)..."
          />

          {/* Beliefs */}
          <div>
            <Label className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Beliefs / Tenets
            </Label>
            <Textarea
              value={formData.agenda.beliefs}
              onChange={(e) => updateAgenda('beliefs', e.target.value)}
              rows={3}
              placeholder="What do they believe? Core principles..."
            />
          </div>

          {/* Methods */}
          <div>
            <Label className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-400" />
              Methods
            </Label>
            <Textarea
              value={formData.agenda.methods}
              onChange={(e) => updateAgenda('methods', e.target.value)}
              rows={3}
              placeholder="How do they pursue their goals?"
            />
          </div>

          {/* Weakness */}
          <div className="p-4 border border-red-900/30 bg-red-950/10 rounded-lg">
            <Label className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              Weakness / Vulnerabilities
            </Label>
            <Textarea
              value={formData.agenda.weakness}
              onChange={(e) => updateAgenda('weakness', e.target.value)}
              rows={2}
              placeholder="What are their weak points? How could they be undermined?"
              className="mt-2"
            />
          </div>

          {/* Secrets */}
          <div className="p-4 border border-red-900/30 bg-red-950/10 rounded-lg">
            <Label className="flex items-center gap-2 text-red-400">
              <EyeOff className="w-4 h-4" />
              Secrets (DM Only)
            </Label>
            <Textarea
              value={formData.agenda.secrets}
              onChange={(e) => updateAgenda('secrets', e.target.value)}
              rows={3}
              placeholder="Dark truths known only to leadership..."
              className="mt-2"
            />
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
              value={formData.relations.allies}
              onChange={(e) => updateRelations('allies', e.target.value)}
              rows={3}
              placeholder="Who are their allies? What alliances do they maintain?"
            />
            <p className="text-xs text-slate-500 mt-1">
              Formal relationships can be added via the Relationships panel on the entity page
            </p>
          </div>

          {/* Rivals */}
          <div>
            <Label className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400" />
              Rivals / Enemies
            </Label>
            <Textarea
              value={formData.relations.rivals}
              onChange={(e) => updateRelations('rivals', e.target.value)}
              rows={3}
              placeholder="Who opposes them? What conflicts are they engaged in?"
            />
          </div>

          {/* History */}
          <div>
            <Label className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              History / Origin
            </Label>
            <Textarea
              value={formData.relations.history}
              onChange={(e) => updateRelations('history', e.target.value)}
              rows={4}
              placeholder="How was this faction founded? Key historical events..."
            />
          </div>

          {/* DM Notes */}
          <div>
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              DM Notes
            </Label>
            <Textarea
              value={formData.relations.dm_notes}
              onChange={(e) => updateRelations('dm_notes', e.target.value)}
              rows={4}
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
