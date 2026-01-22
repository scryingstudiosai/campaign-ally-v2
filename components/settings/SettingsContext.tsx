'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSettings, UserSettings } from '@/hooks/useSettings';

interface SettingsContextValue {
  settings: UserSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  updateSettings: (updates: Partial<UserSettings>, showToast?: boolean) => Promise<boolean>;
  markOnboardingComplete: (taskId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const settingsHook = useSettings();

  return (
    <SettingsContext.Provider value={settingsHook}>{children}</SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}

// Optional hook that doesn't throw if outside provider (for gradual adoption)
export function useSettingsContextOptional() {
  return useContext(SettingsContext);
}
