'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  AlertTriangle,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expandable } from '@/components/ui/motion';
import { EVENT_SUB_TYPES, EventSubType, LoreDrop } from '@/types/event';
import { toast } from 'sonner';

interface TimelineEventCardProps {
  event: {
    id: string;
    name: string;
    sub_type: EventSubType;
    event_ongoing?: boolean;
    soul?: {
      common_knowledge?: string;
      scholarly_account?: string;
      folklore?: string;
      propaganda?: string;
    };
    brain?: {
      true_history?: string;
      consequences?: string;
      secrets?: string;
    };
    mechanics?: {
      date_display?: string;
      lore_drops?: LoreDrop[];
      current_evidence?: string;
    };
    relationships?: {
      type: string;
      target_name: string;
      target_id: string;
    }[];
  };
  campaignId: string;
  showDmContent?: boolean;
  defaultExpanded?: boolean;
}

export function TimelineEventCard({
  event,
  campaignId,
  showDmContent = true,
  defaultExpanded = false,
}: TimelineEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedDropId, setCopiedDropId] = useState<string | null>(null);

  const typeInfo = EVENT_SUB_TYPES.find(t => t.value === event.sub_type);
  const hasSecrets = event.brain?.secrets || event.brain?.true_history;
  const loreDropCount = event.mechanics?.lore_drops?.length || 0;

  const copyLoreDrop = (drop: LoreDrop) => {
    const text = `${drop.trigger}\n${drop.delivery}\n"${drop.text}"`;
    navigator.clipboard.writeText(text);
    setCopiedDropId(drop.id);
    setTimeout(() => setCopiedDropId(null), 2000);
    toast.success('Copied!');
  };

  return (
    <div className={`bg-slate-900/50 border rounded-lg overflow-hidden transition-all ${
      isExpanded ? 'border-amber-500/50' : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{typeInfo?.icon}</span>
              <h3 className="font-semibold text-slate-100">{event.name}</h3>
              {event.event_ongoing && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-medium">
                  ONGOING
                </span>
              )}
              {hasSecrets && showDmContent && (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>{event.mechanics?.date_display}</span>
              <span>•</span>
              <span className="capitalize">{typeInfo?.label}</span>
              {loreDropCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-teal-400">{loreDropCount} lore drops</span>
                </>
              )}
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`} />
        </div>

        {!isExpanded && (
          <p className="text-sm text-slate-400 mt-2 line-clamp-2">
            {event.soul?.common_knowledge}
          </p>
        )}
      </button>

      {/* Expanded Content */}
      <Expandable isOpen={isExpanded}>
        <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
          {/* Common Knowledge */}
          <div>
            <h4 className="text-xs font-semibold text-teal-400 uppercase mb-2">
              Common Knowledge
            </h4>
            <p className="text-slate-300 text-sm">{event.soul?.common_knowledge}</p>
          </div>

          {/* Scholarly Account */}
          {event.soul?.scholarly_account && (
            <div>
              <h4 className="text-xs font-semibold text-blue-400 uppercase mb-2">
                Scholarly Account
              </h4>
              <p className="text-slate-300 text-sm">{event.soul.scholarly_account}</p>
            </div>
          )}

          {/* Folklore */}
          {event.soul?.folklore && (
            <div>
              <h4 className="text-xs font-semibold text-purple-400 uppercase mb-2">
                Folklore
              </h4>
              <p className="text-slate-300 text-sm italic">{event.soul.folklore}</p>
            </div>
          )}

          {/* DM Truth */}
          {showDmContent && event.brain?.true_history && (
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <h4 className="text-xs font-semibold text-red-400 uppercase mb-2 flex items-center gap-2">
                <EyeOff className="w-3 h-3" />
                DM Truth
              </h4>
              <p className="text-slate-300 text-sm">{event.brain.true_history}</p>
              {event.brain.consequences && (
                <p className="text-slate-400 text-sm mt-2">
                  <strong className="text-red-400">Consequences:</strong> {event.brain.consequences}
                </p>
              )}
            </div>
          )}

          {/* Lore Drops */}
          {event.mechanics?.lore_drops && event.mechanics.lore_drops.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-teal-400 uppercase mb-2">
                Lore Drops
              </h4>
              <div className="space-y-2">
                {event.mechanics.lore_drops.map((drop) => (
                  <div
                    key={drop.id}
                    className={`p-2 rounded text-sm flex items-start justify-between ${
                      drop.reveal_level === 'dm_truth'
                        ? 'bg-red-500/5 border border-red-500/20'
                        : drop.reveal_level === 'partial'
                        ? 'bg-amber-500/5 border border-amber-500/20'
                        : 'bg-slate-800/50 border border-slate-700'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 mb-1">
                        {drop.trigger} • {drop.delivery}
                      </div>
                      <p className="text-slate-300">&quot;{drop.text}&quot;</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyLoreDrop(drop);
                      }}
                      className="h-6 w-6 p-0 ml-2"
                    >
                      {copiedDropId === drop.id ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relationships */}
          {event.relationships && event.relationships.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                Connections
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.relationships.map((rel, i) => (
                  <Link
                    key={i}
                    href={`/dashboard/campaigns/${campaignId}/memory/${rel.target_id}`}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors"
                  >
                    {rel.type}: {rel.target_name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* View Full Button */}
          <div className="pt-2">
            <Link href={`/dashboard/campaigns/${campaignId}/memory/${event.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Full Details
              </Button>
            </Link>
          </div>
        </div>
      </Expandable>
    </div>
  );
}
