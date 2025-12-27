'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, Lock, CheckSquare, CheckCircle, XCircle, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Objective {
  id: string;
  title: string;
  description: string;
  type: 'required' | 'optional' | 'hidden';
  state: 'locked' | 'active' | 'completed' | 'failed';
  unlock_condition?: string;
  order: number;
}

interface ObjectivesEditorProps {
  value: Objective[];
  onChange: (objectives: Objective[]) => void;
}

const STATE_CONFIG = {
  locked: {
    icon: Lock,
    bg: 'bg-slate-800/50',
    border: 'border-slate-700',
    text: 'text-slate-400',
    label: 'Locked',
  },
  active: {
    icon: CheckSquare,
    bg: 'bg-slate-900/50',
    border: 'border-slate-600',
    text: 'text-slate-200',
    label: 'Active',
  },
  completed: {
    icon: CheckCircle,
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-800/50',
    text: 'text-emerald-300',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    bg: 'bg-red-950/30',
    border: 'border-red-800/50',
    text: 'text-red-300',
    label: 'Failed',
  },
};

const TYPE_CONFIG = {
  required: { label: 'Required', color: 'text-amber-400' },
  optional: { label: 'Optional', color: 'text-slate-400' },
  hidden: { label: 'Hidden', color: 'text-purple-400' },
};

export function ObjectivesEditor({ value = [], onChange }: ObjectivesEditorProps): JSX.Element {
  const addObjective = (): void => {
    const newObjective: Objective = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      type: 'required',
      state: 'active',
      unlock_condition: '',
      order: value.length,
    };
    onChange([...value, newObjective]);
  };

  const updateObjective = (id: string, updates: Partial<Objective>): void => {
    onChange(value.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)));
  };

  const removeObjective = (id: string): void => {
    onChange(
      value
        .filter((obj) => obj.id !== id)
        .map((obj, index) => ({ ...obj, order: index }))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Objectives</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addObjective}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="p-8 border border-dashed border-slate-700 rounded-lg text-center text-slate-500">
          <p>No objectives yet. Click &quot;Add Step&quot; to create quest objectives.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((objective, index) => {
            const stateConfig = STATE_CONFIG[objective.state];
            const StateIcon = stateConfig.icon;

            return (
              <div
                key={objective.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  stateConfig.bg,
                  stateConfig.border
                )}
              >
                {/* Header Row */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Step Number */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
                      objective.state === 'completed'
                        ? 'bg-emerald-900/50 text-emerald-300'
                        : objective.state === 'failed'
                          ? 'bg-red-900/50 text-red-300'
                          : 'bg-slate-700 text-slate-300'
                    )}
                  >
                    {index + 1}
                  </div>

                  {/* Title Input */}
                  <div className="flex-1">
                    <Input
                      value={objective.title}
                      onChange={(e) => updateObjective(objective.id, { title: e.target.value })}
                      placeholder="Objective title..."
                      className={cn(
                        'font-medium',
                        objective.state === 'completed' && 'line-through opacity-70',
                        stateConfig.text
                      )}
                    />
                  </div>

                  {/* Hidden Icon */}
                  {objective.type === 'hidden' && (
                    <EyeOff className="w-4 h-4 text-purple-400 shrink-0 mt-2" title="Hidden objective" />
                  )}

                  {/* Type Select */}
                  <Select
                    value={objective.type}
                    onValueChange={(val) =>
                      updateObjective(objective.id, { type: val as Objective['type'] })
                    }
                  >
                    <SelectTrigger className="w-28 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">Required</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* State Select */}
                  <Select
                    value={objective.state}
                    onValueChange={(val) =>
                      updateObjective(objective.id, { state: val as Objective['state'] })
                    }
                  >
                    <SelectTrigger className="w-32 shrink-0">
                      <div className="flex items-center gap-2">
                        <StateIcon className="w-4 h-4" />
                        <span>{stateConfig.label}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="locked">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Locked
                        </div>
                      </SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          Completed
                        </div>
                      </SelectItem>
                      <SelectItem value="failed">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          Failed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeObjective(objective.id)}
                    className="shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Description */}
                <div className="ml-11 space-y-3">
                  <Textarea
                    value={objective.description}
                    onChange={(e) =>
                      updateObjective(objective.id, { description: e.target.value })
                    }
                    placeholder="Describe what needs to be done..."
                    rows={2}
                    className={cn('text-sm', stateConfig.text)}
                  />

                  {/* Unlock Condition (only show if state is locked or can be locked) */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-slate-500 shrink-0">Unlocks when:</Label>
                    <Input
                      value={objective.unlock_condition || ''}
                      onChange={(e) =>
                        updateObjective(objective.id, { unlock_condition: e.target.value })
                      }
                      placeholder="Previous step completed, item obtained, etc."
                      className="text-sm h-8"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {value.length > 0 && (
        <div className="flex gap-4 text-xs text-slate-500">
          <span>
            {value.filter((o) => o.type === 'required').length} required
          </span>
          <span>
            {value.filter((o) => o.type === 'optional').length} optional
          </span>
          <span>
            {value.filter((o) => o.type === 'hidden').length} hidden
          </span>
          <span className="text-emerald-400">
            {value.filter((o) => o.state === 'completed').length} completed
          </span>
        </div>
      )}
    </div>
  );
}
