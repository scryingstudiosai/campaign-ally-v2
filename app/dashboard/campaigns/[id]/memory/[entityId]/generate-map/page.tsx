'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Map, Sparkles, Grid3X3, Upload, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

// Map Types
const MAP_TYPES = [
  { value: 'battlemap', label: 'Battlemap', description: 'Close-up tactical combat map' },
  { value: 'dungeon', label: 'Dungeon', description: 'Underground complex or building interior' },
  { value: 'region', label: 'Region/Overland', description: 'Larger area with terrain features' },
  { value: 'city', label: 'City/Settlement', description: 'Town or city layout' },
  { value: 'building', label: 'Building', description: 'Single structure floor plan' },
];

// Styles by Map Type - Curated to ensure usable results
// CRITICAL: All styles explicitly require floor plan / overhead view with NO perspective
const STYLES_BY_TYPE: Record<string, Array<{value: string, label: string, promptKeywords: string}>> = {
  battlemap: [
    {
      value: 'realistic',
      label: '🛡️ Realistic / VTT',
      promptKeywords: 'FLOOR PLAN battlemap looking STRAIGHT DOWN from above, flat overhead view, tabletop RPG map, realistic textures, ground and floor only, walls shown as outlines, furniture as simple shapes from above, gridless, no grid lines, no perspective, no horizon',
    },
    {
      value: 'osr-blue',
      label: '📜 Old School Blue (OSR)',
      promptKeywords: 'FLOOR PLAN map in classic D&D blue ink style, looking STRAIGHT DOWN, architectural blueprint on graph paper, cross-hatching for walls, simple line art, overhead schematic view, gridless, no grid lines, no perspective',
    },
    {
      value: 'watercolor',
      label: '🎨 Watercolor / Hand-drawn',
      promptKeywords: 'Hand-drawn FLOOR PLAN with watercolor wash, looking STRAIGHT DOWN from above, pen and ink architectural style, cross-hatching, parchment paper, overhead view only, gridless, no grid lines, no perspective',
    },
    {
      value: 'dark-fantasy',
      label: '🌑 Dark Fantasy / Noir',
      promptKeywords: 'Dark fantasy FLOOR PLAN battlemap, looking STRAIGHT DOWN from above, desaturated colors, high contrast, ground textures and shadows only, overhead architectural view, gridless, no grid lines, no perspective',
    },
  ],
  dungeon: [
    {
      value: 'realistic',
      label: '🛡️ Realistic Dungeon',
      promptKeywords: 'FLOOR PLAN of dungeon looking STRAIGHT DOWN from above, stone floor textures, wall outlines, corridor layout, overhead architectural view, tabletop RPG dungeon map, gridless, no grid lines, no perspective, no 3D walls',
    },
    {
      value: 'osr-blue',
      label: '📜 Classic Blue Map',
      promptKeywords: 'Classic FLOOR PLAN dungeon map, blue ink on graph paper style, looking STRAIGHT DOWN, cross-hatching for walls, architectural overhead view, simple line art, gridless, no grid lines, no perspective',
    },
    {
      value: 'watercolor',
      label: '🎨 Watercolor Dungeon',
      promptKeywords: 'Hand-drawn dungeon FLOOR PLAN, looking STRAIGHT DOWN from above, pen and ink with watercolor wash, architectural overhead view, parchment texture, gridless, no grid lines, no perspective',
    },
    {
      value: 'dark-fantasy',
      label: '🌑 Dark Fantasy Dungeon',
      promptKeywords: 'Grimdark dungeon FLOOR PLAN, looking STRAIGHT DOWN from above, desaturated overhead view, high contrast stone textures, architectural layout, gridless, no grid lines, no perspective, no 3D',
    },
  ],
  region: [
    {
      value: 'parchment',
      label: '🗺️ Parchment Cartography',
      promptKeywords: 'Fantasy region map looking STRAIGHT DOWN from high above, aged parchment texture, cartographic overhead view, ink drawn terrain symbols for mountains and forests, Tolkien style cartography, no perspective, no horizon',
    },
    {
      value: 'satellite',
      label: '🛰️ Realistic Atlas',
      promptKeywords: 'Satellite-style overhead view looking STRAIGHT DOWN, fantasy region from directly above, photorealistic terrain textures, flat cartographic projection, no perspective, no horizon line',
    },
    {
      value: 'artistic',
      label: '🎨 Artistic Regional',
      promptKeywords: 'Painted fantasy regional map looking STRAIGHT DOWN from above, artistic cartography with flat overhead view, illustrated terrain symbols, beautiful hand-crafted style, no perspective, no horizon',
    },
  ],
  city: [
    {
      value: 'blueprint',
      label: '🏙️ Settlement Blueprint',
      promptKeywords: 'City FLOOR PLAN looking STRAIGHT DOWN from above, architectural overhead view, building footprints and rooftops, street layout, districts marked, flat cartographic style, gridless, no perspective, no 3D buildings',
    },
    {
      value: 'parchment',
      label: '🗺️ Parchment City Map',
      promptKeywords: 'Fantasy city map looking STRAIGHT DOWN from above, aged parchment, building footprints shown from overhead, streets and districts, cartographic style, no perspective, no 3D, no horizon',
    },
    {
      value: 'realistic',
      label: '🛰️ Aerial City View',
      promptKeywords: 'City map looking STRAIGHT DOWN from directly above, Google Maps satellite style, building rooftops and footprints, overhead view only, no perspective, no horizon, no 3D buildings shown from side',
    },
  ],
  building: [
    {
      value: 'blueprint',
      label: '📐 Floor Plan',
      promptKeywords: 'Architectural FLOOR PLAN looking STRAIGHT DOWN, clean line drawing, room layout with wall outlines, furniture shown as simple shapes from above, architectural blueprint style, gridless, no grid lines, no perspective',
    },
    {
      value: 'realistic',
      label: '🛡️ Realistic Interior',
      promptKeywords: 'Interior FLOOR PLAN battlemap looking STRAIGHT DOWN from above, furnished rooms with furniture shapes from overhead, realistic floor textures, architectural layout, gridless, no grid lines, no perspective, no 3D',
    },
    {
      value: 'watercolor',
      label: '🎨 Hand-drawn Plan',
      promptKeywords: 'Hand-drawn building FLOOR PLAN looking STRAIGHT DOWN, pen and ink with watercolor, architectural overhead view, room layout, parchment texture, gridless, no grid lines, no perspective',
    },
  ],
};

// Environment modifiers
const ENVIRONMENTS = [
  { value: 'none', label: 'Default' },
  { value: 'forest', label: 'Forest / Woodland' },
  { value: 'cave', label: 'Cave / Underground' },
  { value: 'snow', label: 'Snow / Arctic' },
  { value: 'desert', label: 'Desert / Arid' },
  { value: 'swamp', label: 'Swamp / Marsh' },
  { value: 'coastal', label: 'Coastal / Beach' },
  { value: 'volcanic', label: 'Volcanic / Lava' },
  { value: 'urban', label: 'Urban / City' },
  { value: 'ruins', label: 'Ancient Ruins' },
  { value: 'tavern', label: 'Tavern / Inn' },
  { value: 'temple', label: 'Temple / Sacred' },
  { value: 'castle', label: 'Castle / Fortress' },
];

// CRITICAL: Top-down enforcement rules - added to every prompt
const TOP_DOWN_ENFORCEMENT = `
STRICT TOP-DOWN REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
- Camera is positioned DIRECTLY ABOVE looking STRAIGHT DOWN (90 degree angle)
- This is a FLOOR PLAN / ARCHITECTURAL BLUEPRINT view
- NO perspective, NO vanishing points, NO horizon line
- NO walls shown as vertical surfaces - only show wall footprints/outlines from above
- NO side views of furniture, objects, or terrain - only show their footprints from above
- Everything appears flat as if pressed under glass
- Humans/creatures would appear as circles/dots from this view (do not include them)
- Tables appear as rectangles, chairs as small squares, beds as rectangles
- Trees appear as circular canopy shapes from above
- Buildings appear as roof outlines or floor plans
- This map will be used as a tabletop RPG battlemap - it MUST be usable for placing miniature tokens
- Think "Google Maps satellite view" or "architectural floor plan"
DO NOT: Show any walls from the side, show horizon, show sky, show perspective depth, show anything at an angle
`;

// Convert vertical/perspective descriptions to floor-plan equivalents
function sanitizeForFloorPlan(text: string): string {
  if (!text) return '';

  const conversions: [RegExp, string][] = [
    // Tall/vertical structures → footprints
    [/towering\s+spires?/gi, 'tower foundations visible from above'],
    [/tall\s+towers?/gi, 'tower footprints'],
    [/high\s+ceilings?/gi, 'spacious room'],
    [/vaulted\s+ceilings?/gi, 'large open chamber'],
    [/soaring\s+(columns?|pillars?)/gi, 'column bases arranged in rows'],
    [/rising\s+(columns?|pillars?)/gi, 'column bases'],
    [/grand\s+staircase/gi, 'staircase footprint (marked with lines)'],
    [/spiral\s+staircase/gi, 'spiral staircase (circular shape with spiral lines)'],
    [/steep\s+stairs?/gi, 'stairway (marked with direction lines)'],
    [/towering\s+trees?/gi, 'tree canopies from above'],
    [/tall\s+trees?/gi, 'circular tree canopy shapes'],
    [/massive\s+chandelier/gi, 'chandelier shadow on floor'],
    [/hanging\s+(lights?|lamps?|lanterns?)/gi, 'light sources marked on floor'],
    [/high\s+windows?/gi, 'window alcoves in wall outline'],
    [/balconies?\s+overlooking/gi, 'balcony platform outline'],
    [/overlooking\s+the/gi, 'adjacent to the'],
    [/looking\s+down\s+(at|on)/gi, 'near'],
    [/rises?\s+(up|above)/gi, 'extends'],
    [/looms?\s+(over|above)/gi, 'is situated near'],
    [/stretches?\s+upward/gi, 'extends across'],
    [/reaches?\s+(toward|to)\s+the\s+(sky|ceiling|heavens)/gi, 'is prominently positioned'],
  ];

  let result = text;
  for (const [pattern, replacement] of conversions) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Format hazards properly (fixes [object Object] bug)
function formatHazards(hazards: unknown[]): string {
  if (!Array.isArray(hazards) || hazards.length === 0) return '';

  const formatted = hazards.map(h => {
    if (typeof h === 'string') return h;
    if (typeof h === 'object' && h !== null) {
      // Handle common hazard object shapes
      const obj = h as Record<string, unknown>;
      if (obj.name) return String(obj.name);
      if (obj.type) return String(obj.type);
      if (obj.description) return String(obj.description);
      if (obj.hazard) return String(obj.hazard);
      // Fallback: stringify but filter useful keys
      const keys = Object.keys(obj).filter(k => typeof obj[k] === 'string');
      if (keys.length > 0) return String(obj[keys[0]]);
    }
    return '';
  }).filter(Boolean);

  return formatted.length > 0 ? formatted.join(', ') : '';
}

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
  description?: string;
  soul?: Record<string, unknown>;
  brain?: Record<string, unknown>;
  mechanics?: Record<string, unknown>;
  facts?: Array<{ content: string }>;
}

export default function GenerateMapPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const entityId = params.entityId as string;

  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedMapUrl, setGeneratedMapUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('generate');

  // AI Generation form state
  const [mapType, setMapType] = useState('battlemap');
  const [style, setStyle] = useState('realistic');
  const [environment, setEnvironment] = useState('none');
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // URL state
  const [externalUrl, setExternalUrl] = useState('');

  // Grid overlay state
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50); // pixels per square

  // Load entity data
  useEffect(() => {
    loadEntity();
  }, [entityId]);

  // Reset style when map type changes
  useEffect(() => {
    const styles = STYLES_BY_TYPE[mapType] || [];
    if (styles.length > 0 && !styles.find(s => s.value === style)) {
      setStyle(styles[0].value);
    }
  }, [mapType, style]);

  const loadEntity = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .single();

    if (error) {
      toast.error('Failed to load entity');
      router.back();
      return;
    }

    setEntity(data);

    // Auto-detect map type from entity
    if (data.entity_type === 'location') {
      const subtype = (data.soul?.subtype || data.sub_type || '').toString().toLowerCase();
      if (subtype.includes('dungeon') || subtype.includes('cave') || subtype.includes('crypt') || subtype.includes('tomb')) {
        setMapType('dungeon');
      } else if (subtype.includes('city') || subtype.includes('town') || subtype.includes('village') || subtype.includes('settlement')) {
        setMapType('city');
      } else if (subtype.includes('region') || subtype.includes('kingdom') || subtype.includes('forest') || subtype.includes('mountain') || subtype.includes('continent')) {
        setMapType('region');
      } else if (subtype.includes('building') || subtype.includes('tavern') || subtype.includes('shop') || subtype.includes('inn') || subtype.includes('house') || subtype.includes('temple')) {
        setMapType('building');
      }
    }

    setLoading(false);
  };

  // Build comprehensive prompt from entity data
  const buildPrompt = (): string => {
    if (!entity) return '';

    const styleInfo = STYLES_BY_TYPE[mapType]?.find(s => s.value === style);
    if (!styleInfo) return '';

    // Gather ALL relevant info from entity
    const soul = entity.soul || {};
    const brain = entity.brain || {};
    const mechanics = entity.mechanics || {};

    // Extract descriptive elements - sanitized for floor plan view
    const elements: string[] = [];

    // From soul (sensory/atmospheric details) - sanitize vertical descriptions
    if (soul.distinctive_feature) {
      elements.push(`Distinctive feature: ${sanitizeForFloorPlan(String(soul.distinctive_feature))}`);
    }
    if (soul.purpose) elements.push(`Purpose: ${sanitizeForFloorPlan(String(soul.purpose))}`);
    // Skip atmosphere - not relevant for floor plan
    if (Array.isArray(soul.sights) && soul.sights.length > 0) {
      const sanitizedSights = soul.sights.map(s => sanitizeForFloorPlan(String(s)));
      elements.push(`Floor features: ${sanitizedSights.join(', ')}`);
    }
    // Skip lighting - not visible from above
    if (soul.architecture) {
      elements.push(`Layout style: ${sanitizeForFloorPlan(String(soul.architecture))}`);
    }
    if (soul.terrain) elements.push(`Ground terrain: ${sanitizeForFloorPlan(String(soul.terrain))}`);
    if (Array.isArray(soul.notable_features) && soul.notable_features.length > 0) {
      const sanitizedFeatures = soul.notable_features.map(f => sanitizeForFloorPlan(String(f)));
      elements.push(`Floor-level features: ${sanitizedFeatures.join(', ')}`);
    }

    // From brain (DM knowledge) - brief context only
    if (brain.concept) elements.push(`Concept: ${sanitizeForFloorPlan(String(brain.concept))}`);
    // Skip situation and history - not relevant for map layout

    // From mechanics (game elements) - using formatHazards to fix [object Object] bug
    if (Array.isArray(mechanics.hazards) && mechanics.hazards.length > 0) {
      const hazardsText = formatHazards(mechanics.hazards);
      if (hazardsText) elements.push(`Hazard locations to mark: ${hazardsText}`);
    }
    if (Array.isArray(mechanics.rooms) && mechanics.rooms.length > 0) {
      const roomNames = mechanics.rooms.map((r: unknown) => {
        if (typeof r === 'object' && r !== null && 'name' in r) return (r as { name: string }).name;
        if (typeof r === 'string') return r;
        return '';
      }).filter(Boolean);
      if (roomNames.length > 0) elements.push(`Rooms/Areas to include: ${roomNames.join(', ')}`);
    }
    if (mechanics.defenses) elements.push(`Defensive positions: ${sanitizeForFloorPlan(String(mechanics.defenses))}`);
    if (mechanics.entry_points) elements.push(`Entry/exit points: ${String(mechanics.entry_points)}`);

    // Environment modifier - focus on ground-level features
    const envKeywords = environment !== 'none'
      ? `${environment} terrain textures and ground features`
      : '';

    // Sanitize additional details too
    const sanitizedDetails = additionalDetails ? sanitizeForFloorPlan(additionalDetails) : '';

    // Build the prompt with STRICT top-down enforcement
    const prompt = `${TOP_DOWN_ENFORCEMENT}

STYLE: ${styleInfo.promptKeywords}

Create a TOP-DOWN FLOOR PLAN map of "${entity.name}" - ${sanitizeForFloorPlan(entity.description || String(soul.purpose) || 'a fantasy location')}.

${elements.length > 0 ? `LAYOUT ELEMENTS (show from above):\n${elements.join('\n')}` : ''}

${envKeywords ? `GROUND/TERRAIN: ${envKeywords}` : ''}

${sanitizedDetails ? `ADDITIONAL FLOOR FEATURES: ${sanitizedDetails}` : ''}

FINAL REMINDERS:
- This is a BIRD'S EYE VIEW looking STRAIGHT DOWN
- Show only what would be visible looking down from directly above
- Walls appear as thick lines (floor plan style)
- Furniture appears as simple shapes from above
- NO 3D perspective, NO horizon, NO sky visible
- Must be usable for placing tabletop RPG miniatures
- NO grid lines (grid overlay added separately via CSS)`;

    return prompt;
  };

  const handleGenerate = async () => {
    if (!entity) return;

    setGenerating(true);
    try {
      const prompt = buildPrompt();
      console.log('Map generation prompt:', prompt);

      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          campaignId,
          entityId,
          entityType: 'map',
          size: '1792x1024', // Landscape for maps
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate map');
      }

      const data = await res.json();
      setGeneratedMapUrl(data.url);
      toast.success('Map generated!');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('campaignId', campaignId);
      formData.append('entityId', entityId);

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      setGeneratedMapUrl(data.url);
      setUploadFile(null);
      toast.success('Map uploaded!');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!externalUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      new URL(externalUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setGeneratedMapUrl(externalUrl);
    toast.success('URL added! Click Save to use this map.');
  };

  const handleSaveMap = async () => {
    if (!generatedMapUrl || !entity) return;

    setSaving(true);
    try {
      const supabase = createClient();

      // Determine source type
      let sourceType: 'ai_generated' | 'uploaded' | 'external_url' = 'ai_generated';
      if (activeTab === 'upload') sourceType = 'uploaded';
      else if (activeTab === 'url') sourceType = 'external_url';

      // Save to atlas_maps table
      const { error: atlasError } = await supabase
        .from('atlas_maps')
        .insert({
          campaign_id: campaignId,
          linked_entity_id: entityId,
          name: `Map of ${entity.name}`,
          image_url: generatedMapUrl,
          source_type: sourceType,
          map_type: mapType,
          style: style,
          description: additionalDetails || null,
          is_primary: true,
          metadata: {
            environment,
            generated_at: new Date().toISOString(),
          },
        });

      if (atlasError) {
        console.error('Atlas insert error:', atlasError);
        throw atlasError;
      }

      // Update entity's soul.map_url field
      const currentSoul = entity.soul || {};
      await supabase
        .from('entities')
        .update({
          soul: {
            ...currentSoul,
            map_url: generatedMapUrl,
          },
        })
        .eq('id', entityId);

      toast.success('Map saved!');
      router.push(`/dashboard/campaigns/${campaignId}/memory/${entityId}`);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save map';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-950">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const availableStyles = STYLES_BY_TYPE[mapType] || [];

  // Extract entity context for display
  const entityContext = {
    description: entity?.description,
    purpose: entity?.soul?.purpose as string | undefined,
    atmosphere: entity?.soul?.atmosphere as string | undefined,
    distinctiveFeature: entity?.soul?.distinctive_feature as string | undefined,
    sights: entity?.soul?.sights as string[] | undefined,
  };

  return (
    <div className="min-h-screen bg-stone-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <Link
          href={`/dashboard/campaigns/${campaignId}/memory/${entityId}`}
          className="inline-flex items-center text-stone-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {entity?.name}
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Map className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Generate Map</h1>
            <p className="text-stone-400">Create a map for {entity?.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Input Method Tabs */}
          <Card className="bg-stone-900 border-stone-800">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-stone-800 grid grid-cols-3">
                <TabsTrigger value="generate" className="data-[state=active]:bg-stone-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Generate
                </TabsTrigger>
                <TabsTrigger value="upload" className="data-[state=active]:bg-stone-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="data-[state=active]:bg-stone-700">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  URL
                </TabsTrigger>
              </TabsList>

              {/* AI Generate Tab */}
              <TabsContent value="generate" className="p-4 space-y-6">
                {/* Map Type */}
                <div className="space-y-2">
                  <Label className="text-stone-300">Map Type</Label>
                  <Select value={mapType} onValueChange={setMapType}>
                    <SelectTrigger className="bg-stone-800 border-stone-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-stone-700">
                      {MAP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-stone-500">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Art Style */}
                <div className="space-y-2">
                  <Label className="text-stone-300">Art Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-stone-800 border-stone-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-stone-700">
                      {availableStyles.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Environment */}
                <div className="space-y-2">
                  <Label className="text-stone-300">Environment (Optional)</Label>
                  <Select value={environment} onValueChange={setEnvironment}>
                    <SelectTrigger className="bg-stone-800 border-stone-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-stone-900 border-stone-700">
                      {ENVIRONMENTS.map((env) => (
                        <SelectItem key={env.value} value={env.value}>
                          {env.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Details */}
                <div className="space-y-2">
                  <Label className="text-stone-300">Additional Details</Label>
                  <Textarea
                    placeholder="Add any specific features you want on the map...

Example: Include a central fountain, secret passage behind the bookshelf, collapsed section in the east wing"
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    className="bg-stone-800 border-stone-700 min-h-[100px]"
                  />
                </div>

                {/* Context Preview */}
                <div className="space-y-2">
                  <Label className="text-stone-400 text-sm">Entity Context (Auto-included)</Label>
                  <div className="bg-stone-800/50 rounded-lg p-3 text-sm text-stone-500 space-y-1">
                    {entityContext.description && <p>• {entityContext.description}</p>}
                    {entityContext.purpose && <p>• Purpose: {entityContext.purpose}</p>}
                    {entityContext.atmosphere && <p>• Atmosphere: {entityContext.atmosphere}</p>}
                    {entityContext.distinctiveFeature && <p>• Feature: {entityContext.distinctiveFeature}</p>}
                    {entityContext.sights && entityContext.sights.length > 0 && (
                      <p>• Sights: {entityContext.sights.slice(0, 3).join(', ')}</p>
                    )}
                    {!entityContext.description && !entityContext.purpose && (
                      <p className="text-stone-600 italic">Flesh out this entity for better map generation</p>
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Map...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Map
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Upload Tab */}
              <TabsContent value="upload" className="p-4 space-y-4">
                <div className="space-y-4">
                  <div
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="border-2 border-dashed border-stone-700 rounded-lg p-8 text-center cursor-pointer hover:border-stone-600 transition-colors"
                  >
                    {uploadFile ? (
                      <div className="space-y-2">
                        <p className="text-teal-400 font-medium">{uploadFile.name}</p>
                        <p className="text-stone-500 text-sm">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-stone-500" />
                        <p className="text-stone-400">Click to upload or drag & drop</p>
                        <p className="text-stone-600 text-sm">PNG, JPG, WebP up to 10MB</p>
                      </>
                    )}
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadFile(file);
                    }}
                  />
                  {uploadFile && (
                    <Button
                      onClick={handleFileUpload}
                      disabled={uploading}
                      className="w-full bg-teal-600 hover:bg-teal-500"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Map
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* URL Tab */}
              <TabsContent value="url" className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-stone-300">Image URL</Label>
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
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Use This URL
                </Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4">
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Preview</CardTitle>

              {/* Grid Controls */}
              {generatedMapUrl && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showGrid}
                      onCheckedChange={setShowGrid}
                      id="grid-toggle"
                    />
                    <Label htmlFor="grid-toggle" className="text-sm flex items-center gap-1 cursor-pointer">
                      <Grid3X3 className="h-4 w-4" />
                      Grid
                    </Label>
                  </div>

                  {showGrid && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-stone-400">Size:</Label>
                      <Slider
                        value={[gridSize]}
                        onValueChange={(values: number[]) => setGridSize(values[0])}
                        min={20}
                        max={100}
                        step={5}
                        className="w-24"
                      />
                      <span className="text-xs text-stone-500 w-10">{gridSize}px</span>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generatedMapUrl ? (
                <div className="space-y-4">
                  {/* Map with optional grid overlay */}
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-stone-700 bg-stone-800">
                    <img
                      src={generatedMapUrl}
                      alt="Generated map"
                      className="w-full h-full object-contain"
                    />

                    {/* CSS Grid Overlay */}
                    {showGrid && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `
                            linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
                          `,
                          backgroundSize: `${gridSize}px ${gridSize}px`,
                        }}
                      />
                    )}

                    {/* Clear button */}
                    <button
                      onClick={() => setGeneratedMapUrl(null)}
                      className="absolute top-2 right-2 p-1.5 bg-stone-900/80 rounded-lg hover:bg-stone-800 transition-colors"
                    >
                      <X className="w-4 h-4 text-stone-400" />
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedMapUrl(null);
                        if (activeTab === 'generate') handleGenerate();
                      }}
                      disabled={generating || saving}
                      className="flex-1 border-stone-700"
                    >
                      {generating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Regenerate
                    </Button>
                    <Button
                      onClick={handleSaveMap}
                      disabled={saving}
                      className="flex-1 bg-teal-600 hover:bg-teal-500"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Map'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded-lg border border-dashed border-stone-700 flex items-center justify-center bg-stone-800/30">
                  <div className="text-center text-stone-500">
                    <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Generated map will appear here</p>
                    <p className="text-xs text-stone-600 mt-1">
                      Grid overlay can be toggled after generation
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-stone-400">Tips for Better Maps</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-stone-500 space-y-2">
              <p>• <strong>Battlemaps</strong>: Best for tactical combat encounters</p>
              <p>• <strong>Dungeons</strong>: Multi-room complexes with corridors</p>
              <p>• <strong>Region maps</strong>: Use for overland travel and exploration</p>
              <p>• <strong>Grid overlay</strong>: Adjust size to match your scale (5ft = 1 square)</p>
              <p>• <strong>Entity context</strong>: Flesh out soul/brain for better prompts</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
