'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { ForceGraphMethods } from 'react-force-graph-2d'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  X,
  Users,
  MapPin,
  Sword,
  Flag,
  Scroll,
  Skull,
  Package,
  User,
} from 'lucide-react'

// Types
interface Entity {
  id: string
  name: string
  entity_type: string
  sub_type?: string
  summary?: string
  image_url?: string
  status?: string
  importance_tier?: string
}

interface Relationship {
  id: string
  source_id: string
  target_id: string
  relationship_type: string
  description?: string
  is_secret?: boolean
}

interface GraphNode {
  id: string
  name: string
  entityType: string
  subType?: string
  summary?: string
  imageUrl?: string
  status?: string
  importance?: string
  color: string
  val: number // Node size
  highlighted?: boolean
  // Force graph internal properties
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number
  fy?: number
}

interface GraphLink {
  id: string
  source: string | GraphNode
  target: string | GraphNode
  relationshipType: string
  description?: string
  isSecret?: boolean
  color: string
}

interface SpiderwebGraphProps {
  campaignId: string
  initialEntities: Entity[]
  initialRelationships: Relationship[]
  onEntityClick?: (entityId: string) => void
  className?: string
}

// Entity type configuration
const ENTITY_COLORS: Record<string, { bg: string; border: string; fill: string }> = {
  npc: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', fill: '#3b82f6' },
  player: { bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', fill: '#eab308' },
  location: { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', fill: '#f59e0b' },
  item: { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', fill: '#10b981' },
  faction: { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7', fill: '#a855f7' },
  quest: { bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899', fill: '#ec4899' },
  encounter: { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', fill: '#ef4444' },
  creature: { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', fill: '#f97316' },
}

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  npc: Users,
  player: User,
  location: MapPin,
  item: Package,
  faction: Flag,
  quest: Scroll,
  encounter: Sword,
  creature: Skull,
}

// Node size based on importance
const IMPORTANCE_SIZES: Record<string, number> = {
  legendary: 16,
  major: 12,
  minor: 8,
  background: 5,
}

export function SpiderwebGraph({
  campaignId,
  initialEntities,
  initialRelationships,
  onEntityClick,
  className,
}: SpiderwebGraphProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<ForceGraphMethods<any, any> | undefined>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // State
  const [entities, setEntities] = useState<Entity[]>(initialEntities)
  const [relationships, setRelationships] = useState<Relationship[]>(initialRelationships)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set())
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [showSecrets, setShowSecrets] = useState(true)

  // Available entity types from data
  const availableTypes = useMemo(() => {
    const types = new Set(entities.map(e => e.entity_type))
    return Array.from(types).sort()
  }, [entities])

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height: Math.max(height, 400) })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Supabase real-time subscriptions
  useEffect(() => {
    const supabase = createClient()

    // Subscribe to entity changes
    const entitiesChannel = supabase
      .channel('entities-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entities',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEntities(prev => [...prev, payload.new as Entity])
          } else if (payload.eventType === 'UPDATE') {
            setEntities(prev =>
              prev.map(e => (e.id === payload.new.id ? (payload.new as Entity) : e))
            )
          } else if (payload.eventType === 'DELETE') {
            setEntities(prev => prev.filter(e => e.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // Subscribe to relationship changes
    const relationshipsChannel = supabase
      .channel('relationships-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'relationships',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRelationships(prev => [...prev, payload.new as Relationship])
          } else if (payload.eventType === 'UPDATE') {
            setRelationships(prev =>
              prev.map(r => (r.id === payload.new.id ? (payload.new as Relationship) : r))
            )
          } else if (payload.eventType === 'DELETE') {
            setRelationships(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(entitiesChannel)
      supabase.removeChannel(relationshipsChannel)
    }
  }, [campaignId])

  // Search highlighting
  useEffect(() => {
    if (!searchTerm.trim()) {
      setHighlightedNodes(new Set())
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const matchingIds = new Set(
      entities
        .filter(e =>
          e.name.toLowerCase().includes(searchLower) ||
          e.summary?.toLowerCase().includes(searchLower)
        )
        .map(e => e.id)
    )
    setHighlightedNodes(matchingIds)
  }, [searchTerm, entities])

  // Build graph data
  const graphData = useMemo(() => {
    // Filter entities by selected types
    const filteredEntities = selectedTypes.size === 0
      ? entities
      : entities.filter(e => selectedTypes.has(e.entity_type))

    const entityIds = new Set(filteredEntities.map(e => e.id))

    // Build nodes
    const nodes: GraphNode[] = filteredEntities.map(entity => {
      const colorConfig = ENTITY_COLORS[entity.entity_type] || ENTITY_COLORS.npc
      const size = IMPORTANCE_SIZES[entity.importance_tier || 'minor'] || 8
      const isHighlighted = highlightedNodes.has(entity.id)

      return {
        id: entity.id,
        name: entity.name,
        entityType: entity.entity_type,
        subType: entity.sub_type,
        summary: entity.summary,
        imageUrl: entity.image_url,
        status: entity.status,
        importance: entity.importance_tier,
        color: isHighlighted ? '#14b8a6' : colorConfig.fill,
        val: isHighlighted ? size * 1.5 : size,
        highlighted: isHighlighted,
      }
    })

    // Build links - only include relationships where both entities are visible
    const filteredRelationships = relationships.filter(
      r => entityIds.has(r.source_id) && entityIds.has(r.target_id)
    )

    // Filter secret relationships if not showing
    const visibleRelationships = showSecrets
      ? filteredRelationships
      : filteredRelationships.filter(r => !r.is_secret)

    const links: GraphLink[] = visibleRelationships.map(rel => ({
      id: rel.id,
      source: rel.source_id,
      target: rel.target_id,
      relationshipType: rel.relationship_type,
      description: rel.description,
      isSecret: rel.is_secret,
      color: rel.is_secret ? 'rgba(251, 191, 36, 0.6)' : 'rgba(255, 255, 255, 0.3)',
    }))

    return { nodes, links }
  }, [entities, relationships, selectedTypes, highlightedNodes, showSecrets])

  // Node canvas rendering
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name
    const fontSize = Math.max(12 / globalScale, 3)
    const nodeSize = node.val || 8

    // Draw node circle
    ctx.beginPath()
    ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false)

    // Fill with entity color
    ctx.fillStyle = node.color
    ctx.fill()

    // Border
    if (node.highlighted) {
      ctx.strokeStyle = '#14b8a6'
      ctx.lineWidth = 3 / globalScale
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1 / globalScale
    }
    ctx.stroke()

    // Draw label
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // Text shadow for readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillText(label, node.x!, node.y! + nodeSize + 2)

    // Actual text
    ctx.fillStyle = node.highlighted ? '#14b8a6' : '#e5e5e5'
    ctx.fillText(label, node.x!, node.y! + nodeSize + 1)
  }, [])

  // Link canvas rendering
  const paintLink = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const source = link.source as GraphNode
    const target = link.target as GraphNode

    if (!source.x || !source.y || !target.x || !target.y) return

    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.lineTo(target.x, target.y)

    if (link.isSecret) {
      // Dashed line for secret relationships
      ctx.setLineDash([5 / globalScale, 5 / globalScale])
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'
    } else {
      ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    }

    ctx.lineWidth = 1 / globalScale
    ctx.stroke()
    ctx.setLineDash([])
  }, [])

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    if (onEntityClick) {
      onEntityClick(node.id)
    }
  }, [onEntityClick])

  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node)
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default'
    }
  }, [])

  // Toggle type filter
  const toggleTypeFilter = useCallback((type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom * 1.3, 300)
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom / 1.3, 300)
    }
  }, [])

  const handleFitView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50)
    }
  }, [])

  const handleReset = useCallback(() => {
    setSearchTerm('')
    setSelectedTypes(new Set())
    setHighlightedNodes(new Set())
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50)
    }
  }, [])

  // Stats
  const stats = useMemo(() => {
    return {
      totalNodes: graphData.nodes.length,
      totalLinks: graphData.links.length,
      typeBreakdown: availableTypes.reduce((acc, type) => {
        acc[type] = entities.filter(e => e.entity_type === type).length
        return acc
      }, {} as Record<string, number>),
    }
  }, [graphData, availableTypes, entities])

  return (
    <div ref={containerRef} className={cn('relative w-full h-full min-h-[400px] bg-stone-950', className)}>
      {/* Controls Panel */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 max-w-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 bg-stone-900/90 border-stone-700 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type Filters */}
        <Card className="p-3 bg-stone-900/90 border-stone-700">
          <div className="text-xs font-medium text-stone-400 mb-2">Filter by Type</div>
          <div className="flex flex-wrap gap-1.5">
            {availableTypes.map(type => {
              const colorConfig = ENTITY_COLORS[type] || ENTITY_COLORS.npc
              const isActive = selectedTypes.size === 0 || selectedTypes.has(type)
              const Icon = ENTITY_ICONS[type] || Users

              return (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all',
                    'border',
                    isActive
                      ? 'opacity-100'
                      : 'opacity-40 hover:opacity-60'
                  )}
                  style={{
                    backgroundColor: isActive ? colorConfig.bg : 'transparent',
                    borderColor: colorConfig.border,
                    color: colorConfig.fill,
                  }}
                >
                  <Icon className="w-3 h-3" />
                  <span className="capitalize">{type}</span>
                  <span className="text-stone-400">({stats.typeBreakdown[type] || 0})</span>
                </button>
              )
            })}
          </div>

          {/* Show secrets toggle */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-700">
            <Checkbox
              id="show-secrets"
              checked={showSecrets}
              onCheckedChange={(checked) => setShowSecrets(checked === true)}
            />
            <label htmlFor="show-secrets" className="text-xs text-stone-400 cursor-pointer">
              Show secret relationships
            </label>
          </div>
        </Card>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          className="bg-stone-900/90 border-stone-700 hover:bg-stone-800"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="bg-stone-900/90 border-stone-700 hover:bg-stone-800"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleFitView}
          className="bg-stone-900/90 border-stone-700 hover:bg-stone-800"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="bg-stone-900/90 border-stone-700 hover:bg-stone-800"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Hover Info Panel */}
      {hoveredNode && (
        <Card className="absolute bottom-4 left-4 z-10 p-4 bg-stone-900/95 border-stone-700 max-w-xs">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: ENTITY_COLORS[hoveredNode.entityType]?.bg || ENTITY_COLORS.npc.bg,
                borderColor: ENTITY_COLORS[hoveredNode.entityType]?.border || ENTITY_COLORS.npc.border,
                borderWidth: 2,
              }}
            >
              <div
              style={{ color: ENTITY_COLORS[hoveredNode.entityType]?.fill || ENTITY_COLORS.npc.fill }}
            >
              {(() => {
                const Icon = ENTITY_ICONS[hoveredNode.entityType] || Users
                return <Icon className="w-4 h-4" />
              })()}
            </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-stone-100 truncate">{hoveredNode.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs capitalize" style={{
                  borderColor: ENTITY_COLORS[hoveredNode.entityType]?.border,
                  color: ENTITY_COLORS[hoveredNode.entityType]?.fill,
                }}>
                  {hoveredNode.entityType}
                </Badge>
                {hoveredNode.importance && (
                  <Badge variant="outline" className="text-xs capitalize text-stone-400">
                    {hoveredNode.importance}
                  </Badge>
                )}
              </div>
              {hoveredNode.summary && (
                <p className="text-xs text-stone-400 mt-2 line-clamp-2">{hoveredNode.summary}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Stats Panel */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="p-3 bg-stone-900/90 border-stone-700">
          <div className="text-xs text-stone-400">
            <div className="flex items-center justify-between gap-4">
              <span>Nodes:</span>
              <span className="font-medium text-stone-200">{stats.totalNodes}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Links:</span>
              <span className="font-medium text-stone-200">{stats.totalLinks}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <div className="absolute bottom-20 right-4 z-10">
        <Card className="p-3 bg-stone-900/90 border-stone-700">
          <div className="text-xs font-medium text-stone-400 mb-2">Legend</div>
          <div className="space-y-1.5">
            {availableTypes.slice(0, 6).map(type => {
              const colorConfig = ENTITY_COLORS[type] || ENTITY_COLORS.npc
              return (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colorConfig.fill }}
                  />
                  <span className="text-xs text-stone-300 capitalize">{type}</span>
                </div>
              )
            })}
            <div className="pt-2 border-t border-stone-700 mt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-white/30" />
                <span className="text-xs text-stone-400">Relationship</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-400/60" />
                <span className="text-xs text-stone-400">Secret</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Graph */}
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#0c0a09"
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          const nodeSize = (node as GraphNode).val || 8
          ctx.beginPath()
          ctx.arc(node.x!, node.y!, nodeSize + 5, 0, 2 * Math.PI, false)
          ctx.fillStyle = color
          ctx.fill()
        }}
        linkCanvasObject={paintLink}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        linkDirectionalParticles={0}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      {/* Empty state */}
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-stone-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No entities to display</p>
            <p className="text-sm mt-1">Create some entities in the Forge to see them here</p>
          </div>
        </div>
      )}
    </div>
  )
}
