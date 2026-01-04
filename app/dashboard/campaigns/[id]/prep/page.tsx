import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SessionPrepPanel } from '@/components/session-prep';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: { id: string };
}

export default async function SessionPrepPage({ params }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!campaign) redirect('/dashboard');

  return (
    <div
      className="min-h-screen text-foreground p-6"
      style={{ backgroundColor: 'var(--ca-bg-base)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/campaigns/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </Link>
        </Button>

        <SessionPrepPanel campaignId={campaign.id} />
      </div>
    </div>
  );
}
