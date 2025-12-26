'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

// Forge foundation imports
import { useForge } from '@/hooks/useForge';
import { ForgeShell } from '@/components/forge/ForgeShell';
import { CommitPanel } from '@/components/forge/CommitPanel';
import { EmptyForgeState } from '@/components/forge/EmptyForgeState';
import { extractTextForScanning } from '@/lib/forge/validation/post-gen';
import type { Discovery, Conflict, EntityType } from '@/types/forge';

// Quest-specific components
import {
  QuestInputForm,
  QuestOutputCard,
  type QuestInputData,
  type GeneratedQuest,
} from '@/components/forge/quest';

interface StubContext {
  stubId: string;
  name: string;
  entityType: string;
  sourceEntityId?: string;
  sourceEntityName?: string;
  snippet?: string;
  suggestedTraits?: string[];
}

export default function QuestForgePage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = params.id as string;
  const supabase = createClient();

  // Parse URL params
  const stubId = searchParams.get('stubId');
  const stubName = searchParams.get('name');
  const contextRaw = searchParams.get('context');

  // Parse context
  const parsedContext = contextRaw ? JSON.parse(contextRaw) : null;
  const stubContext: StubContext | null = stubId && parsedContext ? parsedContext : null;

  // Campaign state
  const [campaignName, setCampaignName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Local state for managing discoveries/conflicts during review
  const [reviewDiscoveries, setReviewDiscoveries] = useState<Discovery[]>([]);
  const [reviewConflicts, setReviewConflicts] = useState<Conflict[]>([]);

  // All entities for linking
  const [allEntities, setAllEntities] = useState<
    Array<{ id: string; name: string; type: string; sub_type?: string }>
  >([]);

  // Store referenced entities at generation time for use during commit
  const [generationReferencedEntities, setGenerationReferencedEntities] = useState<
    { id: string; name: string; type?: string; sub_type?: string }[]
  >([]);

  // The forge hook
  const forge = useForge<QuestInputData, GeneratedQuest>({
    campaignId,
    forgeType: 'quest',
    stubId: stubId || undefined,
    generateFn: async (input) => {
      const response = await fetch('/api/generate/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          inputs: {
            name: input.name,
            questType: input.questType,
            concept: input.concept,
            questGiverId: input.questGiverId,
            questGiverName: input.questGiverName,
            locationId: input.locationId,
            locationName: input.locationName,
            factionId: input.factionId,
            factionName: input.factionName,
            level: input.level,
            parentQuestId: input.parentQuestId,
            parentQuestName: input.parentQuestName,
            referencedEntityIds: input.referencedEntityIds,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      return data.quest;
    },
    getTextContent: (output) => {
      // Extract all text fields for entity scanning
      const fields: Record<string, unknown> = {};

      if (output.name) fields.name = output.name;
      if (output.dm_slug) fields.dm_slug = output.dm_slug;
      if (output.read_aloud) fields.read_aloud = output.read_aloud;

      // Soul
      if (output.soul) {
        if (output.soul.title) fields.title = output.soul.title;
        if (output.soul.hook) fields.hook = output.soul.hook;
        if (output.soul.summary) fields.summary = output.soul.summary;
        if (output.soul.stakes) fields.stakes = output.soul.stakes;
      }

      // Brain
      if (output.brain) {
        if (output.brain.background) fields.background = output.brain.background;
        if (output.brain.secret) fields.secret = output.brain.secret;
        if (output.brain.failure_consequences) fields.failure_consequences = output.brain.failure_consequences;
        if (output.brain.twists) fields.twists = output.brain.twists.join('. ');
        if (output.brain.success_variations) fields.success_variations = output.brain.success_variations.join('. ');
        if (output.brain.dm_notes) fields.dm_notes = output.brain.dm_notes;
      }

      // Objectives
      if (output.objectives) {
        const objTexts = output.objectives.map(obj =>
          [obj.title, obj.description, obj.unlock_condition, ...(obj.hints || [])].filter(Boolean).join(' ')
        );
        fields.objectives = objTexts.join('. ');
      }

      // Encounters
      if (output.encounters) {
        const encTexts = output.encounters.map(enc =>
          [enc.name, enc.description, ...(enc.creatures || [])].filter(Boolean).join(' ')
        );
        fields.encounters = encTexts.join('. ');
      }

      // NPCs
      if (output.npcs) {
        const npcTexts = output.npcs.map(npc => [npc.name, npc.brief].filter(Boolean).join(' '));
        fields.npcs = npcTexts.join('. ');
      }

      return extractTextForScanning(fields);
    },
    getEntityName: (output) => output.soul?.title || output.name || '',
  });

  // Sync scan results to local review state
  useEffect(() => {
    if (forge.scanResult) {
      setReviewDiscoveries(forge.scanResult.discoveries);
      setReviewConflicts(forge.scanResult.conflicts);
    }
  }, [forge.scanResult]);

  // Fetch initial data
  useEffect(() => {
    async function fetchData(): Promise<void> {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

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
      setLoading(false);
    }

    fetchData();
  }, [campaignId, supabase, router]);

  // Fetch all entities for linking
  useEffect(() => {
    async function fetchEntities(): Promise<void> {
      const { data } = await supabase
        .from('entities')
        .select('id, name, entity_type, sub_type')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null);
      if (data) {
        setAllEntities(
          data.map((e) => ({ id: e.id, name: e.name, type: e.entity_type, sub_type: e.sub_type }))
        );
      }
    }
    fetchEntities();
  }, [campaignId, supabase]);

  // Capture referenced entities when generation completes
  useEffect(() => {
    if (forge.output && forge.status === 'review') {
      const inputData = forge.input as Record<string, unknown> | null;
      const referencedEntityIds = (inputData?.referencedEntityIds as string[]) || [];

      if (referencedEntityIds.length > 0) {
        const enrichedEntities = referencedEntityIds.map((id) => {
          const fullEntity = allEntities.find((e) => e.id === id);
          return {
            id,
            name: fullEntity?.name || 'Unknown',
            type: fullEntity?.type,
            sub_type: fullEntity?.sub_type,
          };
        });
        setGenerationReferencedEntities(enrichedEntities);
      }
    }
  }, [forge.output, forge.status, forge.input, allEntities]);

  // Helper function to infer relationship type for quests
  const inferQuestRelationshipType = (
    theirType: string,
    theirSubType?: string
  ): string => {
    if (theirType === 'location') return 'takes_place_at';
    if (theirType === 'npc') return 'given_by';
    if (theirType === 'creature') return 'involves';
    if (theirType === 'faction') return 'related_to';
    if (theirType === 'quest') return 'follows';
    return 'connected_to';
  };

  // Handle discovery actions
  const handleDiscoveryAction = (
    discoveryId: string,
    action: Discovery['status'],
    linkedEntityId?: string
  ): void => {
    setReviewDiscoveries((prev) =>
      prev.map((d) =>
        d.id === discoveryId ? { ...d, status: action, linkedEntityId } : d
      )
    );
  };

  // Handle discovery type changes
  const handleDiscoveryTypeChange = (discoveryId: string, newType: EntityType): void => {
    setReviewDiscoveries((prev) =>
      prev.map((d) => (d.id === discoveryId ? { ...d, suggestedType: newType } : d))
    );
  };

  // Handle conflict resolutions
  const handleConflictResolution = (
    conflictId: string,
    resolution: Conflict['resolution']
  ): void => {
    setReviewConflicts((prev) =>
      prev.map((c) => (c.id === conflictId ? { ...c, resolution } : c))
    );
  };

  // Handle manual discovery creation from text selection
  const handleManualDiscovery = (discovery: Partial<Discovery>): void => {
    const newDiscovery: Discovery = {
      id: `manual-${Date.now()}`,
      text: discovery.text || '',
      suggestedType: (discovery.suggestedType as EntityType) || 'npc',
      context: discovery.context || 'Manually selected by user',
      status: discovery.status || 'pending',
    };
    setReviewDiscoveries((prev) => [...prev, newDiscovery]);
  };

  // Handle linking to existing entity from text selection
  const handleLinkExisting = (discoveryId: string): void => {
    // This is passed down to the output card to initiate linking UI
    // The actual linking happens in the commit panel
  };

  // Handle discovery status change
  const handleDiscoveryStatusChange = (id: string, status: Discovery['status']): void => {
    setReviewDiscoveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status } : d))
    );
  };

  // Handle commit
  const handleCommit = async (): Promise<void> => {
    if (!forge.output) return;

    // If fleshing out a stub, update the existing entity
    if (stubId) {
      try {
        const { data: existingStub } = await supabase
          .from('entities')
          .select('attributes')
          .eq('id', stubId)
          .single();

        const existingHistory =
          (existingStub?.attributes as Record<string, unknown>)?.history || [];

        const questSubType = forge.output.sub_type || 'side';
        const { error } = await supabase
          .from('entities')
          .update({
            name: forge.output.soul?.title || forge.output.name,
            sub_type: questSubType,
            brain: forge.output.brain || {},
            soul: forge.output.soul || {},
            mechanics: forge.output.mechanics || {},
            read_aloud: forge.output.read_aloud,
            dm_slug: forge.output.dm_slug,
            summary: forge.output.soul?.hook?.substring(0, 200),
            description: forge.output.soul?.summary,
            forge_status: 'complete',
            attributes: {
              objectives: forge.output.objectives,
              rewards: forge.output.rewards,
              chain: forge.output.chain,
              encounters: forge.output.encounters,
              npcs: forge.output.npcs,
              is_stub: false,
              needs_review: false,
              history: [
                ...(existingHistory as Array<Record<string, unknown>>),
                {
                  event: 'fleshed_out',
                  timestamp: new Date().toISOString(),
                  note: 'Completed via Quest forge',
                },
              ],
            },
          })
          .eq('id', stubId);

        if (error) {
          toast.error('Failed to update entity');
          return;
        }

        // Create relationship to source entity if exists
        if (stubContext?.sourceEntityId) {
          await supabase.from('relationships').insert({
            campaign_id: campaignId,
            source_id: stubId,
            target_id: stubContext.sourceEntityId,
            relationship_type: 'mentioned_in',
            description: `First mentioned in ${stubContext.sourceEntityName}`,
          });
        }

        // Auto-create relationships with referenced entities
        if (generationReferencedEntities.length > 0) {
          const relationshipPromises = generationReferencedEntities.map((refEntity) =>
            supabase.from('relationships').insert({
              campaign_id: campaignId,
              source_id: stubId,
              target_id: refEntity.id,
              relationship_type: inferQuestRelationshipType(
                refEntity.type || 'location',
                refEntity.sub_type
              ),
              surface_description: 'Referenced during creation',
              is_active: true,
            })
          );

          await Promise.allSettled(relationshipPromises);
        }
        setGenerationReferencedEntities([]);

        toast.success('Quest fleshed out and saved!');
        router.refresh();
        router.push(`/dashboard/campaigns/${campaignId}/memory/${stubId}`);
      } catch {
        toast.error('Failed to update stub');
      }
    } else {
      // Normal create flow
      const result = await forge.handleCommit({
        discoveries: reviewDiscoveries,
        conflicts: reviewConflicts,
      });

      if (result.success && result.entity) {
        const entity = result.entity as { id: string };

        // Auto-create relationships with referenced entities
        if (generationReferencedEntities.length > 0) {
          const relationshipPromises = generationReferencedEntities.map((refEntity) =>
            supabase.from('relationships').insert({
              campaign_id: campaignId,
              source_id: entity.id,
              target_id: refEntity.id,
              relationship_type: inferQuestRelationshipType(
                refEntity.type || 'location',
                refEntity.sub_type
              ),
              surface_description: 'Referenced during creation',
              is_active: true,
            })
          );

          const relationshipResults = await Promise.allSettled(relationshipPromises);
          const failures = relationshipResults.filter((r) => r.status === 'rejected');
          if (failures.length > 0) {
            console.error('Some relationships failed to create:', failures);
          }
        }

        setGenerationReferencedEntities([]);

        toast.success('Quest saved to Memory!');
        router.push(`/dashboard/campaigns/${campaignId}/memory/${entity.id}`);
      } else if (result.error) {
        toast.error(result.error);
      }
    }
  };

  // Handle generation with toast
  const handleGenerate = async (input: QuestInputData): Promise<void> => {
    setReviewDiscoveries([]);
    setReviewConflicts([]);

    try {
      const result = await forge.handleGenerate(input);
      if (result.success) {
        toast.success('Quest generated successfully!');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate Quest'
      );
    }
  };

  // Handle discard
  const handleDiscard = (): void => {
    setReviewDiscoveries([]);
    setReviewConflicts([]);
    forge.reset();
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

  // Determine title and description based on context
  const forgeTitle = stubContext ? `Flesh Out: ${stubName}` : 'Quest Forge';

  const forgeDescription = stubContext
    ? 'Complete this stub entity with full quest details'
    : 'Design adventures with objective tracking, rewards, and quest chains';

  return (
    <ForgeShell
      title={forgeTitle}
      description={forgeDescription}
      status={forge.status}
      backHref={`/dashboard/campaigns/${campaignId}`}
      backLabel={`Back to ${campaignName}`}
      inputSection={
        <>
          {/* Stub Context Banner */}
          {stubContext && (
            <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
                <Sparkles className="w-4 h-4" />
                Fleshing out: {stubName}
              </div>
              {stubContext.sourceEntityName && (
                <p className="text-sm text-slate-300">
                  Origin:{' '}
                  <span className="text-teal-400">{stubContext.sourceEntityName}</span>
                </p>
              )}
              {stubContext.snippet && (
                <p className="text-sm text-slate-400 mt-1 italic">
                  &quot;{stubContext.snippet.substring(0, 150)}
                  {stubContext.snippet.length > 150 ? '...' : ''}&quot;
                </p>
              )}
              {stubContext.suggestedTraits && stubContext.suggestedTraits.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {stubContext.suggestedTraits.map((trait: string) => (
                    <Badge key={trait} variant="outline" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <QuestInputForm
            onSubmit={handleGenerate}
            isLocked={forge.status !== 'idle' && forge.status !== 'error'}
            preValidation={forge.preValidation}
            onProceedAnyway={forge.proceedAnyway}
            campaignId={campaignId}
            initialValues={
              stubContext
                ? {
                    name: stubName || '',
                    concept: stubContext.snippet || `Flesh out ${stubName}`,
                  }
                : undefined
            }
          />
        </>
      }
      outputSection={
        forge.output ? (
          <QuestOutputCard
            data={forge.output}
            scanResult={forge.scanResult}
            campaignId={campaignId}
            onDiscoveryStatusChange={handleDiscoveryStatusChange}
            onManualDiscovery={handleManualDiscovery}
            onLinkExisting={handleLinkExisting}
            existingEntities={allEntities.map(e => ({ id: e.id, name: e.name, entity_type: e.type }))}
          />
        ) : (
          <EmptyForgeState
            forgeType="Quest"
            description='Describe your quest concept and click "Generate Quest" to forge it.'
          />
        )
      }
      commitPanel={
        (forge.status === 'review' || forge.status === 'saving') && forge.scanResult ? (
          <CommitPanel
            scanResult={{
              ...forge.scanResult,
              discoveries: reviewDiscoveries,
              conflicts: reviewConflicts,
            }}
            onDiscoveryAction={handleDiscoveryAction}
            onDiscoveryTypeChange={handleDiscoveryTypeChange}
            onConflictResolution={handleConflictResolution}
            onCommit={handleCommit}
            onDiscard={handleDiscard}
            isCommitting={forge.status === 'saving'}
          />
        ) : undefined
      }
    />
  );
}
