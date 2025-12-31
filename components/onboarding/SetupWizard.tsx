'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useOnboarding } from '@/hooks/useOnboarding'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Progress } from '@/components/ui/progress'
import {
  Sparkles,
  Scroll,
  Wand2,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type WizardStep = 'welcome' | 'campaign' | 'spark' | 'reveal'

const STEPS: WizardStep[] = ['welcome', 'campaign', 'spark', 'reveal']

const GAME_SYSTEMS = [
  { value: 'dnd5e', label: 'D&D 5e' },
  { value: 'pathfinder2e', label: 'Pathfinder 2e' },
  { value: 'daggerheart', label: 'Daggerheart' },
  { value: 'system_agnostic', label: 'System Agnostic' },
  { value: 'other', label: 'Other' },
]

const GENRES = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'scifi', label: 'Sci-Fi' },
  { value: 'horror', label: 'Horror' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'other', label: 'Other' },
]

interface SetupWizardProps {
  open: boolean
  onComplete?: (campaignId?: string) => void
}

export function SetupWizard({ open, onComplete }: SetupWizardProps) {
  const router = useRouter()
  const supabase = createClient()
  const { completeWizard } = useOnboarding()

  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campaign form state
  const [campaignName, setCampaignName] = useState('')
  const [campaignDescription, setCampaignDescription] = useState('')
  const [gameSystem, setGameSystem] = useState('dnd5e')
  const [genre, setGenre] = useState('fantasy')

  // Spark state (optional first idea)
  const [sparkType, setSparkType] = useState<'npc' | 'location' | 'skip'>('skip')
  const [sparkIdea, setSparkIdea] = useState('')

  // Created campaign
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)

  const currentStepIndex = STEPS.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const handleNext = async () => {
    if (currentStep === 'campaign') {
      // Create the campaign
      setIsLoading(true)
      setError(null)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: campaign, error: createError } = await supabase
          .from('campaigns')
          .insert({
            name: campaignName,
            description: campaignDescription || null,
            game_system: gameSystem,
            genre: genre,
            user_id: user.id,
          })
          .select('id')
          .single()

        if (createError) throw createError

        setCreatedCampaignId(campaign.id)
        setCurrentStep('spark')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create campaign')
      } finally {
        setIsLoading(false)
      }
    } else if (currentStep === 'spark') {
      setCurrentStep('reveal')
    } else if (currentStep === 'welcome') {
      setCurrentStep('campaign')
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex])
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      await completeWizard(createdCampaignId || undefined)

      if (onComplete) {
        onComplete(createdCampaignId || undefined)
      }

      // Navigate to the campaign or dashboard
      if (createdCampaignId) {
        router.push(`/dashboard/campaigns/${createdCampaignId}`)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'welcome':
        return true
      case 'campaign':
        return campaignName.trim().length >= 2
      case 'spark':
        return true // Spark is optional
      case 'reveal':
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-xl bg-slate-900 border-slate-700 text-white [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Setup Wizard</DialogTitle>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-1 bg-slate-800" />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            {STEPS.map((step, index) => (
              <span
                key={step}
                className={cn(
                  'capitalize',
                  index <= currentStepIndex && 'text-teal-400'
                )}
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {currentStep === 'welcome' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-3">
                Welcome to Campaign Ally
              </h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Your AI-powered co-pilot for running unforgettable tabletop campaigns.
                Let&apos;s get you set up in just a few steps.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="p-3">
                  <Scroll className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <p className="text-xs text-slate-400">Organize your world</p>
                </div>
                <div className="p-3">
                  <Wand2 className="w-6 h-6 mx-auto mb-2 text-teal-400" />
                  <p className="text-xs text-slate-400">Generate content</p>
                </div>
                <div className="p-3">
                  <Rocket className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                  <p className="text-xs text-slate-400">Run sessions</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'campaign' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-display font-bold mb-2">
                  Create Your First Campaign
                </h2>
                <p className="text-sm text-slate-400">
                  Give your adventure a name and choose your setting
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name *</Label>
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Curse of Strahd, Homebrew Adventure"
                    className="mt-1 bg-slate-800 border-slate-700"
                  />
                </div>

                <div>
                  <Label htmlFor="campaignDescription">Description (Optional)</Label>
                  <Textarea
                    id="campaignDescription"
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="A brief description of your campaign..."
                    className="mt-1 bg-slate-800 border-slate-700 resize-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Game System</Label>
                    <Select value={gameSystem} onValueChange={setGameSystem}>
                      <SelectTrigger className="mt-1 bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {GAME_SYSTEMS.map((sys) => (
                          <SelectItem key={sys.value} value={sys.value}>
                            {sys.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger className="mt-1 bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {GENRES.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}
            </div>
          )}

          {currentStep === 'spark' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-display font-bold mb-2">
                  Your First Spark
                </h2>
                <p className="text-sm text-slate-400">
                  Optional: Give the AI something to work with for your first generation
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSparkType('npc')}
                  className={cn(
                    'p-4 rounded-lg border text-center transition-all',
                    sparkType === 'npc'
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  )}
                >
                  <span className="text-lg">NPC</span>
                </button>
                <button
                  onClick={() => setSparkType('location')}
                  className={cn(
                    'p-4 rounded-lg border text-center transition-all',
                    sparkType === 'location'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  )}
                >
                  <span className="text-lg">Location</span>
                </button>
                <button
                  onClick={() => setSparkType('skip')}
                  className={cn(
                    'p-4 rounded-lg border text-center transition-all',
                    sparkType === 'skip'
                      ? 'border-slate-500 bg-slate-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  )}
                >
                  <span className="text-lg">Skip</span>
                </button>
              </div>

              {sparkType !== 'skip' && (
                <div>
                  <Label htmlFor="sparkIdea">
                    Describe your {sparkType === 'npc' ? 'character' : 'place'}
                  </Label>
                  <Textarea
                    id="sparkIdea"
                    value={sparkIdea}
                    onChange={(e) => setSparkIdea(e.target.value)}
                    placeholder={
                      sparkType === 'npc'
                        ? 'e.g., A mysterious innkeeper with a secret past...'
                        : 'e.g., A haunted forest where travelers disappear...'
                    }
                    className="mt-1 bg-slate-800 border-slate-700 resize-none"
                    rows={3}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    You can refine this later in the Forge
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'reveal' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-3">
                You&apos;re All Set!
              </h2>
              <p className="text-slate-400 max-w-md mx-auto mb-6">
                Your campaign <span className="text-white font-medium">{campaignName}</span> is ready.
                Explore the Forge to create NPCs, locations, and more!
              </p>

              <div className="text-left bg-slate-800/50 rounded-lg p-4 max-w-sm mx-auto">
                <p className="text-sm font-medium text-slate-300 mb-2">Quick tips:</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Cmd+K</kbd> to search anywhere</li>
                  <li>Visit the <span className="text-purple-400">Forge</span> to generate content</li>
                  <li>Check the <span className="text-teal-400">Codex</span> to add world lore</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {currentStepIndex > 0 && currentStep !== 'reveal' ? (
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep === 'reveal' ? (
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Rocket className="w-4 h-4 mr-2" />
              )}
              Start Adventuring
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {currentStep === 'campaign' ? 'Create Campaign' : 'Continue'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
