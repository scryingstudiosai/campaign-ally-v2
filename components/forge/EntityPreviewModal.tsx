'use client'

import React, { useEffect, useState } from 'react'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface Entity {
  id: string
  name: string
  entity_type: string
  sub_type?: string
  summary?: string
  dm_slug?: string
  description?: string
  read_aloud?: string
  brain?: Record<string, unknown>
  soul?: Record<string, unknown>
  voice?: Record<string, unknown>
  attributes?: {
    summary?: string
    description?: string
    public_description?: string
    appearance?: string
    personality?: string
    motivation?: string
    voice_notes?: string
    origin_history?: string
    is_stub?: boolean
  }
}

interface EntityPreviewModalProps {
  entityId: string
  campaignId: string
  isOpen: boolean
  onClose: () => void
}

export function EntityPreviewModal({
  entityId,
  campaignId,
  isOpen,
  onClose,
}: EntityPreviewModalProps): JSX.Element | null {
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && entityId) {
      setLoading(true)
      supabase
        .from('entities')
        .select('*')
        .eq('id', entityId)
        .single()
        .then(({ data }) => {
          setEntity(data as Entity | null)
          setLoading(false)
        })
    }
  }, [isOpen, entityId, supabase])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-6 w-32 bg-slate-700 animate-pulse rounded" />
            ) : (
              <>
                <h2 className="text-lg font-bold text-white">{entity?.name}</h2>
                <Badge variant="outline" className="text-xs capitalize">
                  {entity?.entity_type}
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/campaigns/${campaignId}/memory/${entityId}`}
              target="_blank"
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </Link>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : entity ? (
            <div className="space-y-4">
              {/* Stub Warning */}
              {entity.attributes?.is_stub && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-sm">
                  ⚠️ Stub entity - needs details
                </div>
              )}

              {/* Summary / DM Slug (new architecture) */}
              {(entity.dm_slug || entity.summary || entity.attributes?.summary) && (
                <p className="text-slate-300 italic">
                  {entity.dm_slug || entity.summary || entity.attributes?.summary}
                </p>
              )}

              {/* Read Aloud (new architecture) */}
              {entity.read_aloud && (
                <div className="p-3 bg-amber-900/20 border-l-2 border-amber-500 rounded-r">
                  <p className="text-slate-200 italic">&ldquo;{entity.read_aloud}&rdquo;</p>
                </div>
              )}

              {/* Description */}
              {(entity.description ||
                entity.attributes?.description ||
                entity.attributes?.public_description) && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">
                    Description
                  </h3>
                  <p className="text-slate-300 whitespace-pre-wrap">
                    {entity.description ||
                      entity.attributes?.description ||
                      entity.attributes?.public_description}
                  </p>
                </div>
              )}

              {/* NPC Brain Psychology (new architecture) */}
              {entity.entity_type === 'npc' && entity.brain && (
                <>
                  {(entity.brain as { psychology?: { core_trait?: string } }).psychology?.core_trait && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 mb-1">
                        Core Trait
                      </h3>
                      <p className="text-slate-300">
                        {(entity.brain as { psychology: { core_trait: string } }).psychology.core_trait}
                      </p>
                    </div>
                  )}
                  {(entity.brain as { goals?: { primary?: string } }).goals?.primary && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 mb-1">
                        Goal
                      </h3>
                      <p className="text-slate-300">
                        {(entity.brain as { goals: { primary: string } }).goals.primary}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Location Soul (new architecture) */}
              {entity.entity_type === 'location' && entity.soul && (
                <>
                  {(entity.soul as { atmosphere?: string }).atmosphere && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 mb-1">
                        Atmosphere
                      </h3>
                      <p className="text-slate-300">
                        {(entity.soul as { atmosphere: string }).atmosphere}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Location Brain (new architecture) */}
              {entity.entity_type === 'location' && entity.brain && (
                <>
                  {(entity.brain as { purpose?: string }).purpose && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 mb-1">
                        Purpose
                      </h3>
                      <p className="text-slate-300">
                        {(entity.brain as { purpose: string }).purpose}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Appearance (legacy NPCs) */}
              {entity.attributes?.appearance && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">
                    Appearance
                  </h3>
                  <p className="text-slate-300">{entity.attributes.appearance}</p>
                </div>
              )}

              {/* Personality (legacy NPCs) */}
              {entity.attributes?.personality && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">
                    Personality
                  </h3>
                  <p className="text-slate-300">{entity.attributes.personality}</p>
                </div>
              )}

              {/* Motivation (legacy NPCs) */}
              {entity.attributes?.motivation && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">
                    Motivation
                  </h3>
                  <p className="text-slate-300">{entity.attributes.motivation}</p>
                </div>
              )}

              {/* Origin History (for Items) */}
              {entity.attributes?.origin_history && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">
                    Origin & History
                  </h3>
                  <p className="text-slate-300">{entity.attributes.origin_history}</p>
                </div>
              )}

              {/* Sub-type badge */}
              {entity.sub_type && (
                <div className="pt-2 border-t border-slate-700">
                  <Badge variant="outline" className="text-xs">
                    {entity.sub_type}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">Entity not found</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <Link
            href={`/dashboard/campaigns/${campaignId}/memory/${entityId}`}
            target="_blank"
            className="text-teal-400 hover:text-teal-300 text-sm flex items-center gap-1"
          >
            View full details
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
