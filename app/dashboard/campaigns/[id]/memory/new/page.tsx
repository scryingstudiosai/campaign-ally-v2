import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewEntityForm } from './new-entity-form'

interface PageProps {
  params: { id: string }
}

export default async function NewEntityPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify campaign belongs to user
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

  return (
    <NewEntityForm
      campaignId={params.id}
      campaignName={campaign.name}
    />
  )
}
