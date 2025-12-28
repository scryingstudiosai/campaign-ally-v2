'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InteractiveText } from '@/components/forge/InteractiveText';
import { SelectionPopover } from '@/components/forge/SelectionPopover';
import {
  Scroll,
  Brain,
  ListChecks,
  Gift,
  Users,
  Clock,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Lightbulb,
  Map,
  MessageSquare,
  Swords,
} from 'lucide-react';
import type { ScanResult, Discovery } from '@/types/forge';
import type {
  QuestSoul,
  QuestBrain,
  QuestObjective,
  QuestRewards,
  QuestChain,
  QuestMechanics,
  QuestEncounterSeed,
  QuestNpcSeed,
} from '@/types/living-entity';

export interface GeneratedQuest {
  name: string;
  sub_type: string;
  soul: QuestSoul;
  brain: QuestBrain;
  objectives: QuestObjective[];
  rewards: QuestRewards;
  chain: QuestChain;
  mechanics: QuestMechanics;
  encounters: QuestEncounterSeed[];
  npcs: QuestNpcSeed[];
  read_aloud: string;
  dm_slug: string;
}

interface QuestOutputCardProps {
  data: GeneratedQuest;
  campaignId: string;
  scanResult?: ScanResult | null;
  onDiscoveryStatusChange?: (id: string, status: Discovery['status']) => void;
  onManualDiscovery?: (discovery: Partial<Discovery>) => void;
  onLinkExisting?: (discoveryId: string) => void;
  existingEntities?: Array<{ id: string; name: string; entity_type: string }>;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'border-green-600 text-green-400',
  medium: 'border-yellow-600 text-yellow-400',
  hard: 'border-orange-600 text-orange-400',
  deadly: 'border-red-600 text-red-400',
};

const RARITY_COLORS: Record<string, string> = {
  common: 'border-slate-500 text-slate-400',
  uncommon: 'border-green-500 text-green-400',
  rare: 'border-blue-500 text-blue-400',
  'very rare': 'border-purple-500 text-purple-400',
  legendary: 'border-orange-500 text-orange-400',
};

export function QuestOutputCard({
  data,
  campaignId,
  scanResult,
  onDiscoveryStatusChange,
  onManualDiscovery,
  onLinkExisting,
  existingEntities,
}: QuestOutputCardProps): JSX.Element {
  // DM sees all objectives by default in Forge preview
  const [showLocked, setShowLocked] = useState(true);
  const [selection, setSelection] = useState<{
    text: string;
    range: Range;
  } | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Handle text selection
  const handleTextSelect = (text: string, range: Range): void => {
    setSelection({ text, range });
  };

  // Clear selection
  const clearSelection = (): void => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  // Get objective counts
  const requiredObjectives = data.objectives?.filter((o) => o.type === 'required') || [];
  const completedRequired = requiredObjectives.filter((o) => o.state === 'completed').length;

  return (
    <div className="space-y-4" ref={contentRef}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Scroll className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-slate-100">{data.name}</h2>
        </div>

        {/* Chain Position */}
        {data.chain?.chain_position && (
          <div className="mb-2 text-sm text-amber-400">
            {data.chain.arc_name && (
              <span className="text-slate-400">{data.chain.arc_name}: </span>
            )}
            {data.chain.chain_position}
          </div>
        )}
        {data.chain?.previous_quest && (
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" />
            <span>Follows:</span>
            {data.chain.previous_quest_id ? (
              <Link
                href={`/dashboard/campaigns/${campaignId}/memory/${data.chain.previous_quest_id}`}
                className="text-teal-400 hover:text-teal-300 hover:underline"
              >
                {data.chain.previous_quest}
              </Link>
            ) : (
              <span className="text-teal-400">{data.chain.previous_quest}</span>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="border-amber-700 text-amber-400 capitalize"
          >
            {data.mechanics?.quest_type?.replace('_', ' ') || data.sub_type || 'Side Quest'}
          </Badge>
          {data.mechanics?.recommended_level && (
            <Badge variant="outline" className="border-slate-600">
              Level {data.mechanics.recommended_level}
            </Badge>
          )}
          {data.mechanics?.estimated_sessions && (
            <Badge variant="outline" className="border-slate-600">
              ~{data.mechanics.estimated_sessions} sessions
            </Badge>
          )}
          {data.mechanics?.difficulty && (
            <Badge
              variant="outline"
              className={DIFFICULTY_COLORS[data.mechanics.difficulty] || ''}
            >
              {data.mechanics.difficulty}
            </Badge>
          )}
        </div>

        {/* Themes */}
        {data.mechanics?.themes && data.mechanics.themes.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {data.mechanics.themes.map((theme) => (
              <Badge
                key={theme}
                variant="secondary"
                className="text-xs capitalize"
              >
                {theme}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Hook */}
      {data.soul?.hook && (
        <div className="p-4 bg-gradient-to-r from-amber-900/30 to-transparent border-l-4 border-amber-500 rounded-r-lg">
          {scanResult ? (
            <InteractiveText
              text={data.soul.hook}
              scanResult={scanResult}
              campaignId={campaignId}
              onDiscoveryAction={onDiscoveryStatusChange}
            />
          ) : (
            <p className="text-slate-300">{data.soul.hook}</p>
          )}
        </div>
      )}

      {/* DM Slug */}
      {data.dm_slug && (
        <p className="text-sm text-slate-400 italic">
          <span className="text-slate-500">DM Ref:</span> {data.dm_slug}
        </p>
      )}

      {/* Tabs */}
      <Tabs defaultValue="objectives" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="objectives" className="flex items-center gap-1">
            <ListChecks className="w-4 h-4" />
            <span className="hidden sm:inline">Objectives</span>
          </TabsTrigger>
          <TabsTrigger value="soul" className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Story</span>
          </TabsTrigger>
          <TabsTrigger value="brain" className="flex items-center gap-1">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">DM Info</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-1">
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="encounters" className="flex items-center gap-1">
            <Swords className="w-4 h-4" />
            <span className="hidden sm:inline">Encounters</span>
          </TabsTrigger>
        </TabsList>

        {/* OBJECTIVES TAB */}
        <TabsContent value="objectives" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-slate-400">
              {completedRequired} / {requiredObjectives.length} required complete
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLocked(!showLocked)}
              className="text-slate-400"
            >
              {showLocked ? (
                <Eye className="w-4 h-4 mr-1" />
              ) : (
                <EyeOff className="w-4 h-4 mr-1" />
              )}
              {showLocked ? 'All Visible' : 'Player View'}
            </Button>
          </div>

          <div className="space-y-2">
            {data.objectives?.map((obj, i) => {
              // Hide locked objectives unless toggled
              if (obj.state === 'locked' && !showLocked) {
                return (
                  <div
                    key={obj.id || i}
                    className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-600 blur-sm select-none">
                        Hidden Objective
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={obj.id || i}
                  className={`p-3 rounded-lg border transition-all ${
                    obj.state === 'completed'
                      ? 'bg-green-900/20 border-green-700/50 opacity-75'
                      : obj.state === 'failed'
                      ? 'bg-red-900/20 border-red-700/50 opacity-75'
                      : obj.state === 'locked'
                      ? 'bg-slate-900/50 border-slate-700/50'
                      : obj.type === 'hidden'
                      ? 'bg-purple-900/20 border-purple-700/50'
                      : obj.type === 'optional'
                      ? 'bg-slate-800/50 border-slate-700'
                      : 'bg-slate-800 border-teal-700/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {obj.state === 'locked' ? (
                      <Lock className="w-5 h-5 text-slate-600 mt-0.5" />
                    ) : (
                      <Checkbox
                        checked={obj.state === 'completed'}
                        disabled
                        className="mt-0.5"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-medium ${
                            obj.state === 'completed'
                              ? 'text-green-400 line-through'
                              : obj.state === 'failed'
                              ? 'text-red-400 line-through'
                              : obj.state === 'locked'
                              ? 'text-slate-500'
                              : 'text-slate-200'
                          }`}
                        >
                          {obj.title}
                        </span>

                        {obj.type === 'optional' && (
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        )}
                        {obj.type === 'hidden' && (
                          <Badge
                            variant="outline"
                            className="text-xs text-purple-400 border-purple-600"
                          >
                            Hidden
                          </Badge>
                        )}
                        {obj.state === 'locked' && (
                          <Badge
                            variant="outline"
                            className="text-xs text-slate-500 border-slate-600"
                          >
                            Locked
                          </Badge>
                        )}
                      </div>

                      <p
                        className={`text-sm mt-1 ${
                          obj.state === 'locked' ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        {scanResult ? (
                          <InteractiveText
                            text={obj.description}
                            scanResult={scanResult}
                            campaignId={campaignId}
                            onDiscoveryAction={onDiscoveryStatusChange}
                          />
                        ) : (
                          obj.description
                        )}
                      </p>

                      {obj.state === 'locked' && obj.unlock_condition && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Unlocks: {obj.unlock_condition}
                        </p>
                      )}

                      {obj.hints && obj.hints.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                          <Lightbulb className="w-3 h-3 inline mr-1" />
                          Hints: {obj.hints.join(' | ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* SOUL (Story) TAB */}
        <TabsContent value="soul" className="mt-4 space-y-4">
          {data.soul?.summary && (
            <div className="p-4 bg-slate-800 rounded-lg">
              <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Quest Summary
              </h4>
              <p className="text-slate-300">
                {scanResult ? (
                  <InteractiveText
                    text={data.soul.summary}
                    scanResult={scanResult}
                    campaignId={campaignId}
                    onDiscoveryAction={onDiscoveryStatusChange}
                  />
                ) : (
                  data.soul.summary
                )}
              </p>
            </div>
          )}

          {data.soul?.stakes && (
            <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Stakes
              </h4>
              <p className="text-slate-300">{data.soul.stakes}</p>
            </div>
          )}

          {data.soul?.timeline && (
            <div className="p-3 bg-slate-800 rounded-lg">
              <h4 className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </h4>
              <p className="text-slate-300 capitalize">
                {data.soul.timeline.replace('_', ' ')}
              </p>
            </div>
          )}

          {data.read_aloud && (
            <div className="p-4 bg-gradient-to-r from-teal-900/30 to-transparent border-l-4 border-teal-500 rounded-r-lg">
              <h4 className="text-xs text-teal-400 mb-2 uppercase font-medium">
                Read Aloud
              </h4>
              <p className="text-slate-300 italic">{data.read_aloud}</p>
            </div>
          )}
        </TabsContent>

        {/* BRAIN (DM Info) TAB */}
        <TabsContent value="brain" className="mt-4 space-y-4">
          {data.brain?.background && (
            <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                True Background
              </h4>
              <p className="text-slate-300">
                {scanResult ? (
                  <InteractiveText
                    text={data.brain.background}
                    scanResult={scanResult}
                    campaignId={campaignId}
                    onDiscoveryAction={onDiscoveryStatusChange}
                  />
                ) : (
                  data.brain.background
                )}
              </p>
            </div>
          )}

          {data.brain?.twists && data.brain.twists.length > 0 && (
            <div className="p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Possible Twists
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {data.brain.twists.map((twist, i) => (
                  <li key={i} className="text-slate-300 text-sm">
                    {twist}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.brain?.secret && (
            <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Secret
              </h4>
              <p className="text-slate-300">{data.brain.secret}</p>
            </div>
          )}

          {data.brain?.failure_consequences && (
            <div className="p-4 bg-slate-800 rounded-lg">
              <h4 className="text-sm font-medium text-slate-400 mb-2">
                Failure Consequences
              </h4>
              <p className="text-slate-300">{data.brain.failure_consequences}</p>
            </div>
          )}

          {data.brain?.success_variations && data.brain.success_variations.length > 0 && (
            <div className="p-4 bg-slate-800 rounded-lg">
              <h4 className="text-sm font-medium text-slate-400 mb-2">
                Success Variations
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {data.brain.success_variations.map((variation, i) => (
                  <li key={i} className="text-slate-300 text-sm">
                    {variation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.brain?.dm_notes && (
            <div className="p-4 bg-slate-800 rounded-lg">
              <h4 className="text-sm font-medium text-slate-400 mb-2">DM Notes</h4>
              <p className="text-slate-300">{data.brain.dm_notes}</p>
            </div>
          )}
        </TabsContent>

        {/* REWARDS TAB */}
        <TabsContent value="rewards" className="mt-4 space-y-4">
          {/* XP and Gold */}
          <div className="grid grid-cols-2 gap-4">
            {(data.rewards?.xp ?? 0) > 0 && (
              <div className="p-3 bg-slate-800 rounded-lg">
                <h4 className="text-xs text-slate-500">Experience</h4>
                <p className="text-xl font-bold text-amber-400">
                  {data.rewards?.xp} XP
                </p>
              </div>
            )}
            {data.rewards?.gold && (
              <div className="p-3 bg-slate-800 rounded-lg">
                <h4 className="text-xs text-slate-500">Gold</h4>
                <p className="text-xl font-bold text-amber-400">
                  {data.rewards.gold} gp
                </p>
              </div>
            )}
          </div>

          {/* Item Rewards - Auto-added on save */}
          {data.rewards?.items && data.rewards.items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">
                Item Rewards
              </h4>
              <div className="space-y-2">
                {data.rewards.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-800 rounded-lg flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-purple-400" />
                      <div>
                        <span className="text-slate-200 font-medium">
                          {item.name}
                        </span>
                        {item.rarity && (
                          <Badge
                            variant="outline"
                            className={`ml-2 text-xs capitalize ${
                              RARITY_COLORS[item.rarity] || ''
                            }`}
                          >
                            {item.rarity}
                          </Badge>
                        )}
                        {item.type && (
                          <span className="text-xs text-slate-500 ml-2 capitalize">
                            {item.type}
                          </span>
                        )}
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Auto-added indicator */}
                    <span className="text-xs text-teal-400">
                      Added on save
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Item rewards will be added to the quest&apos;s inventory when saved.
                You can then transfer them to players when the quest is completed.
              </p>
            </div>
          )}

          {/* Reputation */}
          {data.rewards?.reputation && data.rewards.reputation.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">
                Reputation Changes
              </h4>
              <div className="flex gap-2 flex-wrap">
                {data.rewards.reputation.map((rep, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={
                      rep.change?.startsWith('+')
                        ? 'border-green-600 text-green-400'
                        : 'border-red-600 text-red-400'
                    }
                  >
                    {rep.faction}: {rep.change}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Special Reward */}
          {data.rewards?.special && (
            <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-400 mb-1">
                Special Reward
              </h4>
              <p className="text-slate-300">{data.rewards.special}</p>
            </div>
          )}
        </TabsContent>

        {/* ENCOUNTERS TAB */}
        <TabsContent value="encounters" className="mt-4 space-y-4">
          {data.encounters && data.encounters.length > 0 ? (
            <div className="space-y-3">
              {data.encounters.map((enc, i) => (
                <div key={i} className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-slate-200 font-medium flex items-center gap-2">
                      <Swords className="w-4 h-4 text-red-400" />
                      {enc.name}
                    </h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {enc.type}
                      </Badge>
                      {enc.difficulty && (
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${
                            DIFFICULTY_COLORS[enc.difficulty] || ''
                          }`}
                        >
                          {enc.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{enc.description}</p>
                  {enc.objective_id && (
                    <p className="text-xs text-teal-400">
                      <Target className="w-3 h-3 inline mr-1" />
                      Tied to objective: {enc.objective_id}
                    </p>
                  )}
                  {enc.creatures && enc.creatures.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {enc.creatures.map((creature, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">
                          {creature}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">
              No encounters defined for this quest
            </p>
          )}

          {/* NPCs */}
          {data.npcs && data.npcs.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2 mt-6">
                <Users className="w-4 h-4" />
                Key NPCs
              </h4>
              <div className="space-y-2">
                {data.npcs.map((npc, i) => (
                  <div key={i} className="p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-medium">{npc.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {npc.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{npc.brief}</p>
                    {npc.objective_id && (
                      <p className="text-xs text-teal-400 mt-1">
                        <Target className="w-3 h-3 inline mr-1" />
                        Objective: {npc.objective_id}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Next Quest Hook */}
      {data.chain?.next_quest_hook && (
        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
          <h4 className="text-sm font-medium text-amber-400 mb-1 flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Leads To...
          </h4>
          <p className="text-slate-300">{data.chain.next_quest_hook}</p>
        </div>
      )}

      {/* Selection Popover */}
      {/* Selection Popover for manual entity discovery */}
      <SelectionPopover
        containerRef={contentRef}
        onCreateDiscovery={(text, type) => {
          if (onManualDiscovery) {
            onManualDiscovery({
              text,
              suggestedType: type as 'npc' | 'location' | 'item' | 'faction' | 'quest' | 'creature' | 'encounter',
              status: 'pending',
            });
          }
        }}
        onSearchExisting={(text) => {
          // Selection popover handles searching, onLinkExisting is called when an entity is selected
          if (onLinkExisting) {
            onLinkExisting(text);
          }
        }}
        existingEntities={existingEntities?.map(e => ({ id: e.id, name: e.name, type: e.entity_type }))}
      />
    </div>
  );
}
