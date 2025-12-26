import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EntityTypeBadge, EntityType } from '@/components/memory/entity-type-badge'
import { Relationship } from '@/components/memory/relationship-display'
import { EntityRelationshipsSection } from '@/components/memory/entity-relationships-section'
import { DeleteEntityButton } from '@/components/memory/delete-entity-button'
import { StubBanner } from '@/components/memory/stub-banner'
// LootDisplay removed - items are now in inventory system
// import { LootDisplay } from '@/components/memory/loot-display'
import { BrainCard } from '@/components/entity/BrainCard'
import { VoiceCard } from '@/components/entity/VoiceCard'
import { ReadAloudCard } from '@/components/entity/ReadAloudCard'
import { FactsWidget } from '@/components/entity/FactsWidget'
import { ItemBrainCard } from '@/components/entity/ItemBrainCard'
import { ItemVoiceCard } from '@/components/entity/ItemVoiceCard'
import { ItemMechanicsCard } from '@/components/entity/ItemMechanicsCard'
import { SrdItemDetailCard } from '@/components/entity/SrdItemDetailCard'
import { LocationBrainCard } from '@/components/entity/LocationBrainCard'
import { LocationSoulCard } from '@/components/entity/LocationSoulCard'
import { LocationMechanicsCard } from '@/components/entity/LocationMechanicsCard'
import { FactionBrainCard } from '@/components/entity/FactionBrainCard'
import { FactionSoulCard } from '@/components/entity/FactionSoulCard'
import { FactionMechanicsCard } from '@/components/entity/FactionMechanicsCard'
import { EncounterBrainCard } from '@/components/entity/EncounterBrainCard'
import { EncounterSoulCard } from '@/components/entity/EncounterSoulCard'
import { EncounterMechanicsCard } from '@/components/entity/EncounterMechanicsCard'
import { EncounterRewardsCard } from '@/components/entity/EncounterRewardsCard'
import { CreatureBrainCard } from '@/components/entity/CreatureBrainCard'
import { CreatureSoulCard } from '@/components/entity/CreatureSoulCard'
import { CreatureMechanicsCard } from '@/components/entity/CreatureMechanicsCard'
import { EmptyStageState } from '@/components/entity/EmptyStageState'
import { EntityInventorySection } from '@/components/inventory'
import { NpcBrain, Voice, ItemBrain, ItemVoice, ItemMechanics, LocationBrain, LocationSoul, LocationMechanics, FactionBrain, FactionSoul, FactionMechanics, EncounterBrain, EncounterSoul, EncounterMechanics, EncounterRewards, CreatureBrain, CreatureSoul, CreatureMechanics, CreatureTreasure, isNpcBrain } from '@/types/living-entity'
import {
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff,
  Skull,
  AlertTriangle,
  Archive,
  Star,
  Crown,
  Sparkles,
  Shield,
  Swords,
  User,
  MessageSquare,
  Target,
  Lock,
  Lightbulb,
  Calendar,
  Wand2,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { renderWithBold } from '@/lib/text-utils'

interface PageProps {
  params: { id: string; entityId: string }
}

const STATUS_CONFIG: Record<string, { icon: typeof Skull; color: string; bgColor: string; label: string }> = {
  active: { icon: Star, color: 'text-green-400', bgColor: 'bg-green-500/10', label: 'Active' },
  deceased: { icon: Skull, color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Deceased' },
  destroyed: { icon: AlertTriangle, color: 'text-slate-400', bgColor: 'bg-slate-500/10', label: 'Destroyed' },
  missing: { icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', label: 'Missing' },
  archived: { icon: Archive, color: 'text-slate-500', bgColor: 'bg-slate-500/10', label: 'Archived' },
}

const IMPORTANCE_CONFIG: Record<string, { icon: typeof Star; color: string; label: string }> = {
  legendary: { icon: Crown, color: 'text-amber-400', label: 'Legendary' },
  major: { icon: Star, color: 'text-primary', label: 'Major' },
  minor: { icon: Sparkles, color: 'text-muted-foreground', label: 'Minor' },
  background: { icon: Sparkles, color: 'text-muted-foreground/50', label: 'Background' },
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function EntityDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify campaign belongs to user
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (campaignError || !campaign) {
    notFound()
  }

  // Fetch entity
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('*')
    .eq('id', params.entityId)
    .eq('campaign_id', params.id)
    .is('deleted_at', null)
    .single()

  if (entityError || !entity) {
    notFound()
  }

  // Fetch relationships
  const { data: rawRelationships } = await supabase
    .from('relationships')
    .select(`
      id,
      source_id,
      target_id,
      relationship_type,
      description,
      source_entity:source_id(id, name, entity_type),
      target_entity:target_id(id, name, entity_type)
    `)
    .or(`source_id.eq.${params.entityId},target_id.eq.${params.entityId}`)
    .is('deleted_at', null)

  // Transform relationships to match Relationship type
  // Supabase returns joined data as arrays, we need to extract the first element
  const relationships: Relationship[] = (rawRelationships || []).map((rel) => ({
    id: rel.id,
    source_id: rel.source_id,
    target_id: rel.target_id,
    relationship_type: rel.relationship_type,
    description: rel.description,
    source_entity: Array.isArray(rel.source_entity) ? rel.source_entity[0] : rel.source_entity,
    target_entity: Array.isArray(rel.target_entity) ? rel.target_entity[0] : rel.target_entity,
  }))

  const statusConfig = STATUS_CONFIG[entity.status]
  const importanceConfig = IMPORTANCE_CONFIG[entity.importance_tier]
  const attributes = entity.attributes || {}
  // Stub detection: forge_status === 'stub' or legacy attributes flags (when forge_status not set)
  const isStub = entity.forge_status === 'stub' ||
    ((attributes.is_stub || attributes.needs_review) && !entity.forge_status)

  // Item-specific helpers
  const isItem = entity.entity_type === 'item'
  const itemBrain = entity.brain as ItemBrain | null
  const itemMechanics = entity.mechanics as ItemMechanics | null
  const itemCategory = (entity.attributes?.category || entity.attributes?.item_type || entity.subtype) as string | undefined
  const isSentientItem = isItem && itemBrain?.sentience_level && itemBrain.sentience_level !== 'none'
  const isSrdItem = isItem && (entity.attributes?.is_srd || entity.source_forge === 'srd_import')

  // Location-specific helpers
  const isLocation = entity.entity_type === 'location'
  const locationBrain = entity.brain as LocationBrain | null
  const locationSoul = entity.soul as LocationSoul | null
  const locationMechanics = entity.mechanics as LocationMechanics | null

  // Faction-specific helpers
  const isFaction = entity.entity_type === 'faction'
  const factionBrain = entity.brain as FactionBrain | null
  const factionSoul = entity.soul as FactionSoul | null
  const factionMechanics = entity.mechanics as FactionMechanics | null

  // Encounter-specific helpers
  const isEncounter = entity.entity_type === 'encounter'
  const encounterBrain = entity.brain as EncounterBrain | null
  const encounterSoul = entity.soul as EncounterSoul | null
  const encounterMechanics = entity.mechanics as EncounterMechanics | null
  const encounterRewards = entity.attributes?.rewards as EncounterRewards | null

  // Creature-specific helpers
  const isCreature = entity.entity_type === 'creature'
  const creatureBrain = entity.brain as CreatureBrain | null
  const creatureSoul = entity.soul as CreatureSoul | null
  const creatureMechanics = entity.mechanics as CreatureMechanics | null
  const creatureTreasure = attributes.treasure as CreatureTreasure | null

  // Check if Stage column has content for this entity type
  const hasNpcStageContent =
    (entity.voice && (entity.voice as Voice).style?.length > 0) ||
    attributes.appearance ||
    attributes.combatStats ||
    attributes.loot ||
    attributes.voiceAndMannerisms ||
    entity.description

  const hasItemStageContent =
    (itemMechanics && Object.keys(itemMechanics).length > 0) ||
    (isSentientItem && entity.voice)

  const hasLocationStageContent =
    (locationSoul && Object.keys(locationSoul).length > 0) ||
    (locationMechanics && Object.keys(locationMechanics).length > 0)

  const hasFactionStageContent =
    (factionSoul && Object.keys(factionSoul).length > 0) ||
    (factionMechanics && Object.keys(factionMechanics).length > 0)

  const hasEncounterStageContent =
    (encounterSoul && Object.keys(encounterSoul).length > 0) ||
    (encounterMechanics && Object.keys(encounterMechanics).length > 0) ||
    (encounterRewards && Object.keys(encounterRewards).length > 0)

  const hasCreatureTreasureContent = creatureTreasure && (
    creatureTreasure.treasure_description ||
    (creatureTreasure.treasure_items && creatureTreasure.treasure_items.length > 0)
  )

  const hasCreatureStageContent =
    (creatureSoul && Object.keys(creatureSoul).length > 0) ||
    (creatureMechanics && Object.keys(creatureMechanics).length > 0) ||
    hasCreatureTreasureContent

  const hasStageContent =
    (entity.entity_type === 'npc' && hasNpcStageContent) ||
    (isItem && hasItemStageContent) ||
    (isLocation && hasLocationStageContent) ||
    (isFaction && hasFactionStageContent) ||
    (isEncounter && hasEncounterStageContent) ||
    (isCreature && hasCreatureStageContent) ||
    entity.public_notes ||
    entity.dm_notes

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/dashboard/campaigns/${params.id}/memory`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Memory
          </Link>
        </Button>

        {/* Stub Banner */}
        {isStub && (
          <StubBanner
            entityId={entity.id}
            entityName={entity.name}
            entityType={entity.entity_type}
            campaignId={params.id}
            stubContext={attributes.stub_context as string | undefined}
            sourceEntityId={attributes.source_entity_id as string | undefined}
            sourceEntityName={attributes.source_entity_name as string | undefined}
          />
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{entity.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <EntityTypeBadge type={entity.entity_type as EntityType} size="lg" />
                {entity.subtype && (
                  <Badge variant="outline">{entity.subtype}</Badge>
                )}
                {statusConfig && (
                  <Badge className={cn(statusConfig.color, statusConfig.bgColor, 'border-0')}>
                    <statusConfig.icon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                )}
                {importanceConfig && (
                  <Badge variant="outline" className={importanceConfig.color}>
                    <importanceConfig.icon className="w-3 h-3 mr-1" />
                    {importanceConfig.label}
                  </Badge>
                )}
                {entity.visibility === 'dm_only' && (
                  <Badge variant="outline" className="text-muted-foreground">
                    <EyeOff className="w-3 h-3 mr-1" />
                    DM Only
                  </Badge>
                )}
                {entity.visibility === 'public' && (
                  <Badge variant="outline" className="text-green-400">
                    <Eye className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
              {/* Summary as subtitle - the quick reference */}
              {(entity.dm_slug || entity.summary) && (
                <p className="text-slate-400 italic mt-3">
                  {entity.dm_slug || entity.summary}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/campaigns/${params.id}/memory/${params.entityId}/edit`}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <DeleteEntityButton
                entityId={entity.id}
                entityName={entity.name}
                campaignId={params.id}
              />
            </div>
          </div>
        </div>

        {/* Read Aloud - Quick DM Reference (Full Width, Right After Header) */}
        {entity.read_aloud && (
          <div className="mb-6">
            <ReadAloudCard text={entity.read_aloud} entityId={entity.id} />
          </div>
        )}

        {/* === MASTER DASHBOARD LAYOUT === */}
        {/* Left (2/3): "The Stage" - Player-facing content */}
        {/* Right (1/3): "The Script" - DM-facing content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* === LEFT COLUMN (The Stage) - What players see/experience === */}
          <div className="lg:col-span-2 space-y-4">

            {/* Empty State for Stage */}
            {!hasStageContent && (
              <EmptyStageState
                entityType={entity.entity_type}
                entityId={entity.id}
                entityName={entity.name}
                campaignId={params.id}
                isStub={isStub}
              />
            )}

            {/* --- NPC STAGE CONTENT --- */}
            {entity.entity_type === 'npc' && (
              <>
                {/* Voice Profile - How to speak this character */}
                {entity.voice && Object.keys(entity.voice as object).length > 0 && (entity.voice as Voice).style?.length > 0 && (
                  <VoiceCard voice={entity.voice as Voice} />
                )}

                {/* Appearance - What players see */}
                {attributes.appearance && (
                  <div className="ca-panel p-4">
                    <div className="ca-section-header mb-2">
                      <User className="w-4 h-4" />
                      <span>Appearance</span>
                    </div>
                    <p className="text-sm text-slate-300">{renderWithBold(attributes.appearance)}</p>
                  </div>
                )}

                {/* Combat Stats */}
                {attributes.combatStats && (
                  <div className="ca-panel p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">Combat</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="ca-stat-pill ca-stat-pill--ac">AC {attributes.combatStats.armorClass}</span>
                      <span className="ca-stat-pill ca-stat-pill--hp">HP {attributes.combatStats.hitPoints}</span>
                      {attributes.combatStats.primaryWeapon && (
                        <span className="text-sm text-slate-400">
                          <Swords className="w-4 h-4 inline mr-1" />
                          {attributes.combatStats.primaryWeapon}
                        </span>
                      )}
                    </div>
                    {attributes.combatStats.combatStyle && (
                      <p className="text-xs text-slate-500 mt-2 italic">{attributes.combatStats.combatStyle}</p>
                    )}
                  </div>
                )}

                {/* Legacy Loot - deprecated in favor of Inventory system */}
                {/* LootDisplay removed - items are now shown in EntityInventorySection */}

                {/* Legacy Voice/Mannerisms - Only if no Voice profile */}
                {!(entity.voice && (entity.voice as Voice).style?.length > 0) && attributes.voiceAndMannerisms && (
                  <div className="ca-panel p-4">
                    <div className="ca-section-header mb-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Voice & Mannerisms</span>
                    </div>
                    <p className="text-sm text-slate-300">{renderWithBold(attributes.voiceAndMannerisms)}</p>
                  </div>
                )}

                {/* Legacy Description - Only show if NO brain AND NO voice (old entities) */}
                {!isNpcBrain(entity.brain as NpcBrain) && !(entity.voice && (entity.voice as Voice).style?.length > 0) && entity.description && (
                  <div className="ca-panel p-4">
                    <div className="ca-section-header mb-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Description</span>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{renderWithBold(entity.description)}</p>
                  </div>
                )}
              </>
            )}

            {/* --- ITEM STAGE CONTENT --- */}
            {isItem && (
              <>
                {/* SRD Items get special display - use raw mechanics from entity */}
                {isSrdItem ? (
                  <SrdItemDetailCard
                    item={{
                      name: entity.name,
                      sub_type: entity.sub_type,
                      mechanics: entity.mechanics as {
                        rarity?: string
                        requires_attunement?: boolean
                        attunement_requirements?: string
                        value_gp?: number
                        weight?: number
                        damage?: string
                        damage_type?: string
                        properties?: string[]
                        ac?: number
                        ac_bonus?: number
                        stealth_disadvantage?: boolean
                        str_minimum?: number
                        effect?: string
                        charges?: number
                        recharge?: string
                      } | undefined,
                      description: entity.description as string | undefined,
                      dm_description: entity.dm_description as string | undefined,
                      attributes: entity.attributes,
                    }}
                  />
                ) : (
                  <>
                    {/* Item Mechanics - The usable game stats (player-facing) */}
                    {itemMechanics && Object.keys(itemMechanics).length > 0 && (
                      <ItemMechanicsCard mechanics={itemMechanics} category={itemCategory} />
                    )}
                  </>
                )}

                {/* Item Voice - For sentient items */}
                {isSentientItem && entity.voice && (
                  <ItemVoiceCard voice={entity.voice as ItemVoice} />
                )}
              </>
            )}

            {/* --- LOCATION STAGE CONTENT --- */}
            {isLocation && (
              <>
                {/* Location Soul - Sensory details (player-facing) */}
                {locationSoul && Object.keys(locationSoul).length > 0 && (
                  <LocationSoulCard soul={locationSoul} />
                )}

                {/* Location Mechanics - Hazards, encounters (player-facing) */}
                {locationMechanics && Object.keys(locationMechanics).length > 0 && (
                  <LocationMechanicsCard mechanics={locationMechanics} />
                )}
              </>
            )}

            {/* --- FACTION STAGE CONTENT --- */}
            {isFaction && (
              <>
                {/* Faction Soul - Identity, culture (player-facing) */}
                {factionSoul && Object.keys(factionSoul).length > 0 && (
                  <FactionSoulCard soul={factionSoul} />
                )}

                {/* Faction Mechanics - Power, resources (player-facing) */}
                {factionMechanics && Object.keys(factionMechanics).length > 0 && (
                  <FactionMechanicsCard mechanics={factionMechanics} />
                )}
              </>
            )}

            {/* --- ENCOUNTER STAGE CONTENT --- */}
            {isEncounter && (
              <>
                {/* Encounter Soul - Atmosphere, sensory details (player-facing) */}
                {encounterSoul && Object.keys(encounterSoul).length > 0 && (
                  <EncounterSoulCard soul={encounterSoul} />
                )}

                {/* Encounter Mechanics - Creatures, phases, hazards */}
                {encounterMechanics && Object.keys(encounterMechanics).length > 0 && (
                  <EncounterMechanicsCard mechanics={encounterMechanics} />
                )}

                {/* Encounter Rewards - XP, gold, loot */}
                {encounterRewards && Object.keys(encounterRewards).length > 0 && (
                  <EncounterRewardsCard rewards={encounterRewards} />
                )}
              </>
            )}

            {/* --- CREATURE STAGE CONTENT --- */}
            {isCreature && (
              <>
                {/* Creature Mechanics - Full stat block (player-facing for combat) */}
                {creatureMechanics && Object.keys(creatureMechanics).length > 0 && (
                  <CreatureMechanicsCard mechanics={creatureMechanics} name={entity.name} />
                )}

                {/* Creature Soul - Appearance, behavior, habitat (player-facing) */}
                {creatureSoul && Object.keys(creatureSoul).length > 0 && (
                  <CreatureSoulCard soul={creatureSoul} />
                )}
              </>
            )}

            {/* --- SHARED STAGE CONTENT --- */}
            {/* Public Notes */}
            {entity.public_notes && (
              <Card className="border-green-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-green-500" />
                    Public Notes
                    <Badge variant="outline" className="ml-2 text-green-500 text-xs">
                      Player Safe
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{renderWithBold(entity.public_notes)}</p>
                </CardContent>
              </Card>
            )}

            {/* DM Notes */}
            {entity.dm_notes && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <EyeOff className="w-5 h-5 text-amber-500" />
                    DM Notes
                    <Badge variant="outline" className="ml-2 text-amber-500 text-xs">
                      DM Only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{renderWithBold(entity.dm_notes)}</p>
                </CardContent>
              </Card>
            )}

            {/* Inventory Section - for NPCs, Players, Locations */}
            <EntityInventorySection
              campaignId={params.id}
              entityId={entity.id}
              entityType={entity.entity_type}
              entityName={entity.name}
              subType={entity.sub_type}
              mechanics={entity.mechanics as Record<string, unknown>}
            />
          </div>


          {/* === RIGHT COLUMN (The Script) - DM reference === */}
          <div className="space-y-4">

            {/* --- NPC SCRIPT CONTENT --- */}
            {entity.entity_type === 'npc' && entity.brain && isNpcBrain(entity.brain as NpcBrain) && (
              <BrainCard brain={entity.brain as NpcBrain} viewMode="dm" />
            )}

            {/* --- ITEM SCRIPT CONTENT --- */}
            {isItem && itemBrain && Object.keys(itemBrain).length > 0 && (
              <ItemBrainCard brain={itemBrain} subType={entity.sub_type} />
            )}

            {/* --- LOCATION SCRIPT CONTENT --- */}
            {isLocation && locationBrain && Object.keys(locationBrain).length > 0 && (
              <LocationBrainCard brain={locationBrain} subType={entity.sub_type} />
            )}

            {/* --- FACTION SCRIPT CONTENT --- */}
            {isFaction && factionBrain && Object.keys(factionBrain).length > 0 && (
              <FactionBrainCard brain={factionBrain} subType={entity.sub_type} />
            )}

            {/* --- ENCOUNTER SCRIPT CONTENT --- */}
            {isEncounter && encounterBrain && Object.keys(encounterBrain).length > 0 && (
              <EncounterBrainCard brain={encounterBrain} subType={entity.sub_type} />
            )}

            {/* --- CREATURE SCRIPT CONTENT --- */}
            {isCreature && ((creatureBrain && Object.keys(creatureBrain).length > 0) || hasCreatureTreasureContent) && (
              <CreatureBrainCard brain={creatureBrain || {}} treasure={creatureTreasure} />
            )}

            {/* --- SHARED SCRIPT CONTENT --- */}
            {/* Secret - DM Only */}
            {attributes.secret && (
              <div className="ca-panel p-4 border-l-2 border-amber-500/50">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Secret</span>
                  <Badge variant="outline" className="ml-auto text-xs">DM Only</Badge>
                </div>
                <p className="text-sm text-slate-300">{renderWithBold(attributes.secret)}</p>
              </div>
            )}

            {/* Plot Hook */}
            {attributes.plotHook && (
              <div className="ca-panel p-4 border-l-2 border-purple-500/50">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">Plot Hook</span>
                </div>
                <p className="text-sm text-slate-300">{renderWithBold(attributes.plotHook)}</p>
              </div>
            )}

            {/* Legacy Motivation - Only if NO brain */}
            {!isNpcBrain(entity.brain as NpcBrain) && attributes.motivation && (
              <div className="ca-panel p-4">
                <div className="ca-section-header mb-2">
                  <Target className="w-4 h-4" />
                  <span>Motivation</span>
                </div>
                <p className="text-sm text-slate-300">{renderWithBold(attributes.motivation)}</p>
              </div>
            )}

            {/* Legacy Personality - Only if NO brain */}
            {!isNpcBrain(entity.brain as NpcBrain) && attributes.personality && (
              <div className="ca-panel p-4">
                <div className="ca-section-header mb-2">
                  <Heart className="w-4 h-4" />
                  <span>Personality</span>
                </div>
                <p className="text-sm text-slate-300">{renderWithBold(attributes.personality)}</p>
              </div>
            )}

            {/* Relationships */}
            <EntityRelationshipsSection
              relationships={relationships}
              currentEntityId={params.entityId}
              currentEntityName={entity.name}
              campaignId={params.id}
            />

            {/* Facts */}
            <FactsWidget entityId={entity.id} campaignId={params.id} />

            {/* Metadata */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(entity.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDate(entity.updated_at)}</span>
                </div>
                {entity.source_forge && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Source</span>
                    <Badge variant="outline" className="gap-1">
                      <Wand2 className="w-3 h-3" />
                      {entity.source_forge === 'npc' ? 'NPC Forge' : entity.source_forge}
                    </Badge>
                  </div>
                )}
                {entity.tags && entity.tags.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {entity.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
