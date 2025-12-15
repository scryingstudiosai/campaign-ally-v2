'use client'

import Link from 'next/link'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  owns: MapPin,
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
  owns: 'Owns',
  created_by: 'Created by',
  related_to: 'Related to',
}

export function RelationshipDisplay({
  relationships,
  currentEntityId,
  campaignId,
  onAddRelationship,
}: RelationshipDisplayProps): JSX.Element {
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
              return (
                <Link
                  key={rel.id}
                  href={`/dashboard/campaigns/${campaignId}/memory/${rel.otherEntity?.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {rel.relationshipLabel}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {rel.otherEntity?.name}
                  </span>
                  <EntityTypeBadge
                    type={rel.otherEntity?.entity_type || 'other'}
                    size="sm"
                    showIcon={false}
                    className="ml-auto"
                  />
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
