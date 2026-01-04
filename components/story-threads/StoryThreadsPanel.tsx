'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Clock,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  PauseCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { ThreadFormDialog } from './ThreadFormDialog'
import { ResolveThreadDialog } from './ResolveThreadDialog'
import { StoryThread, PRIORITY_LEVELS, THREAD_TYPES } from '@/lib/story-threads/types'

interface StoryThreadsPanelProps {
  campaignId: string
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  background: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50',
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  resolved: CheckCircle,
  failed: XCircle,
  dormant: PauseCircle,
}

export function StoryThreadsPanel({ campaignId }: StoryThreadsPanelProps): JSX.Element {
  const [threads, setThreads] = useState<StoryThread[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingThread, setEditingThread] = useState<StoryThread | null>(null)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolvingThread, setResolvingThread] = useState<StoryThread | null>(null)

  const loadThreads = async (): Promise<void> => {
    setLoading(true)
    try {
      const status = activeTab === 'all' ? '' : activeTab
      const response = await fetch(
        `/api/story-threads?campaignId=${campaignId}&status=${status}`
      )
      if (!response.ok) throw new Error('Failed to load threads')
      const data = await response.json()
      setThreads(data.threads || [])
    } catch (error) {
      console.error('Failed to load threads:', error)
      toast.error('Failed to load story threads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, activeTab])

  const handleAdvanceClock = async (
    thread: StoryThread,
    action: 'advance' | 'reduce'
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/story-threads/${thread.id}/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) throw new Error('Failed to update clock')

      const data = await response.json()

      // Update local state
      setThreads(threads.map((t) => (t.id === thread.id ? { ...t, ...data.thread } : t)))

      if (data.triggered) {
        toast.warning(`"${thread.title}" has triggered!`, {
          description: thread.consequence_if_ignored || 'The clock has run out.',
          duration: 5000,
        })
      }
    } catch (error) {
      toast.error('Failed to update clock')
    }
  }

  const handleDelete = async (thread: StoryThread): Promise<void> => {
    if (!confirm(`Delete "${thread.title}"? This cannot be undone.`)) return

    try {
      const response = await fetch(`/api/story-threads/${thread.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Thread deleted')
      loadThreads()
    } catch (error) {
      toast.error('Failed to delete thread')
    }
  }

  const handleEdit = (thread: StoryThread): void => {
    setEditingThread(thread)
    setFormOpen(true)
  }

  const handleResolve = (thread: StoryThread): void => {
    setResolvingThread(thread)
    setResolveDialogOpen(true)
  }

  const openNewThreadForm = (): void => {
    setEditingThread(null)
    setFormOpen(true)
  }

  // Group threads by priority for display
  const groupedThreads = {
    critical: threads.filter((t) => t.priority === 'critical'),
    high: threads.filter((t) => t.priority === 'high'),
    medium: threads.filter((t) => t.priority === 'medium'),
    low: threads.filter((t) => t.priority === 'low'),
    background: threads.filter((t) => t.priority === 'background'),
  }

  const urgentCount = threads.filter((t) => t.is_urgent || t.is_triggered).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Story Threads
          </h2>
          {urgentCount > 0 && (
            <p className="text-sm text-red-400">
              {urgentCount} urgent thread{urgentCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadThreads}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openNewThreadForm} className="bg-amber-600 hover:bg-amber-500">
            <Plus className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="dormant">Dormant</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : threads.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">
                  No {activeTab !== 'all' ? activeTab : ''} threads
                </h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Story threads track consequences, promises, and ticking clocks.
                </p>
                <Button onClick={openNewThreadForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Thread
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedThreads).map(([priority, priorityThreads]) => {
                if (priorityThreads.length === 0) return null
                const priorityInfo = PRIORITY_LEVELS.find((p) => p.value === priority)

                return (
                  <div key={priority}>
                    <h3
                      className={`text-sm font-medium mb-2 ${
                        priority === 'critical'
                          ? 'text-red-400'
                          : priority === 'high'
                            ? 'text-orange-400'
                            : priority === 'medium'
                              ? 'text-yellow-400'
                              : priority === 'low'
                                ? 'text-blue-400'
                                : 'text-zinc-400'
                      }`}
                    >
                      {priorityInfo?.label || priority} ({priorityThreads.length})
                    </h3>
                    <div className="space-y-2">
                      {priorityThreads.map((thread) => (
                        <ThreadCard
                          key={thread.id}
                          thread={thread}
                          onAdvance={() => handleAdvanceClock(thread, 'advance')}
                          onReduce={() => handleAdvanceClock(thread, 'reduce')}
                          onEdit={() => handleEdit(thread)}
                          onDelete={() => handleDelete(thread)}
                          onResolve={() => handleResolve(thread)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <ThreadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        campaignId={campaignId}
        existingThread={editingThread}
        onSaved={loadThreads}
      />

      {/* Resolve Dialog */}
      {resolvingThread && (
        <ResolveThreadDialog
          open={resolveDialogOpen}
          onOpenChange={setResolveDialogOpen}
          thread={resolvingThread}
          onResolved={loadThreads}
        />
      )}
    </div>
  )
}

// Thread Card Component
function ThreadCard({
  thread,
  onAdvance,
  onReduce,
  onEdit,
  onDelete,
  onResolve,
}: {
  thread: StoryThread
  onAdvance: () => void
  onReduce: () => void
  onEdit: () => void
  onDelete: () => void
  onResolve: () => void
}): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  const isActive = thread.status === 'active'
  const hasClock = thread.clock_max && thread.clock_max > 0
  const clockPercent = thread.clock_percentage || 0
  const isTriggered = hasClock && (thread.clock_current || 0) >= thread.clock_max

  const StatusIcon = STATUS_ICONS[thread.status as string]

  return (
    <Card
      className={`bg-zinc-900 border-zinc-800 ${
        thread.is_urgent || isTriggered ? 'border-red-500/50 bg-red-500/5' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Expand Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-zinc-500 hover:text-zinc-300"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-zinc-200">{thread.title}</span>
              <Badge variant="outline" className={PRIORITY_COLORS[thread.priority]}>
                {thread.priority}
              </Badge>
              {thread.thread_type && (
                <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                  {THREAD_TYPES.find((t) => t.value === thread.thread_type)?.label ||
                    thread.thread_type}
                </Badge>
              )}
              {!isActive && StatusIcon && (
                <StatusIcon
                  className={`h-4 w-4 ${
                    thread.status === 'resolved'
                      ? 'text-green-400'
                      : thread.status === 'failed'
                        ? 'text-red-400'
                        : 'text-zinc-400'
                  }`}
                />
              )}
              {isTriggered && isActive && (
                <Badge className="bg-red-500 text-white">TRIGGERED!</Badge>
              )}
            </div>

            {thread.description && (
              <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{thread.description}</p>
            )}

            {/* Clock Display */}
            {hasClock && isActive && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onReduce()
                    }}
                    disabled={(thread.clock_current || 0) <= 0}
                  >
                    -
                  </Button>
                  <span className="text-sm font-mono w-12 text-center">
                    {thread.clock_current || 0}/{thread.clock_max}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAdvance()
                    }}
                    disabled={(thread.clock_current || 0) >= (thread.clock_max || 0)}
                  >
                    +
                  </Button>
                </div>
                <Progress
                  value={clockPercent}
                  className={`flex-1 h-2 ${
                    clockPercent >= 75
                      ? '[&>div]:bg-red-500'
                      : clockPercent >= 50
                        ? '[&>div]:bg-yellow-500'
                        : '[&>div]:bg-green-500'
                  }`}
                />
              </div>
            )}

            {/* Expanded Content */}
            {expanded && (
              <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                {thread.consequence_if_ignored && (
                  <div>
                    <div className="text-xs font-medium text-red-400 mb-1">If Ignored:</div>
                    <p className="text-sm text-zinc-400">{thread.consequence_if_ignored}</p>
                  </div>
                )}
                {thread.consequence_if_resolved && (
                  <div>
                    <div className="text-xs font-medium text-green-400 mb-1">If Resolved:</div>
                    <p className="text-sm text-zinc-400">{thread.consequence_if_resolved}</p>
                  </div>
                )}
                {thread.resolution_notes && (
                  <div>
                    <div className="text-xs font-medium text-zinc-500 mb-1">Resolution Notes:</div>
                    <p className="text-sm text-zinc-400">{thread.resolution_notes}</p>
                  </div>
                )}
                {thread.applied_consequence && (
                  <div
                    className={`p-2 rounded ${
                      thread.status === 'resolved' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">Applied Consequence:</div>
                    <p className="text-sm">{thread.applied_consequence}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
              <DropdownMenuItem onSelect={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {isActive && (
                <DropdownMenuItem onSelect={onResolve}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve...
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={onDelete} className="text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
