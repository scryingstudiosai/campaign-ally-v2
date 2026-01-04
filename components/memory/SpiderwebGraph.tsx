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
import {
  CATEGORY_COLORS,
  getRelationshipLineStyle,
} from '@/lib/relationships/types'

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
  visibility?: 'public' | 'dm_only' | 'revealable'
  // New Sprint 7 fields
  category?: string
  type_key?: string
  descriptor?: string
  strength?: number
  volatility?: number
  state?: string
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
  visibility?: 'public' | 'dm_only' | 'revealable'
  isSecret: boolean // Derived from visibility === 'dm_only'
  color: string
  // New Sprint 7 styling fields
  category: string
  descriptor?: string
  strength: number
  volatility: number
  state: string
  strokeWidth: number
  dashArray: number[] | null
  opacity: number
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

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  // Handle rgba strings
  if (hex.startsWith('rgba')) {
    return hex.replace(/[\d.]+\)$/, `${alpha})`)
  }
  // Handle hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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
  const [searchHighlightedNodes, setSearchHighlightedNodes] = useState<Set<string>>(new Set())
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [connectedNodes, setConnectedNodes] = useState<Set<string>>(new Set())
  const [connectedLinks, setConnectedLinks] = useState<Set<string>>(new Set())
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [showSecrets, setShowSecrets] = useState(true)

  // Sync entities state when props change (e.g., when filters change in parent)
  useEffect(() => {
    setEntities(initialEntities)
  }, [initialEntities])

  // Sync relationships state when props change
  useEffect(() => {
    setRelationships(initialRelationships)
  }, [initialRelationships])

  // Debug: Log relationship count on mount and when relationships change
  useEffect(() => {
    console.log('[SpiderwebGraph] Props received - entities:', initialEntities.length, 'relationships:', initialRelationships.length)
    console.log('[SpiderwebGraph] State - entities:', entities.length, 'relationships:', relationships.length)
    if (initialRelationships.length > 0) {
      console.log('[SpiderwebGraph] Sample relationship:', initialRelationships[0])
    } else {
      console.warn('[SpiderwebGraph] WARNING: No relationships passed to component!')
    }
  }, [initialEntities.length, initialRelationships.length, entities.length, relationships.length])

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
          console.log('[SpiderwebGraph] Relationship change:', payload.eventType, payload)
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
      setSearchHighlightedNodes(new Set())
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
    setSearchHighlightedNodes(matchingIds)
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
      const isSearchHighlighted = searchHighlightedNodes.has(entity.id)

      return {
        id: entity.id,
        name: entity.name,
        entityType: entity.entity_type,
        subType: entity.sub_type,
        summary: entity.summary,
        imageUrl: entity.image_url,
        status: entity.status,
        importance: entity.importance_tier,
        color: colorConfig.fill,
        val: isSearchHighlighted ? size * 1.5 : size,
        highlighted: isSearchHighlighted,
      }
    })

    // Build links - only include relationships where both entities are visible
    const filteredRelationships = relationships.filter(r => {
      const hasSource = entityIds.has(r.source_id)
      const hasTarget = entityIds.has(r.target_id)
      return hasSource && hasTarget
    })

    // Filter dm_only relationships if not showing secrets
    // DM always has the option to show all, default is to show all
    const visibleRelationships = showSecrets
      ? filteredRelationships
      : filteredRelationships.filter(r => r.visibility === 'public')

    console.log('[SpiderwebGraph] Building graph - Nodes:', nodes.length, 'Links:', visibleRelationships.length)
    console.log('[SpiderwebGraph] Total relationships before filter:', filteredRelationships.length)

    const links: GraphLink[] = visibleRelationships.map(rel => {
      const isSecret = rel.visibility === 'dm_only' || rel.visibility === 'revealable'

      // Get category (with fallback to mapping old relationship_type)
      const category = rel.category || mapOldTypeToCategory(rel.relationship_type) || 'other'

      // Get styling from new Sprint 7 fields
      const lineStyle = getRelationshipLineStyle(
        rel.strength ?? 3,
        rel.volatility ?? 3,
        rel.state ?? 'active'
      )

      // Get color from category
      const categoryColors = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
      const color = categoryColors?.line || '#6b7280'

      return {
        id: rel.id,
        source: rel.source_id,
        target: rel.target_id,
        relationshipType: rel.descriptor || rel.type_key || rel.relationship_type || 'unknown',
        description: rel.description,
        visibility: rel.visibility,
        isSecret,
        color: isSecret ? '#fbbf24' : color, // Secret relationships stay amber
        // New styling fields
        category,
        descriptor: rel.descriptor,
        strength: rel.strength ?? 3,
        volatility: rel.volatility ?? 3,
        state: rel.state ?? 'active',
        strokeWidth: lineStyle.strokeWidth,
        dashArray: lineStyle.strokeDasharray ? lineStyle.strokeDasharray.split(',').map(Number) : null,
        opacity: lineStyle.opacity,
      }
    })

    return { nodes, links }
  }, [entities, relationships, selectedTypes, searchHighlightedNodes, showSecrets])

  // Map old relationship types to new categories (fallback for legacy data)
  function mapOldTypeToCategory(oldType?: string): string {
    if (!oldType) return 'other'

    const typeMap: Record<string, string> = {
      // Alliance
      'friend': 'alliance',
      'ally': 'alliance',
      'lover': 'alliance',
      'patron': 'alliance',
      'protector': 'alliance',
      'client': 'alliance',
      'ward': 'alliance',

      // Conflict
      'enemy': 'conflict',
      'rival': 'conflict',
      'nemesis': 'conflict',
      'opposes': 'conflict',
      'hunter': 'conflict',
      'prey': 'conflict',
      'betrayer': 'conflict',
      'betrayed': 'conflict',

      // Kinship
      'parent': 'kinship',
      'child': 'kinship',
      'sibling': 'kinship',
      'spouse': 'kinship',
      'creator': 'kinship',
      'creation': 'kinship',
      'ancestor': 'kinship',
      'descendant': 'kinship',

      // Organization
      'leader': 'organization',
      'follower': 'organization',
      'member': 'organization',
      'member_of': 'organization',
      'boss': 'organization',
      'employee': 'organization',
      'mentor': 'organization',
      'student': 'organization',
      'partner': 'organization',

      // Geography
      'located_in': 'geography',
      'contains': 'geography',
      'controls': 'geography',
      'controlled_by': 'geography',
      'borders': 'geography',

      // Other
      'knows': 'other',
      'connected': 'other',
      'owes_debt': 'other',
      'owed_by': 'other',
    }

    return typeMap[oldType.toLowerCase()] || 'other'
  }

  // Node canvas rendering - hide labels by default, show on hover
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const nodeSize = node.val || 8
    const isHovered = hoveredNode?.id === node.id
    const isConnectedToHovered = connectedNodes.has(node.id)
    const isSearchHighlighted = node.highlighted

    // Determine opacity based on hover state
    let opacity = 1
    if (hoveredNode && !isHovered && !isConnectedToHovered) {
      opacity = 0.15 // Dim unrelated nodes when hovering
    } else if (searchHighlightedNodes.size > 0 && !isSearchHighlighted) {
      opacity = 0.3
    }

    // Draw node circle
    ctx.beginPath()
    ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false)
    ctx.fillStyle = hexToRgba(node.color, opacity)
    ctx.fill()

    // Draw border
    if (isHovered) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3 / globalScale
      ctx.stroke()
    } else if (isConnectedToHovered) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2 / globalScale
      ctx.stroke()
    } else if (isSearchHighlighted) {
      ctx.strokeStyle = '#14b8a6'
      ctx.lineWidth = 3 / globalScale
      ctx.stroke()
    } else {
      ctx.strokeStyle = hexToRgba('#ffffff', opacity * 0.5)
      ctx.lineWidth = 1 / globalScale
      ctx.stroke()
    }

    // ONLY show label for hovered node or connected nodes (when something is hovered)
    if (isHovered || isConnectedToHovered) {
      const fontSize = Math.max(14 / globalScale, 4)
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      // Measure text for background
      const textWidth = ctx.measureText(node.name).width
      const padding = 4 / globalScale
      const bgHeight = fontSize + padding * 2

      // Draw background for readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.fillRect(
        node.x! - textWidth / 2 - padding,
        node.y! + nodeSize + 2,
        textWidth + padding * 2,
        bgHeight
      )

      // Draw text
      ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'
      ctx.fillText(node.name, node.x!, node.y! + nodeSize + 4)
    }
    // Show labels for search-highlighted nodes even when not hovering
    else if (isSearchHighlighted && !hoveredNode) {
      const fontSize = Math.max(12 / globalScale, 3)
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillText(node.name, node.x!, node.y! + nodeSize + 2)
      ctx.fillStyle = '#14b8a6'
      ctx.fillText(node.name, node.x!, node.y! + nodeSize + 1)
    }
  }, [hoveredNode, connectedNodes, searchHighlightedNodes])

  // Link canvas rendering - uses Sprint 7 styling fields
  const paintLink = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const source = link.source as GraphNode
    const target = link.target as GraphNode

    if (!source.x || !source.y || !target.x || !target.y) return

    const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source
    const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target
    const linkKey = `${sourceId}-${targetId}`
    const reverseLinkKey = `${targetId}-${sourceId}`
    const isHighlighted = connectedLinks.has(linkKey) || connectedLinks.has(reverseLinkKey)

    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.lineTo(target.x, target.y)

    if (isHighlighted) {
      // Bright, visible line for highlighted relationships - use Sprint 7 styling
      if (link.isSecret) {
        ctx.setLineDash([5 / globalScale, 5 / globalScale])
        ctx.strokeStyle = '#fbbf24'
      } else {
        // Use volatility-based dash pattern
        if (link.dashArray) {
          ctx.setLineDash(link.dashArray.map(d => d / globalScale))
        } else {
          ctx.setLineDash([])
        }
        ctx.strokeStyle = link.color
      }
      // Use strength-based line width (boosted when highlighted)
      ctx.lineWidth = Math.max(2, link.strokeWidth * 1.5) / globalScale
      ctx.globalAlpha = 1
    } else if (!hoveredNode) {
      // Subtle lines when nothing is hovered - still show category colors
      if (link.isSecret) {
        ctx.setLineDash([5 / globalScale, 5 / globalScale])
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)'
      } else {
        // Use volatility-based dash pattern even when not highlighted
        if (link.dashArray) {
          ctx.setLineDash(link.dashArray.map(d => d / globalScale))
        } else {
          ctx.setLineDash([])
        }
        // Use category color with reduced opacity
        ctx.strokeStyle = link.color
      }
      // Use strength-based line width
      ctx.lineWidth = link.strokeWidth / globalScale
      ctx.globalAlpha = link.opacity * 0.4 // Dimmed but visible
    } else {
      // Very dim when hovering but not connected
      ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 0.3 / globalScale
      ctx.globalAlpha = 1
    }

    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // Show relationship type label on highlighted links
    if (isHighlighted && link.relationshipType) {
      const midX = (source.x + target.x) / 2
      const midY = (source.y + target.y) / 2

      const fontSize = Math.max(10 / globalScale, 3)
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Format label
      const label = link.relationshipType.replace(/_/g, ' ')
      const textWidth = ctx.measureText(label).width
      const padding = 3 / globalScale

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.fillRect(
        midX - textWidth / 2 - padding,
        midY - fontSize / 2 - padding,
        textWidth + padding * 2,
        fontSize + padding * 2
      )

      // Text
      ctx.fillStyle = link.isSecret ? '#fbbf24' : '#ffffff'
      ctx.fillText(label, midX, midY)
    }
  }, [hoveredNode, connectedLinks])

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    if (onEntityClick) {
      onEntityClick(node.id)
    }
  }, [onEntityClick])

  // Handle node hover - track connected nodes and links
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node)

    if (node) {
      // Find all connected nodes and links
      const nodeIds = new Set<string>()
      const linkKeys = new Set<string>()

      nodeIds.add(node.id)

      graphData.links.forEach((link) => {
        const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source
        const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target

        if (sourceId === node.id) {
          nodeIds.add(targetId as string)
          linkKeys.add(`${sourceId}-${targetId}`)
        } else if (targetId === node.id) {
          nodeIds.add(sourceId as string)
          linkKeys.add(`${sourceId}-${targetId}`)
        }
      })

      setConnectedNodes(nodeIds)
      setConnectedLinks(linkKeys)
    } else {
      setConnectedNodes(new Set())
      setConnectedLinks(new Set())
    }

    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default'
    }
  }, [graphData.links])

  // Get connections for hovered node
  const hoveredNodeConnections = useMemo(() => {
    if (!hoveredNode) return []

    return graphData.links
      .filter(link => {
        const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source
        const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target
        return sourceId === hoveredNode.id || targetId === hoveredNode.id
      })
      .map(link => {
        const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source
        const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target
        const otherId = sourceId === hoveredNode.id ? targetId : sourceId
        const otherNode = graphData.nodes.find(n => n.id === otherId)
        const isOutgoing = sourceId === hoveredNode.id

        return {
          relationshipType: link.relationshipType,
          otherNode,
          isOutgoing,
          isSecret: link.isSecret,
        }
      })
  }, [hoveredNode, graphData])

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
    setSearchHighlightedNodes(new Set())
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
              Show DM-only relationships
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

      {/* Hover Info Panel with Connections */}
      {hoveredNode && (
        <Card className="absolute bottom-4 left-4 z-10 p-4 bg-stone-900/95 border-stone-700 max-w-sm backdrop-blur">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2"
              style={{
                backgroundColor: ENTITY_COLORS[hoveredNode.entityType]?.bg || ENTITY_COLORS.npc.bg,
                borderColor: ENTITY_COLORS[hoveredNode.entityType]?.border || ENTITY_COLORS.npc.border,
              }}
            >
              <div style={{ color: ENTITY_COLORS[hoveredNode.entityType]?.fill || ENTITY_COLORS.npc.fill }}>
                {(() => {
                  const Icon = ENTITY_ICONS[hoveredNode.entityType] || Users
                  return <Icon className="w-4 h-4" />
                })()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-stone-100 truncate text-lg">{hoveredNode.name}</h4>
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

          {/* Connections */}
          {hoveredNodeConnections.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-700">
              <p className="text-xs text-stone-500 mb-2">
                {hoveredNodeConnections.length} connection{hoveredNodeConnections.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {hoveredNodeConnections.slice(0, 10).map((conn, idx) => (
                  <div key={idx} className="text-xs flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: ENTITY_COLORS[conn.otherNode?.entityType || 'npc']?.fill,
                      }}
                    />
                    <span className={cn(
                      "text-stone-500",
                      conn.isSecret && "text-amber-500"
                    )}>
                      {conn.relationshipType?.replace(/_/g, ' ')}
                      {conn.isSecret && ' 🔒'}
                    </span>
                    <span className="text-stone-300 truncate">{conn.otherNode?.name}</span>
                  </div>
                ))}
                {hoveredNodeConnections.length > 10 && (
                  <p className="text-xs text-stone-500">
                    +{hoveredNodeConnections.length - 10} more...
                  </p>
                )}
              </div>
            </div>
          )}
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
              <span>Relationships:</span>
              <span className="font-medium text-stone-200">{stats.totalLinks}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <div className="absolute bottom-20 right-4 z-10">
        <Card className="p-3 bg-stone-900/90 border-stone-700 max-h-[400px] overflow-y-auto">
          <div className="text-xs font-medium text-stone-400 mb-2">Entity Types</div>
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
          </div>

          {/* Relationship Categories */}
          <div className="pt-2 border-t border-stone-700 mt-2">
            <div className="text-xs font-medium text-stone-400 mb-1.5">Relationships</div>
            <div className="space-y-1">
              {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
                <div key={category} className="flex items-center gap-2">
                  <div
                    className="w-4 h-0.5"
                    style={{ backgroundColor: colors.line }}
                  />
                  <span className="text-xs text-stone-300 capitalize">{category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line Styles */}
          <div className="pt-2 border-t border-stone-700 mt-2 space-y-1">
            <div className="text-xs font-medium text-stone-400 mb-1">Line Styles</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-stone-400" />
              <span className="text-xs text-stone-500">Solid = Stable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 border-t-2 border-dashed border-stone-400" />
              <span className="text-xs text-stone-500">Dashed = Volatile</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 border-t-2 border-dashed border-amber-400" />
              <span className="text-xs text-stone-500">🔒 DM Only</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-stone-600 italic">Thickness = Strength</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="text-xs text-stone-500 bg-stone-900/80 px-3 py-1.5 rounded-full">
          Hover over nodes to see names and connections
        </div>
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
