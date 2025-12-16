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
  Backpack,
  Calendar,
  Wand2,
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
  const isStub = attributes.is_stub || attributes.needs_review

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
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{entity.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            {entity.summary && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">{renderWithBold(entity.summary)}</p>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {entity.description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{renderWithBold(entity.description)}</p>
                </CardContent>
              </Card>
            )}

            {/* NPC-specific attributes */}
            {entity.entity_type === 'npc' && attributes && (
              <>
                {/* Appearance & Personality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attributes.appearance && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          Appearance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="text-sm text-muted-foreground">{renderWithBold(attributes.appearance)}</p>
                      </CardContent>
                    </Card>
                  )}
                  {attributes.personality && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          Personality
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="text-sm text-muted-foreground">{renderWithBold(attributes.personality)}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Voice & Mannerisms */}
                {attributes.voiceAndMannerisms && (
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        Voice & Mannerisms
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground">{renderWithBold(attributes.voiceAndMannerisms)}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Combat Stats */}
                {attributes.combatStats && (
                  <Card className="border-slate-500/30 bg-slate-500/5">
                    <CardContent className="py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-400">Combat:</span>
                        </div>
                        <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-base px-3 py-1 font-bold">
                          AC {attributes.combatStats.armorClass}
                        </Badge>
                        <Badge className="bg-red-600 hover:bg-red-600 text-white text-base px-3 py-1 font-bold">
                          HP {attributes.combatStats.hitPoints}
                        </Badge>
                        {attributes.combatStats.primaryWeapon && (
                          <div className="flex items-center gap-2 text-sm">
                            <Swords className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{attributes.combatStats.primaryWeapon}</span>
                          </div>
                        )}
                        {attributes.combatStats.combatStyle && (
                          <span className="text-sm text-muted-foreground italic">
                            {attributes.combatStats.combatStyle}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Motivation */}
                {attributes.motivation && (
                  <Card>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Motivation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground">{renderWithBold(attributes.motivation)}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Secret */}
                {attributes.secret && (
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-500">Secret</span>
                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <EyeOff className="w-3 h-3" />
                          DM Only
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground">{renderWithBold(attributes.secret)}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Plot Hook */}
                {attributes.plotHook && (
                  <Card className="border-cyan-500/30 bg-cyan-500/5">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-cyan-500" />
                        <span className="text-cyan-500">Plot Hook</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground">{renderWithBold(attributes.plotHook)}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Loot */}
                {attributes.loot && (
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                        <Backpack className="w-4 h-4" />
                        Loot & Pockets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      {Array.isArray(attributes.loot) ? (
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {attributes.loot.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{renderWithBold(item)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">{renderWithBold(attributes.loot)}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Relationships */}
            <EntityRelationshipsSection
              relationships={relationships}
              currentEntityId={params.entityId}
              currentEntityName={entity.name}
              campaignId={params.id}
            />

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
