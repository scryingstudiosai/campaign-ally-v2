'use client'

import Link from 'next/link'
import { EntityTypeBadge } from './entity-type-badge'
import { Badge } from '@/components/ui/badge'
import { Entity } from './entity-card'
import { cn } from '@/lib/utils'
import { renderWithBold } from '@/lib/text-utils'
import {
  Skull,
  AlertTriangle,
  Archive,
  EyeOff,
  Star,
  Crown,
  Sparkles,
} from 'lucide-react'

interface EntityListItemProps {
  entity: Entity
  campaignId: string
}

const STATUS_CONFIG: Record<string, { icon: typeof Skull; color: string; label: string }> = {
  active: { icon: Star, color: 'text-green-400', label: 'Active' },
  deceased: { icon: Skull, color: 'text-red-400', label: 'Deceased' },
  destroyed: { icon: AlertTriangle, color: 'text-slate-400', label: 'Destroyed' },
  missing: { icon: AlertTriangle, color: 'text-yellow-400', label: 'Missing' },
  archived: { icon: Archive, color: 'text-slate-500', label: 'Archived' },
}

const IMPORTANCE_CONFIG: Record<string, { icon: typeof Star; color: string; label: string }> = {
  legendary: { icon: Crown, color: 'text-amber-400', label: 'Legendary' },
  major: { icon: Star, color: 'text-primary', label: 'Major' },
  minor: { icon: Sparkles, color: 'text-muted-foreground', label: 'Minor' },
  background: { icon: Sparkles, color: 'text-muted-foreground/50', label: 'Background' },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

export function EntityListItem({ entity, campaignId }: EntityListItemProps): JSX.Element {
  const statusConfig = STATUS_CONFIG[entity.status]
  const importanceConfig = IMPORTANCE_CONFIG[entity.importance_tier]

  return (
    <Link
      href={`/dashboard/campaigns/${campaignId}/memory/${entity.id}`}
      className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors group"
    >
      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {entity.name}
          </span>
          {entity.visibility === 'dm_only' && (
            <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        {entity.summary && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {renderWithBold(entity.summary)}
          </p>
        )}
      </div>

      {/* Type */}
      <div className="w-24 flex-shrink-0 hidden sm:block">
        <EntityTypeBadge type={entity.entity_type} size="sm" showIcon={false} />
      </div>

      {/* Status */}
      <div className="w-24 flex-shrink-0 hidden md:block">
        {statusConfig && (
          <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        )}
      </div>

      {/* Importance */}
      <div className="w-24 flex-shrink-0 hidden lg:flex items-center gap-1">
        {importanceConfig && (
          <>
            <importanceConfig.icon className={cn('w-3 h-3', importanceConfig.color)} />
            <span className={cn('text-xs', importanceConfig.color)}>
              {importanceConfig.label}
            </span>
          </>
        )}
      </div>

      {/* Updated */}
      <div className="w-20 flex-shrink-0 text-xs text-muted-foreground hidden sm:block">
        {formatDate(entity.updated_at)}
      </div>
    </Link>
  )
}

export function EntityListHeader(): JSX.Element {
  return (
    <div className="flex items-center gap-4 px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground">
      <div className="flex-1">Name</div>
      <div className="w-24 flex-shrink-0 hidden sm:block">Type</div>
      <div className="w-24 flex-shrink-0 hidden md:block">Status</div>
      <div className="w-24 flex-shrink-0 hidden lg:block">Importance</div>
      <div className="w-20 flex-shrink-0 hidden sm:block">Updated</div>
    </div>
  )
}
