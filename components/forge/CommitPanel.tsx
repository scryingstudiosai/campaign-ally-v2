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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Discovery, Conflict, ScanResult, EntityType } from '@/types/forge'

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'npc', label: 'NPC' },
  { value: 'location', label: 'Location' },
  { value: 'item', label: 'Item' },
  { value: 'creature', label: 'Creature' },
  { value: 'faction', label: 'Faction' },
  { value: 'other', label: 'Other' },
]

interface CommitPanelProps {
  scanResult: ScanResult
  onDiscoveryAction: (
    discoveryId: string,
    action: Discovery['status'],
    linkedEntityId?: string
  ) => void
  onDiscoveryTypeChange?: (discoveryId: string, newType: EntityType) => void
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
  onDiscoveryTypeChange,
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
                  onTypeChange={
                    onDiscoveryTypeChange
                      ? (newType) => onDiscoveryTypeChange(discovery.id, newType)
                      : undefined
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
      alertClass: 'ca-alert ca-alert--success',
      icon: '✓',
    },
    medium: {
      label: 'Medium Canon Score',
      description: 'Some new elements discovered',
      alertClass: 'ca-alert ca-alert--warning',
      icon: '⚠',
    },
    low: {
      label: 'Low Canon Score',
      description: 'Many new or conflicting elements',
      alertClass: 'ca-alert ca-alert--error',
      icon: '!',
    },
  }

  const { label, description, alertClass, icon } = config[score]

  return (
    <div className={alertClass}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
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
      className={`ca-panel p-3 ${
        isResolved
          ? ''
          : 'border-l-2 border-red-500/50'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-200">
            {conflict.description}
          </p>
          {conflict.existingEntityName && (
            <p className="text-xs text-slate-500 mt-1">
              Existing: {conflict.existingEntityName}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && !isResolved && (
        <div className="mt-3 flex flex-wrap gap-1">
          {conflict.suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onResolve(mapSuggestionToResolution(suggestion))}
              className="ca-btn ca-btn-sm"
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
  onTypeChange,
}: {
  discovery: Discovery
  onAction: (action: Discovery['status'], linkedEntityId?: string) => void
  onTypeChange?: (newType: EntityType) => void
}): JSX.Element {
  const isPending = discovery.status === 'pending'
  const isCreateStub = discovery.status === 'create_stub'
  const isIgnored = discovery.status === 'ignore'
  const isLinked = discovery.status === 'link_existing'

  return (
    <div
      className={`ca-panel p-3 ${
        isCreateStub
          ? 'border-l-2 border-green-500/50'
          : isIgnored
          ? 'border-l-2 border-slate-600/50 opacity-60'
          : isPending
          ? 'border-l-2 border-amber-500/50'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isIgnored ? 'text-slate-400' : 'text-slate-200'}`}>
            &quot;{discovery.text}&quot;
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">Type:</span>
            {onTypeChange && (isPending || isIgnored) ? (
              <Select
                value={discovery.suggestedType}
                onValueChange={(value) => onTypeChange(value as EntityType)}
              >
                <SelectTrigger className="h-6 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-slate-500">
                {ENTITY_TYPES.find((t) => t.value === discovery.suggestedType)?.label || discovery.suggestedType}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pending: show all 3 buttons */}
      {isPending && (
        <div className="mt-3 flex gap-1">
          <button
            onClick={() => onAction('create_stub')}
            className="ca-btn ca-btn-primary ca-btn-sm flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Create Stub
          </button>
          <button
            onClick={() => onAction('link_existing')}
            className="ca-btn ca-btn-sm flex items-center gap-1"
          >
            <Link2 className="w-3 h-3" /> Link
          </button>
          <button
            onClick={() => onAction('ignore')}
            className="ca-btn ca-btn-ghost ca-btn-sm flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Ignore
          </button>
        </div>
      )}

      {/* Ignored: show Create Stub button to opt-in */}
      {isIgnored && (
        <div className="mt-3 flex items-center gap-2">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <X className="w-3 h-3" /> Ignored
          </p>
          <button
            onClick={() => onAction('create_stub')}
            className="ca-btn ca-btn-sm flex items-center gap-1 text-xs"
          >
            <Plus className="w-3 h-3" /> Create Stub
          </button>
        </div>
      )}

      {/* Create Stub: show confirmation with option to ignore */}
      {isCreateStub && (
        <div className="mt-3 flex items-center gap-2">
          <p className="text-xs text-green-400 flex items-center gap-1">
            <Check className="w-3 h-3" /> Will create stub
          </p>
          <button
            onClick={() => onAction('ignore')}
            className="ca-btn ca-btn-ghost ca-btn-sm flex items-center gap-1 text-xs"
          >
            <X className="w-3 h-3" /> Ignore
          </button>
        </div>
      )}

      {/* Linked: show confirmation */}
      {isLinked && (
        <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
          <Link2 className="w-3 h-3" /> {formatStatus(discovery.status)}
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
