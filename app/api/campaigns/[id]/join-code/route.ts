import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership of campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, user_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Generate new join code using RPC
  const { data: joinCode, error: rpcError } = await supabase.rpc('generate_join_code', {
    campaign_id: params.id,
  })

  if (rpcError) {
    console.error('Failed to generate join code:', rpcError)
    return NextResponse.json({ error: 'Failed to generate join code' }, { status: 500 })
  }

  return NextResponse.json({ join_code: joinCode })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get campaign with join code
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, join_code')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  return NextResponse.json({ join_code: campaign.join_code })
}
