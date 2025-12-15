import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/auth/logout-button'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Adventurer'

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {displayName}!</h1>
            <p className="text-muted-foreground">Ready to manage your campaigns?</p>
          </div>
          <LogoutButton />
        </header>

        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Your Campaigns</h2>
          </div>

          <div className="border border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No campaigns yet. Create your first campaign to get started!
            </p>
            <p className="text-sm text-muted-foreground/60">
              Campaign creation coming soon...
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
