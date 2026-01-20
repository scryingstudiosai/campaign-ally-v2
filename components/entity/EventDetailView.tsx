'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expandable } from '@/components/ui/motion';
import { EVENT_SUB_TYPES, EventSubType, LoreDrop } from '@/types/event';
import { toast } from 'sonner';

interface EventDetailViewProps {
  event: {
    id: string;
    name: string;
    sub_type: EventSubType;
    event_sort?: number;
    event_era?: string | null;
    event_ongoing?: boolean;
    soul?: {
      common_knowledge?: string;
      scholarly_account?: string;
      folklore?: string;
      propaganda?: string;
    };
    brain?: {
      true_history?: string;
      hidden_causes?: string;
      consequences?: string;
      secrets?: string;
      reveal_triggers?: string[];
      hooks?: string[];
    };
    mechanics?: {
      date_display?: string;
      duration?: string;
      affected_regions?: string[];
      current_evidence?: string;
      lore_drops?: LoreDrop[];
    };
  };
  campaignId: string;
}

export function EventDetailView({ event, campaignId }: EventDetailViewProps) {
  const [copiedDropId, setCopiedDropId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['common', 'dm_truth', 'lore_drops'])
  );

  const typeInfo = EVENT_SUB_TYPES.find(t => t.value === event.sub_type);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const copyLoreDrop = (drop: LoreDrop) => {
    const text = `${drop.trigger}\n${drop.delivery}\n"${drop.text}"`;
    navigator.clipboard.writeText(text);
    setCopiedDropId(drop.id);
    setTimeout(() => setCopiedDropId(null), 2000);
    toast.success('Lore drop copied!');
  };

  const copyAllLoreDrops = () => {
    if (!event.mechanics?.lore_drops) return;
    const text = event.mechanics.lore_drops
      .map(drop => `${drop.trigger}\n${drop.delivery}\n"${drop.text}"`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('All lore drops copied!');
  };

  return (
    <div className="space-y-6">
      {/* Timeline Info Header */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeInfo?.icon}</span>
          <span className="text-amber-400 font-medium capitalize">{typeInfo?.label}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>{event.mechanics?.date_display || 'Unknown date'}</span>
        </div>

        {event.event_era && (
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{event.event_era}</span>
          </div>
        )}

        {event.event_ongoing && (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ONGOING
          </span>
        )}

        {event.mechanics?.duration && (
          <span className="text-slate-500 text-sm">
            Duration: {event.mechanics.duration}
          </span>
        )}

        <Link
          href={`/dashboard/campaigns/${campaignId}/timeline`}
          className="ml-auto text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          View Timeline
        </Link>
      </div>

      {/* Affected Regions */}
      {event.mechanics?.affected_regions && event.mechanics.affected_regions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span className="text-slate-500 text-sm">Affected regions:</span>
          {event.mechanics.affected_regions.map((region, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-sm"
            >
              {region}
            </span>
          ))}
        </div>
      )}

      {/* Knowledge Layers */}
      <div className="space-y-4">
        {/* Common Knowledge */}
        {event.soul?.common_knowledge && (
          <div className="border border-teal-500/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('common')}
              className="w-full flex items-center justify-between p-4 bg-teal-500/5 hover:bg-teal-500/10 transition-colors"
            >
              <h3 className="text-sm font-semibold text-teal-400 uppercase flex items-center gap-2">
                Common Knowledge
              </h3>
              {expandedSections.has('common') ? (
                <ChevronDown className="w-4 h-4 text-teal-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-teal-400" />
              )}
            </button>
            <Expandable isOpen={expandedSections.has('common')}>
              <div className="p-4 border-t border-teal-500/20">
                <p className="text-slate-300 whitespace-pre-wrap">{event.soul.common_knowledge}</p>
              </div>
            </Expandable>
          </div>
        )}

        {/* Scholarly Account */}
        {event.soul?.scholarly_account && (
          <div className="border border-blue-500/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('scholarly')}
              className="w-full flex items-center justify-between p-4 bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
            >
              <h3 className="text-sm font-semibold text-blue-400 uppercase flex items-center gap-2">
                Scholarly Account
              </h3>
              {expandedSections.has('scholarly') ? (
                <ChevronDown className="w-4 h-4 text-blue-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-blue-400" />
              )}
            </button>
            <Expandable isOpen={expandedSections.has('scholarly')}>
              <div className="p-4 border-t border-blue-500/20">
                <p className="text-slate-300 whitespace-pre-wrap">{event.soul.scholarly_account}</p>
              </div>
            </Expandable>
          </div>
        )}

        {/* Folklore */}
        {event.soul?.folklore && (
          <div className="border border-purple-500/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('folklore')}
              className="w-full flex items-center justify-between p-4 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
            >
              <h3 className="text-sm font-semibold text-purple-400 uppercase flex items-center gap-2">
                Folklore
              </h3>
              {expandedSections.has('folklore') ? (
                <ChevronDown className="w-4 h-4 text-purple-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-purple-400" />
              )}
            </button>
            <Expandable isOpen={expandedSections.has('folklore')}>
              <div className="p-4 border-t border-purple-500/20">
                <p className="text-slate-300 italic whitespace-pre-wrap">{event.soul.folklore}</p>
              </div>
            </Expandable>
          </div>
        )}

        {/* Propaganda (if exists) */}
        {event.soul?.propaganda && (
          <div className="border border-orange-500/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('propaganda')}
              className="w-full flex items-center justify-between p-4 bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
            >
              <h3 className="text-sm font-semibold text-orange-400 uppercase flex items-center gap-2">
                Official Version / Propaganda
              </h3>
              {expandedSections.has('propaganda') ? (
                <ChevronDown className="w-4 h-4 text-orange-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-orange-400" />
              )}
            </button>
            <Expandable isOpen={expandedSections.has('propaganda')}>
              <div className="p-4 border-t border-orange-500/20">
                <p className="text-slate-300 whitespace-pre-wrap">{event.soul.propaganda}</p>
              </div>
            </Expandable>
          </div>
        )}
      </div>

      {/* DM Truth Section */}
      {event.brain && (event.brain.true_history || event.brain.secrets) && (
        <div className="border border-red-500/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('dm_truth')}
            className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/15 transition-colors"
          >
            <h3 className="text-sm font-semibold text-red-400 uppercase flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              DM Truth
              <AlertTriangle className="w-4 h-4" />
            </h3>
            {expandedSections.has('dm_truth') ? (
              <ChevronDown className="w-4 h-4 text-red-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-red-400" />
            )}
          </button>
          <Expandable isOpen={expandedSections.has('dm_truth')}>
            <div className="p-4 border-t border-red-500/20 space-y-4">
              {event.brain.true_history && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-2">True History</h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{event.brain.true_history}</p>
                </div>
              )}

              {event.brain.hidden_causes && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-2">Hidden Causes</h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{event.brain.hidden_causes}</p>
                </div>
              )}

              {event.brain.secrets && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-2">Secrets</h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{event.brain.secrets}</p>
                </div>
              )}

              {event.brain.consequences && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-2">Consequences</h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{event.brain.consequences}</p>
                </div>
              )}

              {event.brain.reveal_triggers && event.brain.reveal_triggers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-2">Reveal Triggers</h4>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    {event.brain.reveal_triggers.map((trigger, i) => (
                      <li key={i}>{trigger}</li>
                    ))}
                  </ul>
                </div>
              )}

              {event.brain.hooks && event.brain.hooks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-2">Plot Hooks</h4>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    {event.brain.hooks.map((hook, i) => (
                      <li key={i}>{hook}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Expandable>
        </div>
      )}

      {/* Lore Drops Section */}
      {event.mechanics?.lore_drops && event.mechanics.lore_drops.length > 0 && (
        <div className="border border-teal-500/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('lore_drops')}
            className="w-full flex items-center justify-between p-4 bg-teal-500/10 hover:bg-teal-500/15 transition-colors"
          >
            <h3 className="text-sm font-semibold text-teal-400 uppercase flex items-center gap-2">
              Lore Drops
              <span className="px-1.5 py-0.5 bg-teal-500/20 rounded text-xs">
                {event.mechanics.lore_drops.length}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyAllLoreDrops();
                }}
                className="h-7 px-2 text-xs text-teal-400 hover:text-teal-300"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy All
              </Button>
              {expandedSections.has('lore_drops') ? (
                <ChevronDown className="w-4 h-4 text-teal-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-teal-400" />
              )}
            </div>
          </button>
          <Expandable isOpen={expandedSections.has('lore_drops')}>
            <div className="p-4 border-t border-teal-500/20 space-y-3">
              {event.mechanics.lore_drops.map((drop) => (
                <div
                  key={drop.id}
                  className={`p-3 rounded-lg border ${
                    drop.reveal_level === 'dm_truth'
                      ? 'bg-red-500/5 border-red-500/20'
                      : drop.reveal_level === 'partial'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        drop.reveal_level === 'dm_truth'
                          ? 'bg-red-500/20 text-red-400'
                          : drop.reveal_level === 'partial'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-teal-500/20 text-teal-400'
                      }`}>
                        {drop.reveal_level === 'dm_truth' ? 'DM Only' : drop.reveal_level === 'partial' ? 'Partial' : 'Public'}
                      </span>
                      <span className="text-slate-400 text-sm">{drop.trigger}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500 text-sm">{drop.delivery}</span>
                      {drop.dc && (
                        <span className="text-amber-400 text-sm font-medium">DC {drop.dc}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLoreDrop(drop)}
                      className="h-7 w-7 p-0 flex-shrink-0"
                    >
                      {copiedDropId === drop.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-slate-200 italic">&quot;{drop.text}&quot;</p>
                </div>
              ))}
            </div>
          </Expandable>
        </div>
      )}

      {/* Current Evidence */}
      {event.mechanics?.current_evidence && (
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">
            Current Evidence
          </h3>
          <p className="text-slate-300 whitespace-pre-wrap">{event.mechanics.current_evidence}</p>
        </div>
      )}
    </div>
  );
}
