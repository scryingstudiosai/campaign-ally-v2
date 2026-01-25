import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/auth/logout-button'
import { Shield, Settings2 } from 'lucide-react'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user settings for display name
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('display_name')
    .eq('user_id', user.id)
    .single()

  // Get user's campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, description, genre, game_system, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  const displayName = userSettings?.display_name || user.email?.split('@')[0] || 'Adventurer'

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Welcome, {displayName}!
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Player Portal</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <LogoutButton />
          </div>
        </div>

        <DashboardClient campaigns={campaigns} />
      </div>
    </div>
  )
}
