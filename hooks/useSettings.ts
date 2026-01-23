'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface UserSettings {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme: string;
  reduce_motion: boolean;
  show_getting_started: boolean;
  default_generation_mode: string;
  onboarding: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>, showToast = true) => {
      setIsSaving(true);
      try {
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          if (showToast) {
            toast.success('Settings saved');
          }
          return true;
        } else {
          const error = await res.json();
          toast.error(error.error || 'Failed to save settings');
        }
      } catch (error) {
        console.error('Failed to update settings:', error);
        toast.error('Failed to save settings');
      } finally {
        setIsSaving(false);
      }
      return false;
    },
    []
  );

  const markOnboardingComplete = useCallback(
    async (tasks: string | string[]) => {
      const taskArray = Array.isArray(tasks) ? tasks : [tasks];

      console.log('[Onboarding] markOnboardingComplete called with tasks:', taskArray);
      console.log('[Onboarding] Current settings:', settings);
      console.log('[Onboarding] Current settings.onboarding:', settings?.onboarding);

      if (!settings) {
        console.warn('[Onboarding] Settings is null, cannot mark tasks complete');
        return;
      }

      // Build updated onboarding with ALL tasks at once to avoid race conditions
      const updatedOnboarding = {
        ...(settings.onboarding || {}),
      };

      for (const task of taskArray) {
        updatedOnboarding[task] = true;
      }

      console.log('[Onboarding] Updating onboarding to:', updatedOnboarding);

      const result = await updateSettings({ onboarding: updatedOnboarding }, false);
      console.log('[Onboarding] Update result:', result);
    },
    [settings, updateSettings]
  );

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    markOnboardingComplete,
    refetch: fetchSettings,
  };
}
