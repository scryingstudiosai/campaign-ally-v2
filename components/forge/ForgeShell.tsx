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
    <div className="min-h-screen text-foreground" style={{ backgroundColor: 'var(--ca-bg-base)' }}>
      {/* Header */}
      <header className="border-b px-6 py-4" style={{ borderColor: 'var(--ca-stroke)', backgroundColor: 'var(--ca-bg-raised)' }}>
        {backHref && (
          <Button variant="ghost" asChild className="mb-2 -ml-2">
            <Link href={backHref}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(180deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.1) 100%)' }}>
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{title}</h1>
            {description && (
              <p className="text-sm text-slate-400">{description}</p>
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
          className={`w-1/3 border-r p-6 min-h-[calc(100vh-100px)] transition-opacity ${
            showCommitPanel ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{ borderColor: 'var(--ca-stroke)', backgroundColor: 'var(--ca-bg-raised)' }}
        >
          {inputSection}
        </div>

        {/* MIDDLE: Output Section */}
        <div
          className={`flex-1 p-6 min-h-[calc(100vh-100px)] ${
            showCommitPanel ? 'w-1/3' : ''
          }`}
          style={{ backgroundColor: 'var(--ca-bg-sunken)' }}
        >
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-slate-400 animate-pulse">
                {status === 'validating' && 'Checking your world...'}
                {status === 'generating' && 'Forging new content...'}
                {status === 'scanning' && 'Scanning for discoveries...'}
              </p>
            </div>
          ) : isSaved ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-slate-200">Saved to Memory!</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">{outputSection}</div>
          )}
        </div>

        {/* RIGHT: Commit Panel (slides in during review) */}
        {showCommitPanel && commitPanel && (
          <div
            className="w-80 border-l p-4 animate-in slide-in-from-right duration-300"
            style={{ borderColor: 'var(--ca-stroke)', backgroundColor: 'var(--ca-bg-raised)' }}
          >
            {commitPanel}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ForgeStatus }): JSX.Element {
  const config: Record<ForgeStatus, { label: string; color: string }> = {
    idle: { label: 'Ready', color: 'text-slate-400' },
    validating: { label: 'Validating...', color: 'text-yellow-400' },
    generating: { label: 'Generating...', color: 'text-primary' },
    scanning: { label: 'Scanning...', color: 'text-purple-400' },
    review: { label: 'Review', color: 'text-amber-400' },
    saving: { label: 'Saving...', color: 'text-blue-400' },
    saved: { label: 'Saved!', color: 'text-green-400' },
    error: { label: 'Error', color: 'text-red-400' },
  }

  const { label, color } = config[status]

  return (
    <span className={`ca-inset px-3 py-1 text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

export { StatusBadge }
