// Comprehensive map prompt builder for Atlas map generation

import { CampaignMapStyle, DEFAULT_MAP_STYLE, MAP_VISUAL_PRESETS } from './map-styles'

export type LocationCategory = 'world' | 'region' | 'settlement' | 'building' | 'dungeon' | 'wilderness'
export type MapDetailLevel = 'overview' | 'standard' | 'detailed'

// Re-export for convenience
export { MAP_VISUAL_PRESETS }

interface MapPromptOptions {
  locationName: string
  locationType: string
  description?: string
  childLocations?: Array<{ name: string; type: string }>
  terrain?: string
  climate?: string
  campaignStyle?: CampaignMapStyle
  attemptNumber?: number
  // New: Direct style preset selection
  visualStyle?: keyof typeof MAP_VISUAL_PRESETS
  additionalContext?: string
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

// ============================================
// VISUAL QUALITY RULES - For Professional D&D Cartography
// ============================================
const VISUAL_QUALITY_RULES = `
VISUAL STYLE - CRITICAL FOR QUALITY:
- Richly detailed fantasy world map in the style of official Dungeons & Dragons cartography
- Painterly watercolor aesthetic with vibrant but harmonious colors
- NOT flat or plain - this should look like professional illustration art
- Color palette: Deep ocean blues, lush forest greens, golden plains, brown/gray mountains with snow caps, warm sandy deserts
- Every terrain type should be visually DISTINCT and beautiful

TERRAIN RENDERING:
- Mountains: Dramatic ranges with individually defined peaks, snow-capped where appropriate, with shadows and depth
- Forests: Dense clusters of individual stylized trees, varying shades of green, not flat blobs
- Water: Rich blue with subtle wave texture or gradient, visible coastline detail
- Plains/Grasslands: Golden or light green with subtle texture variation
- Deserts: Warm sandy tones with dune textures
- Roads: Clear brown paths connecting locations
- Rivers: Natural flowing curves with darker blue, tributaries visible

COMPOSITION:
- Edge-to-edge illustration filling the entire canvas
- NO black borders, NO padding, NO margins, NO empty space around edges
- The map terrain should extend to all four edges of the image
- Epic sense of scale and adventure
- Professional quality suitable for a published game book
`.trim()

// No borders rule - added explicitly to combat black borders
const NO_BORDERS_RULE = `
COMPOSITION: Edge-to-edge illustration filling the entire canvas.
NO black borders, NO padding, NO margins, NO empty space around edges.
The map terrain should extend to all four edges of the image.
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
    const childCount = opts.childLocations?.length || 0
    const stylePrompt = opts.visualStyle
      ? MAP_VISUAL_PRESETS[opts.visualStyle]?.prompt
      : opts.campaignStyle?.prompt || MAP_VISUAL_PRESETS['classic-dnd'].prompt

    return `
${CRITICAL_FIRST_RULES}

${VISUAL_QUALITY_RULES}

Create a stunning fantasy world/continent map for "${opts.locationName}".

${stylePrompt}

WORLD MAP STRUCTURE:
- Grand landmass(es) surrounded by rich deep blue ocean with subtle wave textures
- 2-3 dramatic mountain ranges with snow-capped peaks, individually defined with shadows
- Multiple distinct biomes: lush green forests, golden plains, warm sandy deserts, icy tundra
- Major river systems flowing naturally from mountains to coast, with visible tributaries
- Organic coastlines with bays, peninsulas, and small islands
- ${Math.max(6, childCount)} distinct regions with clear visual separation for marker placement

QUALITY REQUIREMENTS:
- This must look like official D&D cartography, not a simple sketch
- Rich, varied colors - NOT flat single-tone greens
- Each terrain type visually distinct and beautiful
- Mountains with depth and drama, forests with individual tree detail
- Professional illustration quality

${NO_BORDERS_RULE}

${opts.description ? `WORLD THEME: ${opts.description}` : ''}
${opts.climate ? `DOMINANT CLIMATE: ${opts.climate}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `KEY REGIONS TO SHOW (as distinct visual zones, NOT labeled): ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map with ZERO text. No labels, legend, or compass. Strictly 2D top-down. Edge-to-edge illustration.
`.trim()
  },

  region: (opts) => {
    const childCount = opts.childLocations?.length || 0
    const stylePrompt = opts.visualStyle
      ? MAP_VISUAL_PRESETS[opts.visualStyle]?.prompt
      : opts.campaignStyle?.prompt || MAP_VISUAL_PRESETS['classic-dnd'].prompt

    return `
${CRITICAL_FIRST_RULES}

${VISUAL_QUALITY_RULES}

Create a stunning fantasy regional map for "${opts.locationName}".

${stylePrompt}

REGIONAL MAP STRUCTURE:
- Rich water features: rivers with natural curves, lakes with depth gradients, coastlines with detail
- Well-defined road network with brown paths connecting settlements and landmarks
- Multiple terrain types with CLEAR visual distinction:
  * Forests: Dense clusters of individual stylized trees, varying greens
  * Mountains: Dramatic peaks with snow caps where appropriate, shadows for depth
  * Plains: Golden or light green grasslands with subtle texture
  * Hills: Rolling terrain with shading
  * Farmland: Patchwork patterns in warm yellows and greens
  * Marsh/Swamp: Darker greens with water pockets
- ${Math.max(6, childCount)} distinct landmark zones with clear open areas for marker placement

QUALITY REQUIREMENTS:
- Professional D&D cartography quality - this should look like the Sword Coast map
- Rich, vibrant colors that vary across the map - NOT flat monotone
- Each area visually interesting and distinct
- Terrain has texture and depth, not flat colored blobs
- Epic sense of adventure and exploration

${NO_BORDERS_RULE}

${opts.description ? `REGION THEME: ${opts.description}` : ''}
${opts.terrain ? `PRIMARY TERRAIN: ${opts.terrain}` : ''}
${opts.climate ? `CLIMATE: ${opts.climate}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `KEY LOCATIONS TO SHOW (as distinct visual zones, NOT labeled): ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map with ZERO text. No labels, legend, or compass. Strictly 2D top-down. Edge-to-edge illustration.
`.trim()
  },

  settlement: (opts) => {
    const childCount = opts.childLocations?.length || 0
    const stylePrompt = opts.visualStyle
      ? MAP_VISUAL_PRESETS[opts.visualStyle]?.prompt
      : opts.campaignStyle?.prompt || MAP_VISUAL_PRESETS['classic-dnd'].prompt

    return `
${CRITICAL_FIRST_RULES}

${VISUAL_QUALITY_RULES}

Create a beautiful fantasy city/town map for "${opts.locationName}".

${stylePrompt}

SETTLEMENT MAP STRUCTURE:
- Distinctive boundary: stone walls, natural river bend, or coastline
- Central hub: grand plaza, market square, or castle grounds
- 4-6 visually distinct districts with different building densities and roof colors
- Main thoroughfares connecting gates through the city center
- Buildings rendered as detailed roof shapes from above:
  * Larger, grander buildings near center (temples, manors, guild halls)
  * Medium buildings for shops and homes
  * Smaller, denser buildings toward edges
- Water features: rivers, canals, harbor areas with rich blue tones
- Parks and gardens: green spaces breaking up the urban density
- At least 6 clear landmark zones for marker placement

QUALITY REQUIREMENTS:
- Professional fantasy cartography quality
- Buildings have varied roof colors: warm terracottas, grays, browns, some blue slate
- Streets clearly visible between buildings
- District character visible through building style/density
- Rich detail but still readable for placing markers

${NO_BORDERS_RULE}

${opts.description ? `SETTLEMENT CHARACTER: ${opts.description}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `KEY DISTRICTS/LOCATIONS (show as distinct areas, NOT labeled): ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map with ZERO text. No labels, legend, or compass. Strictly 2D top-down. Edge-to-edge illustration.
`.trim()
  },

  building: (opts) => {
    const childCount = opts.childLocations?.length || 0

    return `
${CRITICAL_FIRST_RULES}

Create a detailed architectural floor plan for "${opts.locationName}".

FLOOR PLAN STYLE:
- Professional tabletop RPG battlemap quality
- Rich textures on floors: wood grain, stone tiles, carpet patterns
- Walls as thick dark lines with clear separation
- High contrast between floor and walls

STRUCTURE:
- Logical room layout with clear flow between spaces
- Doors shown as gaps in walls (not drawn rectangles)
- Floor textures vary by room type:
  * Main halls: polished stone or elegant wood
  * Private rooms: warm wood floors, rugs
  * Service areas: simple stone
  * Special rooms: distinctive textures (library = wood, temple = marble)
- Furniture rendered as simple but recognizable shapes from above:
  * Tables: rectangles with slight detail
  * Chairs: small shapes around tables
  * Beds: rounded rectangles
  * Storage: rectangular chests, wardrobes
- One main hall or central organizing space
- Clear walkable paths between furniture

${NO_BORDERS_RULE}

${opts.description ? `BUILDING CHARACTER: ${opts.description}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `ROOMS TO INCLUDE (show as distinct spaces): ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual floor plan with ZERO text. No labels or room names. Strictly 2D top-down. Edge-to-edge illustration.
`.trim()
  },

  dungeon: (opts) => {
    const childCount = opts.childLocations?.length || 0

    return `
${CRITICAL_FIRST_RULES}

Create a professional dungeon battlemap for "${opts.locationName}".

DUNGEON MAP STYLE:
- High quality tabletop RPG battlemap
- Very high contrast: detailed floor textures against dark solid walls/rock
- Atmospheric but functional for gameplay

STRUCTURE:
- Solid dark rock or stone for walls and impassable areas
- Playable floor areas with rich texture:
  * Stone floors: individual tiles or flagstones visible
  * Cave floors: rough natural stone texture
  * Special areas: different textures for shrine, treasury, lair
- Corridors of varying widths connecting chambers
- 4-8 distinct rooms with variety:
  * 1 large central chamber (boss room, great hall)
  * 2-3 medium rooms (guardrooms, shrines, storage)
  * 2-4 small rooms (cells, alcoves, secret chambers)
- Edge style consistent throughout:
  * Natural caves: rough organic edges
  * Constructed: straight cut stone walls
- Clear floor visibility in all playable areas - no fade to black

VISUAL INTEREST:
- Occasional floor details: cracks, debris, puddles, old bloodstains
- Rubble piles near damaged walls
- Different floor elevations suggested by shading where appropriate

${NO_BORDERS_RULE}

${opts.description ? `DUNGEON ATMOSPHERE: ${opts.description}` : ''}
${opts.additionalContext ? `THEME: ${opts.additionalContext}` : ''}
${childCount > 0 ? `KEY CHAMBERS (show as distinct areas): ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map with ZERO text. No labels or room names. Strictly 2D top-down. Edge-to-edge illustration.
`.trim()
  },

  wilderness: (opts) => {
    const childCount = opts.childLocations?.length || 0
    const stylePrompt = opts.visualStyle
      ? MAP_VISUAL_PRESETS[opts.visualStyle]?.prompt
      : opts.campaignStyle?.prompt || MAP_VISUAL_PRESETS['classic-dnd'].prompt

    return `
${CRITICAL_FIRST_RULES}

${VISUAL_QUALITY_RULES}

Create a beautiful wilderness area map for "${opts.locationName}".

${stylePrompt}

WILDERNESS MAP STRUCTURE:
- Organic natural shapes throughout (no artificial straight lines)
- Primary terrain covering 60-70% with rich detail:
  * Forests: Individual stylized trees, varying shades of green, depth through shadows
  * Mountains: Dramatic peaks with snow where appropriate
  * Grasslands: Golden and green with subtle texture variation
  * Swamps: Dark greens with water pools and dead trees
- 2-3 contrasting terrain elements for visual variety
- Winding paths and trails in brown, naturally curving
- 4-6 open clearings for marker placement
- Water features with rich blue tones: streams, ponds, rivers
- Visual anchor points: clearings, crossroads, river fords, ancient ruins, cave mouths

QUALITY REQUIREMENTS:
- Professional fantasy cartography quality
- Rich, varied colors - each terrain type distinct
- Trees rendered individually or as detailed clusters, not flat blobs
- Sense of depth and adventure
- Beautiful enough to display as art

${NO_BORDERS_RULE}

${opts.description ? `WILDERNESS CHARACTER: ${opts.description}` : ''}
${opts.terrain ? `PRIMARY TERRAIN: ${opts.terrain}` : ''}
${opts.climate ? `CLIMATE: ${opts.climate}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `POINTS OF INTEREST (show as distinct visual areas, NOT labeled): ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

FINAL REMINDER: Pure visual map with ZERO text. No labels, legend, or compass. Strictly 2D top-down. Edge-to-edge illustration.
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
