'use client';

import { InventoryList } from './InventoryList';
import { OwnerType } from '@/types/inventory';

interface EntityInventorySectionProps {
  campaignId: string;
  entityId: string;
  entityType: string;
  subType?: string;
}

export function EntityInventorySection({
  campaignId,
  entityId,
  entityType,
  subType,
}: EntityInventorySectionProps): JSX.Element | null {
  // Only show inventory for entity types that can hold items
  const canHoldItems = ['npc', 'player', 'location'].includes(entityType);

  if (!canHoldItems) {
    return null;
  }

  // Determine view mode - shops show prices
  const viewMode = subType === 'shop' ? 'shop' : 'default';

  return (
    <div className="ca-panel p-4">
      <InventoryList
        campaignId={campaignId}
        ownerType={entityType as OwnerType}
        ownerId={entityId}
        viewMode={viewMode}
        onViewDetails={(item) => {
          // TODO: Open item detail modal/popover
          console.log('View item:', item);
        }}
        onTransfer={(item) => {
          // TODO: Open transfer dialog
          console.log('Transfer item:', item);
        }}
      />
    </div>
  );
}
