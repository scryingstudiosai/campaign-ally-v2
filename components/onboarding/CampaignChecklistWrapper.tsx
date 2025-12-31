'use client'

import { useOnboarding } from '@/hooks/useOnboarding'
import { CampaignChecklist } from './CampaignChecklist'

interface CampaignChecklistWrapperProps {
  campaignId: string
}

export function CampaignChecklistWrapper({ campaignId }: CampaignChecklistWrapperProps) {
  const { data, isLoading, getCompletionPercentage } = useOnboarding()

  // Don't render if loading or if checklist is complete
  if (isLoading || !data) return null

  const percentage = getCompletionPercentage()

  // Hide once complete
  if (percentage === 100) return null

  return <CampaignChecklist campaignId={campaignId} />
}
