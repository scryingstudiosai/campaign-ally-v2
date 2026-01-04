'use client'

import { useState, useEffect } from 'react'
import { useOnboarding } from '@/hooks/useOnboarding'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Lightbulb, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureHintProps {
  hintId: string
  title: string
  description: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  showOnce?: boolean
  delay?: number
  className?: string
}

export function FeatureHint({
  hintId,
  title,
  description,
  children,
  side = 'bottom',
  align = 'center',
  showOnce = true,
  delay = 500,
  className,
}: FeatureHintProps) {
  const { data, isLoading, isHintDismissed, dismissHint } = useOnboarding()
  const [open, setOpen] = useState(false)
  const [hasAutoShown, setHasAutoShown] = useState(false)

  // Auto-show hint after delay for new users
  useEffect(() => {
    if (isLoading || !data || hasAutoShown) return

    // Don't show if already dismissed
    if (isHintDismissed(hintId)) return

    // Only auto-show for new users
    const completedCount = Object.values(data.checklist_progress).filter(Boolean).length
    if (completedCount > 3) return

    const timer = setTimeout(() => {
      setOpen(true)
      setHasAutoShown(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [isLoading, data, hintId, hasAutoShown, delay, isHintDismissed])

  const handleDismiss = async () => {
    setOpen(false)
    if (showOnce) {
      await dismissHint(hintId)
    }
  }

  // Don't render popover if hint is dismissed and showOnce is true
  if (!isLoading && showOnce && isHintDismissed(hintId)) {
    return <>{children}</>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className={cn(
          'w-72 p-0 bg-slate-800 border-teal-500/30 shadow-lg shadow-teal-500/10',
          className
        )}
      >
        <div className="relative">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 flex-shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white text-sm mb-1">{title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs h-7 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
            >
              Got it
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Pre-defined hints for common features
export const FEATURE_HINTS = {
  forge: {
    id: 'forge-intro',
    title: 'Welcome to the Forge',
    description:
      'Use the Forge to generate NPCs, locations, creatures, and more using AI. Fill in as much or as little as you want, and the AI will do the rest.',
  },
  codex: {
    id: 'codex-intro',
    title: 'Your World Encyclopedia',
    description:
      'The Codex is where you store world lore, background information, and custom rules. This context helps the AI generate more fitting content.',
  },
  memory: {
    id: 'memory-intro',
    title: 'Campaign Memory',
    description:
      'All your generated entities are stored here. You can edit, link relationships, and organize your world.',
  },
  sessions: {
    id: 'sessions-intro',
    title: 'Session Management',
    description:
      'Track your game sessions, add notes, and use the AI assistant to help during play.',
  },
  commandMenu: {
    id: 'command-menu',
    title: 'Quick Navigation',
    description:
      'Press Cmd+K (or Ctrl+K) to quickly search and navigate anywhere in your campaign.',
  },
  relationships: {
    id: 'relationships-intro',
    title: 'Entity Relationships',
    description:
      'Connect NPCs, locations, and factions together to build a rich, interconnected world.',
  },
}
