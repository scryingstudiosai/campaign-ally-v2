'use client';

import { useState, useEffect, useMemo } from 'react';
import { CombatantType } from '@/types/combat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search, Plus, Minus, User, Users, Skull,
  Swords, BookOpen, Pencil
} from 'lucide-react';
import { rollInitiative, rollHpFormula } from '@/lib/dice';

interface EntityData {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
  summary?: string;
  mechanics?: {
    ac?: number;
    hp?: string | number;
    hp_formula?: string;
    initiative_modifier?: number;
    cr?: string;
    [key: string]: unknown;
  };
}

interface SRDCreature {
  index: string;
  name: string;
  type: string;
  challenge_rating: number;
  armor_class: Array<{ value: number }>;
  hit_points: number;
  hit_points_roll?: string;
  dexterity: number;
}

export interface NewCombatantData {
  id?: string;
  entityId?: string;
  srdId?: string;
  name: string;
  displayName?: string;
  type: CombatantType;
  initiative: number;
  initiativeModifier?: number;
  hp: number;
  maxHp?: number;
  ac: number;
  statBlock?: Record<string, unknown>;
}

interface AddCombatantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  onAddCombatant: (combatant: NewCombatantData) => void;
}

function EntityRow({
  entity,
  count,
  onCountChange,
  onAdd,
}: {
  entity: EntityData | SRDCreature;
  count: number;
  onCountChange: (delta: number) => void;
  onAdd: () => void;
}) {
  // Detect if this is SRD or campaign entity
  const isSRD = 'index' in entity;

  // Extract common properties
  const name = entity.name;
  const type = isSRD ? (entity as SRDCreature).type : (entity as EntityData).sub_type || (entity as EntityData).entity_type;
  const cr = isSRD ? (entity as SRDCreature).challenge_rating : (entity as EntityData).mechanics?.cr;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-200 truncate">{name}</span>
          {cr !== undefined && (
            <Badge variant="outline" className="text-xs border-slate-600">
              CR {cr}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 capitalize">{type}</p>
      </div>

      {/* Count Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onCountChange(-1)}
          disabled={count <= 1}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-6 text-center font-mono">{count}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onCountChange(1)}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <Button
        size="sm"
        onClick={onAdd}
        className="bg-green-600 hover:bg-green-700"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add
      </Button>
    </div>
  );
}

export function AddCombatantDialog({
  open,
  onOpenChange,
  campaignId,
  onAddCombatant,
}: AddCombatantDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'campaign' | 'srd' | 'custom'>('campaign');

  // Campaign entities
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // SRD creatures
  const [srdCreatures, setSrdCreatures] = useState<SRDCreature[]>([]);
  const [loadingSrd, setLoadingSrd] = useState(false);

  // Count tracking for entities
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});

  // Custom combatant form
  const [customCombatant, setCustomCombatant] = useState({
    name: '',
    type: 'monster' as CombatantType,
    initiative: 10,
    hp: 10,
    ac: 10,
  });

  // Load campaign entities (NPCs, creatures, monsters)
  useEffect(() => {
    if (!open || !campaignId) return;

    setLoadingEntities(true);
    fetch(`/api/entities?campaignId=${campaignId}`)
      .then(res => res.json())
      .then((data: EntityData[]) => {
        // Filter to combat-relevant entities (NPCs, creatures, monsters)
        const combatEntities = data.filter(e =>
          ['npc', 'creature', 'monster'].includes(e.entity_type) ||
          e.sub_type === 'villain' ||
          e.mechanics?.ac
        );
        setEntities(combatEntities);
      })
      .catch(err => console.error('Failed to load entities:', err))
      .finally(() => setLoadingEntities(false));
  }, [open, campaignId]);

  // Load SRD creatures when tab is active
  useEffect(() => {
    if (!open || activeTab !== 'srd' || srdCreatures.length > 0) return;

    setLoadingSrd(true);
    fetch('https://www.dnd5eapi.co/api/monsters')
      .then(res => res.json())
      .then(data => {
        // The API returns { count, results: [{ index, name, url }] }
        // We need to store basic info and load details on-demand
        const basicCreatures = data.results.map((c: { index: string; name: string }) => ({
          index: c.index,
          name: c.name,
          type: 'monster',
          challenge_rating: 0,
          armor_class: [{ value: 10 }],
          hit_points: 10,
          dexterity: 10,
        }));
        setSrdCreatures(basicCreatures);
      })
      .catch(err => console.error('Failed to load SRD creatures:', err))
      .finally(() => setLoadingSrd(false));
  }, [open, activeTab, srdCreatures.length]);

  // Filter entities by search term
  const filteredEntities = useMemo(() => {
    if (!searchTerm) return entities;
    const lower = searchTerm.toLowerCase();
    return entities.filter(e =>
      e.name.toLowerCase().includes(lower) ||
      e.sub_type?.toLowerCase().includes(lower)
    );
  }, [entities, searchTerm]);

  // Filter SRD creatures by search term
  const filteredSrdCreatures = useMemo(() => {
    if (!searchTerm) return srdCreatures.slice(0, 50); // Limit initial display
    const lower = searchTerm.toLowerCase();
    return srdCreatures.filter(c => c.name.toLowerCase().includes(lower));
  }, [srdCreatures, searchTerm]);

  const handleCountChange = (id: string, delta: number) => {
    setEntityCounts(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  const getCount = (id: string) => entityCounts[id] || 1;

  const addCampaignEntity = async (entity: EntityData) => {
    const count = getCount(entity.id);
    const mechanics = entity.mechanics || {};

    // Extract stats
    const ac = mechanics.ac ?? 10;
    const hpFormula = mechanics.hp_formula || (typeof mechanics.hp === 'string' ? mechanics.hp : null);
    const baseHp = typeof mechanics.hp === 'number' ? mechanics.hp : 10;
    const initMod = mechanics.initiative_modifier ?? 0;

    // Add each combatant
    for (let i = 0; i < count; i++) {
      const hp = hpFormula ? rollHpFormula(hpFormula) : baseHp;
      const initiative = rollInitiative(initMod);

      const combatantType: CombatantType =
        entity.entity_type === 'npc' ? 'npc' :
        entity.sub_type === 'villain' ? 'monster' : 'monster';

      onAddCombatant({
        id: `${entity.id}-${Date.now()}-${i}`,
        entityId: entity.id,
        name: entity.name,
        displayName: count > 1 ? `${entity.name} ${i + 1}` : entity.name,
        type: combatantType,
        initiative,
        initiativeModifier: initMod,
        hp,
        maxHp: hp,
        ac,
      });
    }

    // Reset count
    setEntityCounts(prev => ({ ...prev, [entity.id]: 1 }));
  };

  const addSrdCreature = async (creature: SRDCreature) => {
    const count = getCount(creature.index);

    // Fetch full creature details
    let fullCreature = creature;
    try {
      const res = await fetch(`https://www.dnd5eapi.co/api/monsters/${creature.index}`);
      if (res.ok) {
        fullCreature = await res.json();
      }
    } catch (err) {
      console.error('Failed to fetch creature details:', err);
    }

    const ac = fullCreature.armor_class?.[0]?.value ?? 10;
    const hpRoll = fullCreature.hit_points_roll;
    const baseHp = fullCreature.hit_points ?? 10;
    const dexMod = Math.floor((fullCreature.dexterity - 10) / 2);

    for (let i = 0; i < count; i++) {
      const hp = hpRoll ? rollHpFormula(hpRoll) : baseHp;
      const initiative = rollInitiative(dexMod);

      onAddCombatant({
        id: `srd-${creature.index}-${Date.now()}-${i}`,
        srdId: creature.index,
        name: creature.name,
        displayName: count > 1 ? `${creature.name} ${i + 1}` : creature.name,
        type: 'monster',
        initiative,
        initiativeModifier: dexMod,
        hp,
        maxHp: hp,
        ac,
        statBlock: fullCreature as unknown as Record<string, unknown>,
      });
    }

    setEntityCounts(prev => ({ ...prev, [creature.index]: 1 }));
  };

  const handleAddCustom = () => {
    onAddCombatant({
      id: `custom-${Date.now()}`,
      name: customCombatant.name,
      displayName: customCombatant.name,
      type: customCombatant.type,
      initiative: customCombatant.initiative,
      hp: customCombatant.hp,
      maxHp: customCombatant.hp,
      ac: customCombatant.ac,
    });

    // Reset form
    setCustomCombatant({
      name: '',
      type: 'monster',
      initiative: 10,
      hp: 10,
      ac: 10,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-400" />
            Add Combatants
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search creatures..."
            className="pl-9 bg-slate-800 border-slate-600"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'campaign' | 'srd' | 'custom')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="campaign" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Campaign
            </TabsTrigger>
            <TabsTrigger value="srd" className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              SRD
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-1">
              <Pencil className="w-4 h-4" />
              Custom
            </TabsTrigger>
          </TabsList>

          {/* Campaign Entities Tab */}
          <TabsContent value="campaign" className="flex-1 overflow-y-auto mt-4 space-y-1">
            {loadingEntities ? (
              <p className="text-slate-400 text-center py-4">Loading entities...</p>
            ) : filteredEntities.length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                {searchTerm ? 'No matching entities found' : 'No combat entities in campaign'}
              </p>
            ) : (
              filteredEntities.map(entity => (
                <EntityRow
                  key={entity.id}
                  entity={entity}
                  count={getCount(entity.id)}
                  onCountChange={(delta) => handleCountChange(entity.id, delta)}
                  onAdd={() => addCampaignEntity(entity)}
                />
              ))
            )}
          </TabsContent>

          {/* SRD Creatures Tab */}
          <TabsContent value="srd" className="flex-1 overflow-y-auto mt-4 space-y-1">
            {loadingSrd ? (
              <p className="text-slate-400 text-center py-4">Loading SRD creatures...</p>
            ) : filteredSrdCreatures.length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                {searchTerm ? 'No matching creatures found' : 'Type to search SRD creatures'}
              </p>
            ) : (
              <>
                {!searchTerm && (
                  <p className="text-xs text-slate-500 px-2 mb-2">
                    Showing first 50 creatures. Search to find more.
                  </p>
                )}
                {filteredSrdCreatures.map(creature => (
                  <EntityRow
                    key={creature.index}
                    entity={creature}
                    count={getCount(creature.index)}
                    onCountChange={(delta) => handleCountChange(creature.index, delta)}
                    onAdd={() => addSrdCreature(creature)}
                  />
                ))}
              </>
            )}
          </TabsContent>

          {/* Custom Combatant Tab */}
          <TabsContent value="custom" className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-slate-400">Name</label>
              <Input
                value={customCombatant.name}
                onChange={(e) => setCustomCombatant(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Goblin Reinforcement"
                className="bg-slate-800 border-slate-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm text-slate-400">Initiative</label>
                <Input
                  type="number"
                  value={customCombatant.initiative}
                  onChange={(e) => setCustomCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">HP</label>
                <Input
                  type="number"
                  value={customCombatant.hp}
                  onChange={(e) => setCustomCombatant(prev => ({ ...prev, hp: parseInt(e.target.value) || 1 }))}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">AC</label>
                <Input
                  type="number"
                  value={customCombatant.ac}
                  onChange={(e) => setCustomCombatant(prev => ({ ...prev, ac: parseInt(e.target.value) || 10 }))}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Type</label>
              <div className="flex gap-2">
                <Button
                  variant={customCombatant.type === 'monster' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomCombatant(prev => ({ ...prev, type: 'monster' }))}
                  className={customCombatant.type === 'monster' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-600'}
                >
                  <Skull className="w-4 h-4 mr-1" />
                  Enemy
                </Button>
                <Button
                  variant={customCombatant.type === 'ally' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomCombatant(prev => ({ ...prev, type: 'ally' }))}
                  className={customCombatant.type === 'ally' ? 'bg-green-600 hover:bg-green-700' : 'border-slate-600'}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Ally
                </Button>
                <Button
                  variant={customCombatant.type === 'npc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomCombatant(prev => ({ ...prev, type: 'npc' }))}
                  className={customCombatant.type === 'npc' ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-600'}
                >
                  <User className="w-4 h-4 mr-1" />
                  NPC
                </Button>
              </div>
            </div>

            <Button
              onClick={handleAddCustom}
              disabled={!customCombatant.name}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add to Combat
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
