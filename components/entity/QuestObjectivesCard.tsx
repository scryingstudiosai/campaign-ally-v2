'use client';

import { useState } from 'react';
import { QuestObjective } from '@/types/living-entity';
import { ListChecks, Lock, Eye, EyeOff, ChevronRight, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface QuestObjectivesCardProps {
  objectives: QuestObjective[];
  onObjectiveToggle?: (objectiveId: string, newState: 'active' | 'completed') => void;
}

export function QuestObjectivesCard({ objectives, onObjectiveToggle }: QuestObjectivesCardProps): JSX.Element | null {
  const [showLocked, setShowLocked] = useState(false);

  if (!objectives || objectives.length === 0) return null;

  const requiredObjectives = objectives.filter((o) => o.type === 'required');
  const completedRequired = requiredObjectives.filter((o) => o.state === 'completed').length;

  return (
    <div className="ca-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-primary/20 pb-2">
        <div className="flex items-center gap-2 text-primary font-medium">
          <ListChecks className="w-5 h-5" />
          <span>Objectives</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            {completedRequired} / {requiredObjectives.length} required
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLocked(!showLocked)}
            className="text-slate-400 h-7 px-2"
          >
            {showLocked ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Objectives List */}
      <div className="space-y-2">
        {objectives.map((obj, i) => {
          // Hide locked objectives unless toggled
          if (obj.state === 'locked' && !showLocked) {
            return (
              <div
                key={obj.id || i}
                className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-600 blur-sm select-none">
                    Hidden Objective
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={obj.id || i}
              className={`p-3 rounded-lg border transition-all ${
                obj.state === 'completed'
                  ? 'bg-green-900/20 border-green-700/50'
                  : obj.state === 'failed'
                  ? 'bg-red-900/20 border-red-700/50'
                  : obj.state === 'locked'
                  ? 'bg-slate-900/50 border-slate-700/50'
                  : obj.type === 'hidden'
                  ? 'bg-purple-900/20 border-purple-700/50'
                  : obj.type === 'optional'
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-slate-800 border-teal-700/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {obj.state === 'locked' ? (
                  <Lock className="w-5 h-5 text-slate-600 mt-0.5" />
                ) : (
                  <Checkbox
                    checked={obj.state === 'completed'}
                    onCheckedChange={(checked) => {
                      if (onObjectiveToggle) {
                        onObjectiveToggle(obj.id, checked ? 'completed' : 'active');
                      }
                    }}
                    className="mt-0.5"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium ${
                        obj.state === 'completed'
                          ? 'text-green-400 line-through'
                          : obj.state === 'failed'
                          ? 'text-red-400 line-through'
                          : obj.state === 'locked'
                          ? 'text-slate-500'
                          : 'text-slate-200'
                      }`}
                    >
                      {obj.title}
                    </span>

                    {obj.type === 'optional' && (
                      <Badge variant="outline" className="text-xs">
                        Optional
                      </Badge>
                    )}
                    {obj.type === 'hidden' && (
                      <Badge
                        variant="outline"
                        className="text-xs text-purple-400 border-purple-600"
                      >
                        Hidden
                      </Badge>
                    )}
                    {obj.state === 'locked' && (
                      <Badge
                        variant="outline"
                        className="text-xs text-slate-500 border-slate-600"
                      >
                        Locked
                      </Badge>
                    )}
                  </div>

                  <p
                    className={`text-sm mt-1 ${
                      obj.state === 'locked' ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {obj.description}
                  </p>

                  {obj.state === 'locked' && obj.unlock_condition && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      Unlocks: {obj.unlock_condition}
                    </p>
                  )}

                  {obj.hints && obj.hints.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      <Lightbulb className="w-3 h-3 inline mr-1" />
                      Hints: {obj.hints.join(' | ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
