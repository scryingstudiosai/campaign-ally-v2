'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Sparkles, Dices, MapPin, User, X } from 'lucide-react'
import type { PreValidationResult } from '@/types/forge'
import { PreValidationAlert } from '@/components/forge/PreValidationAlert'

interface Entity {
  id: string
  name: string
  entity_type: string
}

export interface ItemInputData {
  name?: string
  dmSlug: string
  itemType: string
  rarity: string
  magicalAura: string
  state: string
  isIdentified: boolean
  ownerId?: string
  locationId?: string
  additionalRequirements?: string
  [key: string]: unknown
}

interface ItemInputFormProps {
  onSubmit: (data: ItemInputData) => void
  isLocked: boolean
  preValidation?: PreValidationResult | null
  onProceedAnyway?: () => void
  onDismissValidation?: () => void
  campaignId: string
  generationsRemaining?: number
  generationsLimit?: number
}

const ITEM_TYPES = [
  { value: 'let_ai_decide', label: 'Let AI decide' },
  { value: 'weapon', label: 'Weapon' },
  { value: 'armor', label: 'Armor' },
  { value: 'ring', label: 'Ring' },
  { value: 'potion', label: 'Potion' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'wondrous_item', label: 'Wondrous Item' },
  { value: 'mundane', label: 'Mundane' },
  { value: 'artifact', label: 'Artifact' },
  { value: 'treasure', label: 'Treasure' },
  { value: 'tool', label: 'Tool' },
  { value: 'material', label: 'Material/Component' },
]

const RARITIES = [
  { value: 'let_ai_decide', label: 'Let AI decide', color: '' },
  { value: 'common', label: 'Common', color: 'text-slate-400' },
  { value: 'uncommon', label: 'Uncommon', color: 'text-green-500' },
  { value: 'rare', label: 'Rare', color: 'text-blue-500' },
  { value: 'very_rare', label: 'Very Rare', color: 'text-purple-500' },
  { value: 'legendary', label: 'Legendary', color: 'text-amber-500' },
  { value: 'artifact', label: 'Artifact', color: 'text-red-500' },
]

const MAGICAL_AURAS = [
  { value: 'none', label: 'None (mundane)' },
  { value: 'let_ai_decide', label: 'Let AI decide' },
  { value: 'abjuration', label: 'Abjuration' },
  { value: 'conjuration', label: 'Conjuration' },
  { value: 'divination', label: 'Divination' },
  { value: 'enchantment', label: 'Enchantment' },
  { value: 'evocation', label: 'Evocation' },
  { value: 'illusion', label: 'Illusion' },
  { value: 'necromancy', label: 'Necromancy' },
  { value: 'transmutation', label: 'Transmutation' },
]

const DM_SLUG_SEEDS = [
  'cursed weapon that whispers',
  'healing potion with side effects',
  'map to a hidden location',
  'key to somewhere important',
  'jeweled trinket with a secret',
  'ancient tome of forbidden knowledge',
  'royal heirloom gone missing',
  'mundane item with hidden magic',
  'weapon with a dark history',
  'puzzle box containing a mystery',
  'letter that could change everything',
  'tool used for a crime',
  'trophy from a great battle',
  'ceremonial item from a lost cult',
  'prototype invention that backfired',
]

const STATES = [
  { value: 'carried', label: 'Carried' },
  { value: 'equipped', label: 'Equipped' },
  { value: 'stashed', label: 'Stashed' },
  { value: 'hidden', label: 'Hidden' },
]

const RANDOMIZABLE_TYPES = ITEM_TYPES.filter((t) => t.value !== 'let_ai_decide')
const RANDOMIZABLE_RARITIES = RARITIES.filter((r) => r.value !== 'let_ai_decide')

export function ItemInputForm({
  onSubmit,
  isLocked,
  preValidation,
  onProceedAnyway,
  onDismissValidation,
  campaignId,
  generationsRemaining,
  generationsLimit = 50,
}: ItemInputFormProps): JSX.Element {
  const [name, setName] = useState('')
  const [dmSlug, setDmSlug] = useState('')
  const [itemType, setItemType] = useState('let_ai_decide')
  const [rarity, setRarity] = useState('let_ai_decide')
  const [magicalAura, setMagicalAura] = useState('let_ai_decide')
  const [state, setState] = useState('carried')
  const [isIdentified, setIsIdentified] = useState(true)
  const [ownerId, setOwnerId] = useState<string>('')
  const [locationId, setLocationId] = useState<string>('')
  const [additionalRequirements, setAdditionalRequirements] = useState('')

  // Entity lists for search boxes
  const [locations, setLocations] = useState<Entity[]>([])
  const [npcs, setNpcs] = useState<Entity[]>([])
  const [loadingEntities, setLoadingEntities] = useState(true)
  const [ownerSearch, setOwnerSearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')

  // Fetch entities on mount
  useEffect(() => {
    const fetchEntities = async (): Promise<void> => {
      try {
        const supabase = createClient()

        const { data: locationData } = await supabase
          .from('entities')
          .select('id, name, entity_type')
          .eq('campaign_id', campaignId)
          .eq('entity_type', 'location')
          .is('deleted_at', null)
          .order('name')

        setLocations(locationData || [])

        const { data: npcData } = await supabase
          .from('entities')
          .select('id, name, entity_type')
          .eq('campaign_id', campaignId)
          .eq('entity_type', 'npc')
          .is('deleted_at', null)
          .order('name')

        setNpcs(npcData || [])
      } catch (error) {
        console.error('Failed to fetch entities:', error)
      } finally {
        setLoadingEntities(false)
      }
    }

    fetchEntities()
  }, [campaignId])

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!dmSlug.trim()) return

    onSubmit({
      name: name.trim() || undefined,
      dmSlug: dmSlug.trim(),
      itemType,
      rarity,
      magicalAura,
      state,
      isIdentified,
      ownerId: ownerId || undefined,
      locationId: locationId || undefined,
      additionalRequirements: additionalRequirements.trim() || undefined,
    })
  }

  const randomizeType = (): void => {
    const randomType =
      RANDOMIZABLE_TYPES[Math.floor(Math.random() * RANDOMIZABLE_TYPES.length)]
    setItemType(randomType.value)
  }

  const randomizeRarity = (): void => {
    const randomRarity =
      RANDOMIZABLE_RARITIES[
        Math.floor(Math.random() * RANDOMIZABLE_RARITIES.length)
      ]
    setRarity(randomRarity.value)
  }

  const randomizeDmSlug = (): void => {
    const randomSeed =
      DM_SLUG_SEEDS[Math.floor(Math.random() * DM_SLUG_SEEDS.length)]
    setDmSlug(randomSeed)
  }

  const remainingGenerations =
    generationsRemaining !== undefined ? generationsRemaining : generationsLimit
  const selectedRarity = RARITIES.find((r) => r.value === rarity)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pre-validation alert */}
      {preValidation &&
        (preValidation.conflicts.length > 0 ||
          preValidation.warnings.length > 0) && (
          <PreValidationAlert
            result={preValidation}
            onProceedAnyway={onProceedAnyway || (() => {})}
            onDismiss={onDismissValidation || (() => {})}
          />
        )}

      {/* Generation count */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {remainingGenerations} / {generationsLimit} generations remaining
        </span>
      </div>

      {/* DM Slug - Primary guidance for AI */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="dm-slug">
            DM Concept <span className="text-destructive">*</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={randomizeDmSlug}
            disabled={isLocked}
            className="h-6 px-2 text-xs text-primary hover:text-primary/80"
          >
            <Dices className="w-3 h-3 mr-1" />
            Surprise me
          </Button>
        </div>
        <Input
          id="dm-slug"
          value={dmSlug}
          onChange={(e) => setDmSlug(e.target.value)}
          placeholder='e.g., "cursed ring that grants invisibility but attracts undead"'
          required
          disabled={isLocked}
        />
        <p className="text-xs text-muted-foreground">
          Describe the item&apos;s essence - this guides the AI generation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name (optional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leave blank to auto-generate"
            disabled={isLocked}
          />
        </div>

        {/* Item Type */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="item-type">Item Type</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={randomizeType}
              disabled={isLocked}
              className="h-6 px-2 text-xs"
            >
              <Dices className="w-3 h-3" />
            </Button>
          </div>
          <Select value={itemType} onValueChange={setItemType} disabled={isLocked}>
            <SelectTrigger id="item-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ITEM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rarity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rarity">Rarity</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={randomizeRarity}
              disabled={isLocked}
              className="h-6 px-2 text-xs"
            >
              <Dices className="w-3 h-3" />
            </Button>
          </div>
          <Select value={rarity} onValueChange={setRarity} disabled={isLocked}>
            <SelectTrigger id="rarity" className={selectedRarity?.color}>
              <SelectValue placeholder="Select rarity" />
            </SelectTrigger>
            <SelectContent>
              {RARITIES.map((r) => (
                <SelectItem key={r.value} value={r.value} className={r.color}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Magical Aura */}
        <div className="space-y-2">
          <Label htmlFor="magical-aura">Magical Aura</Label>
          <Select
            value={magicalAura}
            onValueChange={setMagicalAura}
            disabled={isLocked}
          >
            <SelectTrigger id="magical-aura">
              <SelectValue placeholder="Select aura" />
            </SelectTrigger>
            <SelectContent>
              {MAGICAL_AURAS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select value={state} onValueChange={setState} disabled={isLocked}>
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Owner Search */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <User className="w-3 h-3" />
            Owner (optional)
          </Label>
          {ownerId ? (
            <div className="flex items-center justify-between p-2 border rounded-md bg-primary/10">
              <span className="text-sm font-medium">
                {npcs.find((n) => n.id === ownerId)?.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOwnerId('')
                  setOwnerSearch('')
                }}
                disabled={isLocked}
                className="h-6 px-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <>
              <Input
                placeholder="Search NPCs..."
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                disabled={isLocked || loadingEntities}
                className="h-8 text-sm"
              />
              {ownerSearch && (
                <div className="max-h-[120px] overflow-y-auto border rounded-md">
                  {npcs
                    .filter((n) =>
                      n.name.toLowerCase().includes(ownerSearch.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((npc) => (
                      <button
                        key={npc.id}
                        type="button"
                        onClick={() => {
                          setOwnerId(npc.id)
                          setOwnerSearch('')
                        }}
                        className="w-full p-2 text-left text-sm hover:bg-muted/50 transition-colors"
                      >
                        {npc.name}
                      </button>
                    ))}
                  {npcs.filter((n) =>
                    n.name.toLowerCase().includes(ownerSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No NPCs found
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Location Search */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Location (optional)
          </Label>
          {locationId ? (
            <div className="flex items-center justify-between p-2 border rounded-md bg-primary/10">
              <span className="text-sm font-medium">
                {locations.find((l) => l.id === locationId)?.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLocationId('')
                  setLocationSearch('')
                }}
                disabled={isLocked}
                className="h-6 px-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <>
              <Input
                placeholder="Search locations..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                disabled={isLocked || loadingEntities}
                className="h-8 text-sm"
              />
              {locationSearch && (
                <div className="max-h-[120px] overflow-y-auto border rounded-md">
                  {locations
                    .filter((l) =>
                      l.name.toLowerCase().includes(locationSearch.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          setLocationId(loc.id)
                          setLocationSearch('')
                        }}
                        className="w-full p-2 text-left text-sm hover:bg-muted/50 transition-colors"
                      >
                        {loc.name}
                      </button>
                    ))}
                  {locations.filter((l) =>
                    l.name.toLowerCase().includes(locationSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No locations found
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Is Identified Toggle */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
        <div>
          <Label htmlFor="is-identified" className="cursor-pointer">
            Is Identified?
          </Label>
          <p className="text-xs text-muted-foreground">
            If unidentified, players only see the public description
          </p>
        </div>
        <Switch
          id="is-identified"
          checked={isIdentified}
          onCheckedChange={setIsIdentified}
          disabled={isLocked}
        />
      </div>

      {/* Additional Requirements */}
      <div className="space-y-2">
        <Label htmlFor="additional-requirements">
          Additional Requirements (optional)
        </Label>
        <Textarea
          id="additional-requirements"
          value={additionalRequirements}
          onChange={(e) => setAdditionalRequirements(e.target.value)}
          placeholder='e.g., "Should have a connection to the dragon cult", "Include a curse", "Make it feel ancient elven"'
          rows={2}
          disabled={isLocked}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={!dmSlug.trim() || isLocked || remainingGenerations <= 0}
        className="w-full"
        size="lg"
      >
        {isLocked ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Forging Item...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Item
          </>
        )}
      </Button>

      {remainingGenerations <= 0 && (
        <p className="text-sm text-destructive text-center">
          You&apos;ve reached your generation limit for this month.
        </p>
      )}
    </form>
  )
}
