'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EntityTypeBadge, EntityType } from './entity-type-badge'
import { cn } from '@/lib/utils'
import { renderWithBold } from '@/lib/text-utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
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
  Trash2,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  onDelete?: (id: string) => void
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
  // Location subtypes
  location_region: {
    borderClass: 'border-indigo-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]',
    hoverClass: 'hover:border-indigo-500/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]',
  },
  location_settlement: {
    borderClass: 'border-indigo-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]',
    hoverClass: 'hover:border-indigo-500/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]',
  },
  location_district: {
    borderClass: 'border-indigo-500/30',
    glowClass: '',
    hoverClass: 'hover:border-indigo-500/50',
  },
  location_building: {
    borderClass: 'border-indigo-500/30',
    glowClass: '',
    hoverClass: 'hover:border-indigo-500/50',
  },
  location_room: {
    borderClass: 'border-indigo-500/20',
    glowClass: '',
    hoverClass: 'hover:border-indigo-500/40',
  },
  location_landmark: {
    borderClass: 'border-cyan-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    hoverClass: 'hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]',
  },
  location_dungeon: {
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

export function EntityCard({ entity, campaignId, onDelete }: EntityCardProps): JSX.Element {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const statusConfig = STATUS_CONFIG[entity.status]
  const importanceConfig = IMPORTANCE_CONFIG[entity.importance_tier]
  const isStub = entity.attributes?.is_stub || entity.attributes?.needs_review
  const entityStyle = getEntityStyle(entity.entity_type, entity.sub_type)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      // Delete related facts first
      await supabase
        .from('facts')
        .delete()
        .eq('entity_id', entity.id)

      // Delete relationships where this entity is source or target
      await supabase
        .from('relationships')
        .delete()
        .or(`source_id.eq.${entity.id},target_id.eq.${entity.id}`)

      // Soft delete the entity (set deleted_at)
      const { error } = await supabase
        .from('entities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', entity.id)

      if (error) throw error

      toast.success(`${entity.name} deleted`)
      onDelete?.(entity.id)
      setShowDeleteDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete entity')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="relative group">
        <Link href={`/dashboard/campaigns/${campaignId}/memory/${entity.id}`}>
          <div
            className={cn(
              'ca-card ca-card-interactive h-full p-4 border',
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

        {/* Delete Button - appears on hover */}
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800/80 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:border-red-500/50"
          title="Delete entity"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entity.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {entity.entity_type} and all its related facts and relationships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
