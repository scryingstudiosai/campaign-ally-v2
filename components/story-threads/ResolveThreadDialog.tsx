'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CheckCircle, XCircle, PauseCircle, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { StoryThread } from '@/lib/story-threads/types'

interface ResolveThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  thread: StoryThread
  onResolved: () => void
}

export function ResolveThreadDialog({
  open,
  onOpenChange,
  thread,
  onResolved,
}: ResolveThreadDialogProps): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [resolutionType, setResolutionType] = useState<string>('resolved')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [customConsequence, setCustomConsequence] = useState('')

  const handleResolve = async (): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/story-threads/${thread.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_type: resolutionType,
          resolution_notes: resolutionNotes.trim() || null,
          custom_consequence: customConsequence.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resolve thread')
      }

      const result = await response.json()

      toast.success(`Thread ${resolutionType}!`, {
        description: result.applied_consequence
          ? `Consequence: ${result.applied_consequence.slice(0, 100)}...`
          : undefined,
      })

      onResolved()
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Get the consequence that will be applied
  const getPreviewConsequence = (): string | null | undefined => {
    if (customConsequence.trim()) return customConsequence
    if (resolutionType === 'resolved') return thread.consequence_if_resolved
    if (resolutionType === 'failed') return thread.consequence_if_ignored
    return null
  }

  const previewConsequence = getPreviewConsequence()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle>Resolve: {thread.title}</DialogTitle>
          <DialogDescription>How did this story thread end?</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Resolution Type Selection */}
          <RadioGroup value={resolutionType} onValueChange={setResolutionType}>
            <div className="space-y-3">
              {/* Resolved */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  resolutionType === 'resolved'
                    ? 'bg-green-500/10 border-green-500/50'
                    : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <RadioGroupItem value="resolved" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-green-400">Resolved</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    The party successfully addressed this thread.
                  </p>
                  {thread.consequence_if_resolved && (
                    <p className="text-xs text-green-400/70 mt-2 italic">
                      → {thread.consequence_if_resolved}
                    </p>
                  )}
                </div>
              </label>

              {/* Failed */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  resolutionType === 'failed'
                    ? 'bg-red-500/10 border-red-500/50'
                    : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <RadioGroupItem value="failed" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="font-medium text-red-400">Failed / Ignored</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    The party ignored this or failed to address it in time.
                  </p>
                  {thread.consequence_if_ignored && (
                    <p className="text-xs text-red-400/70 mt-2 italic">
                      → {thread.consequence_if_ignored}
                    </p>
                  )}
                </div>
              </label>

              {/* Dormant */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  resolutionType === 'dormant'
                    ? 'bg-zinc-500/10 border-zinc-500/50'
                    : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <RadioGroupItem value="dormant" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <PauseCircle className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-zinc-400">Dormant</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    Put on hold - may return later. No consequence applied yet.
                  </p>
                </div>
              </label>
            </div>
          </RadioGroup>

          {/* Custom Consequence Override */}
          {resolutionType !== 'dormant' && (
            <div>
              <Label className="text-zinc-400">
                Custom Consequence (optional - overrides default)
              </Label>
              <Textarea
                value={customConsequence}
                onChange={(e) => setCustomConsequence(e.target.value)}
                placeholder="Leave empty to use the default consequence above..."
                className="mt-1 bg-zinc-800 border-zinc-700"
                rows={2}
              />
            </div>
          )}

          {/* Resolution Notes */}
          <div>
            <Label>DM Notes (what actually happened)</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Record what happened for future reference..."
              className="mt-1 bg-zinc-800 border-zinc-700"
              rows={3}
            />
          </div>

          {/* Consequence Preview */}
          {previewConsequence && resolutionType !== 'dormant' && (
            <div
              className={`p-3 rounded-lg border ${
                resolutionType === 'resolved'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <AlertTriangle className="h-4 w-4" />
                Consequence to Apply:
              </div>
              <p className="text-sm">{previewConsequence}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={loading}
            className={
              resolutionType === 'resolved'
                ? 'bg-green-600 hover:bg-green-500'
                : resolutionType === 'failed'
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-zinc-600 hover:bg-zinc-500'
            }
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {resolutionType === 'resolved' && 'Mark Resolved'}
            {resolutionType === 'failed' && 'Mark Failed'}
            {resolutionType === 'dormant' && 'Mark Dormant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
