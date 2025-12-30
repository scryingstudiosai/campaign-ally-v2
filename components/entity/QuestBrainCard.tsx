'use client';

import { QuestBrain } from '@/types/living-entity';
import { Brain, Sparkles, Lock, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { MaterialCard } from '@/components/ui/material-card';

interface QuestBrainCardProps {
  brain: QuestBrain;
}

export function QuestBrainCard({ brain }: QuestBrainCardProps): JSX.Element | null {
  if (!brain || Object.keys(brain).length === 0) return null;

  return (
    <MaterialCard entityType="quest" className="p-0">
      <div className="p-4 pb-2 border-b border-white/5">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Brain className="w-5 h-5 text-gold" />
          DM Information
        </h3>
      </div>
      <div className="p-4 space-y-4">

      {/* Background */}
      {brain.background && (
        <div className="p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
            <FileText className="w-4 h-4" />
            <span>True Background</span>
          </div>
          <p className="text-sm text-slate-300">{brain.background}</p>
        </div>
      )}

      {/* Twists */}
      {brain.twists && brain.twists.length > 0 && (
        <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Possible Twists</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {brain.twists.map((twist, i) => (
              <li key={i} className="text-sm text-slate-300">
                {twist}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Secret */}
      {brain.secret && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
            <Lock className="w-4 h-4" />
            <span>Secret</span>
          </div>
          <p className="text-sm text-slate-300">{brain.secret}</p>
        </div>
      )}

      {/* Failure Consequences */}
      {brain.failure_consequences && (
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>If They Fail...</span>
          </div>
          <p className="text-sm text-slate-300">{brain.failure_consequences}</p>
        </div>
      )}

      {/* Success Variations */}
      {brain.success_variations && brain.success_variations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <CheckCircle className="w-4 h-4" />
            <span>Success Outcomes</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {brain.success_variations.map((variation, i) => (
              <li key={i} className="text-sm text-slate-300">
                {variation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DM Notes */}
      {brain.dm_notes && (
        <div className="p-3 bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <FileText className="w-4 h-4" />
            <span>DM Notes</span>
          </div>
          <p className="text-sm text-slate-300">{brain.dm_notes}</p>
        </div>
      )}
      </div>
    </MaterialCard>
  );
}
