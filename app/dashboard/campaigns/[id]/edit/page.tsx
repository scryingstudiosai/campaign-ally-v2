import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CampaignForm } from '@/components/campaigns/campaign-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default async function EditCampaignPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, name, description, genre, game_system')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !campaign) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/dashboard/campaigns/${params.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaign
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Campaign</h1>
          <p className="text-muted-foreground mt-2">
            Update your campaign details.
          </p>
        </div>

        <CampaignForm campaign={campaign} mode="edit" />
      </div>
    </div>
  )
}
