'use client';

import { useState } from 'react';
import { BlockWrapper } from './BlockWrapper';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Clapperboard, MapPin, Users, BookOpen, Target,
  StickyNote, Volume2, Plus, Trash2, X
} from 'lucide-react';

interface SceneBlockProps {
  block: {
    id: string;
    title: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    content: {
      location_name?: string;
      location_id?: string;
      npcs?: { id?: string; name: string }[];
      read_aloud?: string;
      goals?: { text: string; completed: boolean }[];
      dm_notes?: string;
    };
  };
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function SceneBlock({ block, onUpdate, onDelete, onDuplicate }: SceneBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);

  const content = block.content || {};
  const goals = content.goals || [];
  const npcs = content.npcs || [];

  const handleUpdateContent = (field: string, value: any) => {
    onUpdate({ content: { ...content, [field]: value } });
  };

  const toggleGoal = (index: number) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], completed: !newGoals[index].completed };
    handleUpdateContent('goals', newGoals);
  };

  const addGoal = () => {
    const newGoals = [...goals, { text: '', completed: false }];
    handleUpdateContent('goals', newGoals);
  };

  const updateGoal = (index: number, text: string) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], text };
    handleUpdateContent('goals', newGoals);
  };

  const removeGoal = (index: number) => {
    const newGoals = goals.filter((_, i) => i !== index);
    handleUpdateContent('goals', newGoals);
  };

  const addNpc = () => {
    const newNpcs = [...npcs, { name: '' }];
    handleUpdateContent('npcs', newNpcs);
  };

  const updateNpc = (index: number, name: string) => {
    const newNpcs = [...npcs];
    newNpcs[index] = { ...newNpcs[index], name };
    handleUpdateContent('npcs', newNpcs);
  };

  const removeNpc = (index: number) => {
    const newNpcs = npcs.filter((_, i) => i !== index);
    handleUpdateContent('npcs', newNpcs);
  };

  const allGoalsComplete = goals.length > 0 && goals.every(g => g.completed);

  return (
    <BlockWrapper
      id={block.id}
      type="scene"
      title={block.title}
      status={block.status}
      icon={<Clapperboard className="w-4 h-4 text-blue-400" />}
      color="bg-blue-900/50"
      isEditing={isEditing}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onStatusChange={(status) => onUpdate({ status })}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      isRunnable={true}
      onRun={() => onUpdate({ status: 'active' })}
    >
      {isEditing ? (
        // === EDIT MODE ===
        <div className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Scene Title</label>
            <Input
              placeholder="e.g. Arrival at the Tavern"
              value={block.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="bg-slate-800 border-slate-700 font-medium"
            />
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Location
            </label>
            <Input
              placeholder="e.g. The Rusty Dragon Inn"
              value={content.location_name || ''}
              onChange={(e) => handleUpdateContent('location_name', e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {/* NPCs Present */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3" />
              NPCs Present
            </label>
            {npcs.map((npc, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={npc.name}
                  onChange={(e) => updateNpc(i, e.target.value)}
                  placeholder="NPC name..."
                  className="bg-slate-800 border-slate-700"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeNpc(i)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={addNpc}
              className="w-full border-slate-700 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" /> Add NPC
            </Button>
          </div>

          {/* Read Aloud */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Read Aloud Text
            </label>
            <Textarea
              placeholder="The warmth of the inn washes over you as you push through the heavy oak door..."
              value={content.read_aloud || ''}
              onChange={(e) => handleUpdateContent('read_aloud', e.target.value)}
              className="bg-slate-800 border-slate-700 min-h-[100px]"
            />
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3 h-3" />
              Scene Goals
            </label>
            {goals.map((goal, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={goal.text}
                  onChange={(e) => updateGoal(i, e.target.value)}
                  placeholder="What should happen in this scene..."
                  className="bg-slate-800 border-slate-700"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeGoal(i)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={addGoal}
              className="w-full border-slate-700 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Goal
            </Button>
          </div>

          {/* DM Notes */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <StickyNote className="w-3 h-3" />
              DM Notes (Hidden)
            </label>
            <Textarea
              placeholder="Secrets, triggers, or reminders only you can see..."
              value={content.dm_notes || ''}
              onChange={(e) => handleUpdateContent('dm_notes', e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>
      ) : (
        // === VIEW MODE ===
        <div className="space-y-4 mt-4">
          {/* Location & NPCs */}
          <div className="flex flex-wrap gap-4 text-sm">
            {content.location_name && (
              <div className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-4 h-4 text-green-400" />
                {content.location_name}
              </div>
            )}
            {npcs.length > 0 && (
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-4 h-4 text-blue-400" />
                {npcs.filter(n => n.name).map((npc, i) => (
                  <Badge key={i} variant="outline" className="border-blue-800 text-blue-300">
                    {npc.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Read Aloud */}
          {content.read_aloud && (
            <div className="relative">
              <div className={`p-3 rounded-lg border-l-4 border-amber-500 bg-amber-950/30 ${
                isReadingAloud ? 'ring-2 ring-amber-400' : ''
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Read Aloud
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-6 px-2 text-xs ${isReadingAloud ? 'text-amber-400' : 'text-slate-400'}`}
                    onClick={() => setIsReadingAloud(!isReadingAloud)}
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    {isReadingAloud ? 'Reading...' : 'Present'}
                  </Button>
                </div>
                <p className="text-slate-300 italic leading-relaxed">
                  "{content.read_aloud}"
                </p>
              </div>
            </div>
          )}

          {/* Goals */}
          {goals.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Scene Goals
              </p>
              <div className="space-y-2">
                {goals.map((goal, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2"
                  >
                    <Checkbox
                      checked={goal.completed}
                      onCheckedChange={() => toggleGoal(index)}
                      className="mt-0.5"
                    />
                    <span className={`text-sm ${
                      goal.completed ? 'text-slate-500 line-through' : 'text-slate-300'
                    }`}>
                      {goal.text || '(Empty goal)'}
                    </span>
                  </div>
                ))}
              </div>
              {allGoalsComplete && block.status === 'active' && (
                <Button
                  size="sm"
                  className="mt-3 bg-green-700 hover:bg-green-600"
                  onClick={() => onUpdate({ status: 'completed' })}
                >
                  All Goals Complete - Mark Scene Done
                </Button>
              )}
            </div>
          )}

          {/* DM Notes */}
          {content.dm_notes && (
            <div className="p-3 rounded bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <StickyNote className="w-3 h-3" />
                DM Notes
              </p>
              <p className="text-sm text-slate-400">{content.dm_notes}</p>
            </div>
          )}

          {/* Empty State */}
          {!content.location_name && !content.read_aloud && goals.length === 0 && !content.dm_notes && (
            <p className="text-slate-500 text-sm italic">
              Click the edit button to add content to this scene.
            </p>
          )}
        </div>
      )}
    </BlockWrapper>
  );
}
