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

// These rules MUST appear at the START of every prompt for maximum impact
const CRITICAL_FIRST_RULES = `
⚠️ CRITICAL - READ FIRST ⚠️
THIS IS A PURE VISUAL MAP WITH ZERO TEXT.

FORBIDDEN (will reject image if present):
❌ NO TEXT - no words, labels, names, titles, letters, numbers, runes, glyphs
❌ NO LEGEND - no map key, no explanatory box, no symbol reference
❌ NO COMPASS - no compass rose, no directional indicators, no "N" arrow
❌ NO UI ELEMENTS - no borders, frames, decorative corners, watermarks
❌ NO GRID - no hex grid, no square grid, no measurement lines

REQUIRED VIEW:
✓ STRICTLY 2D flat top-down view (like looking at paper on a table)
✓ Camera exactly 90° straight down - NO tilt, NO perspective, NO 3D
✓ NO horizon line, NO vanishing points, NO isometric angle
`.trim()

// Legacy constants kept for compatibility
const CRITICAL_VIEWPOINT_RULES = `
VIEWPOINT: Strictly 2D top-down orthographic (90° straight down, zero tilt).
`.trim()

const NO_TEXT_RULES = `
TEXT: Absolutely none. No words, labels, legends, compass, borders, or grid.
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
⚠️ RETRY #2 - PREVIOUS IMAGE HAD TEXT/LABELS - FIX THIS:
- The ONLY acceptable output is a PURE VISUAL map with ZERO TEXT
- If you added ANY text, labels, legend, or compass - DO NOT do that
- Imagine someone will print this and write their own labels by hand
- Leave it BLANK of any writing whatsoever
`.trim()
  }

  return `
🚨 RETRY #${attemptNumber} - CRITICAL FAILURE MODE:
- Previous attempts had forbidden elements (text/labels/legend)
- This attempt: EXTREME SIMPLICITY
- Large simple terrain shapes ONLY
- NO decorations, NO symbols, NO text of ANY kind
- Think: hand-painted map with NO writing at all
- If in doubt, leave it OUT
`.trim()
}

// ============================================
// CATEGORY-SPECIFIC STRUCTURAL RECIPES
// ============================================

const CATEGORY_PROMPTS: Record<LocationCategory, (opts: MapPromptOptions) => string> = {
  world: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const childCount = opts.childLocations?.length || 0

    return `
${CRITICAL_FIRST_RULES}

Create a fantasy world/continent map for "${opts.locationName}".

STYLE: ${style.artDirection} - muted dark earth tones, ${style.lineWeight} lines, ${style.texture} texture.

STRUCTURE:
- Landmass(es) surrounded by dark navy ocean
- 1-2 mountain ranges as symbolic ridges (viewed from above)
- 2-4 terrain biomes: forests, deserts, plains, tundra
- 1-2 river systems flowing to coast
- Organic coastlines with bays and peninsulas
- ${Math.max(6, childCount)} distinct open areas for placing markers

COLORS: Dark palette only. Ocean = dark navy/slate (never bright blue). Land = muted earth tones.

${opts.description ? `CONTEXT: ${opts.description}` : ''}
${opts.climate ? `CLIMATE: ${opts.climate}` : ''}
${childCount > 0 ? `MUST INCLUDE ZONES FOR: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map. NO text, NO labels, NO legend, NO compass. Strictly 2D top-down.
`.trim()
  },

  region: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const childCount = opts.childLocations?.length || 0

    return `
${CRITICAL_FIRST_RULES}

Create a fantasy regional map for "${opts.locationName}".

STYLE: ${style.artDirection} - muted dark earth tones, ${style.lineWeight} lines, ${style.texture} texture.

STRUCTURE:
- River or coastline as water feature (dark blue-gray, not bright)
- Road network connecting 3-6 landmark areas (thin brown lines)
- 2-4 terrain types: forests (dark green), hills, farmland, marsh
- Mountains as symbolic ridges viewed from above
- Central open area for the main settlement/capital
- ${Math.max(6, childCount)} distinct zones for placing markers

TERRAIN SYMBOLS (all viewed from above):
- Mountains: small peaked symbols, not 3D ridges
- Forests: clustered tree canopy texture
- Roads: thin connecting lines
- Water: dark slate blue, never bright

${opts.description ? `CONTEXT: ${opts.description}` : ''}
${opts.terrain ? `PRIMARY TERRAIN: ${opts.terrain}` : ''}
${childCount > 0 ? `MUST INCLUDE ZONES FOR: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map. NO text, NO labels, NO legend, NO compass. Strictly 2D top-down.
`.trim()
  },

  settlement: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const childCount = opts.childLocations?.length || 0

    return `
${CRITICAL_FIRST_RULES}

Create a fantasy city/town map for "${opts.locationName}".

STYLE: ${style.artDirection} - muted dark tones, ${style.lineWeight} lines, ${style.texture} texture.

STRUCTURE:
- City walls or natural boundary (thick dark lines)
- Central plaza/market square (large open area)
- 3-5 distinct districts separated by main roads
- Main road spine connecting gates through center
- Buildings as simple dark roof shapes (not blobs)
- Vary building sizes: larger near center, smaller at edges
- Water feature if appropriate (dark blue-gray)
- At least 6 clear open zones for markers

BUILDINGS: Simple geometric roof shapes viewed from directly above. NOT painterly blobs.

${opts.description ? `CONTEXT: ${opts.description}` : ''}
${childCount > 0 ? `NOTABLE LOCATIONS TO INCLUDE: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map. NO text, NO labels, NO legend, NO compass. Strictly 2D top-down.
`.trim()
  },

  building: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const childCount = opts.childLocations?.length || 0

    return `
${CRITICAL_FIRST_RULES}

Create an architectural floor plan for "${opts.locationName}".

STYLE: ${style.artDirection} - high contrast, ${style.lineWeight} lines, ${style.texture} texture.

STRUCTURE:
- Walls: thick dark lines (high contrast)
- Rooms: clearly delineated distinct spaces
- Doors: gaps in walls (not rectangles)
- Floors: muted stone/wood texture (dark browns/grays)
- Furniture: simple dark shapes (tables=rectangles, beds=rounded rectangles, chairs=squares)
- One main hall or central corridor
- Clear walkable space between furniture

${opts.description ? `CONTEXT: ${opts.description}` : ''}
${childCount > 0 ? `ROOMS TO INCLUDE: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual floor plan. NO text, NO labels, NO legend. Strictly 2D top-down.
`.trim()
  },

  dungeon: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const childCount = opts.childLocations?.length || 0

    return `
${CRITICAL_FIRST_RULES}

Create a dungeon battlemap for "${opts.locationName}".

STYLE: ${style.artDirection} - very high contrast, ${style.lineWeight} lines, ${style.texture} texture.

STRUCTURE:
- High contrast: light/medium floors against very dark walls
- Solid dark rock for impassable/unexplored areas
- Corridors of varying widths connecting chambers
- 4-8 distinct rooms: 1 large central, 2-3 medium, 2-4 small
- Edges: rough organic (cave) OR straight cut (constructed)
- Floors must stay visible - no fade to black in playable areas

${opts.description ? `ATMOSPHERE: ${opts.description}` : ''}
${childCount > 0 ? `KEY CHAMBERS: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map. NO text, NO labels, NO legend. Strictly 2D top-down.
`.trim()
  },

  wilderness: (opts) => {
    const style = opts.campaignStyle || DEFAULT_MAP_STYLE
    const childCount = opts.childLocations?.length || 0

    return `
${CRITICAL_FIRST_RULES}

Create a wilderness area map for "${opts.locationName}".

STYLE: ${style.artDirection} - muted natural tones, ${style.lineWeight} lines, ${style.texture} texture.

STRUCTURE:
- Organic natural shapes (no straight lines)
- Primary terrain covering 60-70% of map
- 2-3 contrasting terrain elements
- Thin winding paths/trails
- 4-6 open clearings for markers
- Water in dark blue-gray (streams, ponds)
- Visual anchors: crossroads, river crossings, ruins, caves, camps

${opts.description ? `CONTEXT: ${opts.description}` : ''}
${opts.terrain ? `PRIMARY TERRAIN: ${opts.terrain}` : ''}
${childCount > 0 ? `POINTS OF INTEREST: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map. NO text, NO labels, NO legend, NO compass. Strictly 2D top-down.
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
