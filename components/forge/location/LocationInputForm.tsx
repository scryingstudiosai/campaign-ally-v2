'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Map, Mountain, Castle, Building2, DoorOpen, Landmark, Skull, Dices, X } from 'lucide-react'
import type { PreValidationResult } from '@/types/forge'
import { PreValidationAlert } from '@/components/forge/PreValidationAlert'
import { QuickReference } from '@/components/forge/QuickReference'

export interface LocationInputData {
  name?: string
  concept: string
  locationType: 'region' | 'settlement' | 'district' | 'building' | 'room' | 'landmark' | 'dungeon'
  dangerLevel: string
  atmosphere: string
  parentLocationId?: string
  referencedEntityIds?: string[]
  [key: string]: unknown
}

interface LocationInputFormProps {
  onSubmit: (data: LocationInputData) => void
  isLocked: boolean
  preValidation?: PreValidationResult | null
  onProceedAnyway?: () => void
  onDismissValidation?: () => void
  campaignId: string
  initialValues?: {
    name?: string
    concept?: string
    locationType?: string
  }
}

const LOCATION_TYPES = [
  { value: 'region', label: 'Region', icon: Mountain, description: 'Kingdoms, territories, wilderness' },
  { value: 'settlement', label: 'Settlement', icon: Castle, description: 'Cities, towns, villages' },
  { value: 'district', label: 'District', icon: Map, description: 'Neighborhoods, wards, quarters' },
  { value: 'building', label: 'Building', icon: Building2, description: 'Taverns, temples, shops' },
  { value: 'room', label: 'Room', icon: DoorOpen, description: 'Specific chambers or areas' },
  { value: 'landmark', label: 'Landmark', icon: Landmark, description: 'Monuments, natural features' },
  { value: 'dungeon', label: 'Dungeon', icon: Skull, description: 'Adventure sites, ruins, lairs' },
]

const DANGER_LEVELS = [
  { value: 'let_ai_decide', label: 'Let AI decide', color: 'text-slate-400' },
  { value: 'safe', label: 'Safe', color: 'text-green-400' },
  { value: 'low', label: 'Low', color: 'text-lime-400' },
  { value: 'moderate', label: 'Moderate', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'deadly', label: 'Deadly', color: 'text-red-400' },
]

const ATMOSPHERES = [
  { value: 'let_ai_decide', label: 'Let AI decide' },
  { value: 'welcoming', label: 'Welcoming' },
  { value: 'bustling', label: 'Bustling' },
  { value: 'peaceful', label: 'Peaceful' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'eerie', label: 'Eerie' },
  { value: 'oppressive', label: 'Oppressive' },
  { value: 'sacred', label: 'Sacred' },
  { value: 'decaying', label: 'Decaying' },
  { value: 'chaotic', label: 'Chaotic' },
  { value: 'foreboding', label: 'Foreboding' },
  { value: 'serene', label: 'Serene' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'melancholic', label: 'Melancholic' },
  { value: 'haunted', label: 'Haunted' },
  { value: 'ancient', label: 'Ancient' },
]

const CONCEPT_SEEDS = [
  'a crumbling fortress on a cliff overlooking the sea',
  'a bustling market district known for exotic goods',
  'a haunted tavern where travelers disappear',
  'an ancient temple reclaimed by nature',
  'a dwarven mine that broke into something sinister',
  'a floating island where mages train',
  'a thieves\' guild hideout beneath the city',
  'a cursed forest where trees whisper secrets',
  'a frontier town on the edge of the wilderness',
  'a dragon\'s abandoned lair now used by bandits',
]

export function LocationInputForm({
  onSubmit,
  isLocked,
  preValidation,
  onProceedAnyway,
  onDismissValidation,
  campaignId,
  initialValues,
}: LocationInputFormProps): JSX.Element {
  const supabase = createClient()

  // Form state
  const [name, setName] = useState(initialValues?.name || '')
  const [concept, setConcept] = useState(initialValues?.concept || '')
  const [locationType, setLocationType] = useState<LocationInputData['locationType']>(
    (initialValues?.locationType as LocationInputData['locationType']) || 'building'
  )
  const [dangerLevel, setDangerLevel] = useState('let_ai_decide')
  const [atmosphere, setAtmosphere] = useState('let_ai_decide')
  const [parentLocationId, setParentLocationId] = useState('')

  // Context injection
  const [referencedEntities, setReferencedEntities] = useState<{ id: string; name: string }[]>([])

  // Available parent locations
  const [availableParents, setAvailableParents] = useState<Array<{ id: string; name: string; sub_type: string }>>([])

  // Fetch available parent locations
  useEffect(() => {
    const fetchParents = async () => {
      const { data } = await supabase
        .from('entities')
        .select('id, name, sub_type')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'location')
        .is('deleted_at', null)
        .order('name')
      if (data) setAvailableParents(data)
    }
    fetchParents()
  }, [campaignId, supabase])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data: LocationInputData = {
      name: name || undefined,
      concept,
      locationType,
      dangerLevel: dangerLevel === 'let_ai_decide' ? '' : dangerLevel,
      atmosphere: atmosphere === 'let_ai_decide' ? '' : atmosphere,
      parentLocationId: parentLocationId || undefined,
      referencedEntityIds: referencedEntities.map(e => e.id),
    }

    onSubmit(data)
  }

  const handleRandomConcept = () => {
    const randomSeed = CONCEPT_SEEDS[Math.floor(Math.random() * CONCEPT_SEEDS.length)]
    setConcept(randomSeed)
  }

  const handleQuickReferenceSelect = (entityName: string, entityId: string) => {
    // Add to concept
    setConcept(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + entityName)
    // Add to referenced entities
    setReferencedEntities(prev =>
      prev.some(e => e.id === entityId) ? prev : [...prev, { id: entityId, name: entityName }]
    )
  }

  const removeReference = (entityId: string) => {
    setReferencedEntities(prev => prev.filter(e => e.id !== entityId))
  }

  const selectedType = LOCATION_TYPES.find(t => t.value === locationType)
  const canSubmit = concept.trim().length > 0

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

      {/* Location Type Grid */}
      <div className="space-y-2">
        <Label>Location Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {LOCATION_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = locationType === type.value
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setLocationType(type.value as LocationInputData['locationType'])}
                disabled={isLocked}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${isSelected
                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                    : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                  }
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-slate-500 truncate">{type.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Name (optional) */}
      <div className="space-y-2">
        <Label>Name (optional)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Leave blank to auto-generate"
          disabled={isLocked}
          className="bg-slate-900/50 border-slate-700"
        />
      </div>

      {/* Concept / Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Concept / Description *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRandomConcept}
            disabled={isLocked}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            <Dices className="w-3 h-3 mr-1" />
            Random
          </Button>
        </div>
        <Textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="A crumbling fortress on a cliff... A bustling market district known for exotic goods... A haunted tavern where travelers disappear..."
          disabled={isLocked}
          className="min-h-[100px] bg-slate-900/50 border-slate-700"
        />
        <QuickReference
          campaignId={campaignId}
          onSelect={handleQuickReferenceSelect}
        />
      </div>

      {/* Referenced Entities Display */}
      {referencedEntities.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-800/30 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-500">Context from:</span>
          {referencedEntities.map(entity => (
            <span
              key={entity.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300"
            >
              {entity.name}
              <button
                type="button"
                onClick={() => removeReference(entity.id)}
                className="text-slate-500 hover:text-red-400"
                disabled={isLocked}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Atmosphere & Danger Level */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Atmosphere</Label>
          <Select value={atmosphere} onValueChange={setAtmosphere} disabled={isLocked}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700">
              <SelectValue placeholder="Let AI decide..." />
            </SelectTrigger>
            <SelectContent>
              {ATMOSPHERES.map(atm => (
                <SelectItem key={atm.value} value={atm.value}>{atm.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Danger Level</Label>
          <Select value={dangerLevel} onValueChange={setDangerLevel} disabled={isLocked}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700">
              <SelectValue placeholder="Let AI decide..." />
            </SelectTrigger>
            <SelectContent>
              {DANGER_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  <span className={level.color}>{level.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Parent Location (Hierarchy) */}
      <div className="space-y-2">
        <Label>Located Within (optional)</Label>
        <Select value={parentLocationId} onValueChange={setParentLocationId} disabled={isLocked}>
          <SelectTrigger className="bg-slate-900/50 border-slate-700">
            <SelectValue placeholder="Standalone location..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standalone">Standalone (no parent)</SelectItem>
            {availableParents.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name} ({loc.sub_type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">
          For hierarchy: A room is within a building, a building within a district, etc.
        </p>
      </div>

      {/* Generate Button */}
      <Button
        type="submit"
        disabled={isLocked || !canSubmit}
        className="w-full"
        size="lg"
      >
        {isLocked ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Forging Location...
          </>
        ) : (
          <>
            {selectedType && <selectedType.icon className="w-4 h-4 mr-2" />}
            Forge {selectedType?.label || 'Location'}
          </>
        )}
      </Button>
    </form>
  )
}
