'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LocationBrain } from '@/types/living-entity'
import { Map, AlertTriangle, Clock, Swords, Gift, User, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LocationBrainCardProps {
  brain: LocationBrain
  subType?: string | null
}

const DANGER_COLORS: Record<string, string> = {
  safe: 'bg-green-500/20 text-green-400',
  low: 'bg-lime-500/20 text-lime-400',
  moderate: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-orange-500/20 text-orange-400',
  deadly: 'bg-red-500/20 text-red-400',
}

export function LocationBrainCard({ brain, subType }: LocationBrainCardProps): JSX.Element | null {
  const params = useParams()
  const campaignId = params?.id as string

  if (!brain || Object.keys(brain).length === 0) return null

  const dangerClass = DANGER_COLORS[brain.danger_level || 'moderate'] || ''

  // Get staff excluding owner to avoid duplication
  const otherStaff = brain.staff?.filter(
    (s) => s.entity_id !== brain.owner?.entity_id
  ) || []

  return (
    <div className="ca-card p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <Map className="w-5 h-5" />
          <span>Location Brain</span>
        </div>
        <div className="flex items-center gap-2">
          {subType && <Badge variant="outline" className="capitalize">{subType}</Badge>}
          {brain.danger_level && (
            <Badge className={dangerClass}>{brain.danger_level}</Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {brain.purpose && (
          <div>
            <span className="text-xs text-slate-500 uppercase">Purpose</span>
            <p className="text-slate-200">{brain.purpose}</p>
          </div>
        )}

        {brain.atmosphere && (
          <div>
            <span className="text-xs text-slate-500 uppercase">Atmosphere</span>
            <p className="text-slate-200 capitalize">{brain.atmosphere}</p>
          </div>
        )}

        {brain.history && (
          <div>
            <span className="text-xs text-slate-500 uppercase">History</span>
            <p className="text-slate-200">{brain.history}</p>
          </div>
        )}

        {brain.current_state && (
          <div className="flex gap-2">
            <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs text-blue-400 uppercase">Current State</span>
              <p className="text-slate-200">{brain.current_state}</p>
            </div>
          </div>
        )}

        {brain.conflict && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded">
            <div className="flex gap-2">
              <Swords className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-orange-400 uppercase">Conflict</span>
                <p className="text-slate-200">{brain.conflict}</p>
              </div>
            </div>
          </div>
        )}

        {brain.opportunity && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
            <div className="flex gap-2">
              <Gift className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-green-400 uppercase">Opportunity</span>
                <p className="text-slate-200">{brain.opportunity}</p>
              </div>
            </div>
          </div>
        )}

        {brain.secret && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-amber-400 uppercase">Secret (DM Only)</span>
                <p className="text-slate-200">{brain.secret}</p>
              </div>
            </div>
          </div>
        )}

        {/* Owner/Proprietor */}
        {brain.owner && (
          <div className="pt-2 border-t border-slate-700">
            <span className="text-xs text-amber-400 uppercase flex items-center gap-1 mb-2">
              <User className="w-3 h-3" /> Owner/Proprietor
            </span>
            <div className="p-2 bg-slate-800/50 rounded border border-amber-700/50 flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-200">{brain.owner.name}</span>
                <span className="text-slate-400 text-sm ml-2">({brain.owner.role})</span>
              </div>
              {brain.owner.entity_id && campaignId && (
                <Link
                  href={`/dashboard/campaigns/${campaignId}/memory/${brain.owner.entity_id}`}
                  className="text-xs text-teal-400 hover:text-teal-300 hover:underline"
                >
                  View NPC →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Other Staff */}
        {otherStaff.length > 0 && (
          <div className="pt-2 border-t border-slate-700">
            <span className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-2">
              <Users className="w-3 h-3" /> Other Staff
            </span>
            <div className="flex flex-wrap gap-2">
              {otherStaff.map((staff, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={`border-slate-600 ${staff.entity_id && campaignId ? 'cursor-pointer hover:border-teal-500' : ''}`}
                  onClick={() => {
                    if (staff.entity_id && campaignId) {
                      window.location.href = `/dashboard/campaigns/${campaignId}/memory/${staff.entity_id}`
                    }
                  }}
                >
                  {staff.name} ({staff.role})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {brain.contains && brain.contains.length > 0 && (
          <div className="pt-2 border-t border-slate-700">
            <span className="text-xs text-slate-500 uppercase">Contains</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {brain.contains.map((loc, i) => (
                <Badge key={i} variant="outline">{loc}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
