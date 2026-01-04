import Link from 'next/link'
import { ScrollText, Home, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CampaignNotFound(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
          <ScrollText className="w-10 h-10 text-amber-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Campaign Not Found</h1>
          <p className="text-slate-400 max-w-sm mx-auto">
            This campaign doesn&apos;t exist or you don&apos;t have access to it. It may have been
            deleted or the link might be incorrect.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              My Campaigns
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard?new=true">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
