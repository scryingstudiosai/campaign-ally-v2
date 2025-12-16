'use client'

import React, { useState } from 'react'
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PreValidationResult } from '@/types/forge'

interface PreValidationAlertProps {
  result: PreValidationResult
  onProceedAnyway: () => void
  onDismiss: () => void
}

export function PreValidationAlert({
  result,
  onProceedAnyway,
  onDismiss,
}: PreValidationAlertProps): JSX.Element | null {
  const [expanded, setExpanded] = useState(true)

  if (result.conflicts.length === 0 && result.warnings.length === 0) {
    return null
  }

  const hasErrors = result.conflicts.some((c) => c.severity === 'error')

  return (
    <div
      className={`rounded-lg border p-4 mb-4 ${
        hasErrors
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <AlertTriangle
            className={`w-5 h-5 mt-0.5 ${
              hasErrors ? 'text-red-400' : 'text-amber-400'
            }`}
          />
          <div>
            <p className="font-medium text-foreground">
              {hasErrors ? 'Issues Found' : 'Heads Up'}
            </p>
            <p className="text-sm text-muted-foreground">
              {result.conflicts.length} issue(s), {result.warnings.length}{' '}
              warning(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-2">
          {result.conflicts.map((conflict) => (
            <div key={conflict.id} className="text-sm p-2 rounded bg-muted/50">
              <p className="text-foreground">{conflict.description}</p>
              {conflict.existingEntityName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Related to: {conflict.existingEntityName}
                </p>
              )}
            </div>
          ))}

          {result.warnings.map((warning, i) => (
            <p key={i} className="text-sm text-muted-foreground">
              {warning}
            </p>
          ))}

          <div className="flex gap-2 mt-4">
            <Button onClick={onProceedAnyway} variant="outline" size="sm">
              Generate Anyway
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
