import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/5 cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{campaign.name}</CardTitle>
          {campaign.description && (
            <CardDescription className="line-clamp-2">
              {campaign.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-xs">
            {genreLabel && (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                {genreLabel}
              </span>
            )}
            {gameSystemLabel && (
              <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                {gameSystemLabel}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
