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
import { Loader2, Sparkles } from 'lucide-react'

export interface NPCInputs {
  name: string
  role: string
  race: string
  gender: string
  personalityHints: string
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

const GENDERS = [
  { value: 'let_ai_decide', label: 'Let AI decide' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
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
  const [additionalRequirements, setAdditionalRequirements] = useState('')

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    const inputs: NPCInputs = {
      name: name.trim(),
      role: role.trim(),
      race: race === 'other' ? customRace.trim() : race,
      gender,
      personalityHints: personalityHints.trim(),
      additionalRequirements: additionalRequirements.trim(),
    }

    await onGenerate(inputs)
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
          <Label htmlFor="race">Race</Label>
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
          <Label htmlFor="gender">Gender</Label>
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
        <Label htmlFor="personality-hints">Personality Hints (optional)</Label>
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
