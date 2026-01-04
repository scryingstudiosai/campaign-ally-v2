import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemoryPageClient } from './memory-page-client'

interface PageProps {
  params: { id: string }
}

export default async function MemoryPage({ params }: PageProps) {
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

  // Fetch all entities for this campaign
  const { data: entities, error: entitiesError } = await supabase
    .from('entities')
    .select('*')
    .eq('campaign_id', params.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (entitiesError) {
    console.error('Failed to fetch entities:', entitiesError)
  }

  // Fetch all relationships for this campaign (DM sees ALL)
  const { data: relationships, error: relationshipsError } = await supabase
    .from('relationships')
    .select('id, source_id, target_id, relationship_type, description, visibility')
    .eq('campaign_id', params.id)
    .is('deleted_at', null)

  if (relationshipsError) {
    console.error('Failed to fetch relationships:', relationshipsError)
  }

  return (
    <MemoryPageClient
      campaignId={params.id}
      campaignName={campaign.name}
      initialEntities={entities || []}
      initialRelationships={relationships || []}
    />
  )
}
