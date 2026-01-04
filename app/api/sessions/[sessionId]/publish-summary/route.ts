import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = await req.json();
  const { summary, title } = body;

  if (!summary) {
    return NextResponse.json({ error: 'Summary required' }, { status: 400 });
  }

  // Get session with campaign info
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id,
      name,
      session_number,
      campaign_id,
      campaign:campaigns!campaign_id (
        id,
        user_id
      )
    `)
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Verify user is the DM
  const campaign = session.campaign as { id: string; user_id: string } | null;
  if (campaign?.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Get all campaign members
  const { data: members, error: membersError } = await supabase
    .from('campaign_members')
    .select('user_id')
    .eq('campaign_id', session.campaign_id);

  if (membersError || !members || members.length === 0) {
    return NextResponse.json({ error: 'No players in campaign' }, { status: 400 });
  }

  // Create journal entry for each player
  const entryTitle = title || `Session ${session.session_number}: ${session.name}`;

  const entries = members.map(member => ({
    campaign_id: session.campaign_id,
    user_id: member.user_id,
    title: entryTitle,
    content: summary,
    entry_type: 'session_recap',
    session_id: sessionId,
    is_pinned: false,
  }));

  const { data: created, error: insertError } = await supabase
    .from('player_journal_entries')
    .insert(entries)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    published: created?.length || 0,
    message: `Summary published to ${created?.length} players`
  });
}
