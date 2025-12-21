'use client'

import Link from 'next/link'
import { EntityTypeBadge, EntityType } from './entity-type-badge'
import { cn } from '@/lib/utils'
import { renderWithBold } from '@/lib/text-utils'
import {
  Skull,
  AlertTriangle,
  Archive,
  Eye,
  EyeOff,
  Star,
  Crown,
  Sparkles,
  Wand2,
} from 'lucide-react'

export interface Entity {
  id: string
  campaign_id: string
  entity_type: EntityType
  subtype?: string      // Legacy: race/species (e.g., "Human", "Half-Orc")
  sub_type?: string     // NPC role: "standard" | "villain" | "hero"
  name: string
  summary?: string
  description?: string
  status: 'active' | 'deceased' | 'destroyed' | 'missing' | 'archived'
  importance_tier: 'legendary' | 'major' | 'minor' | 'background'
  visibility: 'public' | 'dm_only' | 'revealable'
  created_at: string
  updated_at: string
  attributes?: {
    is_stub?: boolean
    needs_review?: boolean
    stub_context?: string
    source_entity_name?: string
    [key: string]: unknown
  }
}

interface EntityCardProps {
  entity: Entity
  campaignId: string
}

// Composite key style map for entity + subtype combinations
interface EntityStyle {
  borderClass: string
  glowClass: string
  hoverClass: string
}

const STYLE_MAP: Record<string, EntityStyle> = {
  // NPC subtypes
  npc_villain: {
    borderClass: 'border-red-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    hoverClass: 'hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]',
  },
  npc_hero: {
    borderClass: 'border-amber-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    hoverClass: 'hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  },
  npc_standard: {
    borderClass: 'border-teal-500/30',
    glowClass: '',
    hoverClass: 'hover:border-teal-500/50',
  },
  // Default fallbacks for other entity types
  location_default: {
    borderClass: 'border-green-500/30',
    glowClass: '',
    hoverClass: 'hover:border-green-500/50',
  },
  item_default: {
    borderClass: 'border-purple-500/30',
    glowClass: '',
    hoverClass: 'hover:border-purple-500/50',
  },
  // Item subtypes
  item_standard: {
    borderClass: 'border-emerald-500/30',
    glowClass: '',
    hoverClass: 'hover:border-emerald-500/50',
  },
  item_artifact: {
    borderClass: 'border-amber-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    hoverClass: 'hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  },
  item_cursed: {
    borderClass: 'border-red-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    hoverClass: 'hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]',
  },
  faction_default: {
    borderClass: 'border-orange-500/30',
    glowClass: '',
    hoverClass: 'hover:border-orange-500/50',
  },
  quest_default: {
    borderClass: 'border-yellow-500/30',
    glowClass: '',
    hoverClass: 'hover:border-yellow-500/50',
  },
  other_default: {
    borderClass: 'border-slate-500/30',
    glowClass: '',
    hoverClass: 'hover:border-slate-500/50',
  },
}

function getEntityStyle(entityType: EntityType, subtype?: string): EntityStyle {
  // Try composite key first (e.g., npc_villain)
  const compositeKey = `${entityType}_${subtype || 'standard'}`
  if (STYLE_MAP[compositeKey]) {
    return STYLE_MAP[compositeKey]
  }

  // Fall back to entity type default
  const defaultKey = `${entityType}_default`
  if (STYLE_MAP[defaultKey]) {
    return STYLE_MAP[defaultKey]
  }

  // Ultimate fallback
  return STYLE_MAP.other_default
}

const STATUS_CONFIG: Record<string, { icon: typeof Skull; color: string; label: string }> = {
  deceased: { icon: Skull, color: 'text-red-400', label: 'Deceased' },
  destroyed: { icon: AlertTriangle, color: 'text-slate-400', label: 'Destroyed' },
  missing: { icon: AlertTriangle, color: 'text-yellow-400', label: 'Missing' },
  archived: { icon: Archive, color: 'text-slate-500', label: 'Archived' },
}

const IMPORTANCE_CONFIG: Record<string, { icon: typeof Star; color: string }> = {
  legendary: { icon: Crown, color: 'text-amber-400' },
  major: { icon: Star, color: 'text-primary' },
  minor: { icon: Sparkles, color: 'text-muted-foreground' },
}

export function EntityCard({ entity, campaignId }: EntityCardProps): JSX.Element {
  const statusConfig = STATUS_CONFIG[entity.status]
  const importanceConfig = IMPORTANCE_CONFIG[entity.importance_tier]
  const isStub = entity.attributes?.is_stub || entity.attributes?.needs_review
  const entityStyle = getEntityStyle(entity.entity_type, entity.sub_type)

  return (
    <Link href={`/dashboard/campaigns/${campaignId}/memory/${entity.id}`}>
      <div
        className={cn(
          'ca-card ca-card-interactive h-full p-4 group border',
          entityStyle.borderClass,
          entityStyle.glowClass,
          entityStyle.hoverClass,
          isStub && 'border-dashed border-amber-500/50 opacity-90'
        )}
      >
        <div className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-100 group-hover:text-primary transition-colors truncate">
                {entity.name}
              </h3>
              {entity.subtype && (
                <p className="text-xs text-slate-500">{entity.subtype}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {importanceConfig && !isStub && (
                <span title={entity.importance_tier}>
                  <importanceConfig.icon className={cn('w-4 h-4', importanceConfig.color)} />
                </span>
              )}
              {entity.visibility === 'dm_only' && (
                <span title="DM Only">
                  <EyeOff className="w-4 h-4 text-slate-500" />
                </span>
              )}
              {entity.visibility === 'revealable' && (
                <span title="Revealable">
                  <Eye className="w-4 h-4 text-slate-500" />
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <EntityTypeBadge type={entity.entity_type} subtype={entity.sub_type} size="sm" />
            {isStub && (
              <span className="ca-inset px-2 py-0.5 text-xs text-amber-400 flex items-center gap-1">
                <Wand2 className="w-3 h-3" />
                Needs Details
              </span>
            )}
            {statusConfig && !isStub && (
              <span className={cn('ca-inset px-2 py-0.5 text-xs flex items-center gap-1', statusConfig.color)}>
                <statusConfig.icon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            )}
          </div>
        </div>
        <div className="pt-0">
          {isStub && entity.attributes?.source_entity_name ? (
            <p className="text-sm text-slate-500 italic line-clamp-2">
              From: {entity.attributes.source_entity_name}
            </p>
          ) : entity.summary ? (
            <p className="text-sm text-slate-400 line-clamp-2">
              {renderWithBold(entity.summary)}
            </p>
          ) : entity.description ? (
            <p className="text-sm text-slate-400 line-clamp-2">
              {renderWithBold(entity.description)}
            </p>
          ) : (
            <p className="text-sm text-slate-600 italic">
              No description
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
