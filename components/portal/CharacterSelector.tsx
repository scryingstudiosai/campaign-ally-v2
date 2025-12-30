'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Sparkles, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Character {
  id: string;
  name: string;
  summary: string | null;
  description: string | null;
  image_url: string | null;
  attributes: Record<string, unknown> | null;
}

interface Props {
  campaignId: string;
  characters: Character[];
  userId: string;
  existingMemberId?: string;
}

export function CharacterSelector({ campaignId, characters, userId, existingMemberId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'select' | 'spectate'>('select');
  const router = useRouter();
  const supabase = createClient();

  const handleClaim = async () => {
    if (!selectedId && mode === 'select') return;
    setIsLoading(true);

    try {
      if (existingMemberId) {
        // Update existing membership
        await supabase
          .from('campaign_members')
          .update({
            character_entity_id: mode === 'select' ? selectedId : null,
            role: mode === 'spectate' ? 'spectator' : 'player'
          })
          .eq('id', existingMemberId);
      } else {
        // Create new membership
        await supabase
          .from('campaign_members')
          .insert({
            campaign_id: campaignId,
            user_id: userId,
            character_entity_id: mode === 'select' ? selectedId : null,
            role: mode === 'spectate' ? 'spectator' : 'player'
          });
      }

      router.push(`/portal/${campaignId}`);
    } catch (error) {
      console.error('Failed to claim character:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setMode('select')}
          className={cn(
            "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
            mode === 'select'
              ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
              : "text-slate-400 hover:text-white"
          )}
        >
          <User className="w-4 h-4" />
          Claim Character
        </button>
        <button
          onClick={() => setMode('spectate')}
          className={cn(
            "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
            mode === 'spectate'
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Eye className="w-4 h-4" />
          Join as Spectator
        </button>
      </div>

      {/* Character Grid */}
      {mode === 'select' && (
        <>
          {characters.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg text-slate-300 mb-2">No Characters Available</h3>
              <p className="text-slate-500">
                All characters have been claimed or the DM hasn&apos;t created any yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => setSelectedId(character.id)}
                  className={cn(
                    "p-4 rounded-xl border bg-slate-900/50 cursor-pointer transition-all hover:bg-slate-800/50",
                    selectedId === character.id
                      ? "ring-2 ring-teal-500 border-teal-500/50"
                      : "border-white/10"
                  )}
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {character.image_url ? (
                        <img
                          src={character.image_url}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg text-white truncate">
                        {character.name}
                      </h3>
                      {character.summary && (
                        <p className="text-sm text-slate-400">
                          {character.summary}
                        </p>
                      )}
                      {character.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {character.description}
                        </p>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {selectedId === character.id && (
                      <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Spectator Mode Info */}
      {mode === 'spectate' && (
        <div className="text-center py-8">
          <Eye className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg text-slate-300 mb-2">Spectator Mode</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Watch the campaign unfold without controlling a character.
            You&apos;ll see public information but won&apos;t have a character inventory or personal notes.
          </p>
        </div>
      )}

      {/* Confirm Button */}
      <div className="flex justify-center">
        <button
          onClick={handleClaim}
          disabled={isLoading || (mode === 'select' && !selectedId)}
          className={cn(
            "px-8 py-3 rounded-xl font-display text-lg transition-all",
            "bg-gradient-to-r from-teal-600 to-cyan-600 text-white",
            "hover:from-teal-500 hover:to-cyan-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? 'Joining...' : mode === 'select' ? 'Claim & Enter' : 'Join as Spectator'}
        </button>
      </div>
    </div>
  );
}
