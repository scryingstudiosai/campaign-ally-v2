'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ExportModal } from './export-modal'

interface CampaignActionsContextValue {
  openExportModal: () => void
  openInviteModal: () => void
}

const CampaignActionsContext = createContext<CampaignActionsContextValue | null>(null)

interface CampaignActionsProviderProps {
  campaignId: string
  campaignName: string
  children: ReactNode
}

export function CampaignActionsProvider({
  campaignId,
  campaignName,
  children,
}: CampaignActionsProviderProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const openExportModal = useCallback(() => {
    setExportModalOpen(true)
  }, [])

  const openInviteModal = useCallback(() => {
    // Navigate to invite page
    window.location.href = `/dashboard/campaigns/${campaignId}/invite`
  }, [campaignId])

  return (
    <CampaignActionsContext.Provider value={{ openExportModal, openInviteModal }}>
      {children}
      <ExportModal
        campaignId={campaignId}
        campaignName={campaignName}
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </CampaignActionsContext.Provider>
  )
}

export function useCampaignActions() {
  const context = useContext(CampaignActionsContext)
  if (!context) {
    // Return no-op functions if not in provider (e.g., on dashboard)
    return {
      openExportModal: () => {},
      openInviteModal: () => {},
    }
  }
  return context
}
