import { createClient } from '@/lib/supabase/server'
import { CampaignSidebar, MobileMenuButton } from '@/components/layout/CampaignSidebar'

interface CampaignLayoutProps {
  children: React.ReactNode
  params: { id: string }
}

export default async function CampaignLayout({ children, params }: CampaignLayoutProps) {
  const supabase = createClient()

  // Fetch campaign name for the sidebar
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name')
    .eq('id', params.id)
    .single()

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CampaignSidebar campaignId={params.id} campaignName={campaign?.name} />
      </div>

      {/* Mobile Menu Button */}
      <MobileMenuButton campaignId={params.id} campaignName={campaign?.name} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  )
}
