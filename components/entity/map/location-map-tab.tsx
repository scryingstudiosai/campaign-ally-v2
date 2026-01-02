'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Image, Loader2, Sparkles, Link, X, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InteractiveMap } from './interactive-map';
import { toast } from 'sonner';

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
  locationName?: string;
  imageUrl?: string;
  onImageUpdate: (url: string) => Promise<void>;
  onEntityClick?: (entityId: string) => void;
}

const MAP_STYLES = [
  { value: 'hand-drawn', label: 'Hand-Drawn Fantasy' },
  { value: 'parchment', label: 'Parchment/Antique' },
  { value: 'satellite', label: 'Aerial/Satellite View' },
  { value: 'blueprint', label: 'Blueprint/Floor Plan' },
  { value: 'battlemap', label: 'Battle Map (Grid)' },
  { value: 'artistic', label: 'Artistic/Painted' },
];

export function LocationMapTab({
  campaignId,
  locationId,
  locationName = 'this location',
  imageUrl,
  onImageUpdate,
  onEntityClick,
}: LocationMapTabProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [submitting, setSubmitting] = useState(false);

  // AI Generation state
  const [mapDescription, setMapDescription] = useState('');
  const [mapStyle, setMapStyle] = useState('hand-drawn');

  // URL state
  const [externalUrl, setExternalUrl] = useState('');

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  // AI Generation handler
  const handleAIGenerate = async () => {
    if (!mapDescription.trim()) {
      toast.error('Please describe what should be on the map');
      return;
    }

    setSubmitting(true);
    try {
      // Build a map-specific prompt
      const prompt = buildMapPrompt(locationName, mapDescription, mapStyle);

      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          campaignId,
          entityId: locationId,
          entityType: 'map',
          artStyle: mapStyle === 'artistic' ? 'painterly' : 'classic-fantasy',
          compositionStyle: 'environment',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate map');
      }

      const data = await res.json();
      setPreviewUrl(data.url);
      toast.success('Map generated! Click Save to add it.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaignId', campaignId);
      formData.append('entityId', locationId);

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      setPreviewUrl(data.url);
      toast.success('Map uploaded! Click Save to add it.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // URL submit handler
  const handleUrlSubmit = async () => {
    if (!externalUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      new URL(externalUrl); // Validate URL
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setPreviewUrl(externalUrl);
    toast.success('URL added! Click Save to use this map.');
  };

  // Save map handler
  const handleSaveMap = async () => {
    if (!previewUrl) return;

    setSubmitting(true);
    try {
      await onImageUpdate(previewUrl);
      toast.success('Map saved!');
      setShowDialog(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save map';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setMapDescription('');
    setMapStyle('hand-drawn');
    setExternalUrl('');
    setPreviewUrl(null);
    setActiveTab('generate');
  };

  const buildMapPrompt = (name: string, description: string, style: string): string => {
    const styleDescriptions: Record<string, string> = {
      'hand-drawn': 'hand-drawn fantasy map style with ink lines on parchment paper',
      'parchment': 'antique cartography style with aged parchment, decorative borders, and compass rose',
      'satellite': 'aerial satellite view, realistic top-down perspective',
      'blueprint': 'architectural blueprint style, clean lines, floor plan view',
      'battlemap': 'tactical battle map with grid squares, suitable for tabletop RPG combat',
      'artistic': 'painted artistic style, like classic fantasy book illustrations',
    };

    return `Create a detailed fantasy map of "${name}".

STYLE: ${styleDescriptions[style] || style}

CONTENT TO INCLUDE:
${description}

REQUIREMENTS:
- Top-down bird's eye view
- Clear visual hierarchy
- High contrast between features
- Professional cartography quality
- Suitable for tabletop RPG use
- NO text labels (will be added as overlays)

Generate a beautiful, detailed map.`;
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
      <>
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-stone-800 flex items-center justify-center">
            <Map className="w-8 h-8 text-stone-500" />
          </div>
          <div>
            <h3 className="font-medium text-white">No Map Image</h3>
            <p className="text-sm text-stone-400 mt-1">Add a map image to place interactive pins</p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Image className="w-4 h-4 mr-2" />
            Add Map Image
          </Button>
        </div>

        {/* Add Map Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-stone-900 border-stone-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Map for {locationName}</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-stone-800 w-full grid grid-cols-3">
                <TabsTrigger value="generate" className="data-[state=active]:bg-stone-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Generate
                </TabsTrigger>
                <TabsTrigger value="upload" className="data-[state=active]:bg-stone-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="data-[state=active]:bg-stone-700">
                  <Link className="h-4 w-4 mr-2" />
                  URL
                </TabsTrigger>
              </TabsList>

              {/* AI Generate Tab */}
              <TabsContent value="generate" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Map Style</Label>
                  <Select value={mapStyle} onValueChange={setMapStyle}>
                    <SelectTrigger className="bg-stone-800 border-stone-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-stone-700">
                      {MAP_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Describe the Map</Label>
                  <Textarea
                    placeholder={`Describe what should appear on this map...

Example: A ruined monastery on a cliff overlooking a dark forest. Show the main chapel, collapsed east wing, underground catacombs entrance, and a hidden ritual chamber. Include surrounding terrain with paths leading to the ruins.`}
                    value={mapDescription}
                    onChange={(e) => setMapDescription(e.target.value)}
                    className="bg-stone-800 border-stone-700 min-h-[120px]"
                  />
                </div>

                <Button
                  onClick={handleAIGenerate}
                  disabled={submitting || !mapDescription.trim()}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Map
                </Button>
              </TabsContent>

              {/* Upload Tab */}
              <TabsContent value="upload" className="space-y-4 mt-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-700 rounded-lg p-8 text-center cursor-pointer hover:border-stone-600 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="h-8 w-8 mx-auto mb-2 text-teal-500 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto mb-2 text-stone-500" />
                  )}
                  <p className="text-stone-400">Click to upload or drag & drop</p>
                  <p className="text-stone-600 text-sm">PNG, JPG, WebP up to 5MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </TabsContent>

              {/* URL Tab */}
              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    placeholder="https://example.com/map-image.jpg"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="bg-stone-800 border-stone-700"
                  />
                </div>
                <Button
                  onClick={handleUrlSubmit}
                  disabled={!externalUrl.trim()}
                  className="w-full"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Use This URL
                </Button>
              </TabsContent>
            </Tabs>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-4 pt-4 border-t border-stone-800">
                <Label>Preview</Label>
                <div className="relative aspect-video rounded-lg overflow-hidden border border-stone-700 bg-stone-800">
                  <img
                    src={previewUrl}
                    alt="Map preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="absolute top-2 right-2 p-1 bg-stone-900/80 rounded hover:bg-stone-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveMap}
                    disabled={submitting}
                    className="flex-1 bg-teal-600 hover:bg-teal-500"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save Map'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Has map image - show interactive map with replace option
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          className="border-stone-700"
        >
          <Image className="w-4 h-4 mr-2" />
          Replace Map Image
        </Button>
      </div>

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

      {/* Replace Map Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-stone-900 border-stone-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Replace Map for {locationName}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-stone-800 w-full grid grid-cols-3">
              <TabsTrigger value="generate" className="data-[state=active]:bg-stone-700">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-stone-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="data-[state=active]:bg-stone-700">
                <Link className="h-4 w-4 mr-2" />
                URL
              </TabsTrigger>
            </TabsList>

            {/* AI Generate Tab */}
            <TabsContent value="generate" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Map Style</Label>
                <Select value={mapStyle} onValueChange={setMapStyle}>
                  <SelectTrigger className="bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-900 border-stone-700">
                    {MAP_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Describe the Map</Label>
                <Textarea
                  placeholder={`Describe what should appear on this map...

Example: A ruined monastery on a cliff overlooking a dark forest. Show the main chapel, collapsed east wing, underground catacombs entrance, and a hidden ritual chamber.`}
                  value={mapDescription}
                  onChange={(e) => setMapDescription(e.target.value)}
                  className="bg-stone-800 border-stone-700 min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleAIGenerate}
                disabled={submitting || !mapDescription.trim()}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Map
              </Button>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4 mt-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-700 rounded-lg p-8 text-center cursor-pointer hover:border-stone-600 transition-colors"
              >
                {submitting ? (
                  <Loader2 className="h-8 w-8 mx-auto mb-2 text-teal-500 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 mx-auto mb-2 text-stone-500" />
                )}
                <p className="text-stone-400">Click to upload or drag & drop</p>
                <p className="text-stone-600 text-sm">PNG, JPG, WebP up to 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/map-image.jpg"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="bg-stone-800 border-stone-700"
                />
              </div>
              <Button
                onClick={handleUrlSubmit}
                disabled={!externalUrl.trim()}
                className="w-full"
              >
                <Link className="h-4 w-4 mr-2" />
                Use This URL
              </Button>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-4 pt-4 border-t border-stone-800">
              <Label>Preview</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-stone-700 bg-stone-800">
                <img
                  src={previewUrl}
                  alt="Map preview"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="absolute top-2 right-2 p-1 bg-stone-900/80 rounded hover:bg-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMap}
                  disabled={submitting}
                  className="flex-1 bg-teal-600 hover:bg-teal-500"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save Map'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
