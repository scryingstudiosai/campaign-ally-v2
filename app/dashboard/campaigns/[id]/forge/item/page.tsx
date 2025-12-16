'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ItemInputForm, ItemInputs } from '@/components/forge/item-input-form'
import { ItemOutputDisplay, GeneratedItem } from '@/components/forge/item-output-display'
import { ItemSaveToMemoryButton } from '@/components/forge/item-save-to-memory-button'
import { ArrowLeft, RefreshCw, Pencil, Gem } from 'lucide-react'
import { toast } from 'sonner'

interface Campaign {
  id: string
  name: string
}

const GENERATION_LIMITS: Record<string, number> = {
  free: 50,
  pro: 500,
  legendary: 9999,
}

export default function ItemForgePage(): JSX.Element {
  const params = useParams()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedItem, setGeneratedItem] = useState<GeneratedItem | null>(null)
  const [lastInputs, setLastInputs] = useState<ItemInputs | null>(null)
  const [generationsUsed, setGenerationsUsed] = useState(0)
  const [generationsLimit, setGenerationsLimit] = useState(50)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      if (campaignError || !campaignData) {
        window.location.href = '/dashboard'
        return
      }

      setCampaign(campaignData)

      // Fetch profile for generation counts
      const { data: profileData } = await supabase
        .from('profiles')
        .select('generations_used, subscription_tier')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setGenerationsUsed(profileData.generations_used || 0)
        const tier = profileData.subscription_tier || 'free'
        setGenerationsLimit(GENERATION_LIMITS[tier] || 50)
      }

      setLoading(false)
    }

    fetchData()
  }, [campaignId])

  const handleGenerate = async (inputs: ItemInputs): Promise<void> => {
    setIsGenerating(true)
    setLastInputs(inputs)
    setGeneratedItem(null)
    setIsEditing(false)

    try {
      const response = await fetch('/api/generate/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, inputs }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setGeneratedItem(data.item)
      setGenerationsUsed(data.generationsUsed)
      toast.success('Item generated successfully!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate item')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async (): Promise<void> => {
    if (lastInputs) {
      await handleGenerate(lastInputs)
    }
  }

  const handleSaved = (entityId: string): void => {
    console.log('Saved entity:', entityId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/dashboard/campaigns/${campaignId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {campaign?.name || 'Campaign'}
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Gem className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Item Forge</h1>
              <p className="text-muted-foreground">
                Generate unique items with dual player/DM descriptions
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemInputForm
                campaignId={campaignId}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                generationsUsed={generationsUsed}
                generationsLimit={generationsLimit}
              />
            </CardContent>
          </Card>

          {/* Output Display */}
          <div className="space-y-4">
            {isGenerating && (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-muted-foreground">Forging your item...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isGenerating && generatedItem && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Generated Item</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          {isEditing ? 'Done Editing' : 'Edit'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRegenerate}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ItemOutputDisplay
                      item={generatedItem}
                      isEditing={isEditing}
                      onUpdate={setGeneratedItem}
                    />
                  </CardContent>
                </Card>

                <div className="flex gap-4 justify-end">
                  <ItemSaveToMemoryButton
                    item={generatedItem}
                    campaignId={campaignId}
                    ownerId={lastInputs?.ownerId || null}
                    locationId={lastInputs?.locationId || null}
                    onSaved={handleSaved}
                  />
                </div>
              </>
            )}

            {!isGenerating && !generatedItem && (
              <Card className="h-full min-h-[400px]">
                <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Gem className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Forge</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Fill in the details on the left and click &quot;Generate Item&quot; to create a unique item for your campaign.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
