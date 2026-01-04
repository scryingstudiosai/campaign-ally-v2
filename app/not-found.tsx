import Link from 'next/link'
import { Map, Home, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Thematic Icon */}
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center border border-teal-500/30">
          <Map className="w-12 h-12 text-teal-500" />
        </div>

        {/* D&D Themed Message */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white">404</h1>
          <h2 className="text-xl font-semibold text-slate-300">
            You&apos;ve wandered off the map
          </h2>
          <p className="text-slate-400 max-w-sm mx-auto">
            The page you seek lies beyond charted territories. Perhaps a wrong turn at the tavern?
          </p>
        </div>

        {/* Navigation Options */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <Compass className="w-4 h-4 mr-2" />
              Find Your Campaign
            </Link>
          </Button>
        </div>

        {/* Fun flavor text */}
        <p className="text-xs text-slate-600 italic">
          &quot;Not all who wander are lost... but you might be.&quot;
        </p>
      </div>
    </div>
  )
}
