// Comprehensive map prompt builder for Atlas map generation

import { CampaignMapStyle, DEFAULT_MAP_STYLE } from './map-styles'

export type LocationCategory = 'world' | 'region' | 'settlement' | 'building' | 'dungeon' | 'wilderness'
export type MapDetailLevel = 'overview' | 'standard' | 'detailed'

interface MapPromptOptions {
  locationName: string
  locationType: string
  description?: string
  childLocations?: Array<{ name: string; type: string }>
  terrain?: string
  climate?: string
  campaignStyle?: CampaignMapStyle
  attemptNumber?: number
}

// ============================================
// LOCATION CATEGORY DETECTION
// ============================================

export function getLocationCategory(subType: string): LocationCategory {
  const type = subType?.toLowerCase() || ''

  if (['world', 'continent', 'plane', 'realm'].some((t) => type.includes(t))) {
    return 'world'
  }
  if (
    ['region', 'kingdom', 'province', 'territory', 'country', 'land', 'empire'].some((t) =>
      type.includes(t)
    )
  ) {
    return 'region'
  }
  if (
    [
      'city',
      'town',
      'village',
      'settlement',
      'hamlet',
      'outpost',
      'camp',
      'port',
      'capital',
    ].some((t) => type.includes(t))
  ) {
    return 'settlement'
  }
  if (
    [
      'building',
      'tavern',
      'inn',
      'castle',
      'tower',
      'temple',
      'shop',
      'house',
      'manor',
      'palace',
      'guild',
      'warehouse',
      'fortress',
    ].some((t) => type.includes(t))
  ) {
    return 'building'
  }
  if (
    [
      'dungeon',
      'cave',
      'crypt',
      'tomb',
      'lair',
      'mine',
      'ruins',
      'catacomb',
      'sewer',
      'underground',
      'cavern',
    ].some((t) => type.includes(t))
  ) {
    return 'dungeon'
  }
  if (
    [
      'forest',
      'mountain',
      'desert',
      'swamp',
      'plains',
      'coast',
      'island',
      'lake',
      'river',
      'jungle',
      'tundra',
      'valley',
      'canyon',
    ].some((t) => type.includes(t))
  ) {
    return 'wilderness'
  }

  return 'region'
}

export function getDetailLevel(category: LocationCategory): MapDetailLevel {
  switch (category) {
    case 'world':
      return 'overview'
    case 'region':
      return 'standard'
    case 'wilderness':
      return 'standard'
    case 'settlement':
      return 'detailed'
    case 'building':
      return 'detailed'
    case 'dungeon':
      return 'detailed'
    default:
      return 'standard'
  }
}

// ============================================
// STYLE FINGERPRINT (Consistency Across Campaign)
// ============================================

function buildStyleFingerprint(style: CampaignMapStyle): string {
  const artDirectionDescriptions: Record<string, string> = {
    'parchment-ink': 'hand-drawn ink on aged parchment, fine linework, crosshatching for shading',
    'painted-cartography': 'painted fantasy cartography, soft brushwork, layered colors',
    'blueprint-dark': 'technical blueprint style, clean precise lines, dark background with light lines',
    'vtt-realistic': 'realistic digital painting, clear readable shapes, game-ready assets',
    'darkest-dungeon': 'high contrast noir illustration, dramatic shadows, stark lighting',
  }

  const paletteDescriptions: Record<string, string> = {
    'dark-muted':
      'muted earth tones on dark background: deep browns, forest greens, slate grays, navy water',
    ashen: 'desaturated grays and blacks with occasional warm accent, charcoal aesthetic',
    'sepia-dark': 'sepia and brown tones on dark tan, aged document feel',
    'blue-noir': 'dark navy and slate blues with white/cyan lines, technical feel',
    'forest-night': 'deep greens and blacks, moonlit forest palette',
  }

  return `
CAMPAIGN STYLE FINGERPRINT (maintain consistency):
- Art Direction: ${artDirectionDescriptions[style.artDirection] || style.artDirection}
- Line Weight: ${style.lineWeight} lines throughout
- Texture Level: ${style.texture} surface texture
- Color Palette: ${paletteDescriptions[style.palette] || style.palette}
- All maps in this campaign MUST match this visual language
`.trim()
}

// ============================================
// BASE REQUIREMENTS (All Maps)
// ============================================

const CRITICAL_VIEWPOINT_RULES = `
CRITICAL VIEWPOINT REQUIREMENTS:
- STRICTLY 2D Top-Down Orthographic View
- Camera Angle: Exactly 90 degrees (straight down)
- NO tilt, NO perspective, NO isometric, NO 3D rendering
- NO vanishing points, NO horizon line
- Everything viewed from directly above as if looking at a flat paper map
`.trim()

const NO_TEXT_RULES = `
ABSOLUTELY NO TEXT OR SYMBOLS:
- NO text of any kind (names, labels, titles, legends)
- NO letters, numbers, runes, or glyphs
- NO compass rose or directional indicators
- NO map legend or key
- NO decorative border frames or corner ornaments
- NO watermarks or signatures
- NO grid lines or hex patterns
`.trim()

const ATLAS_USABILITY_RULES = `
ATLAS USABILITY (for marker placement):
- Reserve 20-30% of map area as "marker-safe" open space (low detail, readable)
- Create 6-12 distinct landmark zones with clear visual separation
- Each zone should be visually identifiable (different shape, texture, or color value)
- Maintain strong contrast between different terrain/area types
- Avoid dense noisy textures that obscure marker visibility
- Large readable shapes at zoomed-out view
- Clear edges and boundaries between areas
`.trim()

const SYMBOL_LANGUAGE_RULES = `
CONSISTENT SYMBOL LANGUAGE:
- Mountains: consistent small symbolic peaks viewed from above (not 3D ridges)
- Forests: consistent clustered canopy symbols or textured green areas
- Roads: consistent thin line style, clearly connecting landmarks
- Rivers: consistent dark blue-gray lines, flowing naturally
- Buildings: consistent roof-block shapes (settlement) or wall-line shapes (floor plans)
- Water bodies: consistent dark blue-gray fill, not bright blue
`.trim()

// ============================================
// DETAIL LEVEL MODIFIERS
// ============================================

function getDetailLevelRules(level: MapDetailLevel): string {
  switch (level) {
    case 'overview':
      return `
DETAIL LEVEL - OVERVIEW:
- Large shapes only, minimal micro-detail
- Broad terrain regions, not individual trees
- Suitable for viewing entire continents/worlds
- Focus on silhouettes and major boundaries
`.trim()

    case 'standard':
      return `
DETAIL LEVEL - STANDARD:
- Balanced detail, readable at medium zoom
- Terrain features visible but not overwhelming
- Roads and rivers clearly marked
- Individual settlements shown as icons, not detailed buildings
`.trim()

    case 'detailed':
      return `
DETAIL LEVEL - DETAILED:
- Sharp edges, readable individual structures
- High local detail (rooms, buildings, paths)
- Furniture/features visible in floor plans
- Optimized for close-up tactical viewing
`.trim()
  }
}

// ============================================
// RETRY ESCALATION RULES
// ============================================

function getRetryRules(attemptNumber: number): string {
  if (attemptNumber <= 1) return ''

  if (attemptNumber === 2) {
    return `
RETRY ATTEMPT 2 - STRICT MODE:
- ABSOLUTELY NO TEXT OR ANYTHING RESEMBLING LETTERS
- REMOVE ALL LABELING, TITLING, LETTERING
- PURE VISUAL MAP ONLY
`.trim()
  }

  return `
RETRY ATTEMPT ${attemptNumber} - MAXIMUM SIMPLICITY:
- EXTREMELY CLEAN, MINIMAL DETAIL
- LARGE SIMPLE SHAPES ONLY
- NO TEXT, NO SYMBOLS, NO DECORATIONS
- PRIORITIZE CLARITY OVER ARTISTRY
`.trim()
}

// ============================================
// CATEGORY-SPECIFIC STRUCTURAL RECIPES
// ============================================

const CATEGORY_PROMPTS: Record<LocationCategory, (opts: MapPromptOptions) => string> = {
  world: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const detailLevel = getDetailLevel('world')
    const childCount = opts.childLocations?.length || 0

    return `
Fantasy World/Continent Map for "${opts.locationName}".

${CRITICAL_VIEWPOINT_RULES}

${NO_TEXT_RULES}

${buildStyleFingerprint(style)}

${getDetailLevelRules(detailLevel)}

STRUCTURAL RECIPE - WORLD MAP:
- Show entire landmass(es) surrounded by ocean/sea
- Include 1-2 major mountain ranges as symbolic ridges
- Include 2-4 distinct terrain biomes (forests, deserts, plains, tundra)
- Include 1-2 major river systems flowing to coast
- Coastlines should be organic with bays and peninsulas
- Ocean/water: dark navy or slate, NOT bright blue
- Leave ${Math.max(6, childCount)} distinct open areas for placing region/city markers

${ATLAS_USABILITY_RULES}

${SYMBOL_LANGUAGE_RULES}

CONTENT CONTEXT:
${opts.description ? `- World description: ${opts.description}` : ''}
${opts.climate ? `- Climate: ${opts.climate}` : ''}
${childCount > 0 ? `- Must have distinct zones for: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

OUTPUT: Complete fantasy world map, strictly top-down, dark palette, marker-ready.
`.trim()
  },

  region: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const detailLevel = getDetailLevel('region')
    const childCount = opts.childLocations?.length || 0

    return `
Fantasy Regional Map (Kingdom/Province) for "${opts.locationName}".

${CRITICAL_VIEWPOINT_RULES}

${NO_TEXT_RULES}

${buildStyleFingerprint(style)}

${getDetailLevelRules(detailLevel)}

STRUCTURAL RECIPE - REGIONAL MAP:
- 1 major river OR coastline as primary water feature
- 1 road network connecting 3-6 settlement nodes (thin tan/brown lines)
- 2-4 terrain biomes with clear boundaries (forest, hills, farmland, marsh)
- 1 "central hub" area (capital/major city location) - keep it open for markers
- Mountains as background ridges if appropriate
- Forests as darker green textured regions
- Roads MUST visibly connect the landmark zones

${ATLAS_USABILITY_RULES}

${SYMBOL_LANGUAGE_RULES}

CONTENT CONTEXT:
- Region: "${opts.locationName}"
${opts.locationType ? `- Type: ${opts.locationType}` : ''}
${opts.description ? `- Description: ${opts.description}` : ''}
${opts.terrain ? `- Primary terrain: ${opts.terrain}` : ''}
${childCount > 0 ? `- Contains these settlements/landmarks (create distinct zones for each): ${opts.childLocations!.map((c) => `${c.name} (${c.type})`).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

OUTPUT: Regional fantasy map, strictly top-down, roads connecting landmarks, dark palette.
`.trim()
  },

  settlement: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const detailLevel = getDetailLevel('settlement')
    const childCount = opts.childLocations?.length || 0

    return `
Fantasy Settlement Map (City/Town) for "${opts.locationName}".

${CRITICAL_VIEWPOINT_RULES}

${NO_TEXT_RULES}

${buildStyleFingerprint(style)}

${getDetailLevelRules(detailLevel)}

STRUCTURAL RECIPE - SETTLEMENT MAP:
- OUTER BOUNDARY: City walls (thick dark lines) OR natural boundary (river, cliffs)
- CENTRAL PLAZA: 1 large open market square or plaza (primary marker zone)
- DISTRICTS: 3-5 visually distinct districts separated by main roads or canals
- MAIN ROAD SPINE: Primary road running through settlement connecting gates
- SIDE STREETS: Secondary roads creating navigable blocks
- BUILDINGS: Simple dark roof-block shapes, NOT painterly blobs
  - Vary building size by district (larger near center, smaller residential)
- WATER FEATURE: River, harbor, or canals if appropriate (dark blue-gray)
- MARKER ZONES: Reserve at least 6 clear open areas:
  - Main plaza, gate entrances, temple grounds, market, docks, noble quarter

${ATLAS_USABILITY_RULES}

${SYMBOL_LANGUAGE_RULES}

CONTENT CONTEXT:
- Settlement: "${opts.locationName}"
${opts.locationType ? `- Type: ${opts.locationType}` : ''}
${opts.description ? `- Description: ${opts.description}` : ''}
${childCount > 0 ? `- Notable locations (create distinct zones): ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

OUTPUT: Top-down city/town map with clear districts, central plaza, readable buildings.
`.trim()
  },

  building: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const detailLevel = getDetailLevel('building')
    const childCount = opts.childLocations?.length || 0

    return `
Fantasy Building Floor Plan for "${opts.locationName}".

${CRITICAL_VIEWPOINT_RULES}

${NO_TEXT_RULES}

${buildStyleFingerprint(style)}

${getDetailLevelRules(detailLevel)}

STRUCTURAL RECIPE - FLOOR PLAN:
- WALLS: Thick dark lines (high contrast against floor)
- ROOMS: Clearly delineated spaces with distinct purposes
- DOORS: Visible gaps in walls (not drawn as rectangles)
- FLOORS: Muted stone or wood texture (dark browns/grays)
- FURNITURE: Simple dark shapes suggesting function:
  - Tables as rectangles
  - Beds as rounded rectangles
  - Chairs as small squares
  - Barrels/crates as circles/squares
- ROOM VARIETY: Different room sizes for visual interest
- MAIN HALL: One larger central room or corridor
- PLAYABLE SPACE: Clear walkable areas between furniture

${ATLAS_USABILITY_RULES}

CONTENT CONTEXT:
- Building: "${opts.locationName}"
${opts.locationType ? `- Type: ${opts.locationType}` : ''}
${opts.description ? `- Description: ${opts.description}` : ''}
${childCount > 0 ? `- Rooms/areas to include: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

OUTPUT: Clean architectural floor plan, high contrast walls, readable rooms, furniture suggested.
`.trim()
  },

  dungeon: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const detailLevel = getDetailLevel('dungeon')
    const childCount = opts.childLocations?.length || 0

    return `
Fantasy Dungeon Battlemap for "${opts.locationName}".

${CRITICAL_VIEWPOINT_RULES}

${NO_TEXT_RULES}

${buildStyleFingerprint(style)}

${getDetailLevelRules(detailLevel)}

STRUCTURAL RECIPE - DUNGEON MAP:
- HIGH CONTRAST: Light/medium floors against very dark walls/rock
- SOLID ROCK: Very dark background (unexplored/impassable areas)
- CORRIDORS: Connecting passages of varying width (not all same size)
- CHAMBERS: 4-8 distinct rooms of different sizes and shapes
- ROOM VARIETY:
  - 1 large central chamber (boss room / main hall)
  - 2-3 medium rooms (encounters)
  - 2-4 small rooms (storage, traps, secrets)
- EDGES: Rough organic (natural cave) OR straight cut (constructed dungeon)
- NO FADE TO BLACK inside playable rooms - keep floors visible
- VISUAL FLOW: Corridors should logically connect chambers
- DEPTH SUGGESTION: Subtle shadows at wall bases (optional)

${ATLAS_USABILITY_RULES}

CONTENT CONTEXT:
- Dungeon: "${opts.locationName}"
${opts.locationType ? `- Type: ${opts.locationType}` : ''}
${opts.description ? `- Atmosphere: ${opts.description}` : ''}
${childCount > 0 ? `- Key chambers/areas: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

OUTPUT: Top-down dungeon map, high contrast, clear chambers and corridors, dark atmospheric.
`.trim()
  },

  wilderness: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const detailLevel = getDetailLevel('wilderness')
    const childCount = opts.childLocations?.length || 0

    return `
Fantasy Wilderness Area Map for "${opts.locationName}".

${CRITICAL_VIEWPOINT_RULES}

${NO_TEXT_RULES}

${buildStyleFingerprint(style)}

${getDetailLevelRules(detailLevel)}

STRUCTURAL RECIPE - WILDERNESS MAP:
- NATURAL SHAPES: Organic boundaries, no straight lines
- PRIMARY TERRAIN: Dominant terrain type covering 60-70% of map
- SECONDARY FEATURES: 2-3 contrasting terrain elements
- PATHS/TRAILS: Thin winding lines suggesting travel routes
- CLEARINGS: 4-6 open areas suitable for encounter markers
- WATER: Streams, ponds, or river sections in dark blue-gray
- ELEVATION: Suggest height through color value (darker = lower or higher)
- POINTS OF INTEREST: Visual anchors for:
  - Crossroads, river crossings, ruins, caves, camps, rock formations

${ATLAS_USABILITY_RULES}

${SYMBOL_LANGUAGE_RULES}

CONTENT CONTEXT:
- Wilderness: "${opts.locationName}"
${opts.locationType ? `- Type: ${opts.locationType}` : ''}
${opts.description ? `- Description: ${opts.description}` : ''}
${opts.terrain ? `- Primary terrain: ${opts.terrain}` : ''}
${childCount > 0 ? `- Points of interest: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

OUTPUT: Natural wilderness map, organic shapes, clear paths, marker-friendly clearings.
`.trim()
  },
}

// ============================================
// MAIN BUILDER FUNCTION
// ============================================

export function buildMapPrompt(options: MapPromptOptions): string {
  const category = getLocationCategory(options.locationType)
  const promptBuilder = CATEGORY_PROMPTS[category]
  return promptBuilder(options)
}

// ============================================
// GENERATION SETTINGS
// ============================================

export function getMapGenerationSettings(category: LocationCategory, _style?: CampaignMapStyle) {
  // Comprehensive negative prompt for map-specific failures
  const negativePrompt = [
    // Text and labels
    'text',
    'words',
    'labels',
    'letters',
    'numbers',
    'runes',
    'glyphs',
    'title',
    'name',
    'legend',
    'key',
    'calligraphy',
    'writing',
    'inscription',
    // Map decorations
    'compass rose',
    'compass',
    'north arrow',
    'directional indicator',
    'border frame',
    'decorative border',
    'corner ornaments',
    'scroll border',
    'map legend',
    'map key',
    'scale bar',
    // Grids
    'grid',
    'hex grid',
    'square grid',
    'tabletop grid',
    'battle grid',
    // Perspective issues
    '3D render',
    'isometric',
    'perspective',
    'tilted',
    'angled view',
    'vanishing point',
    'horizon line',
    'bird eye angle',
    // Quality issues
    'low quality',
    'blurry',
    'pixelated',
    'jpeg artifacts',
    'watermark',
    'signature',
    'logo',
    'UI overlay',
    // Style issues
    'modern',
    'sci-fi',
    'futuristic',
    'photo realistic photograph',
    'heavy stains',
    'coffee stains',
    'torn paper',
    'burned edges',
    'overly bright',
    'neon colors',
    'saturated colors',
  ].join(', ')

  // Category-specific adjustments
  const categorySettings: Record<LocationCategory, { contrast: string; detail: string }> = {
    world: { contrast: 'medium', detail: 'low micro-detail, large shapes' },
    region: { contrast: 'medium', detail: 'balanced detail' },
    settlement: { contrast: 'high', detail: 'sharp building edges' },
    building: { contrast: 'very high', detail: 'crisp wall lines' },
    dungeon: { contrast: 'very high', detail: 'sharp room boundaries' },
    wilderness: { contrast: 'medium', detail: 'organic textures' },
  }

  return {
    width: 1024,
    height: 1024,
    quality: 'hd' as const,
    style: 'natural' as const,
    negativePrompt,
    categoryHints: categorySettings[category],
  }
}
