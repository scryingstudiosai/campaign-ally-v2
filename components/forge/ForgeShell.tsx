'use client'

import React from 'react'
import Link from 'next/link'
import { Loader2, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ForgeStatus } from '@/types/forge'

interface ForgeShellProps {
  title: string
  description?: string
  status: ForgeStatus
  inputSection: React.ReactNode
  outputSection: React.ReactNode
  commitPanel?: React.ReactNode
  backHref?: string
  backLabel?: string
}

export function ForgeShell({
  title,
  description,
  status,
  inputSection,
  outputSection,
  commitPanel,
  backHref,
  backLabel = 'Back',
}: ForgeShellProps): JSX.Element {
  const isGenerating =
    status === 'generating' || status === 'scanning' || status === 'validating'
  const showCommitPanel = status === 'review'
  const isSaved = status === 'saved'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        {backHref && (
          <Button variant="ghost" asChild className="mb-2 -ml-2">
            <Link href={backHref}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {/* Status indicator */}
          <div className="ml-auto">
            <StatusBadge status={status} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex">
        {/* LEFT: Input Section */}
        <div
          className={`w-1/3 border-r border-border p-6 min-h-[calc(100vh-100px)] transition-opacity ${
            showCommitPanel ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {inputSection}
        </div>

        {/* MIDDLE: Output Section */}
        <div
          className={`flex-1 p-6 min-h-[calc(100vh-100px)] bg-muted/30 ${
            showCommitPanel ? 'w-1/3' : ''
          }`}
        >
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground animate-pulse">
                {status === 'validating' && 'Checking your world...'}
                {status === 'generating' && 'Forging new content...'}
                {status === 'scanning' && 'Scanning for discoveries...'}
              </p>
            </div>
          ) : isSaved ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-foreground">Saved to Memory!</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">{outputSection}</div>
          )}
        </div>

        {/* RIGHT: Commit Panel (slides in during review) */}
        {showCommitPanel && commitPanel && (
          <div className="w-80 border-l border-border bg-background p-4 animate-in slide-in-from-right duration-300">
            {commitPanel}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ForgeStatus }): JSX.Element {
  const config: Record<ForgeStatus, { label: string; color: string }> = {
    idle: { label: 'Ready', color: 'bg-muted text-muted-foreground' },
    validating: {
      label: 'Validating...',
      color: 'bg-yellow-500/20 text-yellow-400',
    },
    generating: {
      label: 'Generating...',
      color: 'bg-primary/20 text-primary',
    },
    scanning: {
      label: 'Scanning...',
      color: 'bg-purple-500/20 text-purple-400',
    },
    review: { label: 'Review', color: 'bg-amber-500/20 text-amber-400' },
    saving: { label: 'Saving...', color: 'bg-blue-500/20 text-blue-400' },
    saved: { label: 'Saved!', color: 'bg-green-500/20 text-green-400' },
    error: { label: 'Error', color: 'bg-red-500/20 text-red-400' },
  }

  const { label, color } = config[status]

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

export { StatusBadge }
