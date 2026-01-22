'use client';

import { useSettingsContext } from '@/components/settings/SettingsContext';
import { GettingStartedChecklist, GettingStartedRestoreButton } from './GettingStartedChecklist';

interface CampaignGettingStartedProps {
  campaignId: string;
}

export function CampaignGettingStarted({ campaignId }: CampaignGettingStartedProps) {
  const { settings, updateSettings } = useSettingsContext();

  const handleHideChecklist = async () => {
    await updateSettings({ show_getting_started: false }, false);
  };

  const handleShowChecklist = async () => {
    await updateSettings({ show_getting_started: true }, false);
  };

  // Don't render until settings are loaded
  if (!settings) {
    return null;
  }

  // Check if all tasks are complete (both phases)
  const onboarding = settings.onboarding || {};
  const allPhase1Tasks = [
    'create_campaign', 'create_npc', 'create_location', 'create_faction',
    'create_quest', 'create_event', 'create_deity', 'use_ai_generation',
    'explore_codex', 'view_timeline', 'create_relationship', 'view_spiderweb', 'ask_ally',
  ];
  const allPhase2Tasks = [
    'create_session', 'use_session_prep', 'run_session',
    'invite_player', 'export_campaign', 'push_rumor',
  ];

  const phase1Complete = allPhase1Tasks.every((t) => onboarding[t]);
  const phase2Complete = allPhase2Tasks.every((t) => onboarding[t]);
  const allComplete = phase1Complete && phase2Complete;

  // Hide completely once everything is done
  if (allComplete) {
    return null;
  }

  return (
    <>
      {settings.show_getting_started ? (
        <GettingStartedChecklist
          campaignId={campaignId}
          onHide={handleHideChecklist}
        />
      ) : (
        <GettingStartedRestoreButton onClick={handleShowChecklist} />
      )}
    </>
  );
}
