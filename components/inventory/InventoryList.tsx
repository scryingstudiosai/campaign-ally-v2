'use client';

import { useInventory } from '@/hooks/use-inventory';
import { InventoryInstanceWithItem, OwnerType } from '@/types/inventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Coins,
  Scale,
  Sparkles,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Trash2,
  ArrowRightLeft,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InventoryListProps {
  campaignId: string;
  ownerType: OwnerType;
  ownerId: string;
  viewMode?: 'default' | 'compact' | 'shop';
  onTransfer?: (item: InventoryInstanceWithItem) => void;
  onViewDetails?: (item: InventoryInstanceWithItem) => void;
  readOnly?: boolean;
  title?: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-slate-600 text-slate-200',
  uncommon: 'bg-green-800 text-green-200',
  rare: 'bg-blue-800 text-blue-200',
  'very rare': 'bg-purple-800 text-purple-200',
  legendary: 'bg-orange-800 text-orange-200',
  artifact: 'bg-red-800 text-red-200',
};

export function InventoryList({
  campaignId,
  ownerType,
  ownerId,
  viewMode = 'default',
  onTransfer,
  onViewDetails,
  readOnly = false,
  title = 'Inventory',
}: InventoryListProps): JSX.Element {
  const {
    items,
    loading,
    error,
    consumeItem,
    spendCharge,
    updateItem,
    removeItem,
    totalWeight,
    totalValue,
  } = useInventory(campaignId, ownerType, ownerId);

  if (loading) {
    return <InventoryListSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-400 bg-red-900/20 rounded-lg border border-red-800">
        Failed to load inventory: {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Package className="w-5 h-5" />
          {title}
          <span className="text-sm text-slate-400 font-normal">
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
        </h3>
      </div>

      {/* Item List */}
      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No items in inventory</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <InventoryItemRow
              key={item.id}
              item={item}
              viewMode={viewMode}
              readOnly={readOnly}
              onUse={() => consumeItem(item.id)}
              onUseCharge={() => spendCharge(item.id)}
              onEquip={() => updateItem(item.id, { is_equipped: !item.is_equipped })}
              onAttune={() => updateItem(item.id, { is_attuned: !item.is_attuned })}
              onIdentify={() => updateItem(item.id, { is_identified: true })}
              onRemove={() => removeItem(item.id)}
              onTransfer={() => {
                console.log('InventoryList.onTransfer wrapper called for item:', item.id);
                onTransfer?.(item);
              }}
              onViewDetails={() => {
                console.log('InventoryList.onViewDetails wrapper called for item:', item.id);
                onViewDetails?.(item);
              }}
            />
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {items.length > 0 && (
        <div className="flex items-center justify-end gap-4 pt-3 border-t border-slate-800 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <Scale className="w-4 h-4" />
            <span>{totalWeight.toFixed(1)} lb.</span>
          </div>
          {viewMode === 'shop' || totalValue > 0 ? (
            <div className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span>{totalValue.toLocaleString()} gp</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Individual item row component
interface InventoryItemRowProps {
  item: InventoryInstanceWithItem;
  viewMode: 'default' | 'compact' | 'shop';
  readOnly: boolean;
  onUse: () => void;
  onUseCharge: () => void;
  onEquip: () => void;
  onAttune: () => void;
  onIdentify: () => void;
  onRemove: () => void;
  onTransfer: () => void;
  onViewDetails: () => void;
}

function InventoryItemRow({
  item,
  viewMode,
  readOnly,
  onUse,
  onUseCharge,
  onEquip,
  onAttune,
  onIdentify,
  onRemove,
  onTransfer,
  onViewDetails,
}: InventoryItemRowProps): JSX.Element {
  // Resolve item data from either SRD or custom entity
  const itemData = item.srd_item || item.custom_entity;
  const name = itemData?.name || 'Unknown Item';
  const rarity = item.srd_item?.rarity?.toLowerCase() || 'common';
  const itemType = item.srd_item?.item_type || item.custom_entity?.sub_type || 'item';
  const mechanics = item.srd_item?.mechanics || item.custom_entity?.mechanics || {};
  const weight = (item.srd_item?.weight || (mechanics as Record<string, unknown>).weight) as
    | number
    | undefined;
  const value = (item.value_override ??
    item.srd_item?.value_gp ??
    (mechanics as Record<string, unknown>).value_gp) as number | undefined;
  const isSrd = !!item.srd_item_id;
  const isConsumable =
    itemType?.toLowerCase().includes('potion') || itemType?.toLowerCase().includes('scroll');
  const hasCharges = item.max_charges !== null;
  const requiresAttunement = Boolean((mechanics as Record<string, unknown>).requires_attunement);

  return (
    <div
      className={`
        group flex items-center gap-3 p-3 rounded-lg border transition-colors
        ${
          item.is_equipped
            ? 'bg-teal-900/20 border-teal-700/50'
            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
        }
      `}
    >
      {/* Quantity Badge */}
      {item.quantity > 1 && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-300">
          {item.quantity}
        </div>
      )}

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Name (blur if unidentified) */}
          <span
            className={`font-medium text-slate-200 cursor-pointer hover:text-slate-100 ${!item.is_identified ? 'blur-sm select-none' : ''}`}
            onClick={onViewDetails}
            role="button"
          >
            {item.is_identified ? name : 'Unidentified Item'}
          </span>

          {/* Source Badge */}
          <Badge
            variant="outline"
            className={`text-[10px] ${isSrd ? 'border-green-700 text-green-400' : 'border-purple-700 text-purple-400'}`}
          >
            {isSrd ? 'SRD' : 'Custom'}
          </Badge>

          {/* Rarity Badge */}
          {item.is_identified && rarity !== 'common' && (
            <Badge className={`text-[10px] ${RARITY_COLORS[rarity] || RARITY_COLORS.common}`}>
              {rarity}
            </Badge>
          )}

          {/* Status Indicators */}
          {item.is_equipped && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Shield className="w-4 h-4 text-teal-400" />
                </TooltipTrigger>
                <TooltipContent>Equipped</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {item.is_attuned && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </TooltipTrigger>
                <TooltipContent>Attuned</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!item.is_identified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <EyeOff className="w-4 h-4 text-slate-500" />
                </TooltipTrigger>
                <TooltipContent>Unidentified</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Secondary Info */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
          <span className="capitalize">{itemType}</span>
          {weight != null && (
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3" />
              {weight} lb.
            </span>
          )}
          {viewMode === 'shop' && value != null && (
            <span className="flex items-center gap-1 text-yellow-500">
              <Coins className="w-3 h-3" />
              {value} gp
            </span>
          )}
          {hasCharges && (
            <span className="flex items-center gap-1 text-blue-400">
              <Zap className="w-3 h-3" />
              {item.charges}/{item.max_charges}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Quick Use Button (for consumables) */}
          {isConsumable && item.is_identified && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUse}
              className="text-green-400 hover:text-green-300 hover:bg-green-900/30"
            >
              Use
            </Button>
          )}

          {/* Use Charge Button */}
          {hasCharges && item.charges != null && item.charges > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUseCharge}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
            >
              <Zap className="w-4 h-4" />
            </Button>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
              <DropdownMenuItem onSelect={onViewDetails} className="text-slate-200">
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>

              {!item.is_identified && (
                <DropdownMenuItem onSelect={onIdentify} className="text-slate-200">
                  <Eye className="w-4 h-4 mr-2" />
                  Identify
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onSelect={onEquip} className="text-slate-200">
                <Shield className="w-4 h-4 mr-2" />
                {item.is_equipped ? 'Unequip' : 'Equip'}
              </DropdownMenuItem>

              {requiresAttunement && (
                <DropdownMenuItem onSelect={onAttune} className="text-slate-200">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {item.is_attuned ? 'Break Attunement' : 'Attune'}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-slate-700" />

              <DropdownMenuItem onSelect={onTransfer} className="text-slate-200">
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transfer
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={onRemove} className="text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// Loading skeleton
function InventoryListSkeleton(): JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-32" />
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}
