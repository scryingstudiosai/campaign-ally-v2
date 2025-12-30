import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Heart, Shield, Zap, Sparkles } from 'lucide-react';

interface PortalPageProps {
  params: Promise<{ campaignId: string }>;
}

interface CharacterMechanics {
  hp?: { current?: number; max?: number };
  ac?: number;
  level?: number;
  class?: string;
  race?: string;
  abilities?: {
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
  };
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { campaignId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get campaign membership with full character data
  const { data: membership, error } = await supabase
    .from('campaign_members')
    .select(`
      id,
      role,
      character_entity_id,
      entities:character_entity_id (
        id,
        name,
        summary,
        description,
        image_url,
        mechanics
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single();

  if (error || !membership) {
    redirect('/');
  }

  // Spectator view
  if (membership.role === 'spectator' || !membership.entities) {
    return (
      <div className="p-4 text-center">
        <div className="py-12">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-display text-white mb-2">Spectator Mode</h2>
          <p className="text-slate-400 max-w-sm mx-auto">
            You&apos;re watching this campaign as a spectator.
            Check out the World and Journal tabs to explore!
          </p>
        </div>
      </div>
    );
  }

  // Handle Supabase joined table types
  const characterData = membership.entities as unknown;
  const character = (Array.isArray(characterData) ? characterData[0] : characterData) as {
    id: string;
    name: string;
    summary: string | null;
    description: string | null;
    image_url: string | null;
    mechanics: CharacterMechanics | null;
  };

  const mechanics = character.mechanics || {};
  const hp = mechanics.hp || { current: 0, max: 0 };
  const hpPercent = hp.max ? Math.round((hp.current || 0) / hp.max * 100) : 100;

  return (
    <div className="p-4 space-y-6">
      {/* Character Header */}
      <div className="flex gap-4 items-start">
        {/* Large avatar */}
        <div className="w-24 h-24 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 ring-2 ring-teal-500/30">
          {character.image_url ? (
            <img
              src={character.image_url}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 text-3xl font-display">
              {character.name[0]}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display text-white truncate">
            {character.name}
          </h1>
          {(mechanics.race || mechanics.class) && (
            <p className="text-slate-400 text-sm">
              {[mechanics.race, mechanics.class].filter(Boolean).join(' ')}
              {mechanics.level && ` • Level ${mechanics.level}`}
            </p>
          )}
          {character.summary && (
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">
              {character.summary}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* HP */}
        <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-500 uppercase">HP</span>
          </div>
          <div className="text-lg font-display text-white">
            {hp.current ?? '—'}/{hp.max ?? '—'}
          </div>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* AC */}
        <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-500 uppercase">AC</span>
          </div>
          <div className="text-2xl font-display text-white">
            {mechanics.ac ?? '—'}
          </div>
        </div>

        {/* Level */}
        <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-500 uppercase">Level</span>
          </div>
          <div className="text-2xl font-display text-white">
            {mechanics.level ?? '—'}
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      {mechanics.abilities && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-3">
            Ability Scores
          </h3>
          <div className="grid grid-cols-6 gap-2">
            {[
              { key: 'strength', label: 'STR' },
              { key: 'dexterity', label: 'DEX' },
              { key: 'constitution', label: 'CON' },
              { key: 'intelligence', label: 'INT' },
              { key: 'wisdom', label: 'WIS' },
              { key: 'charisma', label: 'CHA' },
            ].map(({ key, label }) => {
              const score = mechanics.abilities?.[key as keyof typeof mechanics.abilities];
              const modifier = score ? Math.floor((score - 10) / 2) : 0;
              const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

              return (
                <div key={key} className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase">{label}</div>
                  <div className="text-lg font-display text-white">{score ?? '—'}</div>
                  <div className="text-xs text-teal-400">{score ? modStr : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Description */}
      {character.description && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-2">
            Background
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            {character.description}
          </p>
        </div>
      )}
    </div>
  );
}
