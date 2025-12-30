'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Brain,
  Book,
  History,
  User,
  Users,
  Package,
  MapPin,
  ChevronLeft,
  Sparkles,
  Menu,
  Swords,
  Bug,
  Scroll,
  Search,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CampaignSidebarProps {
  campaignId: string
  campaignName?: string
}

// Shared navigation content used by both desktop sidebar and mobile sheet
function SidebarContent({
  campaignId,
  campaignName,
  onNavigate,
}: CampaignSidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname()
  const baseUrl = `/dashboard/campaigns/${campaignId}`

  const isActive = (path: string, exact = false) => {
    if (exact) return pathname === path
    return pathname.startsWith(path)
  }

  const NAV_ITEMS = [
    { label: 'Overview', href: baseUrl, icon: LayoutDashboard, exact: true },
    { label: 'Memory', href: `${baseUrl}/memory`, icon: Brain },
    { label: 'Codex', href: `${baseUrl}/codex`, icon: Book },
    { label: 'Sessions', href: `${baseUrl}/sessions`, icon: History },
  ]

  const FORGE_ITEMS = [
    { label: 'NPC', href: `${baseUrl}/forge/npc`, icon: User },
    { label: 'Creature', href: `${baseUrl}/forge/creature`, icon: Bug },
    { label: 'Location', href: `${baseUrl}/forge/location`, icon: MapPin },
    { label: 'Item', href: `${baseUrl}/forge/item`, icon: Package },
    { label: 'Faction', href: `${baseUrl}/forge/faction`, icon: Users },
    { label: 'Encounter', href: `${baseUrl}/forge/encounter`, icon: Swords },
    { label: 'Quest', href: `${baseUrl}/forge/quest`, icon: Scroll },
    { label: 'Hero', href: `${baseUrl}/forge/player`, icon: Crown, special: true },
  ]

  const handleClick = () => {
    if (onNavigate) onNavigate()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <Link
          href="/dashboard"
          onClick={handleClick}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All Campaigns</span>
        </Link>
        {campaignName && (
          <h2
            className="mt-2 font-semibold text-slate-100 truncate"
            title={campaignName}
          >
            {campaignName}
          </h2>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Campaign Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Campaign
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Forge Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            The Forge
          </p>
          {FORGE_ITEMS.map((item) => {
            const active = isActive(item.href)
            const isSpecial = 'special' in item && item.special
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? isSpecial
                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : isSpecial
                      ? 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                )}
              >
                <item.icon className={cn('w-4 h-4 flex-shrink-0', isSpecial && !active && 'text-yellow-400')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* Search Hint */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  // Trigger the command menu
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    bubbles: true,
                  })
                  document.dispatchEvent(event)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 border border-white/5 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 hover:text-slate-400 hover:border-white/10 transition-all cursor-pointer"
              >
                <Search className="w-3 h-3" />
                <span>Search</span>
                <div className="ml-auto flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-700 rounded border border-white/10">⌘K</kbd>
                  <span className="text-slate-600">/</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-700 rounded border border-white/10">Ctrl+K</kbd>
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-slate-800 border-slate-700">
              <p>Search entities, navigate, and roll dice</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
            DM
          </div>
          <div className="text-xs">
            <p className="text-slate-300 font-medium">Dungeon Master</p>
            <p className="text-slate-500">Free Plan</p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/50">
          <Link
            href="/licenses"
            onClick={handleClick}
            className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors"
          >
            Game Content Licenses
          </Link>
        </div>
      </div>
    </div>
  )
}

// Desktop Sidebar (visible on lg+)
export function CampaignSidebar({ campaignId, campaignName }: CampaignSidebarProps) {
  return (
    <aside className="w-56 border-r border-slate-800 bg-slate-950/50 h-screen sticky top-0">
      <SidebarContent campaignId={campaignId} campaignName={campaignName} />
    </aside>
  )
}

// Mobile Menu Button + Sheet (visible on < lg)
export function MobileMenuButton({ campaignId, campaignName }: CampaignSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden fixed top-4 left-4 z-50 bg-slate-900/80 backdrop-blur border border-slate-700"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-slate-950 border-slate-800">
        <SidebarContent
          campaignId={campaignId}
          campaignName={campaignName}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
