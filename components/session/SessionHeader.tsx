'use client';

import { useState, useEffect } from 'react';
import { Session, SessionStatus } from '@/types/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Play, Pause, Square, Clock, Users, Shield, Eye, Heart,
  ChevronLeft, Pencil, Check, X, Archive
} from 'lucide-react';
import Link from 'next/link';

interface SessionHeaderProps {
  session: Session;
  campaignId: string;
  onSessionUpdate: (session: Session) => void;
}

interface PlayerCharacter {
  id: string;
  name: string;
  hp_current: number;
  hp_max: number;
  ac: number;
  passive_perception: number;
  class?: string;
  level?: number;
}

export function SessionHeader({ session, campaignId, onSessionUpdate }: SessionHeaderProps): JSX.Element {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(session.name);
  const [players, setPlayers] = useState<PlayerCharacter[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Fetch player characters
  useEffect(() => {
    const fetchPlayers = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/entities?campaignId=${campaignId}&type=player`);
        if (response.ok) {
          const data = await response.json();
          const playerData = data.map((entity: Record<string, unknown>) => {
            const mechanics = entity.mechanics as Record<string, unknown> || {};
            const abilities = mechanics.abilities as Record<string, number> || {};
            return {
              id: entity.id as string,
              name: entity.name as string,
              hp_current: (mechanics.hp_current as number) || (mechanics.hit_points as number) || 10,
              hp_max: (mechanics.hp_max as number) || (mechanics.hit_points as number) || 10,
              ac: (mechanics.armor_class as number) || (mechanics.ac as number) || 10,
              passive_perception: (mechanics.passive_perception as number) ||
                (10 + Math.floor(((abilities.wis || 10) - 10) / 2)),
              class: (mechanics.class as string) || (entity.sub_type as string),
              level: (mechanics.level as number) || 1,
            };
          });
          setPlayers(playerData);
        }
      } catch (error) {
        console.error('Failed to fetch players:', error);
      }
    };
    fetchPlayers();
  }, [campaignId]);

  // Session timer
  useEffect(() => {
    if (session.status !== 'active' || !session.started_at) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(session.started_at).getTime();

    // Set initial elapsed time
    setElapsedTime(Math.floor((Date.now() - startTime) / 1000));

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.status, session.started_at]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveName = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName }),
      });

      if (response.ok) {
        onSessionUpdate({ ...session, name: editedName });
        setIsEditingName(false);
      }
    } catch (error) {
      console.error('Failed to save session name:', error);
    }
  };

  const handleStatusChange = async (newStatus: SessionStatus): Promise<void> => {
    const updates: Partial<Session> = { status: newStatus };

    if (newStatus === 'active' && !session.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (newStatus === 'review' && session.started_at && !session.ended_at) {
      updates.ended_at = new Date().toISOString();
      const start = new Date(session.started_at).getTime();
      const end = Date.now();
      updates.duration_minutes = Math.floor((end - start) / 60000);
    }

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedSession = await response.json();
        onSessionUpdate(updatedSession);
      }
    } catch (error) {
      console.error('Failed to update session status:', error);
    }
  };

  const statusConfig: Record<SessionStatus, { color: string; label: string }> = {
    planning: { color: 'bg-blue-900/50 text-blue-400 border-blue-700', label: 'Planning' },
    active: { color: 'bg-green-900/50 text-green-400 border-green-700', label: 'Live' },
    review: { color: 'bg-amber-900/50 text-amber-400 border-amber-700', label: 'Review' },
    archived: { color: 'bg-slate-800 text-slate-400 border-slate-700', label: 'Archived' },
  };

  const getHpBarColor = (current: number, max: number): string => {
    const ratio = current / max;
    if (ratio > 0.5) return 'bg-green-500';
    if (ratio > 0.25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Back + Session Name + Status */}
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/campaigns/${campaignId}`}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-64 h-8 bg-slate-800 border-slate-700"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <Button size="icon" variant="ghost" onClick={handleSaveName} className="h-8 w-8">
                <Check className="w-4 h-4 text-green-400" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)} className="h-8 w-8">
                <X className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-100">{session.name}</h1>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditingName(true)}
                className="h-6 w-6 opacity-50 hover:opacity-100"
              >
                <Pencil className="w-3 h-3 text-slate-400" />
              </Button>
            </div>
          )}

          <Badge className={`${statusConfig[session.status].color} border`}>
            {session.status === 'active' && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-1.5"></span>
            )}
            {statusConfig[session.status].label}
          </Badge>
        </div>

        {/* Center: Timer + Mode Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg tabular-nums">{formatTime(elapsedTime)}</span>
          </div>

          <div className="flex items-center gap-2">
            {session.status === 'planning' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange('active')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-1" /> Start Session
              </Button>
            )}
            {session.status === 'active' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('planning')}
                  className="border-slate-600 hover:bg-slate-800"
                >
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange('review')}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Square className="w-4 h-4 mr-1" /> End Session
                </Button>
              </>
            )}
            {session.status === 'review' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange('archived')}
                className="bg-slate-600 hover:bg-slate-700"
              >
                <Archive className="w-4 h-4 mr-1" /> Archive
              </Button>
            )}
          </div>
        </div>

        {/* Right: Party Members */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-500">
            <Users className="w-4 h-4" />
            <span className="text-xs">{players.length}</span>
          </div>

          <div className="flex items-center gap-1">
            {players.length === 0 ? (
              <span className="text-slate-500 text-xs">No players</span>
            ) : (
              players.slice(0, 5).map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded border border-slate-700 hover:border-slate-600 transition-colors cursor-default"
                  title={`${player.name}\n${player.class || 'Adventurer'} ${player.level || 1}\nHP: ${player.hp_current}/${player.hp_max}\nAC: ${player.ac}\nPP: ${player.passive_perception}`}
                >
                  <span className="text-xs font-medium text-slate-200 max-w-16 truncate">
                    {player.name.split(' ')[0]}
                  </span>

                  {/* Mini HP Bar */}
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-400" />
                    <div className="w-8 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getHpBarColor(player.hp_current, player.hp_max)} transition-all`}
                        style={{ width: `${Math.max(0, Math.min(100, (player.hp_current / player.hp_max) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* AC */}
                  <div className="flex items-center gap-0.5" title="Armor Class">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-slate-300">{player.ac}</span>
                  </div>

                  {/* PP */}
                  <div className="flex items-center gap-0.5" title="Passive Perception">
                    <Eye className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-slate-300">{player.passive_perception}</span>
                  </div>
                </div>
              ))
            )}
            {players.length > 5 && (
              <span className="text-xs text-slate-500">+{players.length - 5}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
