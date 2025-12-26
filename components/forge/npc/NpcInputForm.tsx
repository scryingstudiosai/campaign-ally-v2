'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Dices, Loader2, X, Swords } from 'lucide-react'
import type { PreValidationResult } from '@/types/forge'
import { PreValidationAlert } from '@/components/forge/PreValidationAlert'
import { RoleCombobox } from '@/components/forge/RoleCombobox'
import { SrdLookupPopover } from '@/components/srd'
import type { SrdCreature } from '@/types/srd'

interface NpcInputFormProps {
  onSubmit: (data: NpcInputData) => void
  isLocked: boolean
  preValidation?: PreValidationResult | null
  onProceedAnyway?: () => void
  onDismissValidation?: () => void
  existingLocations?: Array<{ id: string; name: string }>
  existingFactions?: Array<{ id: string; name: string }>
  initialValues?: {
    name?: string
    slug?: string
  }
  conceptProvided?: boolean  // True if concept field has content (from parent)
}

export interface VillainInputs {
  scheme?: string
  resources?: string[]
  threatLevel?: string
  escapePlan?: string
}

export interface HeroInputs {
  limitation?: string
  supportRoles?: string[]
  availability?: string
  powerTier?: string
}

export type CombatRole = 'non-combatant' | 'minion' | 'elite' | 'villain' | 'hero'

export interface NpcInputData {
  name?: string
  role?: string  // Optional if concept is provided
  concept?: string  // Situation/context describing the NPC
  race?: string
  gender?: string
  personalityHints?: string
  voiceReference?: string
  additionalRequirements?: string
  locationId?: string
  factionId?: string
  npcType?: 'standard' | 'villain' | 'hero'
  villainInputs?: VillainInputs
  heroInputs?: HeroInputs
  referencedEntityIds?: string[]  // Entity IDs selected via QuickReference
  combatRole?: CombatRole
  combatTemplateSlug?: string  // SRD creature slug for combat template
  combatTemplateName?: string  // SRD creature name for display
  [key: string]: unknown
}

const RACES = [
  { value: 'let_ai_decide', label: 'Let AI decide' },
  { value: 'Human', label: 'Human' },
  { value: 'Elf', label: 'Elf' },
  { value: 'Dwarf', label: 'Dwarf' },
  { value: 'Halfling', label: 'Halfling' },
  { value: 'Tiefling', label: 'Tiefling' },
  { value: 'Dragonborn', label: 'Dragonborn' },
  { value: 'Half-Orc', label: 'Half-Orc' },
  { value: 'Gnome', label: 'Gnome' },
  { value: 'Half-Elf', label: 'Half-Elf' },
  { value: 'Aasimar', label: 'Aasimar' },
  { value: 'Goliath', label: 'Goliath' },
  { value: 'Tabaxi', label: 'Tabaxi' },
  { value: 'Kenku', label: 'Kenku' },
  { value: 'other', label: 'Other (specify below)' },
]

const RANDOMIZABLE_RACES = RACES.filter(
  (r) => r.value !== 'let_ai_decide' && r.value !== 'other'
)

const GENDERS = [
  { value: 'let_ai_decide', label: 'Let AI decide' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
]

const RANDOMIZABLE_GENDERS = GENDERS.filter((g) => g.value !== 'let_ai_decide')

const PERSONALITY_SEEDS = [
  'anxious and secretive',
  'boisterous and friendly',
  'cold and calculating',
  'warm but mysterious',
  'gruff but secretly kind',
  'cheerful but hiding pain',
  'paranoid and suspicious',
  'naive and trusting',
  'arrogant and ambitious',
  'humble and wise',
  'quick-tempered but loyal',
  'calm and philosophical',
  'sarcastic and witty',
  'stoic and honorable',
  'mischievous and cunning',
]

const RANDOM_ROLES = [
  'Guard',
  'Shopkeeper',
  'Innkeeper',
  'Blacksmith',
  'Merchant',
  'Noble',
  'Priest',
  'Scholar',
  'Adventurer',
  'Mercenary',
  'Wizard',
  'Thief',
  'Bard',
]

export function NpcInputForm({
  onSubmit,
  isLocked,
  preValidation,
  onProceedAnyway,
  onDismissValidation,
  existingLocations = [],
  existingFactions = [],
  initialValues,
  conceptProvided = false,
}: NpcInputFormProps): JSX.Element {
  const [name, setName] = useState(initialValues?.name || '')
  const [role, setRole] = useState(initialValues?.slug || '')
  const [race, setRace] = useState('let_ai_decide')
  const [customRace, setCustomRace] = useState('')
  const [gender, setGender] = useState('let_ai_decide')
  const [personalityHints, setPersonalityHints] = useState('')
  const [voiceReference, setVoiceReference] = useState('')
  const [additionalRequirements, setAdditionalRequirements] = useState('')
  const [locationId, setLocationId] = useState('none')
  const [factionId, setFactionId] = useState('none')
  const [combatRole, setCombatRole] = useState<CombatRole>('non-combatant')
  const [combatTemplate, setCombatTemplate] = useState<SrdCreature | null>(null)

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    // Allow submission if either role or concept is provided
    if (!role.trim() && !conceptProvided) return

    onSubmit({
      name: name.trim() || undefined,
      role: role.trim() || '',  // Empty string if not provided - API will handle
      race: race === 'other' ? customRace.trim() : race,
      gender,
      personalityHints: personalityHints.trim() || undefined,
      voiceReference: voiceReference.trim() || undefined,
      additionalRequirements: additionalRequirements.trim() || undefined,
      locationId: locationId === 'none' ? undefined : locationId,
      factionId: factionId === 'none' ? undefined : factionId,
      combatRole,
      combatTemplateSlug: combatTemplate?.slug,
      combatTemplateName: combatTemplate?.name,
    })
  }

  // Auto-suggest combat role based on CR when template selected
  const handleSelectCombatTemplate = (creature: SrdCreature): void => {
    setCombatTemplate(creature)
    // Auto-suggest role based on CR
    const cr = creature.cr_numeric ?? 0
    if (cr >= 5) setCombatRole('villain')
    else if (cr >= 2) setCombatRole('elite')
    else if (cr >= 0.5) setCombatRole('minion')
  }

  const randomizeRace = (): void => {
    const randomRace =
      RANDOMIZABLE_RACES[Math.floor(Math.random() * RANDOMIZABLE_RACES.length)]
    setRace(randomRace.value)
  }

  const randomizeGender = (): void => {
    const randomGender =
      RANDOMIZABLE_GENDERS[
        Math.floor(Math.random() * RANDOMIZABLE_GENDERS.length)
      ]
    setGender(randomGender.value)
  }

  const randomizePersonality = (): void => {
    const randomSeed =
      PERSONALITY_SEEDS[Math.floor(Math.random() * PERSONALITY_SEEDS.length)]
    setPersonalityHints(randomSeed)
  }

  const randomizeRole = (): void => {
    const randomRole =
      RANDOM_ROLES[Math.floor(Math.random() * RANDOM_ROLES.length)]
    setRole(randomRole)
  }


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

      {/* Role - Optional if concept is provided */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="role">
            Role / Occupation {!conceptProvided && <span className="text-destructive">*</span>}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={randomizeRole}
            disabled={isLocked}
            className="h-6 px-2 text-xs text-primary hover:text-primary/80"
          >
            <Dices className="w-3 h-3 mr-1" />
            Surprise me
          </Button>
        </div>
        <RoleCombobox
          value={role}
          onChange={setRole}
          placeholder="Guard, Shopkeeper, or let AI decide..."
        />
        <p className="text-xs text-muted-foreground">
          {conceptProvided
            ? 'Optional - AI will infer from your concept if left blank'
            : 'Select a common role or type something unique'}
        </p>
      </div>

      {/* Name (optional) */}
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

      {/* Race & Gender row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="race">Race</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={randomizeRace}
              disabled={isLocked}
              className="h-6 px-2 text-xs"
            >
              <Dices className="w-3 h-3" />
            </Button>
          </div>
          <Select value={race} onValueChange={setRace} disabled={isLocked}>
            <SelectTrigger id="race">
              <SelectValue placeholder="Select race" />
            </SelectTrigger>
            <SelectContent>
              {RACES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {race === 'other' && (
            <Input
              value={customRace}
              onChange={(e) => setCustomRace(e.target.value)}
              placeholder="Enter custom race"
              className="mt-2"
              disabled={isLocked}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="gender">Gender</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={randomizeGender}
              disabled={isLocked}
              className="h-6 px-2 text-xs"
            >
              <Dices className="w-3 h-3" />
            </Button>
          </div>
          <Select value={gender} onValueChange={setGender} disabled={isLocked}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location (optional) */}
      {existingLocations.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="location">Location (optional)</Label>
          <Select
            value={locationId}
            onValueChange={setLocationId}
            disabled={isLocked}
          >
            <SelectTrigger id="location">
              <SelectValue placeholder="Select a location..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific location</SelectItem>
              {existingLocations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Faction (optional) */}
      {existingFactions.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="faction">Faction (optional)</Label>
          <Select
            value={factionId}
            onValueChange={setFactionId}
            disabled={isLocked}
          >
            <SelectTrigger id="faction">
              <SelectValue placeholder="Select a faction..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No faction affiliation</SelectItem>
              {existingFactions.map((fac) => (
                <SelectItem key={fac.id} value={fac.id}>
                  {fac.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Combat Role Section */}
      <div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Swords className="w-4 h-4 text-rose-400" />
          Combat Capability
        </div>

        <div className="space-y-2">
          <Label htmlFor="combat-role">Combat Role</Label>
          <Select value={combatRole} onValueChange={(v) => setCombatRole(v as CombatRole)} disabled={isLocked}>
            <SelectTrigger id="combat-role">
              <SelectValue placeholder="Select combat capability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="non-combatant">Non-combatant (Commoner stats)</SelectItem>
              <SelectItem value="minion">Minion/Guard (Basic combat)</SelectItem>
              <SelectItem value="elite">Elite/Lieutenant (Skilled fighter)</SelectItem>
              <SelectItem value="villain">Villain/Boss (Full stat block)</SelectItem>
              <SelectItem value="hero">Hero/Ally (Full stat block)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {combatRole === 'non-combatant' && 'Minimal stats - just AC 10, HP 4'}
            {combatRole === 'minion' && 'Basic combat stats - CR 1/4 to 1'}
            {combatRole === 'elite' && 'Full stat block with 2-3 abilities - CR 1-5'}
            {combatRole === 'villain' && 'Full stat block with legendary/lair actions - CR 5+'}
            {combatRole === 'hero' && 'Full stat block, optimized for ally support'}
          </p>
        </div>

        {/* Combat Template - SRD Creature Lookup */}
        {combatRole !== 'non-combatant' && (
          <div className="space-y-2">
            <Label>Combat Template (Optional)</Label>
            <div className="flex gap-2 items-center">
              <SrdLookupPopover
                types={['creatures']}
                triggerLabel={combatTemplate ? `Base: ${combatTemplate.name} (CR ${combatTemplate.cr})` : 'Select a monster template...'}
                onSelectCreature={handleSelectCombatTemplate}
              />
              {combatTemplate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setCombatTemplate(null)}
                  disabled={isLocked}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Uses official D&D stats as a starting point for AI generation.
            </p>
          </div>
        )}
      </div>

      {/* Personality Hints */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="personality-hints">Personality Hints (optional)</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={randomizePersonality}
            disabled={isLocked}
            className="h-6 px-2 text-xs"
          >
            <Dices className="w-3 h-3 mr-1" />
            Surprise me
          </Button>
        </div>
        <Textarea
          id="personality-hints"
          value={personalityHints}
          onChange={(e) => setPersonalityHints(e.target.value)}
          placeholder='e.g., "gruff but secretly kind", "speaks in riddles", "paranoid about strangers"'
          rows={2}
          disabled={isLocked}
        />
      </div>

      {/* Voice Reference */}
      <div className="space-y-2">
        <Label htmlFor="voice-reference">Voice Reference (optional)</Label>
        <Input
          id="voice-reference"
          value={voiceReference}
          onChange={(e) => setVoiceReference(e.target.value)}
          placeholder='e.g., "Sounds like Christopher Walken" or "Gravelly pirate accent"'
          disabled={isLocked}
        />
        <p className="text-xs text-muted-foreground">
          Describe a voice or accent to help you roleplay this character
        </p>
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
          placeholder='e.g., "Must have a connection to the thieves guild", "Should be from the northern mountains"'
          rows={2}
          disabled={isLocked}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={(!role.trim() && !conceptProvided) || isLocked}
        className="w-full"
        size="lg"
      >
        {isLocked ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate NPC
          </>
        )}
      </Button>
    </form>
  )
}
