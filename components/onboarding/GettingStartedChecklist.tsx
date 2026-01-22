'use client';

import { useSettings } from '@/hooks/useSettings';
import { MaterialCard } from '@/components/ui/material-card';
import { Progress } from '@/components/ui/progress';
import {
  Map,
  User,
  MapPin,
  Shield,
  Scroll,
  BookOpen,
  Crown,
  Sparkles,
  Book,
  Clock,
  Link2,
  Network,
  MessageSquare,
  Calendar,
  ListChecks,
  Play,
  UserPlus,
  Download,
  Megaphone,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TaskItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href?: (campaignId: string) => string;
  color: string;
}

// Phase 1: Build Your World
const GETTING_STARTED_1: TaskItem[] = [
  {
    id: 'create_campaign',
    label: 'Create a Campaign',
    description: 'Set up your first adventure',
    icon: Map,
    href: () => '/dashboard',
    color: 'text-teal-400',
  },
  {
    id: 'create_npc',
    label: 'Create an NPC',
    description: 'Forge a memorable character',
    icon: User,
    href: (id) => `/dashboard/campaigns/${id}/forge/npc`,
    color: 'text-teal-400',
  },
  {
    id: 'create_location',
    label: 'Create a Location',
    description: 'Build an immersive place',
    icon: MapPin,
    href: (id) => `/dashboard/campaigns/${id}/forge/location`,
    color: 'text-emerald-400',
  },
  {
    id: 'create_faction',
    label: 'Create a Faction',
    description: 'Build organizations and groups',
    icon: Shield,
    href: (id) => `/dashboard/campaigns/${id}/forge/faction`,
    color: 'text-orange-400',
  },
  {
    id: 'create_quest',
    label: 'Add a Quest',
    description: 'Create adventure objectives',
    icon: Scroll,
    href: (id) => `/dashboard/campaigns/${id}/forge/quest`,
    color: 'text-purple-400',
  },
  {
    id: 'create_event',
    label: 'Create a Lore Event',
    description: 'Add historical events to your world',
    icon: BookOpen,
    href: (id) => `/dashboard/campaigns/${id}/forge/lore`,
    color: 'text-blue-400',
  },
  {
    id: 'create_deity',
    label: 'Create a Deity',
    description: 'Forge divine beings',
    icon: Crown,
    href: (id) => `/dashboard/campaigns/${id}/forge/pantheon`,
    color: 'text-amber-400',
  },
  {
    id: 'use_ai_generation',
    label: 'Use AI Generation',
    description: 'Let the AI help you create',
    icon: Sparkles,
    href: (id) => `/dashboard/campaigns/${id}/forge/npc`,
    color: 'text-purple-400',
  },
  {
    id: 'explore_codex',
    label: 'Explore the Codex',
    description: 'Add world lore and notes',
    icon: Book,
    href: (id) => `/dashboard/campaigns/${id}/codex`,
    color: 'text-blue-400',
  },
  {
    id: 'view_timeline',
    label: 'View the Timeline',
    description: 'See your world history',
    icon: Clock,
    href: (id) => `/dashboard/campaigns/${id}/timeline`,
    color: 'text-cyan-400',
  },
  {
    id: 'create_relationship',
    label: 'Connect Two Entities',
    description: 'Link characters and places',
    icon: Link2,
    href: (id) => `/dashboard/campaigns/${id}/memory`,
    color: 'text-pink-400',
  },
  {
    id: 'view_spiderweb',
    label: 'View the Spiderweb',
    description: 'See your world connections',
    icon: Network,
    href: (id) => `/dashboard/campaigns/${id}/memory?view=graph`,
    color: 'text-violet-400',
  },
  {
    id: 'ask_ally',
    label: 'Ask Ally a Question',
    description: 'Chat with your AI assistant',
    icon: MessageSquare,
    href: (id) => `/dashboard/campaigns/${id}/copilot`,
    color: 'text-purple-400',
  },
];

// Phase 2: Run Your Game
const GETTING_STARTED_2: TaskItem[] = [
  {
    id: 'create_session',
    label: 'Create a Session',
    description: 'Plan your next game',
    icon: Calendar,
    href: (id) => `/dashboard/campaigns/${id}/sessions`,
    color: 'text-teal-400',
  },
  {
    id: 'use_session_prep',
    label: 'Use Session Prep',
    description: 'Generate session beats',
    icon: ListChecks,
    href: (id) => `/dashboard/campaigns/${id}/sessions`,
    color: 'text-blue-400',
  },
  {
    id: 'run_session',
    label: 'Run a Session',
    description: 'Start your adventure',
    icon: Play,
    href: (id) => `/dashboard/campaigns/${id}/sessions`,
    color: 'text-green-400',
  },
  {
    id: 'invite_player',
    label: 'Invite a Player',
    description: 'Share with your party',
    icon: UserPlus,
    href: (id) => `/dashboard/campaigns/${id}/party`,
    color: 'text-pink-400',
  },
  {
    id: 'export_campaign',
    label: 'Export Campaign',
    description: 'Backup your data',
    icon: Download,
    href: () => '/dashboard/settings',
    color: 'text-cyan-400',
  },
  {
    id: 'push_rumor',
    label: 'Push a Rumor to Players',
    description: 'Share secrets with your party',
    icon: Megaphone,
    href: (id) => `/dashboard/campaigns/${id}/party`,
    color: 'text-amber-400',
  },
];

interface GettingStartedChecklistProps {
  campaignId?: string;
  className?: string;
  onHide?: () => void;
}

export function GettingStartedChecklist({
  campaignId,
  className,
  onHide,
}: GettingStartedChecklistProps) {
  const { settings, isLoading } = useSettings();

  if (isLoading || !settings) {
    return null;
  }

  const onboarding = settings.onboarding || {};

  // Calculate phase 1 completion
  const phase1Complete = GETTING_STARTED_1.filter((t) => onboarding[t.id]).length;
  const phase1Total = GETTING_STARTED_1.length;
  const phase1Done = phase1Complete === phase1Total;

  // Calculate phase 2 completion
  const phase2Complete = GETTING_STARTED_2.filter((t) => onboarding[t.id]).length;
  const phase2Total = GETTING_STARTED_2.length;
  const phase2Done = phase2Complete === phase2Total;

  // Current tasks and progress
  const currentTasks = phase1Done ? GETTING_STARTED_2 : GETTING_STARTED_1;
  const currentComplete = phase1Done ? phase2Complete : phase1Complete;
  const currentTotal = phase1Done ? phase2Total : phase1Total;
  const percentage = Math.round((currentComplete / currentTotal) * 100);

  // Find next incomplete task
  const nextTask = currentTasks.find((t) => !onboarding[t.id]);

  return (
    <MaterialCard className={cn('p-4 relative', className)}>
      {/* Close button */}
      {onHide && (
        <button
          onClick={onHide}
          className="absolute top-3 right-3 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
          title="Hide Getting Started"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pr-6">
        <div>
          <h3 className="font-display font-semibold text-white">
            {phase1Done ? 'Run Your Game' : 'Build Your World'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {phase1Done ? 'Phase 2: ' : 'Phase 1: '}
            {currentComplete} of {currentTotal} completed
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-purple-400">{percentage}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={percentage} className="h-2 bg-slate-800 mb-4" />

      {/* Phase transition message */}
      {phase1Done && !phase2Done && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm">
            World building complete! Now let&apos;s run your game.
          </p>
        </div>
      )}

      {/* All complete message */}
      {phase1Done && phase2Done ? (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">🏆</p>
          <p className="text-green-400 font-medium">You&apos;ve completed everything!</p>
          <p className="text-slate-500 text-sm mt-1">
            You&apos;re ready to run epic campaigns.
          </p>
        </div>
      ) : (
        /* Task List */
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {currentTasks.map((task) => {
            const isComplete = onboarding[task.id];
            const Icon = task.icon;

            const itemContent = (
              <>
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    isComplete
                      ? 'bg-purple-500/20 text-purple-400'
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
                    {task.label}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{task.description}</p>
                </div>
                {!isComplete && (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                )}
              </>
            );

            const itemClassName = cn(
              'flex items-center gap-3 p-2 rounded-lg transition-all w-full text-left',
              isComplete
                ? 'opacity-60 cursor-default'
                : 'hover:bg-slate-800/50 cursor-pointer'
            );

            if (!task.href || isComplete) {
              return (
                <div key={task.id} className={itemClassName}>
                  {itemContent}
                </div>
              );
            }

            return (
              <Link
                key={task.id}
                href={campaignId ? task.href(campaignId) : task.href('')}
                className={itemClassName}
              >
                {itemContent}
              </Link>
            );
          })}
        </div>
      )}
    </MaterialCard>
  );
}

// Compact version for sidebar or header
export function GettingStartedCompact({
  campaignId,
  className,
}: {
  campaignId?: string;
  className?: string;
}) {
  const { settings, isLoading } = useSettings();

  if (isLoading || !settings) {
    return null;
  }

  const onboarding = settings.onboarding || {};

  // Find next incomplete task from phase 1 first, then phase 2
  const nextTask =
    GETTING_STARTED_1.find((t) => !onboarding[t.id]) ||
    GETTING_STARTED_2.find((t) => !onboarding[t.id]);

  if (!nextTask) {
    return null; // All complete
  }

  const Icon = nextTask.icon;

  return (
    <Link
      href={campaignId && nextTask.href ? nextTask.href(campaignId) : '#'}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-slate-800/50 border border-white/5',
        'hover:border-purple-500/30 hover:bg-slate-800 transition-all group',
        className
      )}
    >
      <div className={cn('p-2 rounded-lg bg-slate-900', nextTask.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">Next: {nextTask.label}</p>
        <p className="text-xs text-slate-500 truncate">{nextTask.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
    </Link>
  );
}

// Restore button for when checklist is hidden
export function GettingStartedRestoreButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        'fixed bottom-4 right-4 h-12 w-12 rounded-full',
        'bg-purple-600 hover:bg-purple-700 shadow-lg',
        'transition-all hover:scale-105',
        className
      )}
      title="Show Getting Started"
    >
      <Sparkles className="w-5 h-5 text-white" />
    </Button>
  );
}
