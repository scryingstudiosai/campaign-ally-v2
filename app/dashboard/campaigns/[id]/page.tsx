import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { DeleteCampaignButton } from '@/components/campaigns/delete-campaign-button'
import { ArrowLeft, BookOpen, Brain, Calendar, Pencil, Sparkles, User, MapPin, Swords, Gem } from 'lucide-react'

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

  // Get entity count
  const { count: entityCount } = await supabase
    .from('entities')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', params.id)
    .is('deleted_at', null)

  const gameSystemLabel = campaign.game_system
    ? GAME_SYSTEM_LABELS[campaign.game_system] || campaign.game_system
    : 'Not specified'
  const genreLabel = campaign.genre
    ? GENRE_LABELS[campaign.genre] || campaign.genre
    : 'Not specified'

  return (
    <div className="min-h-screen text-foreground p-8" style={{ backgroundColor: 'var(--ca-bg-base)' }}>
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
              <h1 className="text-3xl font-bold text-slate-100">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-slate-400 mt-2 max-w-2xl">
                  {campaign.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-4 text-sm">
                <span className="ca-inset text-primary">
                  {genreLabel}
                </span>
                <span className="ca-inset text-slate-300">
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
          <div className="ca-card ca-card-interactive p-6">
            <Link href={`/dashboard/campaigns/${params.id}/codex`} className="block h-full">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-100">Codex</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Your campaign&apos;s world bible and lore
              </p>
              <span className="ca-btn ca-btn-primary w-full text-center block">
                View Codex
              </span>
            </Link>
          </div>

          <div className="ca-card ca-card-interactive p-6">
            <Link href={`/dashboard/campaigns/${params.id}/memory`} className="block h-full">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-slate-100">Memory</h3>
                {entityCount !== null && entityCount > 0 && (
                  <span className="ca-inset ml-auto text-xs">
                    {entityCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mb-4">
                NPCs, locations, items, and factions
              </p>
              <span className="ca-btn ca-btn-primary w-full text-center block">
                View Memory
              </span>
            </Link>
          </div>

          <div className="ca-card p-6 opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-slate-100">Sessions</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Session notes and recaps
            </p>
            <p className="text-sm text-slate-500 italic">
              Coming soon...
            </p>
          </div>
        </div>

        {/* AI Forges Section */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(180deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.1) 100%)' }}>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">AI Forges</h2>
              <p className="text-sm text-slate-400">
                Generate content powered by your campaign&apos;s Codex
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href={`/dashboard/campaigns/${params.id}/forge/npc`} className="block">
              <div className="ca-card ca-card--npc ca-card-interactive p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-semibold text-slate-100">NPC Forge</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Generate memorable NPCs with personalities, secrets, and hooks
                </p>
              </div>
            </Link>

            <Link href={`/dashboard/campaigns/${params.id}/forge/location`} className="block">
              <div className="ca-card ca-card--location ca-card-interactive p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-semibold text-slate-100">Location Forge</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Create immersive locations with atmosphere and secrets
                </p>
              </div>
            </Link>

            <div className="ca-card ca-card--encounter p-4 opacity-50">
              <div className="flex items-center gap-2 mb-2">
                <Swords className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold text-slate-100">Encounter Forge</h3>
              </div>
              <p className="text-sm text-slate-500">
                Coming soon...
              </p>
            </div>

            <Link href={`/dashboard/campaigns/${params.id}/forge/item`} className="block">
              <div className="ca-card ca-card--item ca-card-interactive p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gem className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-semibold text-slate-100">Item Forge</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Generate unique items with dual player/DM descriptions
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
