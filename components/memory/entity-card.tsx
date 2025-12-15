'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EntityTypeBadge, EntityType } from './entity-type-badge'
import { cn } from '@/lib/utils'
import {
  Skull,
  AlertTriangle,
  Archive,
  Eye,
  EyeOff,
  Star,
  Crown,
  Sparkles,
} from 'lucide-react'

export interface Entity {
  id: string
  campaign_id: string
  entity_type: EntityType
  subtype?: string
  name: string
  summary?: string
  description?: string
  status: 'active' | 'deceased' | 'destroyed' | 'missing' | 'archived'
  importance_tier: 'legendary' | 'major' | 'minor' | 'background'
  visibility: 'public' | 'dm_only' | 'revealable'
  created_at: string
  updated_at: string
}

interface EntityCardProps {
  entity: Entity
  campaignId: string
}

const STATUS_CONFIG: Record<string, { icon: typeof Skull; color: string; label: string }> = {
  deceased: { icon: Skull, color: 'text-red-400', label: 'Deceased' },
  destroyed: { icon: AlertTriangle, color: 'text-gray-400', label: 'Destroyed' },
  missing: { icon: AlertTriangle, color: 'text-yellow-400', label: 'Missing' },
  archived: { icon: Archive, color: 'text-gray-500', label: 'Archived' },
}

const IMPORTANCE_CONFIG: Record<string, { icon: typeof Star; color: string }> = {
  legendary: { icon: Crown, color: 'text-amber-400' },
  major: { icon: Star, color: 'text-primary' },
  minor: { icon: Sparkles, color: 'text-muted-foreground' },
}

export function EntityCard({ entity, campaignId }: EntityCardProps): JSX.Element {
  const statusConfig = STATUS_CONFIG[entity.status]
  const importanceConfig = IMPORTANCE_CONFIG[entity.importance_tier]

  return (
    <Link href={`/dashboard/campaigns/${campaignId}/memory/${entity.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {entity.name}
              </h3>
              {entity.subtype && (
                <p className="text-xs text-muted-foreground">{entity.subtype}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {importanceConfig && (
                <span title={entity.importance_tier}>
                  <importanceConfig.icon className={cn('w-4 h-4', importanceConfig.color)} />
                </span>
              )}
              {entity.visibility === 'dm_only' && (
                <span title="DM Only">
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                </span>
              )}
              {entity.visibility === 'revealable' && (
                <span title="Revealable">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <EntityTypeBadge type={entity.entity_type} size="sm" />
            {statusConfig && (
              <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                <statusConfig.icon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {entity.summary ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {entity.summary}
            </p>
          ) : entity.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {entity.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">
              No description
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
