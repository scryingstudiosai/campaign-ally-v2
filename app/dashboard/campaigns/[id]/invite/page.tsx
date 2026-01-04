import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvitePageClient } from './invite-page-client'

interface PageProps {
  params: { id: string }
}

export default async function InvitePage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, name, join_code')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !campaign) {
    notFound()
  }

  // Generate invite URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://campaignally.com'
  const inviteUrl = campaign.join_code
    ? `${baseUrl}/join/${campaign.join_code}`
    : null

  return (
    <InvitePageClient
      campaignId={campaign.id}
      campaignName={campaign.name}
      joinCode={campaign.join_code}
      inviteUrl={inviteUrl}
    />
  )
}
