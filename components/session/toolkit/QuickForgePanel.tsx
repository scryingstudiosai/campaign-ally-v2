'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, MapPin, Package, Skull, Loader2, Sparkles,
  CheckCircle, ExternalLink, Swords, Search, BookOpen
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface QuickForgePanelProps {
  campaignId: string;
  onForged?: (entity: ForgedEntity) => void;
}

interface ForgedEntity {
  id: string;
  name: string;
  summary?: string;
  entity_type?: string;
}

// SRD creature from external D&D 5e API (list view)
interface SRDCreatureListItem {
  index: string;
  name: string;
  challenge_rating: number;
  type: string;
  size: string;
  hit_points: number;
  armor_class: number;
}

const FORGE_OPTIONS = [
  { type: 'creature', label: 'Creature', icon: Skull, color: 'bg-red-600 hover:bg-red-700', hasSRD: true },
  { type: 'encounter', label: 'Encounter', icon: Swords, color: 'bg-orange-600 hover:bg-orange-700', hasSRD: false },
  { type: 'npc', label: 'NPC', icon: Users, color: 'bg-blue-600 hover:bg-blue-700', hasSRD: false },
  { type: 'location', label: 'Location', icon: MapPin, color: 'bg-green-600 hover:bg-green-700', hasSRD: false },
  { type: 'item', label: 'Item', icon: Package, color: 'bg-amber-600 hover:bg-amber-700', hasSRD: false },
];

export function QuickForgePanel({ campaignId, onForged }: QuickForgePanelProps) {
  const [isForging, setIsForging] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [forgedEntity, setForgedEntity] = useState<ForgedEntity | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // SRD state
  const [srdCreatures, setSrdCreatures] = useState<SRDCreatureListItem[]>([]);
  const [srdSearch, setSrdSearch] = useState('');
  const [isLoadingSRD, setIsLoadingSRD] = useState(false);
  const [creatureMode, setCreatureMode] = useState<'generate' | 'srd'>('generate');

  // Search SRD creatures when search query changes
  useEffect(() => {
    if (creatureMode !== 'srd' || srdSearch.length < 2) {
      if (srdSearch.length < 2) setSrdCreatures([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoadingSRD(true);
      try {
        // Use the new external API route
        const response = await fetch(`/api/srd/creatures?q=${encodeURIComponent(srdSearch)}`);
        if (response.ok) {
          const data = await response.json();
          setSrdCreatures(data || []);
        }
      } catch (error) {
        console.error('Failed to search SRD creatures:', error);
      }
      setIsLoadingSRD(false);
    }, 300); // Debounce

    return () => clearTimeout(searchTimeout);
  }, [srdSearch, creatureMode]);

  const handleOpenForge = (type: string) => {
    setSelectedType(type);
    setPrompt('');
    setSrdSearch('');
    setSrdCreatures([]);
    setError(null);
    setForgedEntity(null);
    setShowSuccess(false);
    setCreatureMode('generate');
    setShowDialog(true);
  };

  const handleQuickForge = async () => {
    if (!selectedType || !prompt.trim()) return;

    setIsForging(selectedType);
    setError(null);

    try {
      const response = await fetch('/api/forge/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          entityType: selectedType,
          prompt: prompt.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Forge failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) throw new Error('Empty response from server');

      const newEntity = JSON.parse(text);

      setForgedEntity(newEntity);
      setShowSuccess(true);
      onForged?.(newEntity);

    } catch (err) {
      console.error('Quick forge error:', err);
      setError(err instanceof Error ? err.message : 'Failed to forge entity');
    }

    setIsForging(null);
  };

  const handleImportSRD = async (creature: SRDCreatureListItem) => {
    setIsForging('srd');
    setError(null);

    try {
      // Fetch full creature data from SRD
      const response = await fetch(`/api/srd/creatures/${creature.index}`);
      if (!response.ok) throw new Error('Failed to fetch creature details');

      const srd = await response.json();

      // Build complete mechanics object from SRD data
      const mechanics = {
        // Core stats
        hp: srd.hit_points,
        hp_max: srd.hit_points,
        hp_formula: srd.hit_points_roll || srd.hit_dice,
        ac: srd.armor_class?.[0]?.value || 10,
        ac_type: srd.armor_class?.[0]?.type || 'natural',
        cr: String(srd.challenge_rating),
        xp: srd.xp,

        // Type info
        size: srd.size?.toLowerCase(),
        type: srd.type,
        subtype: srd.subtype,
        alignment: srd.alignment,

        // Ability scores
        abilities: {
          str: srd.strength,
          dex: srd.dexterity,
          con: srd.constitution,
          int: srd.intelligence,
          wis: srd.wisdom,
          cha: srd.charisma,
        },

        // Speed - handle object format
        speed: srd.speed,

        // Proficiencies (saving throws and skills)
        proficiencies: srd.proficiencies?.map((p: any) => ({
          name: p.proficiency?.name || p.name,
          value: p.value,
        })),

        // Senses
        senses: typeof srd.senses === 'object'
          ? Object.entries(srd.senses)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`)
              .join(', ')
          : srd.senses,

        // Languages
        languages: srd.languages || 'None',

        // Resistances and Immunities
        damage_vulnerabilities: srd.damage_vulnerabilities || [],
        damage_resistances: srd.damage_resistances || [],
        damage_immunities: srd.damage_immunities || [],
        condition_immunities: srd.condition_immunities?.map((c: any) => c.name || c) || [],

        // Abilities and Actions
        special_abilities: srd.special_abilities?.map((a: any) => ({
          name: a.name,
          desc: a.desc,
          usage: a.usage,
          dc: a.dc,
          damage: a.damage,
        })) || [],

        actions: srd.actions?.map((a: any) => ({
          name: a.name,
          desc: a.desc,
          attack_bonus: a.attack_bonus,
          damage: a.damage,
          dc: a.dc,
          usage: a.usage,
          multiattack_type: a.multiattack_type,
          actions: a.actions,
        })) || [],

        reactions: srd.reactions?.map((r: any) => ({
          name: r.name,
          desc: r.desc,
        })) || [],

        legendary_actions: srd.legendary_actions?.map((a: any) => ({
          name: a.name,
          desc: a.desc,
          attack_bonus: a.attack_bonus,
          damage: a.damage,
        })) || [],

        legendary_desc: srd.legendary_desc,

        // Source tracking
        srd_index: srd.index,
        srd_url: srd.url,
      };

      // Build summary
      const sizeName = srd.size?.toLowerCase() || 'medium';
      const typeName = srd.type || 'creature';
      const alignment = srd.alignment || 'unaligned';

      // Create entity in database
      const createResponse = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          entity_type: 'creature',
          name: srd.name,
          summary: `${sizeName} ${typeName}, ${alignment}, CR ${srd.challenge_rating}`,
          sub_type: typeName,
          soul: {
            read_aloud: `A ${sizeName} ${typeName} stands before you.`,
            appearance: srd.desc || `A ${sizeName} ${typeName}.`,
          },
          brain: {
            tactics: srd.actions?.[0]?.desc?.substring(0, 200) || 'Attacks aggressively.',
            motivation: 'Follows its nature.',
          },
          mechanics: mechanics,
          status: 'active',
          forge_status: 'complete',
          tags: ['srd', typeName, sizeName],
        }),
      });

      if (!createResponse.ok) {
        const err = await createResponse.json();
        throw new Error(err.error || 'Failed to create entity');
      }

      const newEntity = await createResponse.json();

      setForgedEntity(newEntity);
      setShowSuccess(true);
      onForged?.(newEntity);

    } catch (err: any) {
      console.error('SRD import error:', err);
      setError(err.message || 'Failed to import creature');
    }

    setIsForging(null);
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setForgedEntity(null);
    setPrompt('');
    setSrdSearch('');
    setSrdCreatures([]);
  };

  const handleClose = () => {
    setShowDialog(false);
    setShowSuccess(false);
    setForgedEntity(null);
    setPrompt('');
    setSrdSearch('');
    setSrdCreatures([]);
    setError(null);
  };

  const selectedOption = FORGE_OPTIONS.find(o => o.type === selectedType);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
        Quick Forge
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {FORGE_OPTIONS.map(({ type, label, icon: Icon, color }) => (
          <Button
            key={type}
            onClick={() => handleOpenForge(type)}
            disabled={isForging !== null}
            className={`h-16 flex-col gap-1 ${color}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-4 text-center">
        Instantly generate content during gameplay
      </p>

      {/* Forge Dialog */}
      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOption && <selectedOption.icon className="w-5 h-5 text-teal-400" />}
              Quick Forge {selectedOption?.label}
            </DialogTitle>
          </DialogHeader>

          {showSuccess && forgedEntity ? (
            // SUCCESS STATE
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-green-300 font-medium">Created Successfully!</p>
                  <p className="text-xl text-white font-bold truncate mt-1">{forgedEntity.name}</p>
                  {forgedEntity.summary && (
                    <p className="text-sm text-slate-400 mt-2 line-clamp-3">{forgedEntity.summary}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/campaigns/${campaignId}/memory/${forgedEntity.id}`}
                  target="_blank"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full border-slate-600">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                <Button
                  onClick={handleCreateAnother}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Another
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={handleClose}
                className="w-full text-slate-400"
              >
                Done
              </Button>
            </div>
          ) : selectedType === 'creature' ? (
            // CREATURE MODE - Tabs for Generate vs SRD
            <Tabs value={creatureMode} onValueChange={(v) => setCreatureMode(v as 'generate' | 'srd')}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="generate" className="text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  Generate New
                </TabsTrigger>
                <TabsTrigger value="srd" className="text-xs gap-1">
                  <BookOpen className="w-3 h-3" />
                  SRD Monster
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    Describe the creature:
                  </label>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A pack of dire wolves hunting in the snow..."
                    className="bg-slate-800 border-slate-600"
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleQuickForge()}
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded">{error}</p>
                )}

                <Button
                  onClick={handleQuickForge}
                  disabled={!prompt.trim() || isForging !== null}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {isForging ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Forging...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Creature
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="srd" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={srdSearch}
                    onChange={(e) => setSrdSearch(e.target.value)}
                    placeholder="Search monsters (goblin, dragon, wolf...)"
                    className="pl-10 bg-slate-800 border-slate-600"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded">{error}</p>
                )}

                <div className="h-64 border border-slate-700 rounded-lg overflow-y-auto">
                  {isLoadingSRD ? (
                    <div className="flex items-center justify-center py-8 text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Searching...
                    </div>
                  ) : srdCreatures.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      {srdSearch.length < 2 ? 'Type at least 2 characters to search' : 'No monsters found'}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {srdCreatures.map(creature => (
                        <button
                          key={creature.index}
                          onClick={() => handleImportSRD(creature)}
                          disabled={isForging === 'srd'}
                          className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800 transition-colors text-left disabled:opacity-50"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-slate-200 truncate">{creature.name}</p>
                            <p className="text-xs text-slate-500">
                              {creature.size} {creature.type}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-300">
                              CR {creature.challenge_rating}
                            </span>
                            <span className="text-xs text-slate-500">
                              HP {creature.hit_points}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isForging === 'srd' && (
                  <div className="flex items-center justify-center gap-2 text-teal-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing creature...
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            // OTHER ENTITY TYPES - Standard Generate
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Describe what you need:
                </label>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    selectedType === 'npc' ? 'A mysterious merchant with a secret...' :
                    selectedType === 'location' ? 'A hidden grove with ancient ruins...' :
                    selectedType === 'item' ? 'A cursed sword that whispers...' :
                    selectedType === 'encounter' ? '3 goblins ambush from the trees, medium difficulty...' :
                    'Describe what you want to create...'
                  }
                  className="bg-slate-800 border-slate-600"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleQuickForge()}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded">{error}</p>
              )}

              <Button
                onClick={handleQuickForge}
                disabled={!prompt.trim() || isForging !== null}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {isForging ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Forging...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Forge {selectedOption?.label}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
