export type OwnerType = 'npc' | 'player' | 'location' | 'container' | 'loot_pile' | 'party' | 'shop' | 'creature';

export interface InventoryInstance {
  id: string;
  campaign_id: string;

  // Item reference (one will be set)
  srd_item_id: string | null;
  custom_entity_id: string | null;

  // Owner
  owner_type: OwnerType;
  owner_id: string;

  // State
  quantity: number;
  charges: number | null;
  max_charges: number | null;
  is_identified: boolean;
  is_attuned: boolean;
  is_equipped: boolean;

  // Context
  acquired_from: string | null;
  notes: string | null;
  value_override: number | null;
  sort_order: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Extended type with resolved item data for display
export interface InventoryInstanceWithItem extends InventoryInstance {
  // Populated from join
  srd_item?: {
    id: string;
    name: string;
    item_type: string;
    rarity: string;
    description: string;
    value_gp: number | null;
    weight: number | null;
    mechanics: Record<string, unknown>;
  };
  custom_entity?: {
    id: string;
    name: string;
    sub_type: string;
    description: string;
    mechanics: Record<string, unknown>;
  };
}

// For creating/transferring items
export interface AddToInventoryInput {
  campaign_id: string;
  srd_item_id?: string;
  custom_entity_id?: string;
  owner_type: OwnerType;
  owner_id: string;
  quantity?: number;
  acquired_from?: string;
  notes?: string;
}

export interface TransferItemInput {
  instance_id: string;
  new_owner_type: OwnerType;
  new_owner_id: string;
  quantity?: number; // For partial transfers (split stack)
}
