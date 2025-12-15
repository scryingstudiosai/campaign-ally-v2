import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CodexDisplay } from '@/components/codex/codex-display'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default async function CodexPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user owns this campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (campaignError || !campaign) {
    notFound()
  }

  // Get or create codex
  let { data: codex, error: codexError } = await supabase
    .from('codex')
    .select('*')
    .eq('campaign_id', params.id)
    .single()

  // If no codex exists, create one
  if (codexError || !codex) {
    const { data: newCodex, error: createError } = await supabase
      .from('codex')
      .insert({
        campaign_id: params.id,
        world_name: campaign.name,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create codex:', createError)
      notFound()
    }

    codex = newCodex
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/dashboard/campaigns/${params.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaign
            </Link>
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Codex</h1>
              <p className="text-muted-foreground mt-2">
                The DNA of your campaign — settings that inform AI generations
              </p>
            </div>

            <Button asChild>
              <Link href={`/dashboard/campaigns/${params.id}/codex/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Codex
              </Link>
            </Button>
          </div>
        </div>

        <CodexDisplay codex={codex} />
      </div>
    </div>
  )
}
