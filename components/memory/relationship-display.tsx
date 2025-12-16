'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EntityTypeBadge, EntityType } from './entity-type-badge'
import {
  Link2,
  Plus,
  ArrowRight,
  Users,
  MapPin,
  Heart,
  Briefcase,
  Swords,
  Building,
  Sparkles,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export interface Relationship {
  id: string
  source_id: string
  target_id: string
  relationship_type: string
  description?: string
  target_entity?: {
    id: string
    name: string
    entity_type: EntityType
  }
  source_entity?: {
    id: string
    name: string
    entity_type: EntityType
  }
}

interface RelationshipDisplayProps {
  relationships: Relationship[]
  currentEntityId: string
  campaignId: string
  onAddRelationship?: () => void
}

const RELATIONSHIP_ICONS: Record<string, typeof Link2> = {
  knows: Users,
  family: Heart,
  friend: Heart,
  enemy: Swords,
  rival: Swords,
  lover: Heart,
  employs: Briefcase,
  serves: Briefcase,
  member_of: Building,
  leads: Building,
  located_in: MapPin,
  contains: MapPin,
  owns: MapPin,
  owned_by: MapPin,
  created_by: Sparkles,
  created: Sparkles,
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  knows: 'Knows',
  family: 'Family of',
  friend: 'Friend of',
  enemy: 'Enemy of',
  rival: 'Rival of',
  lover: 'Lover of',
  employs: 'Employs',
  serves: 'Serves',
  member_of: 'Member of',
  leads: 'Leads',
  located_in: 'Located in',
  contains: 'Contains',
  owns: 'Owns',
  owned_by: 'Owned by',
  created_by: 'Created by',
  created: 'Created',
  related_to: 'Related to',
}

export function RelationshipDisplay({
  relationships,
  currentEntityId,
  campaignId,
  onAddRelationship,
}: RelationshipDisplayProps): JSX.Element {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Process relationships to show the "other" entity
  const processedRelationships = relationships.map((rel) => {
    const isSource = rel.source_id === currentEntityId
    const otherEntity = isSource ? rel.target_entity : rel.source_entity
    const relationshipLabel = isSource
      ? RELATIONSHIP_LABELS[rel.relationship_type] || rel.relationship_type
      : `${RELATIONSHIP_LABELS[rel.relationship_type] || rel.relationship_type} (reverse)`

    return {
      ...rel,
      otherEntity,
      relationshipLabel,
      isSource,
    }
  }).filter(rel => rel.otherEntity) // Only show relationships where we have the other entity

  const handleDelete = async (rel: Relationship) => {
    setDeletingId(rel.id)

    try {
      const supabase = createClient()

      // Delete the relationship
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', rel.id)

      if (error) throw error

      // Also delete any reverse relationship (source/target swapped)
      await supabase
        .from('relationships')
        .delete()
        .eq('source_id', rel.target_id)
        .eq('target_id', rel.source_id)
        .eq('campaign_id', campaignId)

      toast.success('Relationship deleted')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete relationship:', error)
      toast.error('Failed to delete relationship')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Relationships
          </CardTitle>
          {onAddRelationship && (
            <Button variant="outline" size="sm" onClick={onAddRelationship}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {processedRelationships.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No relationships yet
          </p>
        ) : (
          <div className="space-y-2">
            {processedRelationships.map((rel) => {
              const Icon = RELATIONSHIP_ICONS[rel.relationship_type] || Link2
              const isDeleting = deletingId === rel.id
              return (
                <div
                  key={rel.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {rel.relationshipLabel}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <Link
                    href={`/dashboard/campaigns/${campaignId}/memory/${rel.otherEntity?.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {rel.otherEntity?.name}
                  </Link>
                  <EntityTypeBadge
                    type={rel.otherEntity?.entity_type || 'other'}
                    size="sm"
                    showIcon={false}
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(rel)}
                    disabled={isDeleting}
                    className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-50"
                    title="Delete relationship"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
