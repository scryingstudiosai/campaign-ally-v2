'use client'

import { useState } from 'react'
import { RelationshipDisplay, Relationship } from './relationship-display'
import { AddRelationshipModal } from './add-relationship-modal'

interface EntityRelationshipsSectionProps {
  relationships: Relationship[]
  currentEntityId: string
  currentEntityName: string
  campaignId: string
}

export function EntityRelationshipsSection({
  relationships,
  currentEntityId,
  currentEntityName,
  campaignId,
}: EntityRelationshipsSectionProps): JSX.Element {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <RelationshipDisplay
        relationships={relationships}
        currentEntityId={currentEntityId}
        campaignId={campaignId}
        onAddRelationship={() => setModalOpen(true)}
      />
      <AddRelationshipModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sourceEntityId={currentEntityId}
        sourceEntityName={currentEntityName}
        campaignId={campaignId}
      />
    </>
  )
}
