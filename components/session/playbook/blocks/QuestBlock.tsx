'use client';

import { useState } from 'react';
import { BlockWrapper } from './BlockWrapper';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flag, Target, Gift, Scroll, Plus, Trash2, X } from 'lucide-react';

interface QuestBlockProps {
  block: {
    id: string;
    title: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    content: {
      quest_id?: string;
      objective?: string;
      milestones?: { text: string; completed: boolean }[];
      rewards?: { xp?: number; gold?: number; items?: string[]; other?: string };
      quest_status?: 'active' | 'completed' | 'failed';
    };
  };
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const QUEST_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'border-amber-500 text-amber-300' },
  { value: 'completed', label: 'Completed', color: 'border-green-500 text-green-300' },
  { value: 'failed', label: 'Failed', color: 'border-red-500 text-red-300' },
];

export function QuestBlock({ block, onUpdate, onDelete, onDuplicate }: QuestBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  const content = block.content || {};
  const milestones = content.milestones || [];
  const rewards = content.rewards || {};
  const rewardItems = rewards.items || [];

  const handleUpdateContent = (field: string, value: any) => {
    onUpdate({ content: { ...content, [field]: value } });
  };

  const handleUpdateRewards = (field: string, value: any) => {
    onUpdate({ content: { ...content, rewards: { ...rewards, [field]: value } } });
  };

  // Milestone management
  const toggleMilestone = (index: number) => {
    const newMilestones = [...milestones];
    newMilestones[index] = { ...newMilestones[index], completed: !newMilestones[index].completed };
    handleUpdateContent('milestones', newMilestones);
  };

  const addMilestone = () => {
    const newMilestones = [...milestones, { text: '', completed: false }];
    handleUpdateContent('milestones', newMilestones);
  };

  const updateMilestone = (index: number, text: string) => {
    const newMilestones = [...milestones];
    newMilestones[index] = { ...newMilestones[index], text };
    handleUpdateContent('milestones', newMilestones);
  };

  const removeMilestone = (index: number) => {
    const newMilestones = milestones.filter((_, i) => i !== index);
    handleUpdateContent('milestones', newMilestones);
  };

  // Reward items management
  const addRewardItem = () => {
    handleUpdateRewards('items', [...rewardItems, '']);
  };

  const updateRewardItem = (index: number, value: string) => {
    const newItems = [...rewardItems];
    newItems[index] = value;
    handleUpdateRewards('items', newItems);
  };

  const removeRewardItem = (index: number) => {
    const newItems = rewardItems.filter((_, i) => i !== index);
    handleUpdateRewards('items', newItems);
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  const questStatusConfig = QUEST_STATUS_OPTIONS.find(s => s.value === content.quest_status);

  return (
    <BlockWrapper
      id={block.id}
      type="quest"
      title={block.title}
      status={block.status}
      icon={<Flag className="w-4 h-4 text-purple-400" />}
      color="bg-purple-900/50"
      isEditing={isEditing}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onStatusChange={(status) => onUpdate({ status })}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      {isEditing ? (
        // === EDIT MODE ===
        <div className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Quest Title</label>
            <Input
              placeholder="e.g. Clear Thistletop"
              value={block.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="bg-slate-800 border-slate-700 font-medium"
            />
          </div>

          {/* Quest Status */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Quest Status</label>
            <Select
              value={content.quest_status || 'active'}
              onValueChange={(value) => handleUpdateContent('quest_status', value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {QUEST_STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Objective */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Scroll className="w-3 h-3" />
              Objective
            </label>
            <Textarea
              placeholder="What is the main goal of this quest?"
              value={content.objective || ''}
              onChange={(e) => handleUpdateContent('objective', e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3 h-3" />
              Milestones
            </label>
            {milestones.map((milestone, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={milestone.text}
                  onChange={(e) => updateMilestone(i, e.target.value)}
                  placeholder="Milestone description..."
                  className="bg-slate-800 border-slate-700"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeMilestone(i)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={addMilestone}
              className="w-full border-slate-700 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Milestone
            </Button>
          </div>

          {/* Rewards */}
          <div className="space-y-3">
            <label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Gift className="w-3 h-3" />
              Rewards
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">XP</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="500"
                  value={rewards.xp || ''}
                  onChange={(e) => handleUpdateRewards('xp', parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Gold</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="100"
                  value={rewards.gold || ''}
                  onChange={(e) => handleUpdateRewards('gold', parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Reward Items</label>
              {rewardItems.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateRewardItem(i, e.target.value)}
                    placeholder="Item name..."
                    className="bg-slate-800 border-slate-700"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeRewardItem(i)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={addRewardItem}
                className="w-full border-slate-700 hover:bg-slate-800"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Other Rewards</label>
              <Input
                placeholder="e.g. Hero of Sandpoint title, land grant..."
                value={rewards.other || ''}
                onChange={(e) => handleUpdateRewards('other', e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>
        </div>
      ) : (
        // === VIEW MODE ===
        <div className="space-y-4 mt-4">
          {/* Quest Status */}
          {content.quest_status && questStatusConfig && (
            <Badge
              variant="outline"
              className={questStatusConfig.color}
            >
              Quest: {questStatusConfig.label}
            </Badge>
          )}

          {/* Objective */}
          {content.objective && (
            <div className="p-3 rounded bg-purple-950/30 border border-purple-900/50">
              <p className="text-xs text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Scroll className="w-3 h-3" />
                Objective
              </p>
              <p className="text-slate-300">{content.objective}</p>
            </div>
          )}

          {/* Progress Bar */}
          {milestones.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Progress</span>
                <span>{completedCount}/{milestones.length}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Milestones
              </p>
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2"
                  >
                    <Checkbox
                      checked={milestone.completed}
                      onCheckedChange={() => toggleMilestone(index)}
                      className="mt-0.5"
                    />
                    <span className={`text-sm ${
                      milestone.completed ? 'text-slate-500 line-through' : 'text-slate-300'
                    }`}>
                      {milestone.text || '(Empty milestone)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewards */}
          {(rewards.xp || rewards.gold || rewardItems.length > 0 || rewards.other) && (
            <div className="p-3 rounded bg-amber-950/30 border border-amber-900/50">
              <p className="text-xs text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Gift className="w-3 h-3" />
                Rewards
              </p>
              <div className="flex flex-wrap gap-2">
                {rewards.xp && (
                  <Badge className="bg-amber-800 text-amber-100">
                    {rewards.xp} XP
                  </Badge>
                )}
                {rewards.gold && (
                  <Badge className="bg-yellow-800 text-yellow-100">
                    {rewards.gold} GP
                  </Badge>
                )}
                {rewardItems.filter(i => i).map((item, i) => (
                  <Badge key={i} variant="outline" className="border-amber-700 text-amber-300">
                    {item}
                  </Badge>
                ))}
                {rewards.other && (
                  <span className="text-sm text-slate-400">{rewards.other}</span>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!content.objective && milestones.length === 0 && (
            <p className="text-slate-500 text-sm italic">
              Click the edit button to add quest details.
            </p>
          )}
        </div>
      )}
    </BlockWrapper>
  );
}
