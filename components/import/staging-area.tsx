'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Check, X, Merge, Edit, AlertTriangle, Loader2,
  ChevronLeft, FileText, Users, MapPin, Package,
  Scroll, Shield, Skull
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SuggestionEditModal } from './suggestion-edit-modal';
import { InteractiveText, TextHighlight, EntityType, TextRange } from '@/components/ui/interactive-text';

interface Suggestion {
  id: string;
  entity_name: string;
  entity_type: string;
  confidence_score: number;
  snippet: string;
  text_start_index: number;
  text_end_index: number;
  status: 'pending' | 'accepted' | 'rejected' | 'merged';
  merge_target_id: string | null;
  similarity_score: number | null;
  proposed_data: Record<string, unknown>;
  merge_target?: {
    id: string;
    name: string;
    entity_type: string;
  };
}

interface Batch {
  id: string;
  name: string;
  status: string;
  stats: Record<string, number>;
  source_doc: {
    id: string;
    title: string;
    content: string;
  };
  suggestions: Suggestion[];
}

interface StagingAreaProps {
  campaignId: string;
  batchId: string;
  onCommitComplete: (stats: { created: number; merged: number; ignored: number }) => void;
  onCancel: () => void;
}

const entityIcons: Record<string, React.ElementType> = {
  npc: Users,
  location: MapPin,
  item: Package,
  quest: Scroll,
  faction: Shield,
  creature: Skull,
};

const entityColors: Record<string, string> = {
  npc: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  location: 'text-green-400 bg-green-500/10 border-green-500/30',
  item: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  quest: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  faction: 'text-red-400 bg-red-500/10 border-red-500/30',
  creature: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

export function StagingArea({ campaignId, batchId, onCommitComplete, onCancel }: StagingAreaProps) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch batch data
  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const fetchBatch = async () => {
    try {
      const response = await fetch(`/api/import/batch/${batchId}`);
      if (response.ok) {
        const data = await response.json();
        setBatch(data);
      }
    } catch (error) {
      console.error('Failed to fetch batch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual text selection to create a new suggestion
  const handleManualSelect = async (text: string, type: EntityType, range: TextRange) => {
    try {
      const content = batch?.source_doc?.content || '';
      const response = await fetch('/api/import/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          campaignId,
          entityName: text,
          entityType: type,
          textStartIndex: range.start,
          textEndIndex: range.end,
          snippet: content.slice(
            Math.max(0, range.start - 50),
            Math.min(content.length, range.end + 50)
          ),
          confidenceScore: 1.0, // Manual = 100% confidence
          status: 'pending',
        }),
      });

      if (response.ok) {
        fetchBatch(); // Refresh to show new card
      }
    } catch (error) {
      console.error('Failed to create suggestion:', error);
    }
  };

  // Convert suggestions to highlights format for InteractiveText
  const highlights: TextHighlight[] = (batch?.suggestions || [])
    .filter(s => s.text_start_index != null)
    .map(s => ({
      id: s.id,
      text: s.entity_name,
      startIndex: s.text_start_index,
      endIndex: s.text_end_index,
      confidence: s.confidence_score,
      type: s.entity_type as EntityType,
      status: s.status,
    }));

  // Update suggestion status
  const updateSuggestion = async (id: string, action: string, mergeTargetId?: string) => {
    try {
      const response = await fetch(`/api/import/suggestion/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, mergeTargetId }),
      });

      if (response.ok) {
        fetchBatch(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to update suggestion:', error);
    }
  };

  // Commit all accepted suggestions
  const handleCommit = async () => {
    setCommitting(true);
    try {
      const response = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });

      if (response.ok) {
        const data = await response.json();
        onCommitComplete(data.stats);
      }
    } catch (error) {
      console.error('Failed to commit:', error);
    } finally {
      setCommitting(false);
    }
  };

  // Scroll to card when clicking highlight
  const scrollToCard = (suggestionId: string) => {
    setSelectedSuggestion(suggestionId);
    const card = cardRefs.current[suggestionId];
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Stats
  const stats = {
    total: batch?.suggestions?.length || 0,
    pending: batch?.suggestions?.filter(s => s.status === 'pending').length || 0,
    accepted: batch?.suggestions?.filter(s => s.status === 'accepted').length || 0,
    rejected: batch?.suggestions?.filter(s => s.status === 'rejected').length || 0,
    merged: batch?.suggestions?.filter(s => s.status === 'merged').length || 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <div>
              <h1 className="font-semibold text-white">{batch?.source_doc?.title}</h1>
              <p className="text-sm text-slate-400">
                {stats.total} entities found • {stats.pending} pending review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                {stats.accepted} accepted
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                {stats.rejected} ignored
              </Badge>
            </div>

            {/* Commit Button */}
            <Button
              onClick={handleCommit}
              disabled={committing || stats.accepted === 0}
              className="bg-gradient-to-r from-teal-600 to-cyan-600"
            >
              {committing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Import {stats.accepted + stats.merged} Entities
            </Button>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Source Text */}
        <div className="w-1/2 border-r border-slate-800 overflow-auto p-6 bg-slate-950">
          <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
            <FileText className="w-4 h-4" />
            Source Document
            <span className="text-xs text-slate-600">
              (Select text to manually tag entities)
            </span>
          </div>

          <InteractiveText
            content={batch?.source_doc?.content || ''}
            highlights={highlights}
            selectedHighlightId={selectedSuggestion || undefined}
            onHighlightClick={(h) => scrollToCard(h.id!)}
            onManualSelect={handleManualSelect}
          />
        </div>

        {/* Right: Suggestion Cards */}
        <div className="w-1/2 overflow-auto p-6 bg-slate-900/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-400">Extracted Entities</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  batch?.suggestions
                    ?.filter(s => s.status === 'pending')
                    .forEach(s => updateSuggestion(s.id, 'accepted'));
                }}
              >
                <Check className="w-3 h-3 mr-1" />
                Accept All
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {batch?.suggestions?.map((suggestion) => {
              const Icon = entityIcons[suggestion.entity_type] || FileText;
              const colorClass = entityColors[suggestion.entity_type] || 'text-slate-400 bg-slate-500/10 border-slate-500/30';
              const isSelected = selectedSuggestion === suggestion.id;
              const hasMergeTarget = suggestion.merge_target_id && suggestion.similarity_score && suggestion.similarity_score > 0.6;

              return (
                <div
                  key={suggestion.id}
                  ref={(el) => { cardRefs.current[suggestion.id] = el; }}
                  className={cn(
                    'rounded-lg border p-4 transition-all',
                    suggestion.status === 'rejected'
                      ? 'opacity-50 bg-slate-900/30 border-slate-800'
                      : suggestion.status === 'accepted'
                      ? 'bg-green-500/5 border-green-500/30'
                      : suggestion.status === 'merged'
                      ? 'bg-blue-500/5 border-blue-500/30'
                      : 'bg-slate-900/50 border-slate-700',
                    isSelected && 'ring-2 ring-teal-500'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded border', colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{suggestion.entity_name}</h3>
                        <span className="text-xs text-slate-500 capitalize">{suggestion.entity_type}</span>
                      </div>
                    </div>

                    {/* Confidence Badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        suggestion.confidence_score >= 0.8
                          ? 'border-green-500/30 text-green-400'
                          : 'border-yellow-500/30 text-yellow-400'
                      )}
                    >
                      {Math.round(suggestion.confidence_score * 100)}%
                    </Badge>
                  </div>

                  {/* Snippet */}
                  {suggestion.snippet && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                      {suggestion.snippet}
                    </p>
                  )}

                  {/* Merge Warning */}
                  {hasMergeTarget && suggestion.merge_target && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded p-2 mb-3">
                      <AlertTriangle className="w-3 h-3" />
                      Similar to existing: &quot;{suggestion.merge_target.name}&quot;
                      ({Math.round((suggestion.similarity_score || 0) * 100)}% match)
                    </div>
                  )}

                  {/* Actions */}
                  {suggestion.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        onClick={() => updateSuggestion(suggestion.id, 'accepted')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>

                      {hasMergeTarget && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          onClick={() => updateSuggestion(suggestion.id, 'merged', suggestion.merge_target_id!)}
                        >
                          <Merge className="w-4 h-4 mr-1" />
                          Merge
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={() => setEditingSuggestion(suggestion)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
                        onClick={() => updateSuggestion(suggestion.id, 'rejected')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Status indicator for non-pending */}
                  {suggestion.status !== 'pending' && (
                    <div className="pt-2 border-t border-slate-800">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          suggestion.status === 'accepted' && 'border-green-500/30 text-green-400',
                          suggestion.status === 'rejected' && 'border-red-500/30 text-red-400',
                          suggestion.status === 'merged' && 'border-blue-500/30 text-blue-400'
                        )}
                      >
                        {suggestion.status === 'accepted' && 'Will be created'}
                        {suggestion.status === 'rejected' && 'Ignored'}
                        {suggestion.status === 'merged' && `Will merge with ${suggestion.merge_target?.name}`}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSuggestion && (
        <SuggestionEditModal
          suggestion={editingSuggestion}
          onClose={() => setEditingSuggestion(null)}
          onSave={async (updated) => {
            await fetch(`/api/import/suggestion/${editingSuggestion.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'accepted',
                proposedData: updated.proposed_data
              }),
            });
            setEditingSuggestion(null);
            fetchBatch();
          }}
        />
      )}
    </div>
  );
}
