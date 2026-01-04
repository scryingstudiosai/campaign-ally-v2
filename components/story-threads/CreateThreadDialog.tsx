'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  onCreated: () => void;
  sourceSessionId?: string;
}

export function CreateThreadDialog({
  open,
  onOpenChange,
  campaignId,
  onCreated,
  sourceSessionId,
}: CreateThreadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [threadType, setThreadType] = useState('consequence');
  const [priority, setPriority] = useState('medium');
  const [clockType, setClockType] = useState('none');
  const [clockMax, setClockMax] = useState(4);
  const [stakeType, setStakeType] = useState('social');
  const [consequence, setConsequence] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/story-threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          title: title.trim(),
          description: description.trim(),
          thread_type: threadType,
          priority,
          clock_type: clockType,
          clock_max: clockType !== 'none' ? clockMax : null,
          stake_type: stakeType,
          consequence_if_ignored: consequence.trim(),
          source_session_id: sourceSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create thread');
      }

      toast.success('Story thread created!');
      onCreated();

      // Reset form
      setTitle('');
      setDescription('');
      setConsequence('');
      setClockType('none');
    } catch (error) {
      toast.error('Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Story Thread</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Blacksmith's Debt"
              className="bg-zinc-800 border-zinc-700 mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened and why it matters..."
              className="bg-zinc-800 border-zinc-700 mt-1"
              rows={2}
            />
          </div>

          {/* Type & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={threadType} onValueChange={setThreadType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="consequence">Consequence</SelectItem>
                  <SelectItem value="promise">Promise</SelectItem>
                  <SelectItem value="debt">Debt</SelectItem>
                  <SelectItem value="secret">Secret</SelectItem>
                  <SelectItem value="prophecy">Prophecy</SelectItem>
                  <SelectItem value="quest_hook">Quest Hook</SelectItem>
                  <SelectItem value="relationship">Relationship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clock Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Clock Type</Label>
              <Select value={clockType} onValueChange={setClockType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="none">No Clock</SelectItem>
                  <SelectItem value="sessions">Sessions</SelectItem>
                  <SelectItem value="days">In-Game Days</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {clockType !== 'none' && (
              <div>
                <Label>Clock Size</Label>
                <Select value={clockMax.toString()} onValueChange={(v) => setClockMax(parseInt(v))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="2">2 (Urgent)</SelectItem>
                    <SelectItem value="4">4 (Short)</SelectItem>
                    <SelectItem value="6">6 (Medium)</SelectItem>
                    <SelectItem value="8">8 (Long)</SelectItem>
                    <SelectItem value="12">12 (Campaign)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Stakes */}
          <div>
            <Label>Stakes</Label>
            <Select value={stakeType} onValueChange={setStakeType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="social">Social (reputation, relationships)</SelectItem>
                <SelectItem value="economic">Economic (gold, resources)</SelectItem>
                <SelectItem value="political">Political (power, influence)</SelectItem>
                <SelectItem value="physical">Physical (danger, combat)</SelectItem>
                <SelectItem value="magical">Magical (curses, enchantments)</SelectItem>
                <SelectItem value="existential">Existential (world-changing)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Consequence */}
          <div>
            <Label>Consequence if Ignored</Label>
            <Textarea
              value={consequence}
              onChange={(e) => setConsequence(e.target.value)}
              placeholder="What happens if the party ignores this..."
              className="bg-zinc-800 border-zinc-700 mt-1"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="bg-teal-600 hover:bg-teal-500"
          >
            {loading ? 'Creating...' : 'Create Thread'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
