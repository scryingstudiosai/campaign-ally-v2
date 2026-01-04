'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, FileText, Grid3X3, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationMapTab } from './map/location-map-tab';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface AtlasMap {
  id: string;
  name: string;
  image_url: string;
  map_type?: string;
  style?: string;
  is_primary?: boolean;
  created_at: string;
}

interface LocationDetailWrapperProps {
  campaignId: string;
  locationId: string;
  locationName?: string;
  mapImageUrl?: string;
  isLocation: boolean;
  children: React.ReactNode;
}

export function LocationDetailWrapper({
  campaignId,
  locationId,
  locationName,
  mapImageUrl,
  isLocation,
  children,
}: LocationDetailWrapperProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'atlas'>('details');
  const [atlasMaps, setAtlasMaps] = useState<AtlasMap[]>([]);
  const [loadingMaps, setLoadingMaps] = useState(false);

  // Fullscreen modal state
  const [selectedMap, setSelectedMap] = useState<AtlasMap | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);

  // Load atlas maps when switching to atlas tab
  useEffect(() => {
    if (isLocation && activeTab === 'atlas') {
      loadAtlasMaps();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, locationId, isLocation]);

  const loadAtlasMaps = async () => {
    setLoadingMaps(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('atlas_maps')
        .select('*')
        .eq('linked_entity_id', locationId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load atlas maps:', error);
      } else {
        setAtlasMaps(data || []);
      }
    } catch (error) {
      console.error('Failed to load atlas maps:', error);
    } finally {
      setLoadingMaps(false);
    }
  };

  // For non-locations, just render children directly
  if (!isLocation) {
    return <>{children}</>;
  }

  // Get the effective map URL - prefer atlas_maps primary, fallback to entity.soul.map_url
  const effectiveMapUrl = atlasMaps.find(m => m.is_primary)?.image_url || mapImageUrl;

  const handleImageUpdate = async (url: string) => {
    // Update the entity's soul.map_url field
    const response = await fetch(`/api/entities/${locationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        soul: {
          map_url: url,
        },
      }),
    });

    if (response.ok) {
      // Reload atlas maps to get fresh data
      await loadAtlasMaps();
      // Refresh the page to show the new map
      router.refresh();
    }
  };

  const handleEntityClick = (entityId: string) => {
    router.push(`/dashboard/campaigns/${campaignId}/memory/${entityId}`);
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-stone-800">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
              activeTab === 'details'
                ? 'border-teal-500 text-teal-500'
                : 'border-transparent text-stone-400 hover:text-white'
            )}
          >
            <FileText className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('atlas')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
              activeTab === 'atlas'
                ? 'border-teal-500 text-teal-500'
                : 'border-transparent text-stone-400 hover:text-white'
            )}
          >
            <MapPin className="w-4 h-4" />
            Atlas
            {atlasMaps.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-teal-500/20 text-teal-400">
                {atlasMaps.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' ? (
        <>{children}</>
      ) : (
        <>
          {/* Show atlas maps gallery if we have maps */}
          {atlasMaps.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-stone-400 mb-3">Saved Maps</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {atlasMaps.map((map) => (
                  <div
                    key={map.id}
                    onClick={() => setSelectedMap(map)}
                    className={cn(
                      'relative aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg',
                      map.is_primary
                        ? 'border-teal-500 ring-1 ring-teal-500/50'
                        : 'border-stone-700 hover:border-stone-600'
                    )}
                  >
                    <img
                      src={map.image_url}
                      alt={map.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay with info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs text-white font-medium truncate">{map.name}</p>
                        {map.map_type && (
                          <p className="text-[10px] text-stone-400 capitalize">{map.map_type}</p>
                        )}
                      </div>
                    </div>
                    {/* Primary badge */}
                    {map.is_primary && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-teal-500 text-white text-[10px] rounded font-medium">
                        Primary
                      </div>
                    )}
                    {/* Fullscreen icon */}
                    <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive map component for adding markers etc */}
          <LocationMapTab
            campaignId={campaignId}
            locationId={locationId}
            locationName={locationName}
            imageUrl={effectiveMapUrl}
            onImageUpdate={handleImageUpdate}
            onEntityClick={handleEntityClick}
          />
        </>
      )}

      {/* Fullscreen Map Modal */}
      <Dialog open={!!selectedMap} onOpenChange={() => setSelectedMap(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-stone-950 border-stone-800 overflow-hidden">
          {selectedMap && (
            <>
              {/* Header with controls */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedMap.name}</h2>
                  {selectedMap.map_type && (
                    <p className="text-xs text-stone-400 capitalize">{selectedMap.map_type} • {selectedMap.style}</p>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  {/* Grid Controls */}
                  <div className="flex items-center gap-3 bg-black/40 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="grid-toggle-modal"
                        checked={showGrid}
                        onCheckedChange={setShowGrid}
                      />
                      <Label htmlFor="grid-toggle-modal" className="text-sm text-white flex items-center gap-1.5 cursor-pointer">
                        <Grid3X3 className="h-4 w-4" />
                        Grid
                      </Label>
                    </div>

                    {showGrid && (
                      <div className="flex items-center gap-2 pl-2 border-l border-stone-700">
                        <Label className="text-xs text-stone-400">Size:</Label>
                        <Slider
                          value={[gridSize]}
                          onValueChange={(values: number[]) => setGridSize(values[0])}
                          min={20}
                          max={100}
                          step={5}
                          className="w-20"
                        />
                        <span className="text-xs text-stone-500 w-10">{gridSize}px</span>
                      </div>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setSelectedMap(null)}
                    className="p-2 bg-black/40 hover:bg-black/60 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Map Image with Grid Overlay */}
              <div className="w-full h-full overflow-auto flex items-center justify-center bg-stone-900">
                <div className="relative">
                  <img
                    src={selectedMap.image_url}
                    alt={selectedMap.name}
                    className="max-w-full max-h-[95vh] object-contain"
                  />

                  {/* CSS Grid Overlay */}
                  {showGrid && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)
                        `,
                        backgroundSize: `${gridSize}px ${gridSize}px`,
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
