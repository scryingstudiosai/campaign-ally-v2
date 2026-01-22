'use client';

import Link from 'next/link';
import { CampaignCard } from '@/components/campaigns/campaign-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem, HoverLift, FadeIn } from '@/components/ui/motion';
import {
  GettingStartedChecklist,
  GettingStartedRestoreButton,
} from '@/components/onboarding';
import { useSettingsContext } from '@/components/settings';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  game_system: string | null;
  created_at: string;
}

interface DashboardClientProps {
  campaigns: Campaign[] | null;
}

export function DashboardClient({ campaigns }: DashboardClientProps) {
  const { settings, updateSettings } = useSettingsContext();

  // Get first campaign ID for checklist links
  const firstCampaignId = campaigns?.[0]?.id;

  const handleHideChecklist = async () => {
    await updateSettings({ show_getting_started: false }, false);
  };

  const handleShowChecklist = async () => {
    await updateSettings({ show_getting_started: true }, false);
  };

  return (
    <PageTransition>
      {/* Getting Started Checklist */}
      {settings?.show_getting_started && (
        <FadeIn delay={0.05}>
          <div className="mb-8">
            <GettingStartedChecklist
              campaignId={firstCampaignId}
              onHide={handleHideChecklist}
            />
          </div>
        </FadeIn>
      )}

      <div className="flex justify-between items-center mb-6">
        <FadeIn delay={0.1}>
          <h2 className="text-xl font-semibold">Your Campaigns</h2>
        </FadeIn>
        <FadeIn delay={0.2}>
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
        </FadeIn>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" delay={0.2}>
          {campaigns.map((campaign) => (
            <StaggerItem key={campaign.id}>
              <HoverLift>
                <CampaignCard campaign={campaign} />
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <FadeIn delay={0.3}>
          <div className="text-center py-12 border border-dashed border-muted rounded-lg">
            <p className="text-muted-foreground mb-4">No campaigns yet.</p>
            <Button asChild>
              <Link href="/dashboard/campaigns/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </Link>
            </Button>
          </div>
        </FadeIn>
      )}

      {/* Restore button (shows when checklist is hidden) */}
      {settings && !settings.show_getting_started && (
        <GettingStartedRestoreButton onClick={handleShowChecklist} />
      )}
    </PageTransition>
  );
}
