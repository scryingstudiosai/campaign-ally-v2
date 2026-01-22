import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CopilotChat } from '@/components/copilot';
import { Brain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { OnboardingTrigger } from '@/components/onboarding';

interface Props {
  params: { id: string };
}

export default async function CopilotPage({ params }: Props) {
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

        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Brain className="h-7 w-7 text-purple-400" />
            Ask Ally
          </h1>
          <p className="text-zinc-400 mt-1">
            Ask questions about your campaign, explore &quot;what if&quot; scenarios, and get
            intelligent suggestions.
          </p>
        </div>

        <CopilotChat campaignId={campaign.id} campaignName={campaign.name} />

        {/* Mark onboarding task complete */}
        <OnboardingTrigger taskId="ask_ally" />
      </div>
    </div>
  );
}
