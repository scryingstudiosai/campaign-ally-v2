'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Brain,
  Book,
  History,
  Users,
  MapPin,
  Package,
  Scroll,
  Swords,
  Command,
  Search,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Guide {
  id: string
  title: string
  description: string
  icon: typeof BookOpen
  color: string
  steps: string[]
}

const GUIDES: Guide[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of Campaign Ally',
    icon: Sparkles,
    color: 'text-teal-400',
    steps: [
      'Create your first campaign from the dashboard',
      'Visit the Forge to generate NPCs, locations, and more',
      'Use the Codex to add world lore that helps the AI',
      'Start a session when you\'re ready to play',
    ],
  },
  {
    id: 'using-forge',
    title: 'Using the Forge',
    description: 'Generate content with AI assistance',
    icon: Sparkles,
    color: 'text-purple-400',
    steps: [
      'Choose what you want to create (NPC, Location, etc.)',
      'Fill in as much or as little detail as you want',
      'Click Generate to let the AI create content',
      'Review, edit, and save to your campaign memory',
    ],
  },
  {
    id: 'world-building',
    title: 'World Building',
    description: 'Create an interconnected world',
    icon: MapPin,
    color: 'text-emerald-400',
    steps: [
      'Create locations where your story takes place',
      'Add NPCs and assign them to locations',
      'Create factions and add members',
      'Link entities with relationships for rich context',
    ],
  },
  {
    id: 'running-sessions',
    title: 'Running Sessions',
    description: 'Use Campaign Ally during play',
    icon: History,
    color: 'text-amber-400',
    steps: [
      'Start a new session from the Sessions page',
      'Use the AI assistant for quick answers',
      'Reference your entities during play',
      'Add session notes to track what happened',
    ],
  },
]

interface Shortcut {
  keys: string[]
  description: string
  category: 'navigation' | 'actions' | 'editor'
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['⌘', 'K'], description: 'Open command menu', category: 'navigation' },
  { keys: ['⌘', '/'], description: 'Open AI assistant', category: 'actions' },
  { keys: ['⌘', 'N'], description: 'Create new entity', category: 'actions' },
  { keys: ['⌘', 'S'], description: 'Save changes', category: 'editor' },
  { keys: ['Esc'], description: 'Close modal / Cancel', category: 'navigation' },
  { keys: ['⌘', 'Enter'], description: 'Submit / Confirm', category: 'actions' },
  { keys: ['Tab'], description: 'Navigate fields', category: 'editor' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar', category: 'navigation' },
]

interface HelpPanelProps {
  trigger?: React.ReactNode
}

export function HelpPanel({ trigger }: HelpPanelProps) {
  const [activeGuide, setActiveGuide] = useState<string | null>(null)

  const selectedGuide = GUIDES.find((g) => g.id === activeGuide)

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[400px] bg-slate-900 border-slate-800 p-0"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-800">
          <SheetTitle className="flex items-center gap-2 text-white">
            <HelpCircle className="w-5 h-5 text-teal-400" />
            Help & Resources
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="guides" className="flex-1">
          <TabsList className="w-full grid grid-cols-3 bg-slate-800/50 p-1 mx-6 mt-4 rounded-lg">
            <TabsTrigger
              value="guides"
              className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Guides
            </TabsTrigger>
            <TabsTrigger
              value="shortcuts"
              className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <Keyboard className="w-3.5 h-3.5 mr-1.5" />
              Shortcuts
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Support
            </TabsTrigger>
          </TabsList>

          {/* Guides Tab */}
          <TabsContent value="guides" className="p-6 pt-4">
            {activeGuide && selectedGuide ? (
              <div>
                <button
                  onClick={() => setActiveGuide(null)}
                  className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  Back to guides
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      'p-2 rounded-lg bg-slate-800',
                      selectedGuide.color
                    )}
                  >
                    <selectedGuide.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">
                      {selectedGuide.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedGuide.description}
                    </p>
                  </div>
                </div>

                <ol className="space-y-3">
                  {selectedGuide.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-300 pt-0.5">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="space-y-2">
                {GUIDES.map((guide) => (
                  <button
                    key={guide.id}
                    onClick={() => setActiveGuide(guide.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left group"
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-slate-900/50',
                        guide.color
                      )}
                    >
                      <guide.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {guide.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {guide.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Shortcuts Tab */}
          <TabsContent value="shortcuts" className="p-6 pt-4">
            <div className="space-y-4">
              {(['navigation', 'actions', 'editor'] as const).map((category) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {SHORTCUTS.filter((s) => s.category === category).map(
                      (shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30"
                        >
                          <span className="text-sm text-slate-300">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, i) => (
                              <kbd
                                key={i}
                                className="px-2 py-1 text-xs bg-slate-700 rounded border border-slate-600 text-slate-300"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}

              <p className="text-xs text-slate-500 mt-4">
                Tip: On Windows, use <kbd className="px-1 bg-slate-700 rounded">Ctrl</kbd> instead of <kbd className="px-1 bg-slate-700 rounded">⌘</kbd>
              </p>
            </div>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="p-6 pt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <h4 className="font-medium text-white mb-2">
                  Need Help?
                </h4>
                <p className="text-sm text-slate-400 mb-4">
                  Check out our documentation or reach out to support.
                </p>
                <div className="space-y-2">
                  <a
                    href="https://docs.campaignally.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Documentation
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="mailto:support@campaignally.app"
                    className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact Support
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <h4 className="font-medium text-purple-300 mb-2">
                  Feature Request?
                </h4>
                <p className="text-sm text-slate-400 mb-3">
                  We&apos;d love to hear your ideas for improving Campaign Ally.
                </p>
                <a
                  href="https://feedback.campaignally.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Submit Feedback
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="text-center pt-4">
                <p className="text-xs text-slate-600">
                  Campaign Ally v1.0
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
