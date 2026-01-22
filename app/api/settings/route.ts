import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try to fetch existing settings
  let { data: settings, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Lazy create if not found
  if (error?.code === 'PGRST116' || !settings) {
    const { data: newSettings, error: insertError } = await supabase
      .from('user_settings')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create settings:', insertError);
      return NextResponse.json(
        { error: 'Failed to create settings' },
        { status: 500 }
      );
    }
    settings = newSettings;
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // Whitelist allowed fields to prevent arbitrary updates
  const allowedFields = [
    'display_name',
    'avatar_url',
    'theme',
    'reduce_motion',
    'show_getting_started',
    'default_generation_mode',
    'onboarding',
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: settings, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }

  return NextResponse.json(settings);
}
