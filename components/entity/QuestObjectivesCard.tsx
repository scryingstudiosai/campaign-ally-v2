'use client';

import { useState, useCallback } from 'react';
import { QuestObjective, QuestObjectiveState } from '@/types/living-entity';
import { ListChecks, Lock, ChevronRight, Lightbulb, RotateCcw, X, Check, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface QuestObjectivesCardProps {
  objectives: QuestObjective[];
  questId?: string;
  campaignId?: string;
  readOnly?: boolean;
}

// Common stop words to ignore in matching
const STOP_WORDS = ['after', 'before', 'when', 'once', 'the', 'and', 'for', 'with', 'from', 'into', 'have', 'has', 'been', 'are', 'is', 'to', 'of', 'a', 'an', 'complete', 'completing', 'completed'];

/**
 * Get significant words from a string (remove stop words, punctuation)
 */
function getSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length >= 3 && !STOP_WORDS.includes(word));
}

/**
 * Get word root for fuzzy matching (first 4-5 chars)
 */
function getWordRoot(word: string): string {
  return word.slice(0, Math.min(word.length, 5));
}

/**
 * Check if an unlock condition is satisfied by a completed objective
 * Uses fuzzy word matching to handle "enter" vs "entering" etc.
 */
function checkUnlockCondition(
  condition: string,
  completedObj: QuestObjective,
  allObjectives: QuestObjective[]
): boolean {
  const conditionWords = getSignificantWords(condition);
  const titleWords = getSignificantWords(completedObj.title);

  console.log('[Quest] Matching condition:', condition);
  console.log('[Quest] Against completed title:', completedObj.title);
  console.log('[Quest] Condition words:', conditionWords);
  console.log('[Quest] Title words:', titleWords);

  // Check for ANY significant word match
  for (const titleWord of titleWords) {
    for (const conditionWord of conditionWords) {
      const titleRoot = getWordRoot(titleWord);
      const conditionRoot = getWordRoot(conditionWord);

      // Match conditions:
      // 1. Exact match: "temple" === "temple"
      // 2. Contains: "entering" includes "enter"
      // 3. Root match: "enter" root === "entering" root
      if (titleWord === conditionWord ||
          titleWord.includes(conditionWord) ||
          conditionWord.includes(titleWord) ||
          (titleRoot.length >= 4 && titleRoot === conditionRoot)) {
        console.log(`[Quest] ✅ MATCH: "${titleWord}" ~ "${conditionWord}"`);
        return true;
      }
    }
  }

  // Also check objective ID
  if (condition.toLowerCase().includes(completedObj.id.toLowerCase())) {
    console.log('[Quest] ✅ ID match');
    return true;
  }

  console.log('[Quest] ❌ No match found');
  return false;
}

export function QuestObjectivesCard({
  objectives: initialObjectives,
  questId,
  campaignId,
  readOnly = false,
}: QuestObjectivesCardProps): JSX.Element | null {
  const [objectives, setObjectives] = useState<QuestObjective[]>(initialObjectives);
  const [saving, setSaving] = useState(false);

  // Check if an objective can be unlocked (parent completed or unlock_condition met)
  const canUnlock = useCallback((objective: QuestObjective): boolean => {
    // If has parent_id, check parent is completed
    if (objective.parent_id) {
      const parent = objectives.find((o) => o.id === objective.parent_id);
      return parent?.state === 'completed';
    }
    // If no parent but has unlock_condition, check if any completed objective matches
    if (objective.unlock_condition) {
      return objectives.some(
        (o) => o.state === 'completed' && checkUnlockCondition(objective.unlock_condition!, o, objectives)
      );
    }
    return true;
  }, [objectives]);

  // Update objective state and save to database
  const updateObjectiveState = useCallback(async (
    objectiveId: string,
    newState: QuestObjectiveState
  ) => {
    if (!questId || !campaignId || readOnly) return;

    const completedObj = objectives.find((o) => o.id === objectiveId);
    const unlockedObjectives: string[] = [];

    // Build updated objectives with auto-unlock logic
    let updatedObjectives = objectives.map((obj) => {
      if (obj.id === objectiveId) {
        return { ...obj, state: newState };
      }
      return obj;
    });

    // Auto-unlock when completing an objective
    if (newState === 'completed' && completedObj) {
      updatedObjectives = updatedObjectives.map((obj) => {
        if (obj.state !== 'locked') return obj;

        // Check parent_id match
        if (obj.parent_id === objectiveId) {
          unlockedObjectives.push(obj.title);
          return { ...obj, state: 'active' as QuestObjectiveState };
        }

        // Check unlock_condition match using fuzzy word matching
        if (obj.unlock_condition && checkUnlockCondition(obj.unlock_condition, completedObj, updatedObjectives)) {
          unlockedObjectives.push(obj.title);
          return { ...obj, state: 'active' as QuestObjectiveState };
        }

        return obj;
      });
    }

    // Re-lock children when parent is uncompleted
    if (newState === 'active') {
      updatedObjectives = updatedObjectives.map((obj) => {
        if (obj.parent_id === objectiveId && obj.state !== 'completed') {
          return { ...obj, state: 'locked' as QuestObjectiveState };
        }
        return obj;
      });
    }

    setObjectives(updatedObjectives);
    setSaving(true);

    try {
      const response = await fetch(`/api/entities/${questId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attributes: { objectives: updatedObjectives },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save objective state');
      }

      // Show feedback based on action
      if (newState === 'completed') {
        toast.success(`Completed: ${completedObj?.title}`);
      } else if (newState === 'failed') {
        toast.error('Objective marked as failed');
      } else if (newState === 'active') {
        toast.info('Objective reset');
      }

      // Show unlock notifications
      unlockedObjectives.forEach((title) => {
        toast.info(`Objective Unlocked: ${title}`, {
          icon: <Unlock className="w-4 h-4 text-amber-400" />,
          duration: 4000,
        });
      });
    } catch (error) {
      // Rollback on error
      setObjectives(initialObjectives);
      toast.error('Failed to update objective');
      console.error('Error updating objective:', error);
    } finally {
      setSaving(false);
    }
  }, [objectives, questId, campaignId, readOnly, initialObjectives]);

  const handleToggle = (obj: QuestObjective, checked: boolean) => {
    const newState: QuestObjectiveState = checked ? 'completed' : 'active';
    updateObjectiveState(obj.id, newState);
  };

  const handleFail = (obj: QuestObjective) => {
    updateObjectiveState(obj.id, 'failed');
  };

  const handleReset = (obj: QuestObjective) => {
    updateObjectiveState(obj.id, 'active');
  };

  // DM always sees all objectives - no blur/hide
  const isInteractive = !!questId && !!campaignId && !readOnly;

  // Early return if no objectives
  if (!objectives || objectives.length === 0) return null;

  // Computed values
  const requiredObjectives = objectives.filter((o) => o.type === 'required');
  const completedRequired = requiredObjectives.filter((o) => o.state === 'completed').length;
  const progressPercent = requiredObjectives.length > 0
    ? Math.round((completedRequired / requiredObjectives.length) * 100)
    : 0;

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
          {saving && (
            <span className="text-xs text-slate-500 animate-pulse">Saving...</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {requiredObjectives.length > 0 && (
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-slate-500 text-right">{progressPercent}% complete</p>
        </div>
      )}

      {/* Objectives List */}
      <div className="space-y-2">
        {objectives.map((obj, i) => {
          const isLocked = obj.state === 'locked';
          const isCompleted = obj.state === 'completed';
          const isFailed = obj.state === 'failed';
          const canBeUnlocked = isLocked && canUnlock(obj);

          return (
            <div
              key={obj.id || i}
              className={`p-3 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-green-900/20 border-green-700/50'
                  : isFailed
                  ? 'bg-red-900/20 border-red-700/50'
                  : isLocked
                  ? 'bg-slate-900/50 border-slate-700/50 opacity-60'
                  : obj.type === 'hidden'
                  ? 'bg-purple-900/20 border-purple-700/50'
                  : obj.type === 'optional'
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-slate-800 border-teal-700/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox or Lock Icon */}
                {isLocked && !isInteractive ? (
                  <Lock className="w-5 h-5 text-slate-600 mt-0.5" />
                ) : isLocked && isInteractive ? (
                  <button
                    onClick={() => updateObjectiveState(obj.id, 'active')}
                    disabled={saving}
                    className={`p-1 rounded transition-colors disabled:opacity-50 ${
                      canBeUnlocked
                        ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-900/30'
                        : 'text-slate-500 hover:text-amber-400 hover:bg-amber-900/30'
                    }`}
                    title={canBeUnlocked ? 'Unlock this objective' : 'Force unlock (condition not met)'}
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                ) : isFailed ? (
                  <X className="w-5 h-5 text-red-500 mt-0.5" />
                ) : (
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => handleToggle(obj, !!checked)}
                    disabled={!isInteractive || saving}
                    className="mt-0.5"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Title */}
                    <span
                      className={`font-medium ${
                        isCompleted
                          ? 'text-green-400 line-through'
                          : isFailed
                          ? 'text-red-400 line-through'
                          : isLocked
                          ? 'text-slate-500'
                          : 'text-slate-200'
                      }`}
                    >
                      {obj.title}
                    </span>

                    {/* Type Badges */}
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
                    {isLocked && (
                      <Badge
                        variant="outline"
                        className="text-xs text-slate-500 border-slate-600"
                      >
                        Locked
                      </Badge>
                    )}
                    {isFailed && (
                      <Badge
                        variant="outline"
                        className="text-xs text-red-400 border-red-600"
                      >
                        Failed
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p
                    className={`text-sm mt-1 ${
                      isLocked ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {obj.description}
                  </p>

                  {/* Unlock condition */}
                  {isLocked && obj.unlock_condition && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      Unlocks: {obj.unlock_condition}
                    </p>
                  )}

                  {/* Hints for DM */}
                  {obj.hints && obj.hints.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      <Lightbulb className="w-3 h-3 inline mr-1" />
                      Hints: {obj.hints.join(' | ')}
                    </div>
                  )}

                  {/* Action buttons for interactive mode */}
                  {isInteractive && !isLocked && (
                    <div className="flex gap-2 mt-2">
                      {!isFailed && !isCompleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFail(obj)}
                          disabled={saving}
                          className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Fail
                        </Button>
                      )}
                      {(isFailed || isCompleted) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReset(obj)}
                          disabled={saving}
                          className="h-6 px-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick complete button for active objectives */}
                {isInteractive && !isLocked && !isCompleted && !isFailed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateObjectiveState(obj.id, 'completed')}
                    disabled={saving}
                    className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-900/30"
                    title="Mark as completed"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
