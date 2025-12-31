'use client';

import { useState, useRef, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Move,
  X,
  Search,
  Home,
  ShoppingBag,
  Beer,
  Church,
  Castle,
  Star,
  Skull,
  Users,
  MapPinIcon,
  Package,
  Scroll,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  soul?: Record<string, unknown>;
}

interface MapMarker {
  id: string;
  parent_location_id: string;
  linked_entity_id: string | null;
  linked_entity?: Entity;
  label: string | null;
  description: string | null;
  x_percent: number;
  y_percent: number;
  color: string;
  icon_type: string;
}

interface InteractiveMapProps {
  campaignId: string;
  locationId: string;
  imageUrl: string;
  markers: MapMarker[];
  entities: Entity[];
  onMarkerCreate: (marker: Partial<MapMarker>) => Promise<void>;
  onMarkerUpdate: (markerId: string, updates: Partial<MapMarker>) => Promise<void>;
  onMarkerDelete: (markerId: string) => Promise<void>;
  onEntityClick?: (entityId: string) => void;
  editable?: boolean;
}

const markerColors: Record<string, string> = {
  teal: 'bg-teal-500 border-teal-400 shadow-teal-500/50',
  red: 'bg-red-500 border-red-400 shadow-red-500/50',
  amber: 'bg-amber-500 border-amber-400 shadow-amber-500/50',
  purple: 'bg-purple-500 border-purple-400 shadow-purple-500/50',
  blue: 'bg-blue-500 border-blue-400 shadow-blue-500/50',
  green: 'bg-green-500 border-green-400 shadow-green-500/50',
  orange: 'bg-orange-500 border-orange-400 shadow-orange-500/50',
};

const markerTailColors: Record<string, string> = {
  teal: 'border-t-teal-500',
  red: 'border-t-red-500',
  amber: 'border-t-amber-500',
  purple: 'border-t-purple-500',
  blue: 'border-t-blue-500',
  green: 'border-t-green-500',
  orange: 'border-t-orange-500',
};

const markerIcons: Record<string, React.ElementType> = {
  default: MapPin,
  star: Star,
  skull: Skull,
  home: Home,
  shop: ShoppingBag,
  tavern: Beer,
  temple: Church,
  castle: Castle,
};

const entityTypeIcons: Record<string, React.ElementType> = {
  npc: Users,
  location: MapPinIcon,
  item: Package,
  quest: Scroll,
  faction: Shield,
  creature: Skull,
};

const entityTypeColors: Record<string, string> = {
  npc: 'blue',
  location: 'green',
  item: 'amber',
  quest: 'purple',
  faction: 'red',
  creature: 'orange',
};

export function InteractiveMap({
  imageUrl,
  markers,
  entities,
  onMarkerCreate,
  onMarkerUpdate,
  onMarkerDelete,
  onEntityClick,
  editable = true,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'view' | 'add' | 'drag'>('view');
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [draggingMarker, setDraggingMarker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEntityPicker, setShowEntityPicker] = useState(false);

  // Handle map click for adding markers
  const handleMapClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== 'add' || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setPendingPosition({ x, y });
      setShowEntityPicker(true);
    },
    [mode]
  );

  // Handle marker drag
  const handleMarkerDrag = useCallback(
    (e: React.MouseEvent, markerId: string) => {
      if (mode !== 'drag' || !containerRef.current) return;

      e.preventDefault();
      setDraggingMarker(markerId);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));

        // Update marker position optimistically (visual feedback)
        const markerEl = document.getElementById(`marker-${markerId}`);
        if (markerEl) {
          markerEl.style.left = `${x}%`;
          markerEl.style.top = `${y}%`;
        }
      };

      const handleMouseUp = async (upEvent: MouseEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((upEvent.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((upEvent.clientY - rect.top) / rect.height) * 100));

        await onMarkerUpdate(markerId, { x_percent: x, y_percent: y });
        setDraggingMarker(null);

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [mode, onMarkerUpdate]
  );

  // Create marker with linked entity
  const handleEntitySelect = async (entity: Entity | null, customLabel?: string) => {
    if (!pendingPosition) return;

    await onMarkerCreate({
      linked_entity_id: entity?.id || null,
      label: customLabel || null,
      x_percent: pendingPosition.x,
      y_percent: pendingPosition.y,
      color: entity ? entityTypeColors[entity.entity_type] || 'teal' : 'teal',
      icon_type: 'default',
    });

    setPendingPosition(null);
    setShowEntityPicker(false);
    setSearchQuery('');
  };

  // Filter entities for picker
  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'view' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('view')}
          >
            View
          </Button>
          <Button
            variant={mode === 'add' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('add')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Pin
          </Button>
          <Button
            variant={mode === 'drag' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('drag')}
          >
            <Move className="w-4 h-4 mr-1" />
            Move Pins
          </Button>

          {mode !== 'view' && (
            <Badge variant="outline" className="ml-2 text-xs">
              {mode === 'add' ? 'Click map to add pin' : 'Drag pins to reposition'}
            </Badge>
          )}
        </div>
      )}

      {/* Map Container */}
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden rounded-lg border border-stone-700 bg-stone-900',
          mode === 'add' && 'cursor-crosshair',
          mode === 'drag' && 'cursor-move'
        )}
        onClick={handleMapClick}
      >
        {/* Map Image */}
        <img src={imageUrl} alt="Map" className="w-full h-auto" draggable={false} />

        {/* Markers */}
        {markers.map((marker) => {
          const Icon = markerIcons[marker.icon_type] || MapPin;
          const EntityIcon = marker.linked_entity
            ? entityTypeIcons[marker.linked_entity.entity_type]
            : null;
          const colorClass = markerColors[marker.color] || markerColors.teal;
          const tailColorClass = markerTailColors[marker.color] || markerTailColors.teal;
          const isHovered = hoveredMarker === marker.id;
          const isDragging = draggingMarker === marker.id;

          const displayName = marker.linked_entity?.name || marker.label || 'Unmarked';

          return (
            <div
              key={marker.id}
              id={`marker-${marker.id}`}
              className="absolute transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${marker.x_percent}%`,
                top: `${marker.y_percent}%`,
              }}
              onMouseEnter={() => setHoveredMarker(marker.id)}
              onMouseLeave={() => setHoveredMarker(null)}
              onMouseDown={(e) => mode === 'drag' && handleMarkerDrag(e, marker.id)}
            >
              {/* Pin */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === 'view' && marker.linked_entity_id) {
                    onEntityClick?.(marker.linked_entity_id);
                  }
                }}
                className={cn(
                  'relative cursor-pointer transition-all duration-200',
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center',
                  'shadow-lg',
                  colorClass,
                  isHovered && 'scale-125 z-10',
                  isDragging && 'scale-110 opacity-70',
                  mode === 'view' && marker.linked_entity_id && 'hover:scale-110'
                )}
              >
                {EntityIcon ? (
                  <EntityIcon className="w-4 h-4 text-white" />
                ) : (
                  <Icon className="w-4 h-4 text-white" />
                )}

                {/* Delete button on hover in drag mode */}
                {mode === 'drag' && isHovered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerDelete(marker.id);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>

              {/* Pin tail */}
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 top-full w-0 h-0',
                  'border-l-[6px] border-r-[6px] border-t-[8px]',
                  'border-l-transparent border-r-transparent',
                  tailColorClass
                )}
              />

              {/* Tooltip */}
              {isHovered && mode === 'view' && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap z-20">
                  <div className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 shadow-xl">
                    <p className="font-medium text-white text-sm">{displayName}</p>
                    {marker.linked_entity && (
                      <p className="text-xs text-stone-400 capitalize">
                        {marker.linked_entity.entity_type}
                      </p>
                    )}
                    {marker.description && (
                      <p className="text-xs text-stone-400 mt-1 max-w-48">{marker.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Pending marker position */}
        {pendingPosition && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${pendingPosition.x}%`,
              top: `${pendingPosition.y}%`,
            }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-teal-500 bg-teal-500/20 animate-pulse" />
          </div>
        )}
      </div>

      {/* Entity Picker Modal */}
      {showEntityPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-stone-900 rounded-xl border border-stone-700 w-full max-w-md mx-4">
            <div className="p-4 border-b border-stone-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Link Entity to Pin</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEntityPicker(false);
                    setPendingPosition(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-stone-800 border-stone-700"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-64 overflow-auto p-2">
              {/* Custom label option */}
              <button
                onClick={() => {
                  const label = prompt('Enter marker label:');
                  if (label) handleEntitySelect(null, label);
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-stone-800 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-stone-400" />
                </div>
                <div>
                  <p className="text-sm text-stone-300">Custom Label</p>
                  <p className="text-xs text-stone-500">Add marker without linking</p>
                </div>
              </button>

              {/* Entity list */}
              {filteredEntities.map((entity) => {
                const Icon = entityTypeIcons[entity.entity_type] || MapPin;
                return (
                  <button
                    key={entity.id}
                    onClick={() => handleEntitySelect(entity)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-stone-800 transition-colors text-left"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        entity.entity_type === 'npc' && 'bg-blue-500/20',
                        entity.entity_type === 'location' && 'bg-green-500/20',
                        entity.entity_type === 'item' && 'bg-amber-500/20',
                        entity.entity_type === 'faction' && 'bg-red-500/20',
                        entity.entity_type === 'quest' && 'bg-purple-500/20',
                        entity.entity_type === 'creature' && 'bg-orange-500/20'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          entity.entity_type === 'npc' && 'text-blue-400',
                          entity.entity_type === 'location' && 'text-green-400',
                          entity.entity_type === 'item' && 'text-amber-400',
                          entity.entity_type === 'faction' && 'text-red-400',
                          entity.entity_type === 'quest' && 'text-purple-400',
                          entity.entity_type === 'creature' && 'text-orange-400'
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-white">{entity.name}</p>
                      <p className="text-xs text-stone-500 capitalize">{entity.entity_type}</p>
                    </div>
                  </button>
                );
              })}

              {filteredEntities.length === 0 && searchQuery && (
                <p className="text-center text-stone-500 py-4 text-sm">No entities found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-stone-400">
        <span className="font-medium text-stone-300">Pin Types:</span>
        {Object.entries(entityTypeIcons).map(([type, Icon]) => (
          <div key={type} className="flex items-center gap-1 capitalize">
            <Icon className="w-3 h-3" />
            {type}
          </div>
        ))}
      </div>
    </div>
  );
}
