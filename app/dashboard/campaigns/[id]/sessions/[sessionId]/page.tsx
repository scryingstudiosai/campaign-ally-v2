import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { SessionShell } from '@/components/session/SessionShell';

interface PageProps {
  params: {
    id: string;
    sessionId: string;
  };
}

export default async function SessionPage({ params }: PageProps): Promise<JSX.Element> {
  const supabase = createServerComponentClient({ cookies });

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.sessionId)
    .single();

  if (error || !session) {
    notFound();
  }

  return <SessionShell session={session} campaignId={params.id} />;
}
