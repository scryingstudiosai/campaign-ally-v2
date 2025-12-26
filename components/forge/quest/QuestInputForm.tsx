'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
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

export function QuestInputForm({
  onSubmit,
  isLocked,
  preValidation,
  onProceedAnyway,
  onDismissValidation,
  campaignId,
  initialValues,
}: QuestInputFormProps): JSX.Element {
  // Core fields
  const [name, setName] = useState(initialValues?.name || '');
  const [concept, setConcept] = useState(initialValues?.concept || '');
  const [questType, setQuestType] = useState<QuestSubType>(initialValues?.questType || 'side');
  const [level, setLevel] = useState('1-4');

  // Linked entities
  const [questGiver, setQuestGiver] = useState<Entity | null>(null);
  const [location, setLocation] = useState<Entity | null>(null);
  const [faction, setFaction] = useState<Entity | null>(null);
  const [parentQuest, setParentQuest] = useState<Entity | null>(null);

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
