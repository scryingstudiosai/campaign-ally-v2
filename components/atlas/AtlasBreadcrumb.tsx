'use client'

import Link from 'next/link'
import { ChevronRight, Globe, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LivingEntity } from '@/types/living-entity'

interface AtlasBreadcrumbProps {
  path: LivingEntity[]
  campaignId: string
}

export function AtlasBreadcrumb({ path, campaignId }: AtlasBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {/* World/Root link */}
      <Link
        href={`/dashboard/campaigns/${campaignId}/atlas`}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
          'text-slate-400 hover:text-white hover:bg-slate-800'
        )}
      >
        <Globe className="w-4 h-4" />
        <span>Atlas</span>
      </Link>

      {/* Breadcrumb items */}
      {path.map((location, index) => {
        const isLast = index === path.length - 1

        return (
          <div key={location.id} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-slate-600" />

            {isLast ? (
              // Current location - not a link
              <span className="flex items-center gap-1.5 px-2 py-1 text-white font-medium">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="max-w-[200px] truncate">{location.name}</span>
              </span>
            ) : (
              // Parent locations - clickable
              <Link
                href={`/dashboard/campaigns/${campaignId}/atlas/${location.id}`}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                  'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <MapPin className="w-4 h-4 text-emerald-400/60" />
                <span className="max-w-[150px] truncate">{location.name}</span>
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
