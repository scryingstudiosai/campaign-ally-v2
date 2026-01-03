'use client'

import { useOnboarding, ChecklistProgress } from '@/hooks/useOnboarding'
import { Progress } from '@/components/ui/progress'
import { MaterialCard } from '@/components/ui/material-card'
import { useCampaignActions } from '@/components/campaign/CampaignActionsContext'
import {
  User,
  MapPin,
  History,
  Wand2,
  Book,
  Users,
  Scroll,
  Download,
  UserPlus,
  Flag,
  Check,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ChecklistItem {
  key: keyof ChecklistProgress
  label: string
  description: string
  icon: typeof User
  href: (campaignId: string) => string
  color: string
  action?: 'export' | 'invite' // Special action items
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: 'created_campaign',
    label: 'Create a Campaign',
    description: 'Set up your first adventure',
    icon: Flag,
    href: () => '/dashboard',
    color: 'text-teal-400',
  },
  {
    key: 'added_first_npc',
    label: 'Create an NPC',
    description: 'Forge a memorable character',
    icon: User,
    href: (id) => `/dashboard/campaigns/${id}/forge/npc`,
    color: 'text-teal-400',
  },
  {
    key: 'added_first_location',
    label: 'Create a Location',
    description: 'Build an immersive place',
    icon: MapPin,
    href: (id) => `/dashboard/campaigns/${id}/forge/location`,
    color: 'text-emerald-400',
  },
  {
    key: 'ran_first_session',
    label: 'Run a Session',
    description: 'Start your first adventure',
    icon: History,
    href: (id) => `/dashboard/campaigns/${id}/sessions`,
    color: 'text-amber-400',
  },
  {
    key: 'used_ai_generation',
    label: 'Use AI Generation',
    description: 'Let the AI help you create',
    icon: Wand2,
    href: (id) => `/dashboard/campaigns/${id}/forge/npc`,
    color: 'text-purple-400',
  },
  {
    key: 'explored_codex',
    label: 'Explore the Codex',
    description: 'Add world lore and notes',
    icon: Book,
    href: (id) => `/dashboard/campaigns/${id}/codex`,
    color: 'text-blue-400',
  },
  {
    key: 'created_faction',
    label: 'Create a Faction',
    description: 'Build organizations and groups',
    icon: Users,
    href: (id) => `/dashboard/campaigns/${id}/forge/faction`,
    color: 'text-orange-400',
  },
  {
    key: 'added_quest',
    label: 'Add a Quest',
    description: 'Create adventure objectives',
    icon: Scroll,
    href: (id) => `/dashboard/campaigns/${id}/forge/quest`,
    color: 'text-purple-400',
  },
  {
    key: 'exported_campaign',
    label: 'Export Campaign',
    description: 'Backup your campaign data',
    icon: Download,
    href: (id) => `/dashboard/campaigns/${id}`,
    color: 'text-cyan-400',
    action: 'export',
  },
  {
    key: 'invited_player',
    label: 'Invite a Player',
    description: 'Share with your party',
    icon: UserPlus,
    href: (id) => `/dashboard/campaigns/${id}/invite`,
    color: 'text-pink-400',
    action: 'invite',
  },
]

interface CampaignChecklistProps {
  campaignId?: string
  compact?: boolean
  className?: string
}

export function CampaignChecklist({
  campaignId,
  compact = false,
  className,
}: CampaignChecklistProps) {
  const { data, isLoading, getCompletionPercentage, getCompletedCount, getTotalCount } = useOnboarding()
  const { openExportModal, openInviteModal } = useCampaignActions()

  if (isLoading || !data) {
    return null
  }

  const percentage = getCompletionPercentage()
  const completedCount = getCompletedCount()
  const totalCount = getTotalCount()
  const progress = data.checklist_progress

  // Find next incomplete item
  const nextItem = CHECKLIST_ITEMS.find((item) => !progress[item.key])

  // In compact mode, only show the next item
  if (compact) {
    if (!nextItem || percentage === 100) {
      return null
    }

    return (
      <Link
        href={campaignId ? nextItem.href(campaignId) : nextItem.href('')}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg',
          'bg-slate-800/50 border border-white/5',
          'hover:border-teal-500/30 hover:bg-slate-800 transition-all group',
          className
        )}
      >
        <div className={cn('p-2 rounded-lg bg-slate-900', nextItem.color)}>
          <nextItem.icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            Next: {nextItem.label}
          </p>
          <p className="text-xs text-slate-500 truncate">{nextItem.description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
      </Link>
    )
  }

  return (
    <MaterialCard className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-white">Getting Started</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-teal-400">{percentage}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={percentage} className="h-2 bg-slate-800 mb-4" />

      {/* Checklist Items */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {CHECKLIST_ITEMS.map((item) => {
          const isComplete = progress[item.key]
          const Icon = item.icon

          // Handle special action items (export, invite) with buttons
          const handleClick = () => {
            if (item.action === 'export') {
              openExportModal()
            } else if (item.action === 'invite') {
              openInviteModal()
            }
          }

          const itemContent = (
            <>
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                  isComplete
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'bg-slate-800 text-slate-500'
                )}
              >
                {isComplete ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm truncate',
                    isComplete ? 'text-slate-400 line-through' : 'text-white'
                  )}
                >
                  {item.label}
                </p>
              </div>
              {!isComplete && (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </>
          )

          const itemClassName = cn(
            'flex items-center gap-3 p-2 rounded-lg transition-all w-full text-left',
            isComplete
              ? 'opacity-60 cursor-default'
              : 'hover:bg-slate-800/50 cursor-pointer'
          )

          // Use button for action items, Link for navigation items
          if (item.action && !isComplete) {
            return (
              <button
                key={item.key}
                onClick={handleClick}
                className={itemClassName}
              >
                {itemContent}
              </button>
            )
          }

          return (
            <Link
              key={item.key}
              href={campaignId ? item.href(campaignId) : item.href('')}
              className={itemClassName}
            >
              {itemContent}
            </Link>
          )
        })}
      </div>

      {/* Completion Message */}
      {percentage === 100 && (
        <div className="mt-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-center">
          <p className="text-sm text-teal-400 font-medium">
            Congratulations! You&apos;ve completed the getting started checklist.
          </p>
        </div>
      )}
    </MaterialCard>
  )
}
