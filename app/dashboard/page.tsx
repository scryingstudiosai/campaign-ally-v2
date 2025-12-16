import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/auth/logout-button'
import { CampaignCard } from '@/components/campaigns/campaign-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile (may not exist if migrations haven't run)
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  // Get user's campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, description, genre, game_system, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  const displayName = profile?.display_name || user.email || 'Adventurer'

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Welcome, {displayName}!
          </h1>
          <LogoutButton />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Campaigns</h2>
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
        </div>

        {campaigns && campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-muted rounded-lg">
            <p className="text-muted-foreground mb-4">No campaigns yet.</p>
            <Button asChild>
              <Link href="/dashboard/campaigns/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
