'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationMapTab } from './map/location-map-tab';

interface LocationDetailWrapperProps {
  campaignId: string;
  locationId: string;
  mapImageUrl?: string;
  isLocation: boolean;
  children: React.ReactNode;
}

export function LocationDetailWrapper({
  campaignId,
  locationId,
  mapImageUrl,
  isLocation,
  children,
}: LocationDetailWrapperProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'atlas'>('details');

  // For non-locations, just render children directly
  if (!isLocation) {
    return <>{children}</>;
  }

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
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' ? (
        <>{children}</>
      ) : (
        <LocationMapTab
          campaignId={campaignId}
          locationId={locationId}
          imageUrl={mapImageUrl}
          onImageUpdate={handleImageUpdate}
          onEntityClick={handleEntityClick}
        />
      )}
    </div>
  );
}
