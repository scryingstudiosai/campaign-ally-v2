import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { PortalCharacterView } from '@/components/portal/PortalCharacterView';

interface PortalPageProps {
  params: Promise<{ campaignId: string }>;
}

interface CharacterMechanics {
  hp?: { current?: number; max?: number };
  hp_current?: number;
  hp_max?: number;
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

  return (
    <PortalCharacterView
      initialCharacter={character}
      characterEntityId={membership.character_entity_id!}
    />
  );
}
