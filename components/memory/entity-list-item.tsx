'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EntityTypeBadge } from './entity-type-badge'
import { Badge } from '@/components/ui/badge'
import { Entity } from './entity-card'
import { cn } from '@/lib/utils'
import { renderWithBold } from '@/lib/text-utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Skull,
  AlertTriangle,
  Archive,
  EyeOff,
  Star,
  Crown,
  Sparkles,
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

interface EntityListItemProps {
  entity: Entity
  campaignId: string
  onDelete?: (id: string) => void
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

export function EntityListItem({ entity, campaignId, onDelete }: EntityListItemProps): JSX.Element {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const statusConfig = STATUS_CONFIG[entity.status]
  const importanceConfig = IMPORTANCE_CONFIG[entity.importance_tier]

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
        <Link
          href={`/dashboard/campaigns/${campaignId}/memory/${entity.id}`}
          className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors"
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

          {/* Delete button spacer */}
          <div className="w-8 flex-shrink-0" />
        </Link>

        {/* Delete Button - appears on hover */}
        <button
          onClick={handleDeleteClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-slate-800/80 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:border-red-500/50"
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

export function EntityListHeader(): JSX.Element {
  return (
    <div className="flex items-center gap-4 px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground">
      <div className="flex-1">Name</div>
      <div className="w-24 flex-shrink-0 hidden sm:block">Type</div>
      <div className="w-24 flex-shrink-0 hidden md:block">Status</div>
      <div className="w-24 flex-shrink-0 hidden lg:block">Importance</div>
      <div className="w-20 flex-shrink-0 hidden sm:block">Updated</div>
      <div className="w-8 flex-shrink-0" /> {/* Actions spacer */}
    </div>
  )
}
