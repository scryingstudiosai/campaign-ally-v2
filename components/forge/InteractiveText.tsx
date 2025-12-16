'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, Link2, X } from 'lucide-react'
import { EntityPreviewModal } from './EntityPreviewModal'
import type { ScanResult, Discovery } from '@/types/forge'

interface InteractiveTextProps {
  text: string
  scanResult: ScanResult
  campaignId: string
  onDiscoveryAction?: (discoveryId: string, action: Discovery['status']) => void
  renderBold?: boolean
}

export function InteractiveText({
  text,
  scanResult,
  campaignId,
  onDiscoveryAction,
  renderBold = true,
}: InteractiveTextProps): JSX.Element {
  // State for entity preview modal
  const [previewEntity, setPreviewEntity] = useState<{
    id: string
    name: string
  } | null>(null)

  // Build a map of all text ranges that need special rendering
  const segments = buildSegments(text, scanResult)

  return (
    <TooltipProvider>
      <p className="leading-relaxed text-muted-foreground">
        {segments.map((segment, index) => {
          // Plain text
          if (segment.type === 'plain') {
            return renderBold ? (
              <RenderBoldText key={index} text={segment.text} />
            ) : (
              <span key={index}>{segment.text}</span>
            )
          }

          // Existing entity - clickable to open preview modal
          if (segment.type === 'existing') {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      setPreviewEntity({
                        id: segment.entityId!,
                        name: segment.text,
                      })
                    }
                    className="text-primary hover:text-primary/80 underline decoration-primary/50 hover:decoration-primary transition-colors cursor-pointer"
                  >
                    {segment.text}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Click to preview {segment.entityType}: {segment.text}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          }

          // Discovery - gold dotted underline
          if (segment.type === 'discovery') {
            const discovery = scanResult.discoveries.find(
              (d) => d.id === segment.discoveryId
            )
            const isHandled = discovery?.status !== 'pending'

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <span
                    className={`
                      border-b-2 border-dotted cursor-help transition-colors
                      ${
                        isHandled
                          ? 'border-muted-foreground/50 text-muted-foreground'
                          : 'border-amber-500 hover:bg-amber-500/10'
                      }
                    `}
                  >
                    {segment.text}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="p-0">
                  {isHandled ? (
                    <p className="text-xs p-2 text-muted-foreground">
                      {discovery?.status === 'create_stub' && '✓ Will create stub'}
                      {discovery?.status === 'link_existing' &&
                        '✓ Linked to existing'}
                      {discovery?.status === 'ignore' && '✓ Ignored'}
                    </p>
                  ) : (
                    <DiscoveryTooltip
                      discovery={discovery!}
                      onAction={(action) =>
                        onDiscoveryAction?.(segment.discoveryId!, action)
                      }
                    />
                  )}
                </TooltipContent>
              </Tooltip>
            )
          }

          return <span key={index}>{segment.text}</span>
        })}
      </p>

      {/* Entity Preview Modal */}
      <EntityPreviewModal
        entityId={previewEntity?.id || ''}
        campaignId={campaignId}
        isOpen={!!previewEntity}
        onClose={() => setPreviewEntity(null)}
      />
    </TooltipProvider>
  )
}

// Render text with **bold** markers
function RenderBoldText({ text }: { text: string }): JSX.Element {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

interface Segment {
  type: 'plain' | 'existing' | 'discovery'
  text: string
  entityId?: string
  entityType?: string
  discoveryId?: string
}

function buildSegments(text: string, scanResult: ScanResult): Segment[] {
  const segments: Segment[] = []

  // Combine all markers and sort by position
  const markers: Array<{
    start: number
    end: number
    type: 'existing' | 'discovery'
    data: ScanResult['existingEntityMentions'][0] | Discovery
  }> = []

  for (const entity of scanResult.existingEntityMentions) {
    markers.push({
      start: entity.startIndex,
      end: entity.endIndex,
      type: 'existing',
      data: entity,
    })
  }

  for (const discovery of scanResult.discoveries) {
    // Find the discovery text in the content
    const index = text.indexOf(discovery.text)
    if (index !== -1) {
      markers.push({
        start: index,
        end: index + discovery.text.length,
        type: 'discovery',
        data: discovery,
      })
    }
  }

  // Sort by start position
  markers.sort((a, b) => a.start - b.start)

  // Remove overlapping markers (keep the first one)
  const filteredMarkers: typeof markers = []
  let lastEnd = 0
  for (const marker of markers) {
    if (marker.start >= lastEnd) {
      filteredMarkers.push(marker)
      lastEnd = marker.end
    }
  }

  // Build segments
  let currentIndex = 0
  for (const marker of filteredMarkers) {
    // Add plain text before this marker
    if (marker.start > currentIndex) {
      segments.push({
        type: 'plain',
        text: text.substring(currentIndex, marker.start),
      })
    }

    // Add the marker segment
    if (marker.type === 'existing') {
      const entity = marker.data as ScanResult['existingEntityMentions'][0]
      segments.push({
        type: 'existing',
        text: text.substring(marker.start, marker.end),
        entityId: entity.id,
        entityType: entity.type,
      })
    } else {
      const discovery = marker.data as Discovery
      segments.push({
        type: 'discovery',
        text: text.substring(marker.start, marker.end),
        discoveryId: discovery.id,
      })
    }

    currentIndex = marker.end
  }

  // Add remaining plain text
  if (currentIndex < text.length) {
    segments.push({
      type: 'plain',
      text: text.substring(currentIndex),
    })
  }

  return segments
}

function DiscoveryTooltip({
  discovery,
  onAction,
}: {
  discovery: Discovery
  onAction: (action: Discovery['status']) => void
}): JSX.Element {
  return (
    <div className="p-2 space-y-2">
      <p className="text-xs text-amber-400 font-medium">
        New: {discovery.suggestedType}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onAction('create_stub')}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-3 h-3" /> Create
        </button>
        <button
          onClick={() => onAction('link_existing')}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80"
        >
          <Link2 className="w-3 h-3" /> Link
        </button>
        <button
          onClick={() => onAction('ignore')}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80"
        >
          <X className="w-3 h-3" /> Ignore
        </button>
      </div>
    </div>
  )
}
