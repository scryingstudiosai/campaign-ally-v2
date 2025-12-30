'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Dices,
  Sword,
  Users,
  CheckCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// SRD data
import {
  races,
  classes,
  standardArray,
  equipmentPacks,
  classWeapons,
  classArmor,
  languages,
} from '@/lib/data/srd-packs';

// Stats calculator
import {
  calculateModifier,
  formatModifier,
  calculateMaxHP,
  calculateArmorClass,
  getBaseSpeed,
  calculateProficiencyBonus,
  getClassSavingThrows,
} from '@/lib/utils/player-stats';

type Step = 'identity' | 'stats' | 'loadout' | 'anchors' | 'review';

interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface EntityOption {
  id: string;
  name: string;
  entity_type: string;
}

const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export default function PlayerForgePage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const supabase = createClient();

  // Loading and campaign state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignName, setCampaignName] = useState('');

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>('identity');

  // Step 1: Identity
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [playerClass, setPlayerClass] = useState('');
  const [level, setLevel] = useState(1);
  const [background, setBackground] = useState('');
  const [backstory, setBackstory] = useState('');

  // Step 2: Stats
  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  });
  const [availableScores, setAvailableScores] = useState<number[]>([...standardArray]);

  // Step 3: Loadout
  const [selectedPack, setSelectedPack] = useState('');
  const [additionalItems, setAdditionalItems] = useState<string[]>([]);
  const [startingGold, setStartingGold] = useState(10);

  // Step 4: Anchors
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [anchorLocation, setAnchorLocation] = useState('');
  const [anchorFaction, setAnchorFaction] = useState('');
  const [anchorNpc, setAnchorNpc] = useState('');

  // Step 5: Review - derived stats
  const maxHP = calculateMaxHP(playerClass, level, abilityScores.con);
  const armorClass = calculateArmorClass(
    abilityScores.dex,
    classArmor[playerClass]?.[0]
  );
  const speed = getBaseSpeed(race);
  const proficiencyBonus = calculateProficiencyBonus(level);
  const savingThrows = getClassSavingThrows(playerClass);

  // Fetch campaign and entities
  useEffect(() => {
    async function fetchData(): Promise<void> {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (campaignError || !campaignData) {
        router.push('/dashboard');
        return;
      }

      setCampaignName(campaignData.name);

      // Fetch entities for anchoring
      const { data: entityData } = await supabase
        .from('entities')
        .select('id, name, entity_type')
        .eq('campaign_id', campaignId)
        .in('entity_type', ['location', 'faction', 'npc'])
        .is('deleted_at', null)
        .order('name');

      if (entityData) {
        setEntities(entityData);
      }

      setLoading(false);
    }

    fetchData();
  }, [campaignId, supabase, router]);

  // Navigation
  const steps: Step[] = ['identity', 'stats', 'loadout', 'anchors', 'review'];
  const currentIndex = steps.indexOf(currentStep);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'identity':
        return name.trim() !== '' && race !== '' && playerClass !== '';
      case 'stats':
        return availableScores.length === 0; // All scores assigned
      case 'loadout':
        return selectedPack !== '';
      case 'anchors':
        return true; // Optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const goNext = (): void => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goBack = (): void => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Ability score assignment
  const assignScore = (ability: keyof AbilityScores, score: number): void => {
    // Add current score back to available if it's from standard array
    const currentScore = abilityScores[ability];
    if (standardArray.includes(currentScore)) {
      setAvailableScores((prev) => [...prev, currentScore].sort((a, b) => b - a));
    }

    // Remove new score from available
    setAvailableScores((prev) => {
      const idx = prev.indexOf(score);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });

    // Set the score
    setAbilityScores((prev) => ({ ...prev, [ability]: score }));
  };

  const resetScores = (): void => {
    setAbilityScores({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    setAvailableScores([...standardArray]);
  };

  // Save player
  const handleSave = async (): Promise<void> => {
    setSaving(true);

    try {
      // Build inventory items list
      const packItems = selectedPack ? equipmentPacks[selectedPack]?.items || [] : [];
      const classWeaponItems = classWeapons[playerClass] || [];
      const classArmorItems = classArmor[playerClass] || [];
      const allItems = [
        ...packItems,
        ...classWeaponItems,
        ...classArmorItems,
        ...additionalItems,
      ];

      // Create the player entity
      const { data: entity, error: entityError } = await supabase
        .from('entities')
        .insert({
          campaign_id: campaignId,
          name,
          entity_type: 'player',
          subtype: `${races.find((r) => r.value === race)?.label} ${classes.find((c) => c.value === playerClass)?.label}`,
          summary: `Level ${level} ${races.find((r) => r.value === race)?.label} ${classes.find((c) => c.value === playerClass)?.label}`,
          description: backstory || undefined,
          soul: {
            race,
            class: playerClass,
            level,
            background,
            ability_scores: abilityScores,
            max_hp: maxHP,
            current_hp: maxHP,
            armor_class: armorClass,
            speed,
            proficiency_bonus: proficiencyBonus,
            saving_throws: savingThrows,
            languages: ['Common'],
          },
          forge_status: 'complete',
        })
        .select('id')
        .single();

      if (entityError || !entity) {
        throw new Error(entityError?.message || 'Failed to create player');
      }

      // Add inventory items via bulk API
      if (allItems.length > 0 || startingGold > 0) {
        // Count items for stacking
        const itemCounts = new Map<string, number>();
        for (const item of allItems) {
          itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
        }

        const bulkItems = Array.from(itemCounts.entries()).map(([name, quantity]) => ({
          name,
          quantity,
        }));

        // Add gold as an item
        if (startingGold > 0) {
          bulkItems.push({ name: 'Gold Pieces', quantity: startingGold });
        }

        const response = await fetch(
          `/api/campaigns/${campaignId}/players/${entity.id}/inventory/bulk`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: bulkItems }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to add inventory items:', errorData);
        }
      }

      // Create anchor relationships
      const anchors = [
        { id: anchorLocation, type: 'lives_in' },
        { id: anchorFaction, type: 'member_of' },
        { id: anchorNpc, type: 'knows' },
      ].filter((a) => a.id);

      if (anchors.length > 0) {
        const relationships = anchors.map((anchor) => ({
          campaign_id: campaignId,
          source_id: entity.id,
          target_id: anchor.id,
          relationship_type: anchor.type,
          surface_description: 'Created during character creation',
          is_active: true,
        }));

        await supabase.from('relationships').insert(relationships);
      }

      toast.success('Player character created!');
      router.push(`/dashboard/campaigns/${campaignId}/memory/${entity.id}`);
    } catch (error) {
      console.error('Failed to save player:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save player');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-foreground"
      style={{ backgroundColor: 'var(--ca-bg-base)' }}
    >
      {/* Header */}
      <header
        className="border-b px-6 py-4"
        style={{
          borderColor: 'var(--ca-stroke)',
          backgroundColor: 'var(--ca-bg-raised)',
        }}
      >
        <Button variant="ghost" asChild className="mb-2 -ml-2">
          <Link href={`/dashboard/campaigns/${campaignId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {campaignName}
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{
              background:
                'linear-gradient(180deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.1) 100%)',
            }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Player Forge</h1>
            <p className="text-sm text-slate-400">Create a new player character</p>
          </div>
        </div>
      </header>

      {/* Step Progress */}
      <div
        className="border-b px-6 py-3"
        style={{
          borderColor: 'var(--ca-stroke)',
          backgroundColor: 'var(--ca-bg-raised)',
        }}
      >
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => {
            const isActive = step === currentStep;
            const isComplete = index < currentIndex;
            const icons: Record<Step, React.ReactNode> = {
              identity: <User className="w-4 h-4" />,
              stats: <Dices className="w-4 h-4" />,
              loadout: <Sword className="w-4 h-4" />,
              anchors: <Users className="w-4 h-4" />,
              review: <CheckCircle className="w-4 h-4" />,
            };

            return (
              <React.Fragment key={step}>
                <button
                  onClick={() => index <= currentIndex && setCurrentStep(step)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
                    isActive && 'bg-teal-500/20 text-teal-400',
                    isComplete && 'text-teal-500 hover:bg-teal-500/10',
                    !isActive && !isComplete && 'text-slate-500 cursor-not-allowed'
                  )}
                  disabled={index > currentIndex}
                >
                  {icons[step]}
                  <span className="text-sm font-medium capitalize">{step}</span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-px mx-2',
                      isComplete ? 'bg-teal-500' : 'bg-slate-700'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-6">
        {/* Step 1: Identity */}
        {currentStep === 'identity' && (
          <div className="space-y-6">
            <div className="ca-panel p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">Character Identity</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Character Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter character name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="race">Race</Label>
                  <Select value={race} onValueChange={setRace}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Select race..." />
                    </SelectTrigger>
                    <SelectContent>
                      {races.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select value={playerClass} onValueChange={setPlayerClass}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Select class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label} (d{c.hitDie})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setLevel(Math.max(1, level - 1))}
                      disabled={level <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      id="level"
                      type="number"
                      min={1}
                      max={20}
                      value={level}
                      onChange={(e) =>
                        setLevel(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))
                      }
                      className="bg-slate-900/50 border-slate-700 text-center w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setLevel(Math.min(20, level + 1))}
                      disabled={level >= 20}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background">Background</Label>
                  <Input
                    id="background"
                    placeholder="e.g., Soldier, Sage, Criminal..."
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="backstory">Backstory (Optional)</Label>
                  <Textarea
                    id="backstory"
                    placeholder="A brief backstory for your character..."
                    value={backstory}
                    onChange={(e) => setBackstory(e.target.value)}
                    className="min-h-[100px] bg-slate-900/50 border-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Stats */}
        {currentStep === 'stats' && (
          <div className="space-y-6">
            <div className="ca-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Ability Scores</h2>
                <Button variant="outline" size="sm" onClick={resetScores}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>

              <p className="text-sm text-slate-400">
                Assign scores from the standard array to your abilities. Click a score
                below, then click an ability to assign it.
              </p>

              {/* Available Scores */}
              <div className="flex gap-2 flex-wrap">
                {availableScores.map((score, idx) => (
                  <div
                    key={`${score}-${idx}`}
                    className="px-4 py-2 bg-teal-500/20 border border-teal-500/50 rounded-lg text-teal-400 font-bold"
                  >
                    {score}
                  </div>
                ))}
                {availableScores.length === 0 && (
                  <p className="text-sm text-green-400">All scores assigned!</p>
                )}
              </div>

              {/* Ability Grid */}
              <div className="grid grid-cols-3 gap-4">
                {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScores>).map(
                  (ability) => {
                    const score = abilityScores[ability];
                    const mod = calculateModifier(score);
                    const isSavingThrow = savingThrows.includes(ability);

                    return (
                      <div
                        key={ability}
                        className={cn(
                          'p-4 rounded-lg border text-center space-y-2',
                          isSavingThrow
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-slate-800/50 border-slate-700'
                        )}
                      >
                        <div className="text-xs text-slate-400 uppercase">
                          {ABILITY_LABELS[ability]}
                          {isSavingThrow && (
                            <span className="ml-1 text-amber-400">★</span>
                          )}
                        </div>
                        <div className="text-3xl font-bold text-white">{score}</div>
                        <div
                          className={cn(
                            'text-sm',
                            mod >= 0 ? 'text-green-400' : 'text-red-400'
                          )}
                        >
                          {formatModifier(mod)}
                        </div>
                        <Select
                          value={score.toString()}
                          onValueChange={(v) => assignScore(ability, parseInt(v))}
                        >
                          <SelectTrigger className="bg-slate-900/50 border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...availableScores, score]
                              .sort((a, b) => b - a)
                              .map((s, idx) => (
                                <SelectItem key={`${s}-${idx}`} value={s.toString()}>
                                  {s} ({formatModifier(calculateModifier(s))})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }
                )}
              </div>

              {playerClass && (
                <p className="text-xs text-slate-500">
                  ★ = Saving throw proficiency for{' '}
                  {classes.find((c) => c.value === playerClass)?.label}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Loadout */}
        {currentStep === 'loadout' && (
          <div className="space-y-6">
            <div className="ca-panel p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">Starting Equipment</h2>

              {/* Equipment Pack */}
              <div className="space-y-2">
                <Label>Equipment Pack</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(equipmentPacks).map(([key, pack]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPack(key)}
                      className={cn(
                        'p-4 rounded-lg border text-left transition-colors',
                        selectedPack === key
                          ? 'bg-teal-500/20 border-teal-500/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      )}
                    >
                      <div className="font-medium text-white">{pack.name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {pack.items.length} items
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Weapons & Armor */}
              {playerClass && (
                <div className="space-y-2">
                  <Label>Class Starting Gear</Label>
                  <div className="flex flex-wrap gap-2">
                    {[...(classWeapons[playerClass] || []), ...(classArmor[playerClass] || [])].map(
                      (item, idx) => (
                        <span
                          key={`${item}-${idx}`}
                          className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300"
                        >
                          {item}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Starting Gold */}
              <div className="space-y-2">
                <Label>Starting Gold</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setStartingGold(Math.max(0, startingGold - 5))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    value={startingGold}
                    onChange={(e) => setStartingGold(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-slate-900/50 border-slate-700 text-center w-24"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setStartingGold(startingGold + 5)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-slate-400 text-sm">gp</span>
                </div>
              </div>

              {/* Selected Pack Contents */}
              {selectedPack && (
                <div className="space-y-2">
                  <Label>Pack Contents</Label>
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {equipmentPacks[selectedPack].items.map((item, idx) => (
                        <span
                          key={`${item}-${idx}`}
                          className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Anchors */}
        {currentStep === 'anchors' && (
          <div className="space-y-6">
            <div className="ca-panel p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">World Anchors</h2>
              <p className="text-sm text-slate-400">
                Connect your character to existing elements in your campaign world.
                These are optional but help ground the character in the story.
              </p>

              <div className="space-y-4">
                {/* Home Location */}
                <div className="space-y-2">
                  <Label>Home Location</Label>
                  <Select value={anchorLocation} onValueChange={setAnchorLocation}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Select a location..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {entities
                        .filter((e) => e.entity_type === 'location')
                        .map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Faction Affiliation */}
                <div className="space-y-2">
                  <Label>Faction Affiliation</Label>
                  <Select value={anchorFaction} onValueChange={setAnchorFaction}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Select a faction..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {entities
                        .filter((e) => e.entity_type === 'faction')
                        .map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Known NPC */}
                <div className="space-y-2">
                  <Label>Known NPC</Label>
                  <Select value={anchorNpc} onValueChange={setAnchorNpc}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Select an NPC..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {entities
                        .filter((e) => e.entity_type === 'npc')
                        .map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className="ca-panel p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">Review Character</h2>

              {/* Character Summary */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-white">{name}</div>
                    <div className="text-sm text-slate-400">
                      Level {level}{' '}
                      {races.find((r) => r.value === race)?.label}{' '}
                      {classes.find((c) => c.value === playerClass)?.label}
                    </div>
                    {background && (
                      <div className="text-sm text-slate-500">{background}</div>
                    )}
                  </div>

                  {/* Combat Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="text-2xl font-bold text-red-400">{maxHP}</div>
                      <div className="text-xs text-slate-400">HP</div>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{armorClass}</div>
                      <div className="text-xs text-slate-400">AC</div>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">{speed}</div>
                      <div className="text-xs text-slate-400">Speed</div>
                    </div>
                  </div>

                  {/* Proficiency */}
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Proficiency Bonus</span>
                      <span className="text-lg font-bold text-amber-400">
                        +{proficiencyBonus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Ability Scores */}
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScores>).map(
                    (ability) => {
                      const score = abilityScores[ability];
                      const mod = calculateModifier(score);
                      const isSave = savingThrows.includes(ability);

                      return (
                        <div
                          key={ability}
                          className={cn(
                            'p-2 rounded border text-center',
                            isSave
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-slate-800/50 border-slate-700'
                          )}
                        >
                          <div className="text-xs text-slate-400 uppercase">
                            {ability}
                          </div>
                          <div className="text-lg font-bold text-white">{score}</div>
                          <div
                            className={cn(
                              'text-xs',
                              mod >= 0 ? 'text-green-400' : 'text-red-400'
                            )}
                          >
                            {formatModifier(mod)}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Equipment Summary */}
              {selectedPack && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">Equipment</h3>
                  <div className="text-sm text-slate-400">
                    {equipmentPacks[selectedPack].name}
                    {playerClass && (
                      <>
                        {' '}
                        + {classes.find((c) => c.value === playerClass)?.label} gear
                      </>
                    )}
                    {startingGold > 0 && <> + {startingGold} gp</>}
                  </div>
                </div>
              )}

              {/* Anchors Summary */}
              {(anchorLocation || anchorFaction || anchorNpc) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">World Connections</h3>
                  <div className="flex flex-wrap gap-2">
                    {anchorLocation && (
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-400">
                        Lives in: {entities.find((e) => e.id === anchorLocation)?.name}
                      </span>
                    )}
                    {anchorFaction && (
                      <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400">
                        Member of: {entities.find((e) => e.id === anchorFaction)?.name}
                      </span>
                    )}
                    {anchorNpc && (
                      <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400">
                        Knows: {entities.find((e) => e.id === anchorNpc)?.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep === 'review' ? (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="ca-btn ca-btn-primary gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Character
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!canProceed()}
              className="ca-btn ca-btn-primary gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
