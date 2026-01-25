'use client'

import { useEffect, useRef } from 'react'
import { X, ExternalLink, MapPin, User, Skull, Scroll, Package, Castle, Swords, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LivingEntity } from '@/types/living-entity'

interface EntityQuickViewProps {
  entity: LivingEntity
  campaignId: string
  isOpen: boolean
  onClose: () => void
  onOpenFull: () => void
  onAddMap?: () => void
}

const ENTITY_TYPE_CONFIG: Record<
  string,
  { icon: typeof User; label: string; color: string; bgColor: string }
> = {
  npc: { icon: User, label: 'NPC', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  creature: { icon: Skull, label: 'Creature', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  location: { icon: MapPin, label: 'Location', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  quest: { icon: Scroll, label: 'Quest', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  item: { icon: Package, label: 'Item', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  faction: { icon: Castle, label: 'Faction', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  encounter: { icon: Swords, label: 'Encounter', color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
  player: { icon: Users, label: 'Player', color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
}

export function EntityQuickView({
  entity,
  campaignId,
  isOpen,
  onClose,
  onOpenFull,
  onAddMap,
}: EntityQuickViewProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const config = ENTITY_TYPE_CONFIG[entity.entity_type] || {
    icon: User,
    label: entity.entity_type,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
  }

  const Icon = config.icon
  const description = entity.dm_slug || entity.read_aloud
  const imageUrl = entity.attributes?.image_url as string | undefined
  const hasMap = entity.entity_type === 'location' && entity.attributes?.map_image_url

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-md mx-4 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with optional image */}
        {imageUrl && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={imageUrl}
              alt={entity.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors backdrop-blur-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className={cn('p-5', imageUrl && '-mt-8 relative')}>
          {/* Type Badge */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3',
              config.bgColor,
              config.color
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="capitalize">{config.label}</span>
            {entity.sub_type && (
              <>
                <span className="opacity-50">•</span>
                <span className="capitalize">{entity.sub_type}</span>
              </>
            )}
          </div>

          {/* Name */}
          <h2 className="text-xl font-bold text-white mb-2">{entity.name}</h2>

          {/* Description */}
          {description && (
            <p className="text-sm text-slate-400 line-clamp-4 mb-4">{description}</p>
          )}

          {/* Quick Stats for specific entity types */}
          {entity.entity_type === 'npc' && entity.attributes && (
            <div className="flex flex-wrap gap-2 mb-4">
              {entity.attributes.race && (
                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                  {entity.attributes.race as string}
                </span>
              )}
              {entity.attributes.class && (
                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                  {entity.attributes.class as string}
                </span>
              )}
              {entity.attributes.occupation && (
                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                  {entity.attributes.occupation as string}
                </span>
              )}
            </div>
          )}

          {entity.entity_type === 'creature' && entity.attributes && (
            <div className="flex flex-wrap gap-2 mb-4">
              {entity.attributes.creature_type && (
                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                  {entity.attributes.creature_type as string}
                </span>
              )}
              {entity.attributes.challenge_rating && (
                <span className="px-2 py-1 bg-red-900/30 rounded text-xs text-red-400">
                  CR {entity.attributes.challenge_rating as string}
                </span>
              )}
            </div>
          )}

          {entity.entity_type === 'item' && entity.attributes && (
            <div className="flex flex-wrap gap-2 mb-4">
              {entity.attributes.rarity && (
                <span className={cn(
                  'px-2 py-1 rounded text-xs',
                  entity.attributes.rarity === 'legendary' && 'bg-amber-900/30 text-amber-400',
                  entity.attributes.rarity === 'rare' && 'bg-blue-900/30 text-blue-400',
                  entity.attributes.rarity === 'uncommon' && 'bg-green-900/30 text-green-400',
                  (!entity.attributes.rarity || entity.attributes.rarity === 'common') && 'bg-slate-800 text-slate-300'
                )}>
                  {(entity.attributes.rarity as string)?.charAt(0).toUpperCase() + (entity.attributes.rarity as string)?.slice(1) || 'Common'}
                </span>
              )}
            </div>
          )}

          {/* Status */}
          {entity.status && entity.status !== 'active' && (
            <div className="mb-4">
              <span
                className={cn(
                  'px-2 py-1 rounded text-xs',
                  entity.status === 'stub' && 'bg-slate-700 text-slate-400',
                  entity.status === 'archived' && 'bg-slate-800 text-slate-500'
                )}
              >
                {entity.status === 'stub' ? 'Quick Reference' : 'Archived'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onOpenFull}
              className="flex-1 gap-2"
              variant="default"
            >
              <ExternalLink className="w-4 h-4" />
              View Details
            </Button>

            {onAddMap && (
              <Button
                onClick={onAddMap}
                variant="outline"
                className="gap-2"
              >
                <MapPin className="w-4 h-4" />
                Add Map
              </Button>
            )}
          </div>

          {/* Map preview for locations with maps */}
          {hasMap && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-500 mb-2">Location Map</div>
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-800">
                <img
                  src={entity.attributes?.map_image_url as string}
                  alt={`Map of ${entity.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
