import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntityEditForm } from './entity-edit-form'

interface PageProps {
  params: { id: string; entityId: string }
}

export default async function EntityEditPage({ params }: PageProps) {
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

  // Fetch entity
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('*')
    .eq('id', params.entityId)
    .eq('campaign_id', params.id)
    .is('deleted_at', null)
    .single()

  if (entityError || !entity) {
    notFound()
  }

  return (
    <EntityEditForm
      entity={entity}
      campaignId={params.id}
      campaignName={campaign.name}
    />
  )
}
