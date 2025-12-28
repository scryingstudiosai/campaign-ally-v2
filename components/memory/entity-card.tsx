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
  ChevronRight,
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
    chain?: {
      arc_id?: string
      arc_name?: string
      chain_position?: string
    }
    [key: string]: unknown
  }
}

interface EntityCardProps {
  entity: Entity
  campaignId: string
  onDelete?: (id: string) => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
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
  // Encounter subtypes
  encounter_default: {
    borderClass: 'border-red-500/30',
    glowClass: '',
    hoverClass: 'hover:border-red-500/50',
  },
  encounter_combat: {
    borderClass: 'border-red-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    hoverClass: 'hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]',
  },
  encounter_boss: {
    borderClass: 'border-orange-500/50',
    glowClass: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    hoverClass: 'hover:border-orange-500/70 hover:shadow-[0_0_25px_rgba(249,115,22,0.35)]',
  },
  encounter_ambush: {
    borderClass: 'border-yellow-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]',
    hoverClass: 'hover:border-yellow-500/60 hover:shadow-[0_0_20px_rgba(234,179,8,0.25)]',
  },
  encounter_defense: {
    borderClass: 'border-blue-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    hoverClass: 'hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]',
  },
  encounter_chase: {
    borderClass: 'border-cyan-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    hoverClass: 'hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]',
  },
  encounter_stealth: {
    borderClass: 'border-slate-500/40',
    glowClass: '',
    hoverClass: 'hover:border-slate-500/60',
  },
  encounter_puzzle: {
    borderClass: 'border-purple-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    hoverClass: 'hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]',
  },
  encounter_social: {
    borderClass: 'border-pink-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]',
    hoverClass: 'hover:border-pink-500/60 hover:shadow-[0_0_20px_rgba(236,72,153,0.25)]',
  },
  encounter_exploration: {
    borderClass: 'border-emerald-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    hoverClass: 'hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  },
  encounter_trap: {
    borderClass: 'border-amber-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    hoverClass: 'hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  },
  encounter_complex_trap: {
    borderClass: 'border-red-600/50',
    glowClass: 'shadow-[0_0_20px_rgba(220,38,38,0.2)]',
    hoverClass: 'hover:border-red-600/70 hover:shadow-[0_0_25px_rgba(220,38,38,0.35)]',
  },
  encounter_skill_challenge: {
    borderClass: 'border-teal-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(20,184,166,0.15)]',
    hoverClass: 'hover:border-teal-500/60 hover:shadow-[0_0_20px_rgba(20,184,166,0.25)]',
  },
  // Creature subtypes
  creature_default: {
    borderClass: 'border-rose-500/30',
    glowClass: '',
    hoverClass: 'hover:border-rose-500/50',
  },
  creature_beast: {
    borderClass: 'border-emerald-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    hoverClass: 'hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  },
  creature_humanoid: {
    borderClass: 'border-teal-500/30',
    glowClass: '',
    hoverClass: 'hover:border-teal-500/50',
  },
  creature_undead: {
    borderClass: 'border-purple-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    hoverClass: 'hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]',
  },
  creature_fiend: {
    borderClass: 'border-red-600/50',
    glowClass: 'shadow-[0_0_20px_rgba(220,38,38,0.2)]',
    hoverClass: 'hover:border-red-600/70 hover:shadow-[0_0_25px_rgba(220,38,38,0.35)]',
  },
  creature_celestial: {
    borderClass: 'border-amber-400/50',
    glowClass: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]',
    hoverClass: 'hover:border-amber-400/70 hover:shadow-[0_0_25px_rgba(251,191,36,0.35)]',
  },
  creature_dragon: {
    borderClass: 'border-orange-500/50',
    glowClass: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    hoverClass: 'hover:border-orange-500/70 hover:shadow-[0_0_25px_rgba(249,115,22,0.35)]',
  },
  creature_aberration: {
    borderClass: 'border-fuchsia-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(217,70,239,0.15)]',
    hoverClass: 'hover:border-fuchsia-500/60 hover:shadow-[0_0_20px_rgba(217,70,239,0.25)]',
  },
  creature_construct: {
    borderClass: 'border-slate-400/40',
    glowClass: 'shadow-[0_0_15px_rgba(148,163,184,0.15)]',
    hoverClass: 'hover:border-slate-400/60 hover:shadow-[0_0_20px_rgba(148,163,184,0.25)]',
  },
  creature_elemental: {
    borderClass: 'border-cyan-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    hoverClass: 'hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]',
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

export function EntityCard({
  entity,
  campaignId,
  onDelete,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: EntityCardProps): JSX.Element {
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault()
      onToggleSelect?.()
    }
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
        {selectionMode ? (
          <div
            className={cn(
              'ca-card ca-card-interactive h-full p-4 border cursor-pointer',
              entityStyle.borderClass,
              entityStyle.glowClass,
              entityStyle.hoverClass,
              isStub && 'border-dashed border-amber-500/50 opacity-90',
              isSelected && 'border-teal-500 bg-teal-500/10'
            )}
            onClick={handleCardClick}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-3 left-3 z-10">
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center',
                  isSelected
                    ? 'bg-teal-500 border-teal-500'
                    : 'border-slate-500 hover:border-teal-500'
                )}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            <div className="pl-8">
              <div className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-100 truncate">
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
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <EntityTypeBadge type={entity.entity_type} subtype={entity.sub_type} size="sm" />
                </div>
                {/* Quest Chain Breadcrumb (selection mode) */}
                {entity.entity_type === 'quest' && entity.attributes?.chain?.arc_name && (
                  <div className="flex items-center gap-1 text-xs mt-2">
                    <span className="text-amber-400/80">{entity.attributes.chain.arc_name}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span className="text-slate-400">{entity.attributes.chain.chain_position || 'Part 1'}</span>
                  </div>
                )}
              </div>
              <div className="pt-0">
                {entity.summary ? (
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {renderWithBold(entity.summary)}
                  </p>
                ) : (
                  <p className="text-sm text-slate-600 italic">
                    No description
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
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
                {/* Quest Chain Breadcrumb */}
                {entity.entity_type === 'quest' && entity.attributes?.chain?.arc_name && (
                  <div className="flex items-center gap-1 text-xs mt-2">
                    <span className="text-amber-400/80">{entity.attributes.chain.arc_name}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span className="text-slate-400">{entity.attributes.chain.chain_position || 'Part 1'}</span>
                  </div>
                )}
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
        )}

        {/* Delete Button - appears on hover (only when not in selection mode) */}
        {!selectionMode && (
          <button
            onClick={handleDeleteClick}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800/80 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:border-red-500/50"
            title="Delete entity"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
          </button>
        )}
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
