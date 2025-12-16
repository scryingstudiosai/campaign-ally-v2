'use client'

import { useState } from 'react'
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
import { Loader2, Sparkles, Dices } from 'lucide-react'

export interface NPCInputs {
  name: string
  role: string
  race: string
  gender: string
  personalityHints: string
  voiceReference: string
  additionalRequirements: string
}

interface NPCInputFormProps {
  onGenerate: (inputs: NPCInputs) => Promise<void>
  isGenerating: boolean
  generationsUsed?: number
  generationsLimit?: number
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

// Races that can be randomly selected (excluding 'let_ai_decide' and 'other')
const RANDOMIZABLE_RACES = RACES.filter(r => r.value !== 'let_ai_decide' && r.value !== 'other')

const GENDERS = [
  { value: 'let_ai_decide', label: 'Let AI decide' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
]

const RANDOMIZABLE_GENDERS = GENDERS.filter(g => g.value !== 'let_ai_decide')

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
  'melancholic and poetic',
  'enthusiastic and reckless',
  'patient and observant',
  'nervous and apologetic',
  'confident and charming',
]

export function NPCInputForm({
  onGenerate,
  isGenerating,
  generationsUsed = 0,
  generationsLimit = 50,
}: NPCInputFormProps): JSX.Element {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [race, setRace] = useState('let_ai_decide')
  const [customRace, setCustomRace] = useState('')
  const [gender, setGender] = useState('let_ai_decide')
  const [personalityHints, setPersonalityHints] = useState('')
  const [voiceReference, setVoiceReference] = useState('')
  const [additionalRequirements, setAdditionalRequirements] = useState('')

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    const inputs: NPCInputs = {
      name: name.trim(),
      role: role.trim(),
      race: race === 'other' ? customRace.trim() : race,
      gender,
      personalityHints: personalityHints.trim(),
      voiceReference: voiceReference.trim(),
      additionalRequirements: additionalRequirements.trim(),
    }

    await onGenerate(inputs)
  }

  const randomizeRace = (): void => {
    const randomRace = RANDOMIZABLE_RACES[Math.floor(Math.random() * RANDOMIZABLE_RACES.length)]
    setRace(randomRace.value)
  }

  const randomizeGender = (): void => {
    const randomGender = RANDOMIZABLE_GENDERS[Math.floor(Math.random() * RANDOMIZABLE_GENDERS.length)]
    setGender(randomGender.value)
  }

  const randomizePersonality = (): void => {
    const randomSeed = PERSONALITY_SEEDS[Math.floor(Math.random() * PERSONALITY_SEEDS.length)]
    setPersonalityHints(randomSeed)
  }

  const remainingGenerations = generationsLimit - generationsUsed

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">NPC Details</h2>
        <span className="text-sm text-muted-foreground">
          {remainingGenerations} / {generationsLimit} generations remaining
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name (optional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leave blank to auto-generate"
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">
            Role <span className="text-destructive">*</span>
          </Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder='e.g., "tavern keeper", "corrupt guard"'
            required
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="race">Race</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={randomizeRace}
              disabled={isGenerating}
              className="h-6 px-2 text-xs"
              title="Random race"
            >
              <Dices className="w-3 h-3 mr-1" />
              Surprise me
            </Button>
          </div>
          <Select value={race} onValueChange={setRace} disabled={isGenerating}>
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
              disabled={isGenerating}
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
              disabled={isGenerating}
              className="h-6 px-2 text-xs"
              title="Random gender"
            >
              <Dices className="w-3 h-3 mr-1" />
              Surprise me
            </Button>
          </div>
          <Select value={gender} onValueChange={setGender} disabled={isGenerating}>
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="personality-hints">Personality Hints (optional)</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={randomizePersonality}
            disabled={isGenerating}
            className="h-6 px-2 text-xs"
            title="Random personality seed"
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
          disabled={isGenerating}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="voice-reference">Voice Reference (optional)</Label>
        <Input
          id="voice-reference"
          value={voiceReference}
          onChange={(e) => setVoiceReference(e.target.value)}
          placeholder='e.g., "Sounds like Christopher Walken" or "Gravelly pirate accent"'
          disabled={isGenerating}
        />
        <p className="text-xs text-muted-foreground">
          Describe a voice or accent to help you roleplay this character
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional-requirements">Additional Requirements (optional)</Label>
        <Textarea
          id="additional-requirements"
          value={additionalRequirements}
          onChange={(e) => setAdditionalRequirements(e.target.value)}
          placeholder='e.g., "Must have a connection to the thieves guild", "Should be from the northern mountains"'
          rows={2}
          disabled={isGenerating}
        />
      </div>

      <Button
        type="submit"
        disabled={!role.trim() || isGenerating || remainingGenerations <= 0}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating NPC...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate NPC
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
