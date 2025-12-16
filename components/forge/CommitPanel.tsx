'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  AlertTriangle,
  Plus,
  Link2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Discovery, Conflict, ScanResult } from '@/types/forge'

interface CommitPanelProps {
  scanResult: ScanResult
  onDiscoveryAction: (
    discoveryId: string,
    action: Discovery['status'],
    linkedEntityId?: string
  ) => void
  onConflictResolution: (
    conflictId: string,
    resolution: Conflict['resolution']
  ) => void
  onCommit: () => void
  onDiscard: () => void
  isCommitting?: boolean
}

export function CommitPanel({
  scanResult,
  onDiscoveryAction,
  onConflictResolution,
  onCommit,
  onDiscard,
  isCommitting = false,
}: CommitPanelProps): JSX.Element {
  const { discoveries, conflicts, canonScore } = scanResult

  const pendingDiscoveries = discoveries.filter((d) => d.status === 'pending')
  const pendingConflicts = conflicts.filter((c) => c.resolution === 'pending')
  const canCommit =
    pendingDiscoveries.length === 0 && pendingConflicts.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
          Review & Commit
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Review AI discoveries before saving
        </p>
      </div>

      {/* Canon Score */}
      <CanonScoreBadge score={canonScore} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-4 my-4">
        {/* Conflicts Section */}
        {conflicts.length > 0 && (
          <section>
            <h3 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Conflicts ({conflicts.length})
            </h3>
            <div className="space-y-2">
              {conflicts.map((conflict) => (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  onResolve={(resolution) =>
                    onConflictResolution(conflict.id, resolution)
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Discoveries Section */}
        {discoveries.length > 0 && (
          <section>
            <h3 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Discoveries ({discoveries.length})
            </h3>
            <div className="space-y-2">
              {discoveries.map((discovery) => (
                <DiscoveryCard
                  key={discovery.id}
                  discovery={discovery}
                  onAction={(action, linkedId) =>
                    onDiscoveryAction(discovery.id, action, linkedId)
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {conflicts.length === 0 && discoveries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No issues found!</p>
            <p className="text-xs">Content is ready to save.</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-border pt-4 space-y-2">
        <Button
          onClick={onCommit}
          disabled={!canCommit || isCommitting}
          className="w-full"
        >
          {isCommitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save to Memory'
          )}
        </Button>
        <Button
          onClick={onDiscard}
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
        >
          Discard
        </Button>
        {!canCommit && (
          <p className="text-xs text-amber-500 text-center">
            Resolve all items above to save
          </p>
        )}
      </div>
    </div>
  )
}

function CanonScoreBadge({
  score,
}: {
  score: 'high' | 'medium' | 'low'
}): JSX.Element {
  const config = {
    high: {
      label: 'High Canon Score',
      description: 'Uses existing world elements',
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      icon: '✓',
    },
    medium: {
      label: 'Medium Canon Score',
      description: 'Some new elements discovered',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: '⚠',
    },
    low: {
      label: 'Low Canon Score',
      description: 'Many new or conflicting elements',
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: '!',
    },
  }

  const { label, description, color, icon } = config[score]

  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs opacity-75">{description}</p>
        </div>
      </div>
    </div>
  )
}

function ConflictCard({
  conflict,
  onResolve,
}: {
  conflict: Conflict
  onResolve: (resolution: Conflict['resolution']) => void
}): JSX.Element {
  const [expanded, setExpanded] = useState(true)
  const isResolved = conflict.resolution !== 'pending'

  return (
    <div
      className={`rounded-lg border p-3 ${
        isResolved
          ? 'bg-muted/50 border-border'
          : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {conflict.description}
          </p>
          {conflict.existingEntityName && (
            <p className="text-xs text-muted-foreground mt-1">
              Existing: {conflict.existingEntityName}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && !isResolved && (
        <div className="mt-3 flex flex-wrap gap-1">
          {conflict.suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onResolve(mapSuggestionToResolution(suggestion))}
              className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {isResolved && (
        <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
          <Check className="w-3 h-3" /> Resolved: {conflict.resolution}
        </p>
      )}
    </div>
  )
}

function DiscoveryCard({
  discovery,
  onAction,
}: {
  discovery: Discovery
  onAction: (action: Discovery['status'], linkedEntityId?: string) => void
}): JSX.Element {
  const isHandled = discovery.status !== 'pending'

  return (
    <div
      className={`rounded-lg border p-3 ${
        isHandled
          ? 'bg-muted/50 border-border'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            &quot;{discovery.text}&quot;
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Suggested type: {discovery.suggestedType}
          </p>
        </div>
      </div>

      {!isHandled && (
        <div className="mt-3 flex gap-1">
          <button
            onClick={() => onAction('create_stub')}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          >
            <Plus className="w-3 h-3" /> Create Stub
          </button>
          <button
            onClick={() => onAction('link_existing')}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-colors"
          >
            <Link2 className="w-3 h-3" /> Link
          </button>
          <button
            onClick={() => onAction('ignore')}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-3 h-3" /> Ignore
          </button>
        </div>
      )}

      {isHandled && (
        <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
          <Check className="w-3 h-3" /> {formatStatus(discovery.status)}
        </p>
      )}
    </div>
  )
}

function mapSuggestionToResolution(
  suggestion: string
): Conflict['resolution'] {
  const lower = suggestion.toLowerCase()
  if (lower.includes('keep new') || lower.includes('replace')) return 'keep_new'
  if (lower.includes('keep existing') || lower.includes('edit existing'))
    return 'keep_existing'
  if (lower.includes('merge')) return 'merge'
  if (lower.includes('rename')) return 'rename'
  return 'ignore'
}

function formatStatus(status: Discovery['status']): string {
  switch (status) {
    case 'create_stub':
      return 'Will create stub'
    case 'link_existing':
      return 'Will link to existing'
    case 'ignore':
      return 'Ignored'
    default:
      return status
  }
}

export { CanonScoreBadge, ConflictCard, DiscoveryCard }
