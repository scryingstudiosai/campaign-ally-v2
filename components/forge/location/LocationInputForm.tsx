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
import { Loader2, Map, Mountain, Castle, Building2, DoorOpen, Landmark, Skull, X, ChevronDown } from 'lucide-react'
import type { PreValidationResult } from '@/types/forge'
import { PreValidationAlert } from '@/components/forge/PreValidationAlert'
import { QuickReference } from '@/components/forge/QuickReference'
import type { LucideIcon } from 'lucide-react'

export interface LocationInputData {
  name?: string
  concept: string
  locationType: 'region' | 'settlement' | 'district' | 'building' | 'room' | 'landmark' | 'dungeon'
  subCategory?: string
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

interface LocationConfig {
  label: string
  icon: LucideIcon
  description: string
  subCategory: {
    label: string
    options: Array<{ value: string; label: string }>
  }
  placeholder: string
  defaultDanger: string
  showDangerLevel: boolean
}

const LOCATION_CONFIG: Record<string, LocationConfig> = {
  region: {
    label: 'Region',
    icon: Mountain,
    description: 'Kingdoms, territories, wilderness',
    subCategory: {
      label: 'Biome / Terrain',
      options: [
        { value: 'forest', label: 'Forest / Woodland' },
        { value: 'mountain', label: 'Mountain Range' },
        { value: 'swamp', label: 'Swamp / Marshland' },
        { value: 'desert', label: 'Desert / Wasteland' },
        { value: 'tundra', label: 'Tundra / Arctic' },
        { value: 'plains', label: 'Plains / Grassland' },
        { value: 'coastal', label: 'Coastal / Islands' },
        { value: 'underdark', label: 'Underdark / Subterranean' },
        { value: 'magical', label: 'Magical / Corrupted' },
      ],
    },
    placeholder: 'A sprawling ancient forest where the trees whisper secrets to those who listen...',
    defaultDanger: 'moderate',
    showDangerLevel: true,
  },
  settlement: {
    label: 'Settlement',
    icon: Castle,
    description: 'Cities, towns, villages',
    subCategory: {
      label: 'Settlement Size',
      options: [
        { value: 'thorp', label: 'Thorp (< 20 people)' },
        { value: 'hamlet', label: 'Hamlet (20-80 people)' },
        { value: 'village', label: 'Village (80-400 people)' },
        { value: 'town', label: 'Town (400-4,000 people)' },
        { value: 'city', label: 'City (4,000-25,000 people)' },
        { value: 'metropolis', label: 'Metropolis (25,000+ people)' },
      ],
    },
    placeholder: 'A bustling trade city built on bridges spanning a deep chasm...',
    defaultDanger: 'safe',
    showDangerLevel: false,
  },
  district: {
    label: 'District',
    icon: Map,
    description: 'Neighborhoods, wards, quarters',
    subCategory: {
      label: 'District Type',
      options: [
        { value: 'market', label: 'Market / Trade District' },
        { value: 'poor_residential', label: 'Poor Residential / Slums' },
        { value: 'wealthy_residential', label: 'Wealthy Residential' },
        { value: 'temple', label: 'Temple / Religious Quarter' },
        { value: 'military', label: 'Military / Guard District' },
        { value: 'arcane', label: 'Arcane / Magic Quarter' },
        { value: 'government', label: 'Government / Noble District' },
        { value: 'docks', label: 'Docks / Harbor District' },
        { value: 'industrial', label: 'Industrial / Craftsman' },
      ],
    },
    placeholder: 'A smoky industrial district where dwarven smithies work day and night...',
    defaultDanger: 'low',
    showDangerLevel: false,
  },
  building: {
    label: 'Building',
    icon: Building2,
    description: 'Taverns, temples, shops',
    subCategory: {
      label: 'Building Type',
      options: [
        { value: 'tavern', label: 'Tavern / Inn' },
        { value: 'shop', label: 'Shop / Merchant' },
        { value: 'temple', label: 'Temple / Shrine' },
        { value: 'blacksmith', label: 'Blacksmith / Armorer' },
        { value: 'library', label: 'Library / Archive' },
        { value: 'guildhall', label: 'Guildhall' },
        { value: 'manor', label: 'Manor / Estate' },
        { value: 'warehouse', label: 'Warehouse / Storage' },
        { value: 'fort', label: 'Fort / Keep' },
      ],
    },
    placeholder: 'A cozy tavern built inside the hollow trunk of a massive tree...',
    defaultDanger: 'safe',
    showDangerLevel: false,
  },
  room: {
    label: 'Room',
    icon: DoorOpen,
    description: 'Specific chambers or areas',
    subCategory: {
      label: 'Room Type',
      options: [
        { value: 'throne', label: 'Throne Room' },
        { value: 'treasury', label: 'Treasury / Vault' },
        { value: 'bedroom', label: 'Bedroom / Quarters' },
        { value: 'kitchen', label: 'Kitchen / Pantry' },
        { value: 'library', label: 'Library / Study' },
        { value: 'cell', label: 'Prison Cell / Dungeon' },
        { value: 'armory', label: 'Armory / Weapons Room' },
        { value: 'ritual', label: 'Ritual Chamber' },
        { value: 'secret', label: 'Secret Room / Passage' },
      ],
    },
    placeholder: 'A dusty library filled with rotting scrolls and a single desk covered in strange symbols...',
    defaultDanger: 'low',
    showDangerLevel: true,
  },
  landmark: {
    label: 'Landmark',
    icon: Landmark,
    description: 'Monuments, natural features',
    subCategory: {
      label: 'Landmark Type',
      options: [
        { value: 'natural', label: 'Natural Feature (waterfall, cliff, grove)' },
        { value: 'ruin', label: 'Ancient Ruin' },
        { value: 'monument', label: 'Monument / Statue' },
        { value: 'magical', label: 'Magical Phenomenon' },
        { value: 'planar', label: 'Planar Breach / Portal' },
        { value: 'battlefield', label: 'Historic Battlefield' },
        { value: 'sacred', label: 'Sacred Grove / Holy Site' },
        { value: 'cursed', label: 'Cursed Ground' },
      ],
    },
    placeholder: 'A weeping statue of a forgotten god that bleeds real blood at midnight...',
    defaultDanger: 'moderate',
    showDangerLevel: true,
  },
  dungeon: {
    label: 'Dungeon',
    icon: Skull,
    description: 'Adventure sites, ruins, lairs',
    subCategory: {
      label: 'Dungeon Origin',
      options: [
        { value: 'cave', label: 'Natural Cave System' },
        { value: 'mine', label: 'Abandoned Mine' },
        { value: 'tomb', label: 'Ancient Tomb / Crypt' },
        { value: 'cult', label: 'Cult Lair / Temple' },
        { value: 'tower', label: "Wizard's Tower" },
        { value: 'sunken', label: 'Sunken Ruin' },
        { value: 'prison', label: 'Prison / Asylum' },
        { value: 'lair', label: 'Monster Lair' },
        { value: 'fortress', label: 'Fallen Fortress' },
      ],
    },
    placeholder: 'An abandoned dwarven mine where something ancient has awakened in the depths...',
    defaultDanger: 'high',
    showDangerLevel: true,
  },
}

const ATMOSPHERES = [
  { value: 'any', label: 'Let AI decide' },
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

  // Core state
  const [locationType, setLocationType] = useState<LocationInputData['locationType']>(
    (initialValues?.locationType as LocationInputData['locationType']) || 'building'
  )
  const [subCategory, setSubCategory] = useState('')
  const [name, setName] = useState(initialValues?.name || '')
  const [concept, setConcept] = useState(initialValues?.concept || '')

  // Advanced options (collapsed by default)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [dangerLevel, setDangerLevel] = useState('')
  const [atmosphere, setAtmosphere] = useState('any')
  const [parentLocationId, setParentLocationId] = useState('')

  // Context injection
  const [referencedEntities, setReferencedEntities] = useState<{ id: string; name: string }[]>([])

  // Available parent locations
  const [availableParents, setAvailableParents] = useState<Array<{ id: string; name: string; sub_type: string }>>([])

  // Get current config
  const currentConfig = LOCATION_CONFIG[locationType]

  // Reset sub-category and danger level when type changes
  useEffect(() => {
    setSubCategory('')
    setDangerLevel(LOCATION_CONFIG[locationType]?.defaultDanger || 'moderate')
  }, [locationType])

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

    // Build enhanced concept with sub-category context
    let enhancedConcept = ''

    // Add sub-category if selected
    if (subCategory && subCategory !== 'any') {
      const subLabel = currentConfig.subCategory.options.find(o => o.value === subCategory)?.label
      if (subLabel) {
        enhancedConcept = `[${currentConfig.subCategory.label}: ${subLabel}] `
      }
    }

    // Add user concept or generate default
    if (concept.trim()) {
      enhancedConcept += concept.trim()
    } else if (subCategory && subCategory !== 'any') {
      const subLabel = currentConfig.subCategory.options.find(o => o.value === subCategory)?.label
      enhancedConcept += `A ${subLabel || currentConfig.label.toLowerCase()}`
    } else {
      enhancedConcept += `A ${currentConfig.label.toLowerCase()}`
    }

    const data: LocationInputData = {
      name: name || undefined,
      concept: enhancedConcept,
      locationType,
      subCategory: subCategory && subCategory !== 'any' ? subCategory : undefined,
      dangerLevel: dangerLevel || currentConfig.defaultDanger,
      atmosphere: atmosphere && atmosphere !== 'any' ? atmosphere : '',
      parentLocationId: parentLocationId && parentLocationId !== 'none' ? parentLocationId : undefined,
      referencedEntityIds: referencedEntities.map(e => e.id),
    }

    onSubmit(data)
  }

  const handleQuickReferenceSelect = (entityName: string, entityId: string) => {
    setConcept(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + entityName)
    setReferencedEntities(prev =>
      prev.some(e => e.id === entityId) ? prev : [...prev, { id: entityId, name: entityName }]
    )
  }

  const removeReference = (entityId: string) => {
    setReferencedEntities(prev => prev.filter(e => e.id !== entityId))
  }

  const CurrentIcon = currentConfig.icon

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

      {/* SECTION 1: Location Type Grid */}
      <div className="space-y-2">
        <Label>What are you creating?</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Object.entries(LOCATION_CONFIG).map(([key, config]) => {
            const Icon = config.icon
            const isSelected = locationType === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setLocationType(key as LocationInputData['locationType'])}
                disabled={isLocked}
                className={`
                  p-2 sm:p-3 rounded-lg border text-left transition-all min-w-0 overflow-hidden
                  ${isSelected
                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                    : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                  }
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-1 flex-shrink-0 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                <div className="font-medium text-xs sm:text-sm truncate">{config.label}</div>
                <div className="text-xs text-slate-500 truncate hidden sm:block">{config.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: Dynamic Sub-Category */}
      <div className="space-y-2">
        <Label>{currentConfig.subCategory.label}</Label>
        <Select value={subCategory} onValueChange={setSubCategory} disabled={isLocked}>
          <SelectTrigger className="bg-slate-900/50 border-slate-700">
            <SelectValue placeholder="Let AI decide..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Let AI decide</SelectItem>
            {currentConfig.subCategory.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* SECTION 3: Name (Optional) */}
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

      {/* SECTION 4: Concept with Dynamic Placeholder */}
      <div className="space-y-2">
        <Label>Describe your vision (optional)</Label>
        <Textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder={currentConfig.placeholder}
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

      {/* SECTION 5: Advanced Options (Collapsible) */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
        >
          <span className="text-sm text-slate-400">Advanced Options</span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="p-4 space-y-4 border-t border-slate-700">
            {/* Danger Level - Only show for relevant types */}
            {currentConfig.showDangerLevel && (
              <div className="space-y-2">
                <Label>Danger Level</Label>
                <Select value={dangerLevel} onValueChange={setDangerLevel} disabled={isLocked}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe"><span className="text-green-400">Safe</span></SelectItem>
                    <SelectItem value="low"><span className="text-lime-400">Low</span></SelectItem>
                    <SelectItem value="moderate"><span className="text-yellow-400">Moderate</span></SelectItem>
                    <SelectItem value="high"><span className="text-orange-400">High</span></SelectItem>
                    <SelectItem value="deadly"><span className="text-red-400">Deadly</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Atmosphere */}
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

            {/* Parent Location */}
            <div className="space-y-2">
              <Label>Located Within</Label>
              <Select value={parentLocationId} onValueChange={setParentLocationId} disabled={isLocked}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700">
                  <SelectValue placeholder="Standalone location..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standalone (no parent)</SelectItem>
                  {availableParents.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({loc.sub_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                For hierarchy: A room within a building, a building within a district, etc.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: Generate Button */}
      <Button
        type="submit"
        disabled={isLocked}
        className="w-full"
        size="lg"
      >
        {isLocked ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Forging {currentConfig.label}...
          </>
        ) : (
          <>
            <CurrentIcon className="w-4 h-4 mr-2" />
            Forge {currentConfig.label}
          </>
        )}
      </Button>
    </form>
  )
}
