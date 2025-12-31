'use client'

import { useEffect, useState } from 'react'
import { useOnboarding } from '@/hooks/useOnboarding'
import { SetupWizard } from './SetupWizard'
import { HelpPanel } from './HelpPanel'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingProviderProps {
  children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { needsWizard, isLoading } = useOnboarding()
  const [showWizard, setShowWizard] = useState(false)

  // Show wizard for new users
  useEffect(() => {
    if (!isLoading && needsWizard) {
      setShowWizard(true)
    }
  }, [isLoading, needsWizard])

  const handleWizardComplete = () => {
    setShowWizard(false)
  }

  return (
    <>
      {children}

      {/* Setup Wizard Modal */}
      <SetupWizard open={showWizard} onComplete={handleWizardComplete} />

      {/* Floating Help Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <HelpPanel
          trigger={
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-slate-900 border-slate-700 hover:border-teal-500/50 hover:bg-slate-800 shadow-lg"
            >
              <HelpCircle className="w-5 h-5 text-slate-400" />
            </Button>
          }
        />
      </div>
    </>
  )
}
