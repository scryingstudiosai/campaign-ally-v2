'use client'

import React, { useState } from 'react'
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react'
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
      className={`mb-4 ${
        hasErrors
          ? 'ca-alert ca-alert--error'
          : 'ca-alert ca-alert--warning'
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
            <p className="font-medium text-slate-200">
              {hasErrors ? 'Issues Found' : 'Heads Up'}
            </p>
            <p className="text-sm text-slate-400">
              {result.conflicts.length} issue(s), {result.warnings.length}{' '}
              warning(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onDismiss}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-2">
          {result.conflicts.map((conflict) => (
            <div key={conflict.id} className="ca-panel p-2 text-sm">
              <p className="text-slate-200">{conflict.description}</p>
              {conflict.existingEntityName && (
                <p className="text-xs text-slate-500 mt-1">
                  Related to: {conflict.existingEntityName}
                </p>
              )}
            </div>
          ))}

          {result.warnings.map((warning, i) => (
            <p key={i} className="text-sm text-slate-400">
              {warning}
            </p>
          ))}

          <div className="flex gap-2 mt-4">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onProceedAnyway()
              }}
              className="ca-btn ca-btn-sm relative z-10"
              type="button"
            >
              Generate Anyway
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
