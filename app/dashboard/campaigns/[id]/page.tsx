import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { DeleteCampaignButton } from '@/components/campaigns/delete-campaign-button'
import { SessionsList } from '@/components/dashboard/SessionsList'
import { MaterialCard } from '@/components/ui/material-card'
import { ForgeButton } from '@/components/ui/forge-button'
import { ManaBar } from '@/components/ui/mana-bar'
import {
  ArrowLeft,
  Brain,
  Book,
  Pencil,
  User,
  MapPin,
  Swords,
  Package,
  Bug,
  Users,
  Scroll,
} from 'lucide-react'

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

  // Get session count for progress
  const { count: sessionCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', params.id)

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

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN (Spans 2 cols) - Campaign Header & Sessions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Header */}
            <div className="flex justify-between items-start">
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
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/campaigns/${params.id}/edit`}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
              </div>
            </div>

            {/* Sessions List */}
            <SessionsList campaignId={params.id} />
          </div>

          {/* RIGHT COLUMN - Tools & Quick Access */}
          <div className="space-y-6">
            {/* Codex & Memory - Compact Tiles */}
            <div className="grid grid-cols-2 gap-4">
              <Link href={`/dashboard/campaigns/${params.id}/codex`}>
                <MaterialCard hoverable className="p-4 text-center h-full">
                  <Book className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                  <div className="font-semibold text-slate-200 text-sm">Codex</div>
                  <p className="text-xs text-slate-500 mt-1">World lore</p>
                </MaterialCard>
              </Link>

              <Link href={`/dashboard/campaigns/${params.id}/memory`}>
                <MaterialCard hoverable className="p-4 text-center h-full">
                  <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="font-semibold text-slate-200 text-sm">Memory</div>
                  {entityCount !== null && entityCount > 0 ? (
                    <p className="text-xs text-slate-500 mt-1">{entityCount} entities</p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">NPCs & more</p>
                  )}
                </MaterialCard>
              </Link>
            </div>

            {/* Quick Forge - Compact Grid */}
            <MaterialCard className="p-4">
              <h3 className="text-xs font-mono uppercase text-slate-500 mb-4 tracking-wider">
                Quick Forge
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/npc`}
                  icon={User}
                  label="NPC"
                  glowColor="teal"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/creature`}
                  icon={Bug}
                  label="Creature"
                  glowColor="rose"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/location`}
                  icon={MapPin}
                  label="Location"
                  glowColor="emerald"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/item`}
                  icon={Package}
                  label="Item"
                  glowColor="blue"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/faction`}
                  icon={Users}
                  label="Faction"
                  glowColor="orange"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/encounter`}
                  icon={Swords}
                  label="Encounter"
                  glowColor="amber"
                />
                <ForgeButton
                  href={`/dashboard/campaigns/${params.id}/forge/quest`}
                  icon={Scroll}
                  label="Quest"
                  glowColor="purple"
                />
              </div>
            </MaterialCard>

            {/* Campaign Progress */}
            <MaterialCard className="p-4">
              <h3 className="text-xs font-mono uppercase text-slate-500 mb-3 tracking-wider">
                Progress
              </h3>
              <div className="space-y-3">
                <ManaBar
                  value={sessionCount || 0}
                  max={Math.max(sessionCount || 0, 10)}
                  variant="arcane"
                  label="Sessions"
                  showValue
                />
                <ManaBar
                  value={entityCount || 0}
                  max={Math.max(entityCount || 0, 20)}
                  variant="gold"
                  label="Entities"
                  showValue
                />
              </div>
            </MaterialCard>
          </div>
        </div>
      </div>
    </div>
  )
}
