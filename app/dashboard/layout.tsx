import { OnboardingProvider } from '@/components/onboarding'
import { CommandMenu } from '@/components/command-menu'
import { SettingsProvider } from '@/components/settings'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SettingsProvider>
      <OnboardingProvider>
        {children}
        <CommandMenu />
      </OnboardingProvider>
    </SettingsProvider>
  )
}
