'use client'

import { useState, useMemo } from 'react'
import { getEntityStyle } from '@/lib/constants/entity-styles'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown, Search, Eye, EyeOff, GripVertical, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { LivingEntity } from '@/types/living-entity'
import type { MapMarker } from './AtlasMap'

interface AtlasSidebarProps {
  currentLocation: LivingEntity
  allLocations: LivingEntity[]
  markers: MapMarker[]
  isEditMode: boolean
  onFlyTo: (x: number, y: number) => void
  onSelectLocation: (location: LivingEntity) => void
  onToggleVisibility: (locationId: string, isRevealed: boolean) => void
  onReparent: (locationId: string, newParentId: string | null) => void
}

export function AtlasSidebar({
  currentLocation,
  allLocations,
  markers,
  isEditMode,
  onFlyTo,
  onSelectLocation,
  onToggleVisibility,
  onReparent,
}: AtlasSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([currentLocation.id]))
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Build tree structure - get root locations (no parent)
  const locationTree = useMemo(() => {
    const buildTree = (parentId: string | null): LivingEntity[] => {
      return allLocations
        .filter((loc) => {
          const locParentId = loc.attributes?.parent_entity_id as string | undefined
          return locParentId === parentId
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    }

    return buildTree(null)
  }, [allLocations])

  // Filter by search
  const filteredLocations = useMemo(() => {
    if (!searchQuery) return null
    return allLocations.filter((loc) => loc.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery, allLocations])

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Handle drag & drop for reparenting
  const handleDragStart = (e: React.DragEvent, locationId: string) => {
    setDraggedId(locationId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetParentId: string | null) => {
    e.preventDefault()
    if (draggedId && draggedId !== targetParentId) {
      onReparent(draggedId, targetParentId)
    }
    setDraggedId(null)
  }

  // Recursive tree node component
  const TreeNode = ({ location, depth = 0 }: { location: LivingEntity; depth?: number }) => {
    const children = allLocations.filter((l) => {
      const parentId = l.attributes?.parent_entity_id as string | undefined
      return parentId === location.id
    })
    const hasChildren = children.length > 0
    const isExpanded = expandedNodes.has(location.id)
    const isCurrent = location.id === currentLocation.id
    const style = getEntityStyle(location.entity_type)
    const isRevealed = location.status !== 'stub'

    return (
      <div>
        <div
          className={cn(
            'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer group',
            'hover:bg-slate-800/50',
            isCurrent && 'bg-teal-600/20 border-l-2 border-teal-500',
            draggedId === location.id && 'opacity-50'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          draggable={isEditMode}
          onDragStart={(e) => handleDragStart(e, location.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, location.id)}
        >
          {/* Drag Handle (Edit Mode) */}
          {isEditMode && (
            <GripVertical className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab" />
          )}

          {/* Expand/Collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(location.id)
            }}
            className="w-5 h-5 flex items-center justify-center"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )
            ) : (
              <span className="w-4" />
            )}
          </button>

          {/* Icon */}
          <MapPin className={cn('w-4 h-4', style.text)} />

          {/* Name */}
          <button
            onClick={() => {
              // If has map coordinates, fly to them
              const mapX = location.attributes?.map_x as number | undefined
              const mapY = location.attributes?.map_y as number | undefined
              if (mapX && mapY) {
                onFlyTo(mapX, mapY)
              }
              onSelectLocation(location)
            }}
            className="flex-1 text-left text-sm truncate"
          >
            {location.name}
          </button>

          {/* Visibility Toggle (Edit Mode) */}
          {isEditMode && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleVisibility(location.id, !isRevealed)
              }}
              className={cn(
                'p-1 rounded opacity-0 group-hover:opacity-100',
                isRevealed ? 'text-emerald-400' : 'text-slate-600'
              )}
            >
              {isRevealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {children.map((child) => (
              <TreeNode key={child.id} location={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-72 border-l border-slate-800 bg-slate-900/50 flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
            className="pl-9 bg-slate-800/50 border-slate-700"
          />
        </div>
      </div>

      {/* Tree / Search Results */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredLocations ? (
          // Search results (flat list)
          filteredLocations.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No locations found</p>
          ) : (
            <div className="space-y-1">
              {filteredLocations.map((loc) => {
                const mapX = loc.attributes?.map_x as number | undefined
                const mapY = loc.attributes?.map_y as number | undefined
                return (
                  <button
                    key={loc.id}
                    onClick={() => {
                      if (mapX && mapY) {
                        onFlyTo(mapX, mapY)
                      }
                      onSelectLocation(loc)
                      setSearchQuery('')
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-800 text-left"
                  >
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm truncate">{loc.name}</span>
                  </button>
                )
              })}
            </div>
          )
        ) : (
          // Tree view
          <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, null)}>
            {locationTree.map((location) => (
              <TreeNode key={location.id} location={location} />
            ))}
          </div>
        )}
      </div>

      {/* Current Location Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <p className="text-xs text-slate-500 mb-1">Current View</p>
        <p className="font-medium text-white truncate">{currentLocation.name}</p>
        <p className="text-xs text-slate-400">{currentLocation.sub_type}</p>
      </div>
    </div>
  )
}
