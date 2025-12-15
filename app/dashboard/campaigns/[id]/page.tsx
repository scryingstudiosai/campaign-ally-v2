import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteCampaignButton } from '@/components/campaigns/delete-campaign-button'
import { ArrowLeft, BookOpen, Users, Calendar, Pencil } from 'lucide-react'

interface PageProps {
  params: { id: string }
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

export default async function CampaignDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*, codex(id)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !campaign) {
    notFound()
  }

  const gameSystemLabel = campaign.game_system
    ? GAME_SYSTEM_LABELS[campaign.game_system] || campaign.game_system
    : 'Not specified'
  const genreLabel = campaign.genre
    ? GENRE_LABELS[campaign.genre] || campaign.genre
    : 'Not specified'

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  {campaign.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-4 text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">
                  {genreLabel}
                </span>
                <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                  {gameSystemLabel}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/campaigns/${params.id}/edit`}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Codex
              </CardTitle>
              <CardDescription>
                Your campaign&apos;s world bible and lore
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/dashboard/campaigns/${params.id}/codex`}>
                  View Codex
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Entities
              </CardTitle>
              <CardDescription>
                NPCs, locations, items, and factions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">
                Coming soon...
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Sessions
              </CardTitle>
              <CardDescription>
                Session notes and recaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">
                Coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
