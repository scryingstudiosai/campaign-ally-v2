'use client';

import { useState, useEffect } from 'react';
import { Upload, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InteractiveMap } from './interactive-map';

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

interface LocationMapTabProps {
  campaignId: string;
  locationId: string;
  imageUrl?: string;
  onImageUpdate: (url: string) => Promise<void>;
  onEntityClick?: (entityId: string) => void;
}

export function LocationMapTab({
  campaignId,
  locationId,
  imageUrl,
  onImageUpdate,
  onEntityClick,
}: LocationMapTabProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Fetch markers and entities
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [markersRes, entitiesRes] = await Promise.all([
          fetch(`/api/campaigns/${campaignId}/locations/${locationId}/markers`),
          fetch(`/api/campaigns/${campaignId}/entities`),
        ]);

        if (markersRes.ok) {
          const markersData = await markersRes.json();
          setMarkers(markersData);
        }

        if (entitiesRes.ok) {
          const entitiesData = await entitiesRes.json();
          setEntities(entitiesData);
        }
      } catch (error) {
        console.error('Failed to fetch map data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (imageUrl) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [campaignId, locationId, imageUrl]);

  // Marker handlers
  const handleMarkerCreate = async (markerData: Partial<MapMarker>) => {
    const response = await fetch(
      `/api/campaigns/${campaignId}/locations/${locationId}/markers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedEntityId: markerData.linked_entity_id,
          label: markerData.label,
          xPercent: markerData.x_percent,
          yPercent: markerData.y_percent,
          color: markerData.color,
          iconType: markerData.icon_type,
        }),
      }
    );

    if (response.ok) {
      const newMarker = await response.json();
      setMarkers((prev) => [...prev, newMarker]);
    }
  };

  const handleMarkerUpdate = async (markerId: string, updates: Partial<MapMarker>) => {
    const response = await fetch(
      `/api/campaigns/${campaignId}/locations/${locationId}/markers/${markerId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xPercent: updates.x_percent,
          yPercent: updates.y_percent,
          color: updates.color,
          iconType: updates.icon_type,
          label: updates.label,
          description: updates.description,
          linkedEntityId: updates.linked_entity_id,
        }),
      }
    );

    if (response.ok) {
      const updated = await response.json();
      setMarkers((prev) => prev.map((m) => (m.id === markerId ? { ...m, ...updated } : m)));
    }
  };

  const handleMarkerDelete = async (markerId: string) => {
    const response = await fetch(
      `/api/campaigns/${campaignId}/locations/${locationId}/markers/${markerId}`,
      { method: 'DELETE' }
    );

    if (response.ok) {
      setMarkers((prev) => prev.filter((m) => m.id !== markerId));
    }
  };

  const handleImageSubmit = async () => {
    if (newImageUrl.trim()) {
      await onImageUpdate(newImageUrl.trim());
      setShowUrlInput(false);
      setNewImageUrl('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  // No map image yet
  if (!imageUrl) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-stone-800 flex items-center justify-center">
          <Image className="w-8 h-8 text-stone-500" />
        </div>
        <div>
          <h3 className="font-medium text-white">No Map Image</h3>
          <p className="text-sm text-stone-400 mt-1">Add a map image to place interactive pins</p>
        </div>

        {showUrlInput ? (
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              placeholder="Enter image URL..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="bg-stone-800 border-stone-700"
            />
            <Button onClick={handleImageSubmit}>Add</Button>
            <Button variant="outline" onClick={() => setShowUrlInput(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowUrlInput(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Add Map Image
          </Button>
        )}
      </div>
    );
  }

  return (
    <InteractiveMap
      campaignId={campaignId}
      locationId={locationId}
      imageUrl={imageUrl}
      markers={markers}
      entities={entities}
      onMarkerCreate={handleMarkerCreate}
      onMarkerUpdate={handleMarkerUpdate}
      onMarkerDelete={handleMarkerDelete}
      onEntityClick={onEntityClick}
      editable={true}
    />
  );
}
