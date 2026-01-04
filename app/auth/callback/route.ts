import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getSmartRedirect(supabase: Awaited<ReturnType<typeof createClient>>, origin: string, explicitNext?: string): Promise<string> {
  // If there's an explicit redirect (e.g., from join link), honor it
  if (explicitNext && explicitNext !== '/dashboard') {
    return `${origin}${explicitNext}`;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return `${origin}/dashboard`;
  }

  // Check if user has seen welcome screen
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('has_seen_welcome')
    .eq('user_id', user.id)
    .single();

  // First time user - show welcome
  if (!prefs?.has_seen_welcome) {
    return `${origin}/welcome`;
  }

  // Returning user - determine where to send them
  const { data: dmCampaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .limit(1);

  // Has DM campaigns - go to dashboard
  if (dmCampaigns && dmCampaigns.length > 0) {
    return `${origin}/dashboard`;
  }

  // Check for player memberships
  const { data: playerMemberships } = await supabase
    .from('campaign_members')
    .select('campaign_id')
    .eq('user_id', user.id)
    .eq('role', 'player')
    .limit(1);

  // Only player memberships - go to portal
  if (playerMemberships && playerMemberships.length > 0) {
    return `${origin}/portal/${playerMemberships[0].campaign_id}`;
  }

  // Neither - show welcome again
  return `${origin}/welcome`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  const supabase = await createClient()

  // Handle password recovery with token_hash (email link flow)
  if (token_hash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    })

    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`)
    }
    return NextResponse.redirect(`${origin}/login?error=invalid_recovery_link`)
  }

  // Handle OAuth or magic link with code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this is a password recovery, redirect to reset-password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }

      // Smart redirect based on user's campaigns and preferences
      const redirectUrl = await getSmartRedirect(supabase, origin, next ?? undefined);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
