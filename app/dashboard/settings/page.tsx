import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsShell } from '@/components/settings';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Try to fetch existing settings (lazy create happens on client if needed)
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <SettingsShell initialSettings={settings} />
      </div>
    </div>
  );
}
