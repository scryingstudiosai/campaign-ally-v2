'use client';

import { useState } from 'react';
import { Target, ChevronRight, Check, X, Clock, Skull, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackedQuest {
  id: string;
  quest_id: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  personal_notes: string | null;
  discovered_at: string;
  quest: {
    id: string;
    name: string;
    sub_type: string | null;
    description: string | null;
    soul: Record<string, unknown> | null;
    mechanics: Record<string, unknown> | null;
    image_url: string | null;
  };
}

interface Props {
  campaignId: string;
  quests: TrackedQuest[];
  setQuests: (quests: TrackedQuest[]) => void;
}

type StatusFilter = 'active' | 'completed' | 'all';

const statusConfig = {
  active: { icon: Clock, color: 'text-teal-400', bg: 'bg-teal-400/10', label: 'Active' },
  completed: { icon: Check, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Completed' },
  failed: { icon: Skull, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Failed' },
  abandoned: { icon: X, color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'Abandoned' },
};

export function QuestTracker({ quests, setQuests }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  const filteredQuests = filter === 'all'
    ? quests
    : quests.filter(q => q.status === filter);

  const activeCount = quests.filter(q => q.status === 'active').length;
  const completedCount = quests.filter(q => q.status === 'completed').length;

  const handleStatusChange = async (id: string, newStatus: TrackedQuest['status']) => {
    const res = await fetch('/api/portal/quests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });

    if (res.ok) {
      setQuests(quests.map(q => q.id === id ? { ...q, status: newStatus } : q));
    }
  };

  const handleSaveNotes = async (id: string) => {
    const res = await fetch('/api/portal/quests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, personalNotes: notesValue }),
    });

    if (res.ok) {
      setQuests(quests.map(q => q.id === id ? { ...q, personal_notes: notesValue } : q));
      setEditingNotesId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === 'active'
              ? "bg-teal-500/20 text-teal-400"
              : "text-slate-400 hover:text-white"
          )}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === 'completed'
              ? "bg-green-500/20 text-green-400"
              : "text-slate-400 hover:text-white"
          )}
        >
          Completed ({completedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === 'all'
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:text-white"
          )}
        >
          All ({quests.length})
        </button>
      </div>

      {/* Quest List */}
      {filteredQuests.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            {filter === 'active' ? 'No active quests' :
             filter === 'completed' ? 'No completed quests' : 'No quests tracked'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Your DM will add quests as you discover them
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuests.map((tracked) => {
            const quest = tracked.quest;
            const config = statusConfig[tracked.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedId === tracked.id;
            const isEditingNotes = editingNotesId === tracked.id;

            // Extract quest details from soul/mechanics
            const soul = quest.soul as Record<string, unknown> | null;
            const mechanics = quest.mechanics as Record<string, unknown> | null;
            const hook = (soul?.hook as string) || quest.description;
            const objectives = (mechanics?.objectives as unknown[]) || [];

            return (
              <div
                key={tracked.id}
                className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : tracked.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                >
                  <div className={cn("p-1.5 rounded-lg", config.bg)}>
                    <StatusIcon className={cn("w-4 h-4", config.color)} />
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className="text-white font-medium">{quest.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {quest.sub_type && <span className="text-purple-400">{quest.sub_type}</span>}
                      <span>Discovered {formatDate(tracked.discovered_at)}</span>
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-slate-500 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
                    {/* Quest Hook */}
                    {hook && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">The Story</h4>
                        <p className="text-slate-300 text-sm">{hook}</p>
                      </div>
                    )}

                    {/* Objectives */}
                    {objectives.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Objectives</h4>
                        <ul className="space-y-1">
                          {objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="text-teal-400 mt-0.5">•</span>
                              {typeof obj === 'string' ? obj : (obj as Record<string, unknown>)?.description || (obj as Record<string, unknown>)?.name || 'Unknown objective'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Personal Notes */}
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Your Notes
                      </h4>

                      {isEditingNotes ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            rows={3}
                            placeholder="Add your own notes about this quest..."
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50 resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-3 py-1 text-sm text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNotes(tracked.id)}
                              className="px-3 py-1 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-500"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setNotesValue(tracked.personal_notes || '');
                            setEditingNotesId(tracked.id);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 border border-white/5 text-sm hover:border-teal-500/30 transition-colors"
                        >
                          {tracked.personal_notes ? (
                            <p className="text-slate-300 whitespace-pre-wrap">{tracked.personal_notes}</p>
                          ) : (
                            <p className="text-slate-500 italic">Click to add notes...</p>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Status Change */}
                    {tracked.status === 'active' && (
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleStatusChange(tracked.id, 'completed')}
                          className="flex-1 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleStatusChange(tracked.id, 'abandoned')}
                          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:text-white transition-colors"
                        >
                          Abandon
                        </button>
                      </div>
                    )}

                    {tracked.status !== 'active' && (
                      <button
                        onClick={() => handleStatusChange(tracked.id, 'active')}
                        className="w-full py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:text-white transition-colors"
                      >
                        Reactivate Quest
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
