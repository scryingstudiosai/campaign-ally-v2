'use client'

import { useRouter } from 'next/navigation'
import {
  Globe,
  MapPin,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Sparkles,
  Upload,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { AtlasMap } from '@/app/api/campaigns/[id]/atlas/route'

interface MapCardProps {
  map: AtlasMap
  campaignId: string
  onDelete: () => void
  onTogglePublic: () => void
}

const sourceTypeIcons = {
  ai_generated: Sparkles,
  uploaded: Upload,
  external_url: ExternalLink,
}

const sourceTypeLabels = {
  ai_generated: 'AI Generated',
  uploaded: 'Uploaded',
  external_url: 'External URL',
}

export function MapCard({ map, campaignId, onDelete, onTogglePublic }: MapCardProps) {
  const router = useRouter()
  const SourceIcon = sourceTypeIcons[map.source_type]
  const poiCount = Array.isArray(map.poi_data) ? map.poi_data.length : 0

  const handleClick = () => {
    router.push(`/dashboard/campaigns/${campaignId}/atlas/${map.id}`)
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl border overflow-hidden bg-slate-900/50 transition-all cursor-pointer',
        'border-white/10 hover:border-teal-500/30'
      )}
      onClick={handleClick}
    >
      {/* Map Preview */}
      <div className="aspect-video relative overflow-hidden bg-slate-800">
        {map.image_url ? (
          <>
            <img
              src={map.thumbnail_url || map.image_url}
              alt={map.name}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="w-12 h-12 text-slate-700" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge
            variant="outline"
            className="bg-slate-900/80 border-slate-700 text-slate-300 text-xs flex items-center gap-1"
          >
            <SourceIcon className="w-3 h-3" />
            {sourceTypeLabels[map.source_type]}
          </Badge>
        </div>

        {/* POI Count */}
        {poiCount > 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-teal-500/90 text-white text-xs font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {poiCount}
          </div>
        )}

        {/* Menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onTogglePublic}>
                {map.is_public ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide from Players
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show to Players
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Map
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white group-hover:text-teal-400 transition-colors truncate">
                {map.name}
              </h3>
              {map.is_public && (
                <Eye className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-500 capitalize mt-0.5">
              {map.map_type} {map.style && `• ${map.style}`}
            </p>
          </div>
        </div>

        {map.description && (
          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{map.description}</p>
        )}

        {/* Linked Entity */}
        {map.linked_entity && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <LinkIcon className="w-3 h-3" />
            <span className="truncate">
              Linked to {map.linked_entity.name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
