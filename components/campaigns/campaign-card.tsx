import Link from 'next/link'
import { MaterialCard } from '@/components/ui/material-card'

interface Campaign {
  id: string
  name: string
  description: string | null
  genre: string | null
  game_system: string | null
  created_at: string
}

interface CampaignCardProps {
  campaign: Campaign
}

const GAME_SYSTEM_LABELS: Record<string, string> = {
  dnd5e: 'D&D 5e',
  pathfinder2e: 'Pathfinder 2e',
  daggerheart: 'Daggerheart',
  system_agnostic: 'System Agnostic',
  other: 'Other',
}

const GENRE_LABELS: Record<string, string> = {
  fantasy: 'Fantasy',
  scifi: 'Sci-Fi',
  horror: 'Horror',
  mystery: 'Mystery',
  other: 'Other',
}

export function CampaignCard({ campaign }: CampaignCardProps): JSX.Element {
  const gameSystemLabel = campaign.game_system
    ? GAME_SYSTEM_LABELS[campaign.game_system] || campaign.game_system
    : null
  const genreLabel = campaign.genre
    ? GENRE_LABELS[campaign.genre] || campaign.genre
    : null

  return (
    <Link href={`/dashboard/campaigns/${campaign.id}`}>
      <MaterialCard hoverable entityType="quest" className="h-full p-0">
        <div className="p-4 pb-2">
          <h3 className="font-display text-lg font-semibold text-white tracking-wide">
            {campaign.name}
          </h3>
          {campaign.description && (
            <p className="text-sm text-ash line-clamp-2 mt-1">
              {campaign.description}
            </p>
          )}
        </div>
        <div className="p-4 pt-2">
          <div className="flex flex-wrap gap-2 text-xs">
            {genreLabel && (
              <span className="badge-arcane">
                {genreLabel}
              </span>
            )}
            {gameSystemLabel && (
              <span className="px-2 py-1 rounded-full bg-stone-light text-bone">
                {gameSystemLabel}
              </span>
            )}
          </div>
        </div>
      </MaterialCard>
    </Link>
  )
}
