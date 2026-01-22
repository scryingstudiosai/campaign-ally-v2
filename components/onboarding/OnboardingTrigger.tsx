'use client';

import { useEffect } from 'react';
import { useSettingsContextOptional } from '@/components/settings';

interface OnboardingTriggerProps {
  taskId: string;
}

/**
 * Client component that triggers an onboarding task completion when mounted.
 * Use this in server components to mark onboarding tasks as complete.
 *
 * Example:
 * <OnboardingTrigger taskId="explore_codex" />
 */
export function OnboardingTrigger({ taskId }: OnboardingTriggerProps) {
  const settings = useSettingsContextOptional();

  useEffect(() => {
    // Only trigger if we have settings context and the task isn't already complete
    if (settings && settings.settings?.onboarding?.[taskId] !== true) {
      settings.markOnboardingComplete(taskId);
    }
  }, [settings, taskId]);

  // This component doesn't render anything
  return null;
}
