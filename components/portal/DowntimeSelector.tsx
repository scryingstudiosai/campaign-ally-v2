'use client';

import { useState } from 'react';
import {
  Dumbbell, BookOpen, Coins, Beer, Hammer,
  MoreHorizontal, Check, Loader2, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  campaignId: string;
  characterId: string;
  characterName: string;
  daysAvailable?: number;
  onActivitySubmitted?: () => void;
}

type ActivityType = 'training' | 'research' | 'work' | 'carousing' | 'crafting' | 'other';

interface Activity {
  type: ActivityType;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  bgColor: string;
  requiresTarget: boolean;
  targetLabel?: string;
  riskLevel: 'safe' | 'moderate' | 'risky';
}

const activities: Activity[] = [
  {
    type: 'training',
    label: 'Train',
    icon: Dumbbell,
    description: 'Practice combat skills or work on a new proficiency',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    requiresTarget: true,
    targetLabel: 'What are you training?',
    riskLevel: 'safe',
  },
  {
    type: 'research',
    label: 'Research',
    icon: BookOpen,
    description: 'Study a topic at a library or consult sages',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    requiresTarget: true,
    targetLabel: 'What are you researching?',
    riskLevel: 'safe',
  },
  {
    type: 'work',
    label: 'Work',
    icon: Coins,
    description: 'Earn gold through honest labor or your profession',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    requiresTarget: false,
    riskLevel: 'safe',
  },
  {
    type: 'carousing',
    label: 'Carouse',
    icon: Beer,
    description: 'Make contacts and gather rumors at taverns',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
    requiresTarget: false,
    riskLevel: 'risky',
  },
  {
    type: 'crafting',
    label: 'Craft',
    icon: Hammer,
    description: 'Create items if you have the materials and skills',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    requiresTarget: true,
    targetLabel: 'What are you crafting?',
    riskLevel: 'moderate',
  },
  {
    type: 'other',
    label: 'Other',
    icon: MoreHorizontal,
    description: 'Something else? Describe what you want to do',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    requiresTarget: true,
    targetLabel: 'What do you want to do?',
    riskLevel: 'moderate',
  },
];

export function DowntimeSelector({
  campaignId,
  characterId,
  characterName,
  daysAvailable = 7,
  onActivitySubmitted
}: Props) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activityTarget, setActivityTarget] = useState('');
  const [notes, setNotes] = useState('');
  const [daysSpent, setDaysSpent] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedActivity) return;
    if (selectedActivity.requiresTarget && !activityTarget.trim()) {
      setError('Please specify what you want to do');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await fetch('/api/portal/downtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        characterId,
        activityType: selectedActivity.type,
        activityTarget: activityTarget || null,
        notes: notes || null,
        daysSpent,
      }),
    });

    if (res.ok) {
      setSubmitted(true);
      onActivitySubmitted?.();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to submit activity');
    }

    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setSelectedActivity(null);
    setActivityTarget('');
    setNotes('');
    setDaysSpent(1);
    setError(null);
  };

  if (submitted) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
        <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h3 className="text-lg font-display text-white mb-2">Activity Submitted!</h3>
        <p className="text-slate-400 text-sm">
          {characterName} is {selectedActivity?.type === 'research' ? 'researching' :
            selectedActivity?.type === 'training' ? 'training' :
            selectedActivity?.type === 'work' ? 'working' :
            selectedActivity?.type === 'carousing' ? 'carousing' :
            selectedActivity?.type === 'crafting' ? 'crafting' : 'busy'}.
          Your DM will resolve this before the next session.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-display">Downtime Activity</h3>
            <p className="text-slate-400 text-sm">Choose how to spend your free time</p>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>{daysAvailable} days available</span>
          </div>
        </div>
      </div>

      {/* Activity Selection */}
      {!selectedActivity ? (
        <div className="p-4 grid grid-cols-2 gap-3">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <button
                key={activity.type}
                onClick={() => setSelectedActivity(activity)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all hover:scale-[1.02]",
                  activity.bgColor,
                  "border-white/10 hover:border-white/20"
                )}
              >
                <Icon className={cn("w-6 h-6 mb-2", activity.color)} />
                <h4 className="text-white font-medium">{activity.label}</h4>
                <p className="text-slate-400 text-xs mt-1">{activity.description}</p>
                {activity.riskLevel === 'risky' && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]">
                    Risky
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Activity Details Form */
        <div className="p-4 space-y-4">
          {/* Selected Activity Header */}
          <div className={cn("flex items-center gap-3 p-3 rounded-lg", selectedActivity.bgColor)}>
            <selectedActivity.icon className={cn("w-6 h-6", selectedActivity.color)} />
            <div>
              <h4 className="text-white font-medium">{selectedActivity.label}</h4>
              <p className="text-slate-400 text-xs">{selectedActivity.description}</p>
            </div>
          </div>

          {/* Target Input */}
          {selectedActivity.requiresTarget && (
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                {selectedActivity.targetLabel}
              </label>
              <input
                type="text"
                value={activityTarget}
                onChange={(e) => setActivityTarget(e.target.value)}
                placeholder={
                  selectedActivity.type === 'research' ? "e.g., The history of the Lich King" :
                  selectedActivity.type === 'training' ? "e.g., Longsword proficiency" :
                  selectedActivity.type === 'crafting' ? "e.g., Healing potions" :
                  "Describe your activity..."
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
            </div>
          )}

          {/* Days Spent */}
          <div>
            <label className="text-sm text-slate-400 block mb-1">Days to spend</label>
            <div className="flex items-center gap-2">
              {[1, 3, 5, 7].map((days) => (
                <button
                  key={days}
                  onClick={() => setDaysSpent(days)}
                  disabled={days > daysAvailable}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                    daysSpent === days
                      ? "bg-teal-600 text-white"
                      : days > daysAvailable
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  {days} {days === 1 ? 'day' : 'days'}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-sm text-slate-400 block mb-1">Additional notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any specific details for your DM..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (selectedActivity.requiresTarget && !activityTarget.trim())}
              className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Activity'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
