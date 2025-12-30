'use client';

import { useState } from 'react';
import { Book, ScrollText, Plus, Pin, Trash2, Edit2, ChevronRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestTracker } from './QuestTracker';

interface JournalEntry {
  id: string;
  title: string;
  content: string | null;
  entry_type: 'personal' | 'session_recap';
  session_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  session?: {
    id: string;
    name: string;
    session_number: number;
    session_date: string;
  } | null;
}

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

interface Session {
  id: string;
  name: string;
  session_number: number;
  session_date: string;
}

interface Props {
  campaignId: string;
  userId: string;
  initialEntries: JournalEntry[];
  initialQuests: TrackedQuest[];
  sessions: Session[];
}

type Tab = 'notes' | 'quests';

export function JournalView({ campaignId, initialEntries, initialQuests, sessions }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [quests, setQuests] = useState<TrackedQuest[]>(initialQuests);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    const res = await fetch('/api/portal/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        title: newTitle,
        content: newContent,
        entryType: 'personal',
        sessionId: selectedSessionId,
      }),
    });

    if (res.ok) {
      const entry = await res.json();
      // Add session data if linked
      if (selectedSessionId) {
        entry.session = sessions.find(s => s.id === selectedSessionId);
      }
      setEntries([entry, ...entries]);
      setNewTitle('');
      setNewContent('');
      setSelectedSessionId(null);
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<JournalEntry>) => {
    const res = await fetch('/api/portal/journal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });

    if (res.ok) {
      const updated = await res.json();
      setEntries(entries.map(e => e.id === id ? { ...e, ...updated } : e));
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journal entry?')) return;

    const res = await fetch(`/api/portal/journal?id=${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    await handleUpdate(id, { is_pinned: !currentPinned } as Partial<JournalEntry>);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-white/10 px-4 py-4">
        <h1 className="text-xl font-display text-white flex items-center gap-2">
          <Book className="w-5 h-5 text-teal-400" />
          Journal
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('notes')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === 'notes'
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-white"
          )}
        >
          <ScrollText className="w-4 h-4" />
          Notes ({entries.length})
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeTab === 'quests'
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Target className="w-4 h-4" />
          Quests ({quests.filter(q => q.status === 'active').length} active)
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* Create New Entry */}
            {isCreating ? (
              <div className="bg-slate-900/50 border border-teal-500/30 rounded-xl p-4 space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Entry title..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                  autoFocus
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your notes..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 resize-none"
                />

                {/* Link to Session */}
                <select
                  value={selectedSessionId || ''}
                  onChange={(e) => setSelectedSessionId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-teal-500/50"
                >
                  <option value="">No session link</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      Session {session.session_number}: {session.name}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewTitle('');
                      setNewContent('');
                      setSelectedSessionId(null);
                    }}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newTitle.trim()}
                    className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-teal-500/50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Journal Entry
              </button>
            )}

            {/* Entry List */}
            {entries.length === 0 && !isCreating ? (
              <div className="text-center py-12">
                <ScrollText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No journal entries yet</p>
                <p className="text-slate-500 text-sm">Start writing to track your adventure!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedId === entry.id}
                    isEditing={editingId === entry.id}
                    onToggleExpand={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    onEdit={() => setEditingId(entry.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={(updates) => handleUpdate(entry.id, updates)}
                    onDelete={() => handleDelete(entry.id)}
                    onTogglePin={() => handleTogglePin(entry.id, entry.is_pinned)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'quests' && (
          <QuestTracker
            campaignId={campaignId}
            quests={quests}
            setQuests={setQuests}
          />
        )}
      </div>
    </div>
  );
}

// Entry Card Component
interface EntryCardProps {
  entry: JournalEntry;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Partial<JournalEntry>) => void;
  onDelete: () => void;
  onTogglePin: () => void;
  formatDate: (date: string) => string;
}

function EntryCard({
  entry,
  isExpanded,
  isEditing,
  onToggleExpand,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onTogglePin,
  formatDate,
}: EntryCardProps) {
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editContent, setEditContent] = useState(entry.content || '');

  if (isEditing) {
    return (
      <div className="bg-slate-900/50 border border-teal-500/30 rounded-xl p-4 space-y-3">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-teal-500/50"
        />
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-teal-500/50 resize-none"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancelEdit}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ title: editTitle, content: editContent })}
            className="px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-500"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-slate-900/50 border rounded-xl overflow-hidden transition-colors",
        entry.is_pinned ? "border-amber-500/30" : "border-white/10"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
      >
        <ChevronRight
          className={cn(
            "w-4 h-4 text-slate-500 transition-transform",
            isExpanded && "rotate-90"
          )}
        />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            {entry.is_pinned && <Pin className="w-3 h-3 text-amber-400" />}
            <h3 className="text-white font-medium">{entry.title}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{formatDate(entry.created_at)}</span>
            {entry.session && (
              <>
                <span>•</span>
                <span className="text-purple-400">Session {entry.session.session_number}</span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          {entry.content ? (
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{entry.content}</p>
          ) : (
            <p className="text-slate-500 text-sm italic">No content</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
            <button
              onClick={onTogglePin}
              className={cn(
                "p-2 rounded-lg transition-colors",
                entry.is_pinned
                  ? "text-amber-400 bg-amber-400/10"
                  : "text-slate-400 hover:text-amber-400 hover:bg-white/5"
              )}
            >
              <Pin className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
