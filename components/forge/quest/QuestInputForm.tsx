'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Sparkles,
  Dices,
  Scroll,
  User,
  MapPin,
  Flag,
  Link2,
  X,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { PreValidationResult, BaseForgeInput } from '@/types/forge';
import type { QuestSubType } from '@/types/living-entity';
import { PreValidationAlert } from '@/components/forge/PreValidationAlert';
import { QuickReference } from '@/components/forge/QuickReference';
import { QUEST_TYPES, LEVEL_TIERS, QUEST_THEMES } from '@/lib/forge/prompts/quest-prompts';

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  summary?: string;
  dm_slug?: string;
}

// Chain context for sequel quests - anchored to the first quest in the chain
export interface ChainContext {
  arc_id: string;         // UUID of the first quest (anchor)
  arc_name: string;       // Story arc name - inherited, never changes
  chain_position: string; // "Part 2 of 3"
  parent_quest_id: string;
  parent_quest_name: string;
}

// Arc planning for new arcs (Part 1)
export interface ArcPlanning {
  arc_name: string | null;  // User-provided or AI-generated
  total_parts: number;
  current_part: number;
  arc_beat: string;
  arc_beat_description: string;
}

export interface QuestInputData extends BaseForgeInput {
  name?: string;
  questType: QuestSubType;
  concept: string;
  questGiverId?: string;
  questGiverName?: string;
  locationId?: string;
  locationName?: string;
  factionId?: string;
  factionName?: string;
  level?: string;
  parentQuestId?: string;
  parentQuestName?: string;
  referencedEntityIds?: string[];
  chainContext?: ChainContext; // Arc info for sequel quests
  arcPlanning?: ArcPlanning;   // Arc planning for new arcs
}

interface QuestInputFormProps {
  onSubmit: (data: QuestInputData) => void;
  isLocked: boolean;
  preValidation?: PreValidationResult | null;
  onProceedAnyway?: () => void;
  onDismissValidation?: () => void;
  campaignId: string;
  initialValues?: {
    name?: string;
    concept?: string;
    questType?: QuestSubType;
  };
}

const CONCEPT_SEEDS = [
  'A noble\'s daughter has gone missing',
  'Strange lights in the abandoned mine',
  'The village well has been poisoned',
  'A merchant needs protection on the road',
  'The old temple is waking up',
  'Someone is stealing from the guild',
  'A prophetic dream warns of danger',
  'The local lord is hiding something',
  'Ancient ruins emerged from the sand',
  'A monster hunt with a twist',
  'Two factions near open war',
  'A curse spreading through town',
  'The dead aren\'t staying buried',
  'A heist to recover stolen artifacts',
  'Escort a prisoner to justice',
];

// Helper functions for arc structure
function getArcBeatName(part: number, total: number): string {
  if (total === 3) {
    return ['Setup', 'Confrontation', 'Resolution'][part - 1] || `Part ${part}`;
  }
  if (total === 5) {
    return ['Exposition', 'Rising Action', 'Climax', 'Falling Action', 'Resolution'][part - 1] || `Part ${part}`;
  }
  // Generic for custom
  if (part === 1) return 'Beginning';
  if (part === total) return 'Finale';
  if (part === Math.ceil(total / 2)) return 'Midpoint';
  return `Part ${part}`;
}

function getArcBeatDescription(part: number, total: number): string {
  if (total === 3) {
    const descriptions = [
      'Introduce the conflict, establish stakes, and hook the players into the story.',
      'Escalate the conflict, introduce complications, and raise the stakes dramatically.',
      'Bring the story to its climax and provide a satisfying resolution.',
    ];
    return descriptions[part - 1] || '';
  }
  if (total === 5) {
    const descriptions = [
      'Introduce characters, setting, and plant the seeds of conflict.',
      'Complications arise as heroes pursue their goal. Stakes increase.',
      'The turning point — highest tension, major confrontation or revelation.',
      'Consequences of the climax unfold. The path to resolution becomes clear.',
      'Final confrontation and conclusion. Resolve the central conflict.',
    ];
    return descriptions[part - 1] || '';
  }
  // Generic
  const percentage = part / total;
  if (percentage <= 0.2) return 'Early arc — focus on setup and introducing the conflict.';
  if (percentage <= 0.4) return 'Rising action — escalate stakes and introduce complications.';
  if (percentage <= 0.6) return 'Midpoint — major turning point or revelation.';
  if (percentage <= 0.8) return 'Falling action — consequences unfold, building to finale.';
  return 'Resolution — bring the arc to a satisfying conclusion.';
}

function parsePosition(position: string): { part: number; total: number } {
  const match = position?.match(/Part (\d+) of (\d+)/);
  if (match) {
    return { part: parseInt(match[1]), total: parseInt(match[2]) };
  }
  return { part: 1, total: 3 };
}

export function QuestInputForm({
  onSubmit,
  isLocked,
  preValidation,
  onProceedAnyway,
  onDismissValidation,
  campaignId,
  initialValues,
}: QuestInputFormProps): JSX.Element {
  const searchParams = useSearchParams();

  // Check for sequel params from URL
  const urlParentQuestId = searchParams.get('parentQuestId');
  const urlParentQuestName = searchParams.get('parentQuestName');
  const urlConcept = searchParams.get('concept');
  const urlChainPosition = searchParams.get('chainPosition');
  // Arc info - anchored to the first quest in the chain
  const urlArcId = searchParams.get('arcId');
  const urlArcName = searchParams.get('arcName');

  // Determine if we're in sequel mode
  const isSequelMode = Boolean(urlParentQuestId && urlParentQuestName);

  // Build chain context from URL params if this is a sequel
  const chainContext: ChainContext | undefined = isSequelMode && urlParentQuestId && urlParentQuestName
    ? {
        arc_id: urlArcId || urlParentQuestId, // Default to parent if no arc_id
        arc_name: urlArcName || urlParentQuestName, // Default to parent name if no arc_name
        chain_position: urlChainPosition || 'Part 2 of ?',
        parent_quest_id: urlParentQuestId,
        parent_quest_name: urlParentQuestName,
      }
    : undefined;

  // Core fields - pre-fill from URL params if in sequel mode
  const [name, setName] = useState(() => {
    // Don't pre-fill name for sequels - let AI create a unique title
    // The arc name and position are tracked separately in chainContext
    return initialValues?.name || '';
  });
  const [concept, setConcept] = useState(() => {
    if (isSequelMode && urlConcept) {
      return urlConcept;
    }
    return initialValues?.concept || '';
  });
  const [questType, setQuestType] = useState<QuestSubType>(() => {
    // If sequel mode, default to main quest (sequels are usually main quests)
    if (isSequelMode) return 'main';
    return initialValues?.questType || 'side';
  });
  const [level, setLevel] = useState('1-4');

  // Linked entities
  const [questGiver, setQuestGiver] = useState<Entity | null>(null);
  const [location, setLocation] = useState<Entity | null>(null);
  const [faction, setFaction] = useState<Entity | null>(null);
  const [parentQuest, setParentQuest] = useState<Entity | null>(() => {
    // Pre-fill parent quest from URL if in sequel mode
    if (isSequelMode && urlParentQuestId && urlParentQuestName) {
      return {
        id: urlParentQuestId,
        name: urlParentQuestName,
        entity_type: 'quest',
      };
    }
    return null;
  });

  // Entity search
  const [npcs, setNpcs] = useState<Entity[]>([]);
  const [locations, setLocations] = useState<Entity[]>([]);
  const [factions, setFactions] = useState<Entity[]>([]);
  const [quests, setQuests] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);

  // Search filters
  const [npcSearch, setNpcSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [factionSearch, setFactionSearch] = useState('');
  const [questSearch, setQuestSearch] = useState('');

  // Context tracking
  const [referencedEntities, setReferencedEntities] = useState<{ id: string; name: string }[]>([]);

  // Arc planning state (for new arcs, not sequels)
  const [isPartOfArc, setIsPartOfArc] = useState(false);
  const [arcName, setArcName] = useState('');
  const [arcStructure, setArcStructure] = useState<'3' | '5' | 'custom'>('3');
  const [customParts, setCustomParts] = useState(3);
  const [isGeneratingArcName, setIsGeneratingArcName] = useState(false);

  // Generate arc name from AI
  const handleGenerateArcName = async (): Promise<void> => {
    if (!concept) return;

    setIsGeneratingArcName(true);
    try {
      const response = await fetch('/api/generate/arc-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept }),
      });

      if (response.ok) {
        const data = await response.json();
        setArcName(data.arcName);
      }
    } catch (error) {
      console.error('Failed to generate arc name:', error);
    } finally {
      setIsGeneratingArcName(false);
    }
  };

  // Fetch entities
  useEffect(() => {
    const fetchEntities = async (): Promise<void> => {
      try {
        const supabase = createClient();

        const [npcRes, locRes, facRes, questRes] = await Promise.all([
          supabase
            .from('entities')
            .select('id, name, entity_type, summary, dm_slug')
            .eq('campaign_id', campaignId)
            .eq('entity_type', 'npc')
            .is('deleted_at', null)
            .order('name'),
          supabase
            .from('entities')
            .select('id, name, entity_type, summary, dm_slug')
            .eq('campaign_id', campaignId)
            .eq('entity_type', 'location')
            .is('deleted_at', null)
            .order('name'),
          supabase
            .from('entities')
            .select('id, name, entity_type, summary, dm_slug')
            .eq('campaign_id', campaignId)
            .eq('entity_type', 'faction')
            .is('deleted_at', null)
            .order('name'),
          supabase
            .from('entities')
            .select('id, name, entity_type, summary, dm_slug')
            .eq('campaign_id', campaignId)
            .eq('entity_type', 'quest')
            .is('deleted_at', null)
            .order('name'),
        ]);

        setNpcs(npcRes.data || []);
        setLocations(locRes.data || []);
        setFactions(facRes.data || []);
        setQuests(questRes.data || []);
      } catch (error) {
        console.error('Failed to fetch entities:', error);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [campaignId]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!concept.trim()) return;

    // Calculate arc planning info if starting a new arc
    const totalParts = arcStructure === 'custom' ? customParts : parseInt(arcStructure);
    const arcPlanningData: ArcPlanning | undefined = isPartOfArc && !isSequelMode
      ? {
          arc_name: arcName.trim() || null,
          total_parts: totalParts,
          current_part: 1,
          arc_beat: getArcBeatName(1, totalParts),
          arc_beat_description: getArcBeatDescription(1, totalParts),
        }
      : undefined;

    onSubmit({
      name: name.trim() || undefined,
      questType,
      concept: concept.trim(),
      questGiverId: questGiver?.id,
      questGiverName: questGiver?.name,
      locationId: location?.id,
      locationName: location?.name,
      factionId: faction?.id,
      factionName: faction?.name,
      level,
      parentQuestId: parentQuest?.id,
      parentQuestName: parentQuest?.name,
      referencedEntityIds: referencedEntities.map((e) => e.id),
      chainContext, // Include arc info for sequel quests
      arcPlanning: arcPlanningData, // Include arc planning for new arcs
    });
  };

  const randomizeConcept = (): void => {
    const randomSeed = CONCEPT_SEEDS[Math.floor(Math.random() * CONCEPT_SEEDS.length)];
    setConcept(randomSeed);
  };

  // Filter entities based on search
  const filteredNpcs = npcs.filter((n) =>
    n.name.toLowerCase().includes(npcSearch.toLowerCase())
  );
  const filteredLocations = locations.filter((l) =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );
  const filteredFactions = factions.filter((f) =>
    f.name.toLowerCase().includes(factionSearch.toLowerCase())
  );
  const filteredQuests = quests.filter((q) =>
    q.name.toLowerCase().includes(questSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pre-validation Alert */}
      {preValidation && !preValidation.canProceed && (
        <PreValidationAlert
          result={preValidation}
          onProceedAnyway={onProceedAnyway || (() => {})}
          onDismiss={onDismissValidation || (() => {})}
        />
      )}

      {/* Sequel Mode Banner */}
      {isSequelMode && chainContext && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
            <Link2 className="w-4 h-4" />
            <span>Forging Sequel</span>
          </div>
          {/* Arc Breadcrumb */}
          <div className="flex items-center gap-1 text-sm mb-2">
            <span className="text-amber-400">{chainContext.arc_name}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-400">{chainContext.chain_position}</span>
          </div>
          <p className="text-sm text-slate-300">
            Continuing from: <span className="text-cyan-400">{urlParentQuestName}</span>
          </p>
          {urlConcept && (
            <p className="text-xs text-slate-400 mt-1 italic">
              Hook: &quot;{urlConcept.substring(0, 100)}{urlConcept.length > 100 ? '...' : ''}&quot;
            </p>
          )}
        </div>
      )}

      {/* Quest Name (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="name">Quest Name (Optional)</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Let AI decide..."
          disabled={isLocked}
        />
        <p className="text-xs text-slate-500">Leave blank to let the AI create a name</p>
      </div>

      {/* Quest Type */}
      <div className="space-y-2">
        <Label>Quest Type</Label>
        <Select value={questType} onValueChange={(v) => setQuestType(v as QuestSubType)} disabled={isLocked}>
          <SelectTrigger>
            <SelectValue placeholder="Select quest type..." />
          </SelectTrigger>
          <SelectContent>
            {QUEST_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <span>{type.label}</span>
                  <span className="text-xs text-slate-500">- {type.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quest Chain (for main quests) */}
      {questType === 'main' && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Part of Quest Chain? (Optional)
          </Label>
          <div className="relative">
            <Input
              value={questSearch}
              onChange={(e) => setQuestSearch(e.target.value)}
              placeholder="Search for preceding quest..."
              disabled={isLocked}
            />
            {questSearch && filteredQuests.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredQuests.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-slate-700 text-sm"
                    onClick={() => {
                      setParentQuest(q);
                      setQuestSearch('');
                    }}
                  >
                    <span className="text-slate-200">{q.name}</span>
                    {q.dm_slug && (
                      <span className="text-xs text-slate-500 ml-2">{q.dm_slug}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {parentQuest && (
            <div className="p-2 bg-amber-900/20 border border-amber-700/50 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-amber-400">Sequel to: </span>
                <span className="text-slate-200">{parentQuest.name}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setParentQuest(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Recommended Level */}
      <div className="space-y-2">
        <Label>Recommended Level</Label>
        <Select value={level} onValueChange={setLevel} disabled={isLocked}>
          <SelectTrigger>
            <SelectValue placeholder="Select level tier..." />
          </SelectTrigger>
          <SelectContent>
            {LEVEL_TIERS.map((tier) => (
              <SelectItem key={tier.value} value={tier.value}>
                <div className="flex items-center gap-2">
                  <span>{tier.label}</span>
                  <span className="text-xs text-slate-500">- {tier.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quest Giver */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Quest Giver (Optional)
        </Label>
        <div className="relative">
          <Input
            value={npcSearch}
            onChange={(e) => setNpcSearch(e.target.value)}
            placeholder="Search NPCs..."
            disabled={isLocked || loadingEntities}
          />
          {npcSearch && filteredNpcs.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredNpcs.map((npc) => (
                <button
                  key={npc.id}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-slate-700 text-sm"
                  onClick={() => {
                    setQuestGiver(npc);
                    setNpcSearch('');
                  }}
                >
                  <span className="text-slate-200">{npc.name}</span>
                  {npc.dm_slug && (
                    <span className="text-xs text-slate-500 ml-2">{npc.dm_slug}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {questGiver && (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <User className="w-3 h-3" />
            {questGiver.name}
            <button type="button" onClick={() => setQuestGiver(null)}>
              <X className="w-3 h-3 ml-1" />
            </button>
          </Badge>
        )}
      </div>

      {/* Primary Location */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Primary Location (Optional)
        </Label>
        <div className="relative">
          <Input
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            placeholder="Search locations..."
            disabled={isLocked || loadingEntities}
          />
          {locationSearch && filteredLocations.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-slate-700 text-sm"
                  onClick={() => {
                    setLocation(loc);
                    setLocationSearch('');
                  }}
                >
                  <span className="text-slate-200">{loc.name}</span>
                  {loc.dm_slug && (
                    <span className="text-xs text-slate-500 ml-2">{loc.dm_slug}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {location && (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <MapPin className="w-3 h-3" />
            {location.name}
            <button type="button" onClick={() => setLocation(null)}>
              <X className="w-3 h-3 ml-1" />
            </button>
          </Badge>
        )}
      </div>

      {/* Related Faction */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Flag className="w-4 h-4" />
          Related Faction (Optional)
        </Label>
        <div className="relative">
          <Input
            value={factionSearch}
            onChange={(e) => setFactionSearch(e.target.value)}
            placeholder="Search factions..."
            disabled={isLocked || loadingEntities}
          />
          {factionSearch && filteredFactions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredFactions.map((fac) => (
                <button
                  key={fac.id}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-slate-700 text-sm"
                  onClick={() => {
                    setFaction(fac);
                    setFactionSearch('');
                  }}
                >
                  <span className="text-slate-200">{fac.name}</span>
                  {fac.dm_slug && (
                    <span className="text-xs text-slate-500 ml-2">{fac.dm_slug}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {faction && (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Flag className="w-3 h-3" />
            {faction.name}
            <button type="button" onClick={() => setFaction(null)}>
              <X className="w-3 h-3 ml-1" />
            </button>
          </Badge>
        )}
      </div>

      {/* Concept */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="concept">Quest Concept *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={randomizeConcept}
            disabled={isLocked}
          >
            <Dices className="w-4 h-4 mr-1" />
            Inspire Me
          </Button>
        </div>
        <Textarea
          id="concept"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="A noble's daughter has gone missing..."
          rows={4}
          disabled={isLocked}
          className="resize-none"
        />
        <p className="text-xs text-slate-500">
          Describe the core idea, hook, or situation for this quest
        </p>
      </div>

      {/* Arc Structure Planning - Only show when starting new arc (not sequel) */}
      {!isSequelMode && (
        <div className="space-y-4 p-4 border border-amber-700/30 bg-amber-950/10 rounded-lg">
          <h3 className="text-amber-400 font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Story Arc Planning
          </h3>

          <div className="flex items-center gap-2">
            <Switch
              checked={isPartOfArc}
              onCheckedChange={setIsPartOfArc}
              disabled={isLocked}
            />
            <Label>This quest starts a story arc</Label>
          </div>

          {isPartOfArc && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              {/* Arc Name with Generate Button */}
              <div>
                <Label>Arc Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={arcName}
                    onChange={(e) => setArcName(e.target.value)}
                    placeholder="The Dragon's Conspiracy, The Lost Kingdom..."
                    className="bg-slate-900/50 border-slate-700 flex-1"
                    disabled={isLocked}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateArcName}
                    disabled={isGeneratingArcName || !concept || isLocked}
                    className="border-amber-700 text-amber-400 hover:bg-amber-900/20"
                    title={!concept ? 'Enter a quest concept first' : 'Generate arc name'}
                  >
                    {isGeneratingArcName ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  This name will carry through all quests in the arc
                </p>
              </div>

              {/* Arc Structure */}
              <div>
                <Label>Arc Structure</Label>
                <Select
                  value={arcStructure}
                  onValueChange={(v) => setArcStructure(v as '3' | '5' | 'custom')}
                  disabled={isLocked}
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">3-Act Structure</span>
                        <span className="text-xs text-slate-500">Setup → Confrontation → Resolution</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="5">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">5-Act Structure</span>
                        <span className="text-xs text-slate-500">Exposition → Rising → Climax → Falling → Resolution</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Custom Length</span>
                        <span className="text-xs text-slate-500">Choose your own number of parts</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Parts Input */}
              {arcStructure === 'custom' && (
                <div>
                  <Label>Number of Parts</Label>
                  <Input
                    type="number"
                    min={2}
                    max={10}
                    value={customParts}
                    onChange={(e) => setCustomParts(Math.max(2, Math.min(10, parseInt(e.target.value) || 3)))}
                    className="bg-slate-900/50 border-slate-700 w-24"
                    disabled={isLocked}
                  />
                </div>
              )}

              {/* Arc Beat Preview */}
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">This quest will be:</p>
                <p className="text-amber-400 font-medium">
                  Part 1 of {arcStructure === 'custom' ? customParts : arcStructure} — {getArcBeatName(1, arcStructure === 'custom' ? customParts : parseInt(arcStructure))}
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  {getArcBeatDescription(1, arcStructure === 'custom' ? customParts : parseInt(arcStructure))}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* For sequels, show inherited arc info (read-only) */}
      {isSequelMode && chainContext && (
        <div className="p-4 border border-amber-700/30 bg-amber-950/10 rounded-lg">
          <h3 className="text-amber-400 font-medium flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4" />
            Continuing Story Arc
          </h3>
          <p className="text-slate-200 font-medium">{chainContext.arc_name}</p>
          <p className="text-amber-400 text-sm mt-1">{chainContext.chain_position}</p>
          <p className="text-sm text-slate-400 mt-2">
            {getArcBeatDescription(
              parsePosition(chainContext.chain_position).part,
              parsePosition(chainContext.chain_position).total
            )}
          </p>
        </div>
      )}

      {/* Quick Reference */}
      <QuickReference
        campaignId={campaignId}
        onSelect={(name, entityId) => {
          if (!referencedEntities.find((e) => e.id === entityId)) {
            setReferencedEntities([...referencedEntities, { id: entityId, name }]);
          }
        }}
      />

      {/* Referenced Entities */}
      {referencedEntities.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Context Injected:</Label>
          <div className="flex flex-wrap gap-2">
            {referencedEntities.map((e) => (
              <Badge key={e.id} variant="outline" className="flex items-center gap-1">
                {e.name}
                <button
                  type="button"
                  onClick={() =>
                    setReferencedEntities(referencedEntities.filter((r) => r.id !== e.id))
                  }
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-amber-600 hover:bg-amber-700"
        disabled={isLocked || !concept.trim()}
      >
        {isLocked ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Forging Quest...
          </>
        ) : (
          <>
            <Scroll className="w-4 h-4 mr-2" />
            Forge Quest
          </>
        )}
      </Button>
    </form>
  );
}
