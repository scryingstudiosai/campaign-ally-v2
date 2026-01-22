import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { DeleteCampaignButton } from '@/components/campaigns/delete-campaign-button'
import { ExportButton } from '@/components/campaign/export-button'
import { SessionsList } from '@/components/dashboard/SessionsList'
import { MaterialCard } from '@/components/ui/material-card'
import { ForgeButton } from '@/components/ui/forge-button'
import {
  ArrowLeft,
  Brain,
  Book,
  Database,
  Pencil,
  Sparkles,
} from 'lucide-react'
import { CampaignGettingStarted } from '@/components/onboarding'
import { StoryThreadsPanel } from '@/components/story-threads'

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
    <div className="min-h-screen text-foreground p-6" style={{ backgroundColor: 'var(--ca-bg-base)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Campaign Header - Full Width */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-slate-400 mt-2 max-w-2xl">
                {campaign.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              <span className="ca-inset text-primary">
                {genreLabel}
              </span>
              <span className="ca-inset text-slate-300">
                {gameSystemLabel}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <ExportButton campaignId={campaign.id} campaignName={campaign.name} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/campaigns/${params.id}/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
          </div>
        </div>

        {/* Bento Grid Layout - Sessions & Sidebar aligned */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN (Spans 2 cols) - Sessions & Story Threads */}
          <div className="lg:col-span-2 space-y-6">
            <SessionsList campaignId={params.id} />
            <StoryThreadsPanel campaignId={params.id} />
          </div>

          {/* RIGHT COLUMN - Tools & Quick Access */}
          <div className="space-y-6">
            {/* Forges */}
            <MaterialCard className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-display text-white">Forges</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/npc`}
                  forgeType="npc"
                  label="NPC"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/creature`}
                  forgeType="creature"
                  label="Creature"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/location`}
                  forgeType="location"
                  label="Location"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/item`}
                  forgeType="item"
                  label="Item"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/faction`}
                  forgeType="faction"
                  label="Faction"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/encounter`}
                  forgeType="encounter"
                  label="Encounter"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/quest`}
                  forgeType="quest"
                  label="Quest"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/player`}
                  forgeType="player"
                  label="Player"
                />
              </div>
            </MaterialCard>

            {/* Campaign Data - Codex & Memory */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-display text-white">Campaign Data</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/dashboard/campaigns/${params.id}/codex`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-white/5 hover:border-teal-500/30 hover:bg-slate-800 transition-all">
                    <Book className="w-5 h-5 text-teal-400 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">Codex</div>
                      <div className="text-xs text-slate-500">World lore</div>
                    </div>
                  </div>
                </Link>

                <Link href={`/dashboard/campaigns/${params.id}/memory`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-white/5 hover:border-purple-500/30 hover:bg-slate-800 transition-all">
                    <Brain className="w-5 h-5 text-purple-400 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">Memory</div>
                      <div className="text-xs text-slate-500">
                        {entityCount !== null && entityCount > 0 ? `${entityCount} entities` : 'NPCs & more'}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Getting Started Checklist */}
            <CampaignGettingStarted campaignId={params.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
