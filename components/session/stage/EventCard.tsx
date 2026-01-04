'use client';

import { SessionEvent } from '@/types/session';
import { Dices, MessageSquare, Swords, Shield, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface EventCardProps {
  event: SessionEvent;
  onResumeCombat?: () => void;
}

export function EventCard({ event, onResumeCombat }: EventCardProps) {
  const renderContent = () => {
    switch (event.event_type) {
      case 'roll':
        return <RollCard event={event} />;
      case 'narrative':
        return <NarrativeCard event={event} />;
      case 'note':
        return <NoteCard event={event} />;
      case 'skill_check':
      case 'saving_throw':
        return <CheckCard event={event} />;
      case 'combat_start':
      case 'combat_end':
        return <CombatCard event={event} onResumeCombat={onResumeCombat} />;
      default:
        return <DefaultCard event={event} />;
    }
  };

  return (
    <div className="group">
      {renderContent()}
    </div>
  );
}

function RollCard({ event }: { event: SessionEvent }) {
  const payload = event.payload as Record<string, unknown> | undefined;
  const isNat20 = Boolean(payload?.isNat20);
  const isNat1 = Boolean(payload?.isNat1);
  const rolls = payload?.rolls as number[] | undefined;
  const total = payload?.total as number | undefined;
  const modifier = payload?.modifier as number | undefined;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${
      isNat20 ? 'bg-green-900/30 border border-green-700' :
      isNat1 ? 'bg-red-900/30 border border-red-700' :
      'bg-slate-800/50'
    }`}>
      <div className={`p-2 rounded-lg ${
        isNat20 ? 'bg-green-800' : isNat1 ? 'bg-red-800' : 'bg-teal-900'
      }`}>
        <Dices className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-400">{event.title}</p>
        <p className="text-2xl font-bold text-white">
          {total}
          {isNat20 && <span className="ml-2 text-green-400 text-sm">NAT 20! 🎉</span>}
          {isNat1 && <span className="ml-2 text-red-400 text-sm">NAT 1! 💀</span>}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          [{rolls?.join(', ')}]
          {modifier !== 0 && modifier !== undefined && ` ${modifier > 0 ? '+' : ''}${modifier}`}
        </p>
      </div>
      <TimeStamp timestamp={event.timestamp} />
    </div>
  );
}

function NarrativeCard({ event }: { event: SessionEvent }) {
  return (
    <div className="p-3 bg-slate-800/30 border-l-2 border-amber-600 rounded-r-lg">
      <p className="text-slate-200 italic">{event.description}</p>
      <TimeStamp timestamp={event.timestamp} />
    </div>
  );
}

function NoteCard({ event }: { event: SessionEvent }) {
  const payload = event.payload as Record<string, unknown> | undefined;
  const isPrivate = Boolean(event.is_private || payload?.isPrivate);

  return (
    <div className={`p-3 rounded-lg ${
      isPrivate ? 'bg-purple-900/20 border border-purple-800' : 'bg-slate-800/50'
    }`}>
      <div className="flex items-start gap-2">
        <MessageSquare className={`w-4 h-4 mt-0.5 ${isPrivate ? 'text-purple-400' : 'text-slate-500'}`} />
        <div className="flex-1">
          {event.title && <p className="text-sm font-medium text-slate-300">{event.title}</p>}
          <p className="text-sm text-slate-400">{event.description}</p>
          {isPrivate && <span className="text-xs text-purple-400">DM Only</span>}
        </div>
      </div>
      <TimeStamp timestamp={event.timestamp} />
    </div>
  );
}

function CheckCard({ event }: { event: SessionEvent }) {
  const isSave = event.event_type === 'saving_throw';

  return (
    <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
      <div className="flex items-center gap-2">
        {isSave ? <Shield className="w-4 h-4 text-blue-400" /> : <Swords className="w-4 h-4 text-blue-400" />}
        <p className="text-sm font-medium text-blue-300">{event.title}</p>
      </div>
      <p className="text-xs text-slate-400 mt-1">{event.description}</p>
      <TimeStamp timestamp={event.timestamp} />
    </div>
  );
}

function CombatCard({ event, onResumeCombat }: { event: SessionEvent; onResumeCombat?: () => void }) {
  const isStart = event.event_type === 'combat_start';

  if (isStart && onResumeCombat) {
    return (
      <div
        onClick={onResumeCombat}
        className="cursor-pointer hover:ring-2 hover:ring-orange-500/50 transition-all"
      >
        <div className="flex items-center gap-3 p-4 bg-orange-900/30 border border-orange-700 rounded-lg">
          <Swords className="w-6 h-6 text-orange-400" />
          <div className="flex-1">
            <p className="font-medium text-orange-300">⚔️ COMBAT STARTED</p>
            <p className="text-sm text-slate-400">{event.description || 'Initiative tracker activated'}</p>
          </div>
          <Button size="sm" variant="outline" className="border-orange-600 text-orange-400 hover:bg-orange-900/30">
            Resume
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg text-center ${
      isStart ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'
    }`}>
      <Swords className={`w-6 h-6 mx-auto mb-1 ${isStart ? 'text-red-400' : 'text-green-400'}`} />
      <p className={`font-bold ${isStart ? 'text-red-300' : 'text-green-300'}`}>
        {isStart ? '⚔️ COMBAT STARTED' : '🏆 COMBAT ENDED'}
      </p>
      {event.description && <p className="text-xs text-slate-400 mt-1">{event.description}</p>}
    </div>
  );
}

function DefaultCard({ event }: { event: SessionEvent }) {
  return (
    <div className="p-3 bg-slate-800/30 rounded-lg">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-500 mt-0.5" />
        <div>
          {event.title && <p className="text-sm font-medium text-slate-300">{event.title}</p>}
          <p className="text-sm text-slate-400">{event.description}</p>
        </div>
      </div>
      <TimeStamp timestamp={event.timestamp} />
    </div>
  );
}

function TimeStamp({ timestamp }: { timestamp: string }) {
  return (
    <p className="text-xs text-slate-600 mt-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
      {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
    </p>
  );
}
