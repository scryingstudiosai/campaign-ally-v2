'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function CreateCharacterPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.campaignId as string;

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!campaignId) return;
    checkAuthAndRedirect();
  }, [campaignId]);

  async function checkAuthAndRedirect() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=/portal/${campaignId}/create-character`);
      return;
    }

    // Verify user is a member of this campaign
    const { data: membership } = await supabase
      .from('campaign_members')
      .select('id, character_entity_id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      router.push('/');
      return;
    }

    // If they already have a character, redirect to portal
    if (membership.character_entity_id) {
      router.push(`/portal/${campaignId}`);
      return;
    }

    // Redirect to existing forge with playerMode flag
    // The forge will check this flag to hide DM-only fields
    router.push(`/dashboard/campaigns/${campaignId}/forge/player?playerMode=true&returnTo=/portal/${campaignId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
    </div>
  );
}
