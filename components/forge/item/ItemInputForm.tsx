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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Sparkles, Dices, MapPin, User, X, Package, Skull } from 'lucide-react'
import type { PreValidationResult } from '@/types/forge'
import { PreValidationAlert } from '@/components/forge/PreValidationAlert'
import { QuickReference } from '@/components/forge/QuickReference'

interface Entity {
  id: string
  name: string
  entity_type: string
}

export interface ItemInputData {
  name?: string
  dmSlug: string
  itemType: 'standard' | 'artifact' | 'cursed'
  category: string
  rarity: string
  magicalAura: string
  state: string
  isIdentified: boolean
  ownerId?: string
  locationId?: string
  additionalRequirements?: string
  // Sentience
  isSentient: boolean
  sentienceLevel: 'none' | 'dormant' | 'awakened' | 'dominant'
  // Artifact fields
  legendaryPower?: string
  creatorLore?: string
  // Cursed fields
  curseType?: string
  curseTrigger?: string
  curseEscape?: string
  // Context injection
  referencedEntityIds?: string[]
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
  initialValues?: {
    name?: string
    dmSlug?: string
    ownerId?: string
    ownerName?: string
  }
  lockedOwnerId?: string // When set, owner cannot be changed (for forge from loot)
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
  initialValues,
  lockedOwnerId,
}: ItemInputFormProps): JSX.Element {
  const [name, setName] = useState(initialValues?.name || '')
  const [dmSlug, setDmSlug] = useState(initialValues?.dmSlug || '')
  const [category, setCategory] = useState('let_ai_decide')
  const [rarity, setRarity] = useState('let_ai_decide')
  const [magicalAura, setMagicalAura] = useState('let_ai_decide')
  const [state, setState] = useState('carried')
  const [isIdentified, setIsIdentified] = useState(true)
  const [ownerId, setOwnerId] = useState<string>(initialValues?.ownerId || lockedOwnerId || '')
  const [locationId, setLocationId] = useState<string>('')
  const [additionalRequirements, setAdditionalRequirements] = useState('')

  // Item Sub-Type (Standard/Artifact/Cursed)
  const [itemSubType, setItemSubType] = useState<'standard' | 'artifact' | 'cursed'>('standard')

  // Sentience
  const [isSentient, setIsSentient] = useState(false)
  const [sentienceLevel, setSentienceLevel] = useState<'dormant' | 'awakened' | 'dominant'>('dormant')

  // Artifact fields
  const [legendaryPower, setLegendaryPower] = useState('')
  const [creatorLore, setCreatorLore] = useState('')

  // Cursed fields
  const [curseType, setCurseType] = useState('corruption')
  const [curseTrigger, setCurseTrigger] = useState('')
  const [curseEscape, setCurseEscape] = useState('')

  // Context tracking (for Quick Reference)
  const [referencedEntities, setReferencedEntities] = useState<{id: string, name: string}[]>([])

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

    // Determine effective sentience (haunted items are always sentient)
    const effectivelySentient = isSentient || (itemSubType === 'cursed' && curseType === 'haunted')
    const effectiveSentienceLevel = effectivelySentient
      ? (curseType === 'haunted' && !isSentient ? 'awakened' : sentienceLevel)
      : 'none'

    onSubmit({
      name: name.trim() || undefined,
      dmSlug: dmSlug.trim(),
      itemType: itemSubType,
      category,
      rarity,
      magicalAura,
      state,
      isIdentified,
      ownerId: ownerId || undefined,
      locationId: locationId || undefined,
      additionalRequirements: additionalRequirements.trim() || undefined,
      // Sentience
      isSentient: effectivelySentient,
      sentienceLevel: effectiveSentienceLevel,
      // Artifact fields (only if artifact)
      ...(itemSubType === 'artifact' ? {
        legendaryPower: legendaryPower.trim() || undefined,
        creatorLore: creatorLore.trim() || undefined,
      } : {}),
      // Cursed fields (only if cursed)
      ...(itemSubType === 'cursed' ? {
        curseType,
        curseTrigger: curseTrigger.trim() || undefined,
        curseEscape: curseEscape.trim() || undefined,
      } : {}),
      // Context injection
      referencedEntityIds: referencedEntities.map(e => e.id),
    })
  }

  const randomizeCategory = (): void => {
    const randomType =
      RANDOMIZABLE_TYPES[Math.floor(Math.random() * RANDOMIZABLE_TYPES.length)]
    setCategory(randomType.value)
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

        {/* Quick Reference */}
        <QuickReference
          campaignId={campaignId}
          onSelect={(name, entityId) => {
            setDmSlug(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + name)
            setReferencedEntities(prev =>
              prev.some(e => e.id === entityId) ? prev : [...prev, { id: entityId, name }]
            )
          }}
        />

        {/* Show referenced entities */}
        {referencedEntities.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-800/30 rounded-lg border border-slate-700 mt-2">
            <span className="text-xs text-slate-500">Context from:</span>
            {referencedEntities.map(entity => (
              <span
                key={entity.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300"
              >
                {entity.name}
                <button
                  type="button"
                  onClick={() => setReferencedEntities(prev => prev.filter(e => e.id !== entity.id))}
                  className="text-slate-500 hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
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

        {/* Item Category */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="category">Category</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={randomizeCategory}
              disabled={isLocked}
              className="h-6 px-2 text-xs"
            >
              <Dices className="w-3 h-3" />
            </Button>
          </div>
          <Select value={category} onValueChange={setCategory} disabled={isLocked}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
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
            Owner {lockedOwnerId ? '' : '(optional)'}
          </Label>
          {lockedOwnerId ? (
            // Locked owner - show display only
            <div className="flex items-center justify-between p-2 border rounded-md bg-amber-500/10 border-amber-500/30">
              <span className="text-sm font-medium text-amber-400">
                {initialValues?.ownerName || npcs.find((n) => n.id === lockedOwnerId)?.name || 'Loading...'}
              </span>
              <span className="text-xs text-muted-foreground">(from loot)</span>
            </div>
          ) : ownerId ? (
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

      {/* Item Sub-Type Tabs */}
      <div className="space-y-4">
        <Label>Item Configuration</Label>

        <Tabs value={itemSubType} onValueChange={(v) => setItemSubType(v as typeof itemSubType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standard" className="flex items-center gap-2" disabled={isLocked}>
              <Package className="w-4 h-4" /> Standard
            </TabsTrigger>
            <TabsTrigger value="artifact" className="flex items-center gap-2" disabled={isLocked}>
              <Sparkles className="w-4 h-4" /> Artifact
            </TabsTrigger>
            <TabsTrigger value="cursed" className="flex items-center gap-2" disabled={isLocked}>
              <Skull className="w-4 h-4" /> Cursed
            </TabsTrigger>
          </TabsList>

          {/* STANDARD TAB */}
          <TabsContent value="standard">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400">
                Standard items have origin, history, and secrets but no special curse or legendary power.
              </p>
            </div>
          </TabsContent>

          {/* ARTIFACT TAB */}
          <TabsContent value="artifact">
            <div className="space-y-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-400 mb-2">
                Artifacts are legendary items of immense power with world-shaping abilities.
              </p>
              <div className="space-y-2">
                <Label>Legendary Power</Label>
                <Textarea
                  placeholder="What world-shaping power does it hold? What can it do that no other item can?"
                  value={legendaryPower}
                  onChange={e => setLegendaryPower(e.target.value)}
                  className="min-h-[60px] bg-slate-900/50 border-slate-700"
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Creator / Origin (optional)</Label>
                <Input
                  placeholder="Who forged this? A god, an ancient mage, a forgotten civilization?"
                  value={creatorLore}
                  onChange={e => setCreatorLore(e.target.value)}
                  className="bg-slate-900/50 border-slate-700"
                  disabled={isLocked}
                />
              </div>
            </div>
          </TabsContent>

          {/* CURSED TAB */}
          <TabsContent value="cursed">
            <div className="space-y-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 mb-2">
                Cursed items appear beneficial but carry hidden dangers. The curse should feel earned, not arbitrary.
              </p>
              <div className="space-y-2">
                <Label>Curse Type</Label>
                <Select value={curseType} onValueChange={setCurseType} disabled={isLocked}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corruption">Corruption - Slowly changes the wielder</SelectItem>
                    <SelectItem value="addiction">Addiction - Can&apos;t let go of the item</SelectItem>
                    <SelectItem value="betrayal">Betrayal - Fails at critical moments</SelectItem>
                    <SelectItem value="hunger">Hunger - Demands sacrifices</SelectItem>
                    <SelectItem value="haunted">Haunted - Contains a malevolent spirit</SelectItem>
                    <SelectItem value="monkey_paw">Monkey&apos;s Paw - Grants wishes with twists</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Curse Trigger (optional)</Label>
                <Input
                  placeholder="When does the curse activate? Using it in combat, at midnight..."
                  value={curseTrigger}
                  onChange={e => setCurseTrigger(e.target.value)}
                  className="bg-slate-900/50 border-slate-700"
                  disabled={isLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Escape Method (optional)</Label>
                <Input
                  placeholder="How can it be cleansed or broken? Leave blank for AI to decide."
                  value={curseEscape}
                  onChange={e => setCurseEscape(e.target.value)}
                  className="bg-slate-900/50 border-slate-700"
                  disabled={isLocked}
                />
              </div>
              {curseType === 'haunted' && (
                <p className="text-xs text-purple-400 mt-2">
                  Haunted items are automatically sentient. A voice profile will be generated.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sentience Toggle */}
      <div className="flex items-center gap-4 p-4 border border-slate-700 rounded-lg bg-slate-900/50">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Switch checked={isSentient} onCheckedChange={setIsSentient} disabled={isLocked} />
            <Label>Sentient Item</Label>
          </div>
          <p className="text-xs text-slate-500 pl-10">Does this item have a personality and can communicate?</p>
        </div>

        {isSentient && (
          <div className="w-[200px]">
            <Select value={sentienceLevel} onValueChange={(v) => setSentienceLevel(v as typeof sentienceLevel)} disabled={isLocked}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dormant">Dormant - Occasional whispers</SelectItem>
                <SelectItem value="awakened">Awakened - Active personality</SelectItem>
                <SelectItem value="dominant">Dominant - Tries to control wielder</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
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
