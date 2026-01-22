'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Crown, Sparkles } from 'lucide-react'
import type { PreValidationResult } from '@/types/forge'
import { PreValidationAlert } from '@/components/forge/PreValidationAlert'
import {
  DeityRank,
  DEITY_RANKS,
  DEITY_DOMAINS,
  DEITY_ALIGNMENTS,
} from '@/types/deity'

export interface DeityInputData {
  rank: DeityRank
  domains: string[]
  alignment?: string
  concept?: string
  pantheon?: string
  [key: string]: unknown
}

interface DeityInputFormProps {
  onSubmit: (data: DeityInputData) => void
  isLocked: boolean
  preValidation?: PreValidationResult | null
  onProceedAnyway?: () => void
  onDismissValidation?: () => void
}

export function DeityInputForm({
  onSubmit,
  isLocked,
  preValidation,
  onProceedAnyway,
  onDismissValidation,
}: DeityInputFormProps): JSX.Element {
  // Form state
  const [rank, setRank] = useState<DeityRank>('intermediate_deity')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [alignment, setAlignment] = useState<string>('')
  const [concept, setConcept] = useState('')
  const [pantheon, setPantheon] = useState('')

  const selectedRankInfo = DEITY_RANKS.find(r => r.value === rank)

  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter(d => d !== domain))
    } else if (selectedDomains.length < 3) {
      setSelectedDomains([...selectedDomains, domain])
    }
  }

  const canGenerate = selectedDomains.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!canGenerate) return

    const data: DeityInputData = {
      rank,
      domains: selectedDomains,
      alignment: alignment || undefined,
      concept: concept.trim() || undefined,
      pantheon: pantheon.trim() || undefined,
    }

    onSubmit(data)
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

      {/* Divine Rank */}
      <div className="space-y-2">
        <Label>Divine Rank</Label>
        <Select
          value={rank}
          onValueChange={(v: string) => setRank(v as DeityRank)}
          disabled={isLocked}
        >
          <SelectTrigger className="bg-slate-900/50 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEITY_RANKS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span>{r.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedRankInfo && (
          <p className="text-xs text-slate-500">{selectedRankInfo.description}</p>
        )}
      </div>

      {/* Domains */}
      <div className="space-y-2">
        <Label>Domains (select up to 3)</Label>
        <div className="flex flex-wrap gap-2">
          {DEITY_DOMAINS.map((domain) => (
            <Badge
              key={domain}
              variant={selectedDomains.includes(domain) ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                selectedDomains.includes(domain)
                  ? 'bg-purple-500/80 hover:bg-purple-600 border-purple-500'
                  : 'hover:bg-slate-700 border-slate-600'
              } ${isLocked ? 'pointer-events-none opacity-50' : ''}`}
              onClick={() => !isLocked && toggleDomain(domain)}
            >
              {domain}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Selected: {selectedDomains.length > 0 ? selectedDomains.join(', ') : 'None'}
        </p>
        {selectedDomains.length === 0 && (
          <p className="text-xs text-amber-400">Select at least one domain</p>
        )}
      </div>

      {/* Alignment */}
      <div className="space-y-2">
        <Label>Alignment (Optional)</Label>
        <Select
          value={alignment || '_auto'}
          onValueChange={(v) => setAlignment(v === '_auto' ? '' : v)}
          disabled={isLocked}
        >
          <SelectTrigger className="bg-slate-900/50 border-slate-700">
            <SelectValue placeholder="Let AI decide..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_auto">Let AI decide</SelectItem>
            {DEITY_ALIGNMENTS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pantheon */}
      <div className="space-y-2">
        <Label>Pantheon (Optional)</Label>
        <Input
          placeholder="The Old Gods, Elven Pantheon, etc."
          value={pantheon}
          onChange={(e) => setPantheon(e.target.value)}
          disabled={isLocked}
          className="bg-slate-900/50 border-slate-700"
        />
        <p className="text-xs text-slate-500">Group this deity with others</p>
      </div>

      {/* Concept */}
      <div className="space-y-2">
        <Label>Concept (Optional)</Label>
        <Textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Describe themes, origins, or specific aspects you want for this deity..."
          disabled={isLocked}
          className="min-h-[100px] bg-slate-900/50 border-slate-700"
        />
      </div>

      {/* Generate Button */}
      <Button
        type="submit"
        disabled={isLocked || !canGenerate}
        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        size="lg"
      >
        {isLocked ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Summoning Divine Power...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Forge Deity
          </>
        )}
      </Button>
    </form>
  )
}
