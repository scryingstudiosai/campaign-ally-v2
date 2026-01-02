'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  ImageIcon,
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
import { EntityTypeahead } from '@/components/forge/entity-typeahead';
import { ImageInput } from '@/components/ui/image-input';
import { cn } from '@/lib/utils';

// SRD data
import {
  races,
  classes,
  standardArray,
  equipmentPacks,
  classWeapons,
  classArmor,
  classSpellcastingFocus,
  classRecommendedPacks,
  classWeaponChoices,
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

type Step = 'identity' | 'stats' | 'loadout' | 'anchors' | 'portrait' | 'review';

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
  const searchParams = useSearchParams();
  const campaignId = params.id as string;
  const supabase = createClient();

  // Player mode - when accessed from player portal
  const isPlayerMode = searchParams.get('playerMode') === 'true';
  const returnTo = searchParams.get('returnTo');

  // Loading and campaign state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>('identity');

  // Step 1: Identity
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [playerClass, setPlayerClass] = useState('');
  const [level, setLevel] = useState(1);
  const [background, setBackground] = useState('');
  const [backstory, setBackstory] = useState('');
  const [dmSecrets, setDmSecrets] = useState('');

  // Step 2: Stats
  type ScoreMethod = 'standard' | 'roll' | 'manual';
  const [scoreMethod, setScoreMethod] = useState<ScoreMethod>('standard');
  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  });
  // Standard array - track which scores are still available
  const [availableScores, setAvailableScores] = useState<number[]>([...standardArray]);

  // Roll method - track dice rolls for transparency
  interface DiceRoll {
    rolls: number[];
    dropped: number;
    total: number;
  }
  const [diceRolls, setDiceRolls] = useState<Record<keyof AbilityScores, DiceRoll | null>>({
    str: null, dex: null, con: null, int: null, wis: null, cha: null,
  });
  const [rolledValues, setRolledValues] = useState<number[]>([]);
  const [availableRolledScores, setAvailableRolledScores] = useState<number[]>([]);

  // Step 3: Loadout
  const [selectedPack, setSelectedPack] = useState('');
  const [spellcastingFocus, setSpellcastingFocus] = useState('');
  const [additionalItems, setAdditionalItems] = useState<string[]>([]);
  const [startingGold, setStartingGold] = useState(10);

  // Step 4: Anchors
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [anchorLocation, setAnchorLocation] = useState('');
  const [anchorFaction, setAnchorFaction] = useState('');
  const [anchorNpc, setAnchorNpc] = useState('');

  // Step 5: Portrait
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Step 6: Review - derived stats
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

      setCurrentUserId(user.id);

      // In player mode, verify membership instead of ownership
      if (isPlayerMode) {
        const { data: membership } = await supabase
          .from('campaign_members')
          .select('id, campaign:campaigns(id, name)')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id)
          .single();

        if (!membership) {
          router.push('/');
          return;
        }

        const campaignInfo = membership.campaign as unknown as { id: string; name: string } | null;
        setCampaignName(campaignInfo?.name || 'Campaign');
      } else {
        // Normal DM mode - require ownership
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
      }

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
  }, [campaignId, supabase, router, isPlayerMode]);

  // Navigation
  const steps: Step[] = ['identity', 'stats', 'loadout', 'anchors', 'portrait', 'review'];
  const currentIndex = steps.indexOf(currentStep);

  // Build portrait generation prompt from character details
  const buildPortraitPrompt = (): string => {
    const parts: string[] = [];
    if (race) {
      const raceLabel = races.find((r) => r.value === race)?.label;
      if (raceLabel) parts.push(raceLabel);
    }
    if (playerClass) {
      const classLabel = classes.find((c) => c.value === playerClass)?.label;
      if (classLabel) parts.push(classLabel);
    }

    // Add equipment from loadout
    const weaponGroups = classWeaponChoices[playerClass] || [];
    const armor = classArmor[playerClass] || [];
    const focusData = classSpellcastingFocus[playerClass];

    // Get primary weapon from first weapon group (skip ammo like bolts/arrows)
    if (weaponGroups.length > 0) {
      const primaryGroup = weaponGroups[0];
      const visualWeapons = primaryGroup.items.filter(w =>
        !w.toLowerCase().includes('bolt') &&
        !w.toLowerCase().includes('arrow') &&
        !w.toLowerCase().includes('ammunition')
      );
      if (visualWeapons.length > 0) {
        const primaryWeapon = visualWeapons[0];
        // Special handling for staff with wizard
        if (playerClass === 'wizard' && primaryWeapon.toLowerCase().includes('staff')) {
          parts.push('wielding a glowing arcane quarterstaff');
        } else {
          parts.push(`wielding ${primaryWeapon.toLowerCase()}`);
        }
      }
    }

    // Armor
    if (armor.length > 0) {
      parts.push(`wearing ${armor[0].toLowerCase()}`);
    }

    // Spellcasting focus or class-specific items
    if (spellcastingFocus) {
      if (spellcastingFocus.toLowerCase().includes('staff')) {
        parts.push('with glowing magical staff');
      } else if (spellcastingFocus.toLowerCase().includes('orb')) {
        parts.push('holding a glowing arcane orb');
      } else if (spellcastingFocus.toLowerCase().includes('wand')) {
        parts.push('with magical wand');
      } else if (spellcastingFocus.toLowerCase().includes('crystal')) {
        parts.push('with glowing crystal focus');
      } else if (spellcastingFocus.toLowerCase().includes('holy symbol')) {
        parts.push('wearing holy symbol');
      } else if (spellcastingFocus.toLowerCase().includes('druidic')) {
        parts.push('with wooden druidic focus');
      } else if (spellcastingFocus.toLowerCase().includes('lute') ||
                 spellcastingFocus.toLowerCase().includes('lyre') ||
                 spellcastingFocus.toLowerCase().includes('flute') ||
                 spellcastingFocus.toLowerCase().includes('drum') ||
                 spellcastingFocus.toLowerCase().includes('horn')) {
        parts.push(`carrying a ${spellcastingFocus.toLowerCase()}`);
      }
    }

    // Add spellbook for wizard if automatic
    if (focusData?.automatic.includes('Spellbook')) {
      parts.push('with leather-bound spellbook');
    }

    if (backstory) {
      // Take first sentence of backstory as context
      const firstSentence = backstory.split(/[.!?]/)[0].trim();
      if (firstSentence && firstSentence.length < 100) {
        parts.push(firstSentence);
      }
    }
    return parts.join(', ') || 'Fantasy adventurer character portrait';
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'identity':
        return name.trim() !== '' && race !== '' && playerClass !== '';
      case 'stats': {
        // All 6 abilities must have a value > 0
        const allAssigned = Object.values(abilityScores).every((score) => score > 0);
        return allAssigned;
      }
      case 'loadout':
        return selectedPack !== '';
      case 'anchors':
        return true; // Optional
      case 'portrait':
        return true; // Optional - can skip portrait
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

  // Roll 4d6 drop lowest logic
  const roll4d6DropLowest = (): DiceRoll => {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    const sorted = [...rolls].sort((a, b) => a - b);
    const dropped = sorted[0];
    const kept = sorted.slice(1);
    const total = kept.reduce((sum, die) => sum + die, 0);
    return { rolls, dropped, total };
  };

  // Roll all abilities at once
  const rollAllAbilities = (): void => {
    const newRolls: number[] = [];
    const newDiceRolls: Record<keyof AbilityScores, DiceRoll | null> = {
      str: null, dex: null, con: null, int: null, wis: null, cha: null,
    };

    // Generate 6 rolls
    for (let i = 0; i < 6; i++) {
      const roll = roll4d6DropLowest();
      newRolls.push(roll.total);
    }

    // Sort descending for display
    const sortedRolls = [...newRolls].sort((a, b) => b - a);
    setRolledValues(sortedRolls);
    setAvailableRolledScores(sortedRolls);
    setDiceRolls(newDiceRolls);
    // Reset ability scores when rolling new values
    setAbilityScores({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
  };

  // Assign a score from standard array
  const assignStandardScore = (ability: keyof AbilityScores, score: number): void => {
    const currentScore = abilityScores[ability];

    // Return current score to available pool if it was assigned
    if (currentScore > 0 && standardArray.includes(currentScore)) {
      setAvailableScores((prev) => [...prev, currentScore].sort((a, b) => b - a));
    }

    // Remove new score from available
    setAvailableScores((prev) => {
      const idx = prev.indexOf(score);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });

    setAbilityScores((prev) => ({ ...prev, [ability]: score }));
  };

  // Assign a rolled score
  const assignRolledScore = (ability: keyof AbilityScores, score: number): void => {
    const currentScore = abilityScores[ability];

    // Return current score to available pool if it was assigned
    if (currentScore > 0) {
      setAvailableRolledScores((prev) => [...prev, currentScore].sort((a, b) => b - a));
    }

    // Remove new score from available
    setAvailableRolledScores((prev) => {
      const idx = prev.indexOf(score);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });

    setAbilityScores((prev) => ({ ...prev, [ability]: score }));
  };

  // Set manual score
  const setManualScore = (ability: keyof AbilityScores, value: number): void => {
    const clampedValue = Math.min(20, Math.max(1, value));
    setAbilityScores((prev) => ({ ...prev, [ability]: clampedValue }));
  };

  // Reset scores based on current method
  const resetScores = (): void => {
    setAbilityScores({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
    if (scoreMethod === 'standard') {
      setAvailableScores([...standardArray]);
    } else if (scoreMethod === 'roll') {
      setRolledValues([]);
      setAvailableRolledScores([]);
      setDiceRolls({ str: null, dex: null, con: null, int: null, wis: null, cha: null });
    }
  };

  // Change score method
  const changeScoreMethod = (method: ScoreMethod): void => {
    setScoreMethod(method);
    setAbilityScores({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
    setAvailableScores([...standardArray]);
    setRolledValues([]);
    setAvailableRolledScores([]);
    setDiceRolls({ str: null, dex: null, con: null, int: null, wis: null, cha: null });
  };

  // Save player
  const handleSave = async (): Promise<void> => {
    setSaving(true);

    try {
      // Build inventory items list
      const packItems = selectedPack ? equipmentPacks[selectedPack]?.items || [] : [];
      // Get all weapon items from the choice groups
      const classWeaponItems = (classWeaponChoices[playerClass] || []).flatMap(group => group.items);
      const classArmorItems = classArmor[playerClass] || [];
      const automaticItems = classSpellcastingFocus[playerClass]?.automatic || [];
      const focusItems = spellcastingFocus ? [spellcastingFocus] : [];
      const allItems = [
        ...packItems,
        ...classWeaponItems,
        ...classArmorItems,
        ...automaticItems,
        ...focusItems,
        ...additionalItems,
      ];

      // Build loadout data for soul
      const loadoutData = {
        weapons: classWeaponItems,
        armor: classArmorItems.length > 0 ? classArmorItems[0] : null,
        pack: selectedPack || null,
        packContents: packItems,
        focus: spellcastingFocus || null,
        automaticItems: automaticItems,
        gold: startingGold,
      };

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
          image_url: imageUrl || undefined,
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
            loadout: loadoutData,
          },
          attributes: dmSecrets ? { dm_secrets: dmSecrets } : undefined,
          forge_status: 'complete',
        })
        .select('id')
        .single();

      if (entityError || !entity) {
        throw new Error(entityError?.message || 'Failed to create player');
      }

      // In player mode, link character to player's membership BEFORE adding inventory
      // (so the bulk API can verify ownership)
      if (isPlayerMode && currentUserId) {
        await supabase
          .from('campaign_members')
          .update({ character_entity_id: entity.id })
          .eq('campaign_id', campaignId)
          .eq('user_id', currentUserId);
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

      // Create anchor relationships (World Anchors)
      const anchors = [
        { id: anchorLocation, type: 'lives_in', label: 'Home location' },
        { id: anchorFaction, type: 'member_of', label: 'Faction affiliation' },
        { id: anchorNpc, type: 'knows', label: 'Known NPC' },
      ].filter((a) => a.id);

      if (anchors.length > 0) {
        const relationships = anchors.map((anchor) => ({
          campaign_id: campaignId,
          source_id: entity.id,
          target_id: anchor.id,
          relationship_type: anchor.type,
          surface_description: `${anchor.label} selected during character creation`,
          visibility: 'public', // Players can see their own world anchors
          is_active: true,
        }));

        const { error: relError } = await supabase.from('relationships').insert(relationships);
        if (relError) {
          console.error('Failed to save world anchors:', relError);
          // Don't fail the whole creation, just log the error
        }
      }

      // Navigate after creation
      if (isPlayerMode) {
        toast.success('Character created!');
        router.push(returnTo || `/portal/${campaignId}`);
      } else {
        toast.success('Player character created!');
        router.push(`/dashboard/campaigns/${campaignId}/memory/${entity.id}`);
      }
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
          <Link href={isPlayerMode ? (returnTo || `/portal/${campaignId}`) : `/dashboard/campaigns/${campaignId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isPlayerMode ? 'Back to Portal' : `Back to ${campaignName}`}
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
              portrait: <ImageIcon className="w-4 h-4" />,
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

                {/* DM Secrets - hidden in player mode */}
                {!isPlayerMode && (
                  <div className="col-span-2 space-y-2 p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
                    <Label htmlFor="dmSecrets" className="text-red-400 flex items-center gap-2">
                      DM Secrets
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded border border-red-500/30">
                        Hidden from Players
                      </span>
                    </Label>
                    <Textarea
                      id="dmSecrets"
                      placeholder="Secret information only the DM knows about this character..."
                      value={dmSecrets}
                      onChange={(e) => setDmSecrets(e.target.value)}
                      className="min-h-[80px] bg-red-950/30 border-red-500/30 placeholder:text-red-300/50"
                    />
                    <p className="text-xs text-red-400/70">
                      This won&apos;t appear in the Player Portal.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Stats */}
        {currentStep === 'stats' && (
          <div className="space-y-6">
            <div className="ca-panel p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Ability Scores</h2>
                <Button variant="outline" size="sm" onClick={resetScores}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Method Selection */}
              <div className="space-y-2">
                <Label className="text-slate-400">Choose a method:</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={scoreMethod === 'standard' ? 'default' : 'outline'}
                    onClick={() => changeScoreMethod('standard')}
                    className={cn(
                      scoreMethod === 'standard' && 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    )}
                  >
                    Standard Array
                  </Button>
                  <Button
                    type="button"
                    variant={scoreMethod === 'roll' ? 'default' : 'outline'}
                    onClick={() => changeScoreMethod('roll')}
                    className={cn(
                      scoreMethod === 'roll' && 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    )}
                  >
                    <Dices className="w-4 h-4 mr-2" />
                    Roll 4d6 Drop 1
                  </Button>
                  <Button
                    type="button"
                    variant={scoreMethod === 'manual' ? 'default' : 'outline'}
                    onClick={() => changeScoreMethod('manual')}
                    className={cn(
                      scoreMethod === 'manual' && 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    )}
                  >
                    Manual Entry
                  </Button>
                </div>
              </div>

              {/* Standard Array Method */}
              {scoreMethod === 'standard' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Assign values from the standard array (15, 14, 13, 12, 10, 8) to your abilities.
                  </p>

                  {/* Available Scores */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-sm text-slate-500 mr-2">Available:</span>
                    {availableScores.length > 0 ? (
                      availableScores.map((score, idx) => (
                        <div
                          key={`${score}-${idx}`}
                          className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 font-bold text-sm"
                        >
                          {score}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-green-400">All scores assigned!</span>
                    )}
                  </div>

                  {/* Ability Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScores>).map(
                      (ability) => {
                        const score = abilityScores[ability];
                        const mod = score > 0 ? calculateModifier(score) : 0;
                        const isSavingThrow = savingThrows.includes(ability);
                        const selectOptions = score > 0
                          ? [...availableScores, score].sort((a, b) => b - a)
                          : availableScores;

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
                            <div className="text-3xl font-bold text-white">
                              {score > 0 ? score : '—'}
                            </div>
                            <div
                              className={cn(
                                'text-sm',
                                score === 0
                                  ? 'text-slate-500'
                                  : mod >= 0
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              )}
                            >
                              {score > 0 ? formatModifier(mod) : '—'}
                            </div>
                            <Select
                              value={score > 0 ? score.toString() : undefined}
                              onValueChange={(v) => v && assignStandardScore(ability, parseInt(v))}
                            >
                              <SelectTrigger className="bg-slate-900/50 border-slate-600">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {selectOptions
                                  .filter((s) => s > 0)
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
                </div>
              )}

              {/* Roll Method */}
              {scoreMethod === 'roll' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Roll 4d6 and drop the lowest die for each ability score. Click the button to roll all 6 scores.
                  </p>

                  {/* Roll Button */}
                  <Button
                    type="button"
                    onClick={rollAllAbilities}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Dices className="w-4 h-4 mr-2" />
                    {rolledValues.length > 0 ? 'Reroll All Abilities' : 'Roll All Abilities'}
                  </Button>

                  {/* Rolled Values Display */}
                  {rolledValues.length > 0 && (
                    <>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-sm text-slate-500 mr-2">Rolled values:</span>
                        {rolledValues.map((score, idx) => (
                          <div
                            key={`rolled-${idx}`}
                            className={cn(
                              'px-3 py-1.5 rounded-lg font-bold text-sm',
                              availableRolledScores.includes(score)
                                ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                                : 'bg-slate-700/50 border border-slate-600 text-slate-500 line-through'
                            )}
                          >
                            {score}
                          </div>
                        ))}
                      </div>

                      {/* Available to assign */}
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-sm text-slate-500 mr-2">Available:</span>
                        {availableRolledScores.length > 0 ? (
                          availableRolledScores.map((score, idx) => (
                            <div
                              key={`avail-${idx}`}
                              className="px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 font-bold text-sm"
                            >
                              {score}
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-green-400">All scores assigned!</span>
                        )}
                      </div>

                      {/* Ability Grid for Roll */}
                      <div className="grid grid-cols-3 gap-4">
                        {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScores>).map(
                          (ability) => {
                            const score = abilityScores[ability];
                            const mod = score > 0 ? calculateModifier(score) : 0;
                            const isSavingThrow = savingThrows.includes(ability);
                            const selectOptions = score > 0
                              ? [...availableRolledScores, score].sort((a, b) => b - a)
                              : availableRolledScores;

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
                                <div className="text-3xl font-bold text-white">
                                  {score > 0 ? score : '—'}
                                </div>
                                <div
                                  className={cn(
                                    'text-sm',
                                    score === 0
                                      ? 'text-slate-500'
                                      : mod >= 0
                                      ? 'text-green-400'
                                      : 'text-red-400'
                                  )}
                                >
                                  {score > 0 ? formatModifier(mod) : '—'}
                                </div>
                                <Select
                                  value={score > 0 ? score.toString() : undefined}
                                  onValueChange={(v) => v && assignRolledScore(ability, parseInt(v))}
                                  disabled={selectOptions.length === 0}
                                >
                                  <SelectTrigger className="bg-slate-900/50 border-slate-600">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectOptions
                                      .filter((s) => s > 0)
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
                    </>
                  )}

                  {rolledValues.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      Click &quot;Roll All Abilities&quot; to generate your scores
                    </div>
                  )}
                </div>
              )}

              {/* Manual Entry Method */}
              {scoreMethod === 'manual' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Enter ability scores manually. Valid range: 1-20. Use this for point buy,
                    scores rolled at the table, or any custom method.
                  </p>

                  {/* Ability Grid for Manual */}
                  <div className="grid grid-cols-3 gap-4">
                    {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScores>).map(
                      (ability) => {
                        const score = abilityScores[ability];
                        const mod = score > 0 ? calculateModifier(score) : 0;
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
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={score || ''}
                              onChange={(e) => setManualScore(ability, parseInt(e.target.value) || 0)}
                              className="bg-slate-900/50 border-slate-600 text-center text-2xl font-bold h-12"
                              placeholder="—"
                            />
                            <div
                              className={cn(
                                'text-sm',
                                score === 0
                                  ? 'text-slate-500'
                                  : mod >= 0
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              )}
                            >
                              {score > 0 ? formatModifier(mod) : '—'}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Saving throw note */}
              {playerClass && (
                <p className="text-xs text-slate-500">
                  ★ = Saving throw proficiency for{' '}
                  {classes.find((c) => c.value === playerClass)?.label}
                </p>
              )}

              {/* Validation message */}
              {!canProceed() && (
                <p className="text-sm text-amber-400">
                  Assign all 6 ability scores to continue.
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

              {/* Class Starting Gear - Organized by Category */}
              {playerClass && (
                <div className="space-y-4">
                  <Label>Class Starting Gear</Label>

                  {/* Weapons - Organized by choice groups */}
                  {classWeaponChoices[playerClass]?.length > 0 && (
                    <div className="space-y-2">
                      {classWeaponChoices[playerClass].map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-1">
                          <div className="text-xs text-slate-500">{group.label}</div>
                          <div className="flex flex-wrap gap-1">
                            {group.items.map((item, idx) => (
                              <span
                                key={`${item}-${idx}`}
                                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Armor */}
                  {classArmor[playerClass]?.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">Armor</div>
                      <div className="flex flex-wrap gap-1">
                        {classArmor[playerClass].map((item, idx) => (
                          <span
                            key={`${item}-${idx}`}
                            className="px-2 py-1 bg-blue-900/30 border border-blue-700 rounded text-sm text-blue-300"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Automatic Items (like Spellbook) */}
                  {classSpellcastingFocus[playerClass]?.automatic.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">Automatic Equipment</div>
                      <div className="flex flex-wrap gap-1">
                        {classSpellcastingFocus[playerClass].automatic.map((item, idx) => (
                          <span
                            key={`${item}-${idx}`}
                            className="px-2 py-1 bg-purple-900/30 border border-purple-700 rounded text-sm text-purple-300"
                          >
                            {item}
                            <span className="ml-1 text-xs text-purple-400">✓</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Spellcasting Focus Choice */}
              {playerClass && classSpellcastingFocus[playerClass]?.options.length > 0 && (
                <div className="space-y-2">
                  <Label>
                    {playerClass === 'bard' ? 'Musical Instrument' : 'Spellcasting Focus'}
                  </Label>
                  <Select value={spellcastingFocus} onValueChange={setSpellcastingFocus}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue placeholder="Choose your focus..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classSpellcastingFocus[playerClass].options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {playerClass === 'wizard' && 'Wizards can use their arcane focus or component pouch for spellcasting.'}
                    {playerClass === 'sorcerer' && 'Sorcerers can use their arcane focus or component pouch for spellcasting.'}
                    {playerClass === 'warlock' && 'Warlocks can use their arcane focus or component pouch for spellcasting.'}
                    {playerClass === 'cleric' && 'Clerics use a holy symbol to channel divine magic.'}
                    {playerClass === 'paladin' && 'Paladins use a holy symbol to channel divine magic.'}
                    {playerClass === 'druid' && 'Druids use a druidic focus to channel nature magic.'}
                    {playerClass === 'bard' && 'Bards use a musical instrument as their spellcasting focus.'}
                  </p>
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
                  <EntityTypeahead
                    entities={entities}
                    value={anchorLocation}
                    onChange={setAnchorLocation}
                    entityType="location"
                    placeholder="Search locations..."
                    emptyMessage="No locations found. Create one in the Location Forge."
                  />
                </div>

                {/* Faction Affiliation */}
                <div className="space-y-2">
                  <Label>Faction Affiliation</Label>
                  <EntityTypeahead
                    entities={entities}
                    value={anchorFaction}
                    onChange={setAnchorFaction}
                    entityType="faction"
                    placeholder="Search factions..."
                    emptyMessage="No factions found. Create one in the Faction Forge."
                  />
                </div>

                {/* Known NPC */}
                <div className="space-y-2">
                  <Label>Known NPC</Label>
                  <EntityTypeahead
                    entities={entities}
                    value={anchorNpc}
                    onChange={setAnchorNpc}
                    entityType="npc"
                    placeholder="Search NPCs..."
                    emptyMessage="No NPCs found. Create one in the NPC Forge."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Portrait */}
        {currentStep === 'portrait' && (
          <div className="space-y-6">
            <div className="ca-panel p-6 space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">Bring Your Character to Life</h2>
                <p className="text-slate-400 mt-2">
                  Generate a portrait based on your character&apos;s details, or upload your own.
                </p>
              </div>

              {/* Character Summary for Context */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="font-medium text-white">{name}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {races.find((r) => r.value === race)?.label}{' '}
                  {classes.find((c) => c.value === playerClass)?.label} • Level {level}
                </p>
                {backstory && (
                  <p className="text-sm text-slate-300 mt-2 italic line-clamp-2">
                    &quot;{backstory}&quot;
                  </p>
                )}
              </div>

              {/* Image Input */}
              <ImageInput
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                campaignId={campaignId}
                entityType="player"
                generationPrompt={buildPortraitPrompt()}
                label="Character Portrait"
              />

              {/* Skip Note */}
              <p className="text-center text-sm text-slate-500">
                You can always add or change your portrait later from the character page.
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
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
