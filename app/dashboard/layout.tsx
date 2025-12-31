import { OnboardingProvider } from '@/components/onboarding'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <OnboardingProvider>{children}</OnboardingProvider>
}
