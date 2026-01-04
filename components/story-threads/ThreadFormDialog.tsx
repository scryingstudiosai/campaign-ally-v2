'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Clock, AlertTriangle, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EntitySearch } from '@/components/entity-mention/EntitySearch'
import { EntityBadge } from '@/components/entity-mention/EntityBadge'
import {
  THREAD_TYPES,
  PRIORITY_LEVELS,
  CLOCK_TYPES,
  TRIGGER_TYPES,
  STAKE_TYPES,
  StoryThread,
} from '@/lib/story-threads/types'

interface ThreadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  existingThread?: StoryThread | null
  onSaved: () => void
}

interface LinkedEntity {
  id: string
  name: string
  entity_type: string
}

export function ThreadFormDialog({
  open,
  onOpenChange,
  campaignId,
  existingThread,
  onSaved,
}: ThreadFormDialogProps): JSX.Element {
  const [loading, setLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [threadType, setThreadType] = useState('consequence')
  const [priority, setPriority] = useState('medium')
  const [clockType, setClockType] = useState('none')
  const [clockMax, setClockMax] = useState(4)
  const [triggerType, setTriggerType] = useState('none')
  const [stakeType, setStakeType] = useState('')
  const [consequenceIfIgnored, setConsequenceIfIgnored] = useState('')
  const [consequenceIfResolved, setConsequenceIfResolved] = useState('')
  const [relatedEntities, setRelatedEntities] = useState<LinkedEntity[]>([])

  const isEditing = !!existingThread

  // Populate form when editing
  useEffect(() => {
    if (existingThread) {
      setTitle(existingThread.title || '')
      setDescription(existingThread.description || '')
      setThreadType(existingThread.thread_type || 'consequence')
      setPriority(existingThread.priority || 'medium')
      setClockType(existingThread.clock_type || 'none')
      setClockMax(existingThread.clock_max || 4)
      setTriggerType(existingThread.trigger_type || 'none')
      setStakeType(existingThread.stake_type || '')
      setConsequenceIfIgnored(existingThread.consequence_if_ignored || '')
      setConsequenceIfResolved(existingThread.consequence_if_resolved || '')
      // TODO: Load related entities from IDs
    } else {
      // Reset form
      setTitle('')
      setDescription('')
      setThreadType('consequence')
      setPriority('medium')
      setClockType('none')
      setClockMax(4)
      setTriggerType('none')
      setStakeType('')
      setConsequenceIfIgnored('')
      setConsequenceIfResolved('')
      setRelatedEntities([])
    }
  }, [existingThread, open])

  const handleAddEntity = (entity: LinkedEntity): void => {
    if (!relatedEntities.find((e) => e.id === entity.id)) {
      setRelatedEntities([...relatedEntities, entity])
    }
  }

  const handleRemoveEntity = (entityId: string): void => {
    setRelatedEntities(relatedEntities.filter((e) => e.id !== entityId))
  }

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setLoading(true)
    try {
      const payload = {
        campaignId,
        title: title.trim(),
        description: description.trim() || null,
        thread_type: threadType,
        priority,
        clock_type: clockType !== 'none' ? clockType : null,
        clock_max: clockType !== 'none' ? clockMax : null,
        trigger_type: triggerType !== 'none' ? triggerType : null,
        stake_type: stakeType || null,
        consequence_if_ignored: consequenceIfIgnored.trim() || null,
        consequence_if_resolved: consequenceIfResolved.trim() || null,
        related_entity_ids: relatedEntities.map((e) => e.id),
      }

      const url = isEditing ? `/api/story-threads/${existingThread.id}` : '/api/story-threads'

      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save thread')
      }

      toast.success(isEditing ? 'Thread updated!' : 'Thread created!')
      onSaved()
      onOpenChange(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            {isEditing ? 'Edit Story Thread' : 'Create Story Thread'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Blacksmith's Debt"
              className="mt-1 bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Description with Entity Mentions */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <EntitySearch
                campaignId={campaignId}
                onSelect={handleAddEntity}
                trigger={
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Link Entity
                  </Button>
                }
              />
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The party owes money to the blacksmith and skipped town..."
              className="mt-1 bg-zinc-800 border-zinc-700"
              rows={3}
            />
            {relatedEntities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {relatedEntities.map((entity) => (
                  <EntityBadge
                    key={entity.id}
                    name={entity.name}
                    type={entity.entity_type}
                    onRemove={() => handleRemoveEntity(entity.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Type and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Thread Type</Label>
              <Select value={threadType} onValueChange={setThreadType}>
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {THREAD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {PRIORITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            level.color === 'red'
                              ? 'bg-red-500'
                              : level.color === 'orange'
                                ? 'bg-orange-500'
                                : level.color === 'yellow'
                                  ? 'bg-yellow-500'
                                  : level.color === 'blue'
                                    ? 'bg-blue-500'
                                    : 'bg-gray-500'
                          }`}
                        />
                        {level.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clock Section */}
          <div className="p-4 bg-zinc-800/50 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="font-medium">Clock Settings</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Clock Type</Label>
                <Select value={clockType} onValueChange={setClockType}>
                  <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {CLOCK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clockType !== 'none' && (
                <div>
                  <Label className="flex items-center justify-between">
                    <span>Clock Size</span>
                    <span className="text-zinc-400 text-sm">{clockMax} segments</span>
                  </Label>
                  <Slider
                    value={[clockMax]}
                    onValueChange={([v]) => setClockMax(v)}
                    min={1}
                    max={20}
                    step={1}
                    className="mt-3"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Stakes and Trigger Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stakes</Label>
              <Select value={stakeType} onValueChange={setStakeType}>
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select stakes..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {STAKE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Trigger Type</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {TRIGGER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Consequences Section */}
          <div className="p-4 bg-zinc-800/50 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="font-medium">Consequences</span>
            </div>

            <div>
              <Label className="text-red-400">If Ignored / Failed</Label>
              <Textarea
                value={consequenceIfIgnored}
                onChange={(e) => setConsequenceIfIgnored(e.target.value)}
                placeholder="What happens if the party ignores this or the clock runs out?"
                className="mt-1 bg-zinc-800 border-zinc-700"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-green-400">If Resolved</Label>
              <Textarea
                value={consequenceIfResolved}
                onChange={(e) => setConsequenceIfResolved(e.target.value)}
                placeholder="What happens if the party successfully addresses this?"
                className="mt-1 bg-zinc-800 border-zinc-700"
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="bg-amber-600 hover:bg-amber-500"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update Thread' : 'Create Thread'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
