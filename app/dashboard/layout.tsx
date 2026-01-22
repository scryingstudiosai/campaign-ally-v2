import { OnboardingProvider } from '@/components/onboarding'
import { CommandMenu } from '@/components/command-menu'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <OnboardingProvider>
      {children}
      <CommandMenu />
    </OnboardingProvider>
  )
}
