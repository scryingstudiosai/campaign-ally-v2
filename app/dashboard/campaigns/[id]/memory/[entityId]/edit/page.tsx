import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  NpcEditor,
  LocationEditor,
  CreatureEditor,
  QuestEditor,
  ItemEditor,
  FactionEditor,
  EncounterEditor,
  GenericEditor,
} from '@/components/entity/edit';

interface PageProps {
  params: { id: string; entityId: string };
}

export default async function EntityEditPage({ params }: PageProps): Promise<JSX.Element> {
  const { id: campaignId, entityId } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify campaign belongs to user
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  // Fetch entity
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .eq('campaign_id', campaignId)
    .is('deleted_at', null)
    .single();

  if (entityError || !entity) {
    notFound();
  }

  // Common props for all editors
  const commonProps = {
    entity,
    campaignId,
  };

  // Render the appropriate editor based on entity type
  switch (entity.entity_type) {
    case 'npc':
      return <NpcEditor {...commonProps} />;
    case 'location':
      return <LocationEditor {...commonProps} />;
    case 'creature':
      return <CreatureEditor {...commonProps} />;
    case 'quest':
      return <QuestEditor {...commonProps} />;
    case 'item':
      return <ItemEditor {...commonProps} />;
    case 'faction':
      return <FactionEditor {...commonProps} />;
    case 'encounter':
      return <EncounterEditor {...commonProps} />;
    default:
      return <GenericEditor {...commonProps} />;
  }
}
