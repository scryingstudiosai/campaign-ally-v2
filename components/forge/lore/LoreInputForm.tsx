'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Scroll, Wand2 } from 'lucide-react'
import type { PreValidationResult } from '@/types/forge'
import { PreValidationAlert } from '@/components/forge/PreValidationAlert'
import { EntityMultiSelect } from '@/components/entities/EntityMultiSelect'
import { EVENT_SUB_TYPES, EventSubType } from '@/types/event'
import { TIMEFRAMES } from '@/lib/forge/prompts/lore-prompts'

export interface LoreInputData {
  subType: EventSubType
  timeframe: string
  description?: string
  involvedEntityIds?: string[]
  surpriseMe?: boolean
  [key: string]: unknown
}

interface LoreInputFormProps {
  onSubmit: (data: LoreInputData) => void
  isLocked: boolean
  preValidation?: PreValidationResult | null
  onProceedAnyway?: () => void
  onDismissValidation?: () => void
  campaignId: string
  initialValues?: {
    subType?: EventSubType
    description?: string
  }
}

export function LoreInputForm({
  onSubmit,
  isLocked,
  preValidation,
  onProceedAnyway,
  onDismissValidation,
  campaignId,
  initialValues,
}: LoreInputFormProps): JSX.Element {
  // Form state
  const [subType, setSubType] = useState<EventSubType>(initialValues?.subType || 'historical_event')
  const [timeframe, setTimeframe] = useState<string>('ancient')
  const [involvedEntities, setInvolvedEntities] = useState<string[]>([])
  const [description, setDescription] = useState(initialValues?.description || '')
  const [surpriseMe, setSurpriseMe] = useState(false)

  const selectedTypeInfo = EVENT_SUB_TYPES.find(t => t.value === subType)
  const selectedTimeframe = TIMEFRAMES.find(t => t.value === timeframe)

  // Check if we can generate (either description, surpriseMe, or entities selected)
  const canGenerate = description.trim() || surpriseMe || involvedEntities.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!canGenerate) return

    const data: LoreInputData = {
      subType,
      timeframe,
      description: description.trim() || undefined,
      involvedEntityIds: involvedEntities.length > 0 ? involvedEntities : undefined,
      surpriseMe,
    }

    onSubmit(data)
  }

  const handleSurpriseMe = () => {
    setDescription('')
    setSurpriseMe(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pre-validation Alert */}
      {preValidation &&
        (preValidation.conflicts.length > 0 || preValidation.warnings.length > 0) && (
        <PreValidationAlert
          result={preValidation}
          onProceedAnyway={onProceedAnyway || (() => {})}
          onDismiss={onDismissValidation || (() => {})}
        />
      )}

      {/* Event Type & Timeframe Row */}
      <div className="grid grid-cols-1 gap-4">
        {/* Event Type */}
        <div className="space-y-2">
          <Label>Event Type</Label>
          <Select
            value={subType}
            onValueChange={(v: string) => setSubType(v as EventSubType)}
            disabled={isLocked}
          >
            <SelectTrigger className="bg-slate-900/50 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_SUB_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTypeInfo && (
            <p className="text-xs text-slate-500">{selectedTypeInfo.description}</p>
          )}
        </div>

        {/* Timeframe */}
        <div className="space-y-2">
          <Label>When in History?</Label>
          <Select
            value={timeframe}
            onValueChange={setTimeframe}
            disabled={isLocked}
          >
            <SelectTrigger className="bg-slate-900/50 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((tf) => (
                <SelectItem key={tf.value} value={tf.value}>
                  <span className="flex items-center gap-2">
                    <span>{tf.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTimeframe && (
            <p className="text-xs text-slate-500">{selectedTimeframe.hint}</p>
          )}
        </div>
      </div>

      {/* Involved Entities */}
      <div className="space-y-2">
        <Label>Who&apos;s Involved? (Optional)</Label>
        <EntityMultiSelect
          campaignId={campaignId}
          entityTypes={['npc', 'faction', 'location', 'deity']}
          selected={involvedEntities}
          onChange={setInvolvedEntities}
          placeholder="Search NPCs, factions, locations, deities..."
        />
        <p className="text-xs text-slate-500">
          Select existing entities to connect this lore to your world
        </p>
      </div>

      {/* Description with Surprise Me */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>What Happened? (Optional)</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSurpriseMe}
            disabled={isLocked}
            className={`text-xs gap-1.5 ${surpriseMe ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
          >
            <Wand2 className="w-3 h-3" />
            Surprise Me
          </Button>
        </div>
        <Textarea
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setDescription(e.target.value)
            if (e.target.value) setSurpriseMe(false)
          }}
          placeholder={surpriseMe
            ? "AI will generate based on your campaign's tone and themes..."
            : "Describe the event, or leave blank for AI to create one..."
          }
          disabled={isLocked}
          className={`min-h-[100px] bg-slate-900/50 border-slate-700 ${surpriseMe ? 'bg-amber-500/5 border-amber-500/20' : ''}`}
        />
        {surpriseMe && (
          <p className="text-xs text-amber-400/80">
            AI will create an unexpected event that fits your campaign
          </p>
        )}
      </div>

      {/* Generate Button */}
      <Button
        type="submit"
        disabled={isLocked || !canGenerate}
        className="w-full"
        size="lg"
      >
        {isLocked ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Weaving History...
          </>
        ) : (
          <>
            <Scroll className="w-4 h-4 mr-2" />
            Forge Lore
          </>
        )}
      </Button>

      {!canGenerate && (
        <p className="text-xs text-center text-slate-500">
          Describe the event, select involved entities, or click &quot;Surprise Me&quot;
        </p>
      )}
    </form>
  )
}
