// Comprehensive map prompt builder for Atlas map generation

import { CampaignMapStyle, DEFAULT_MAP_STYLE, MAP_VISUAL_PRESETS } from './map-styles'

export type LocationCategory = 'world' | 'region' | 'settlement' | 'building' | 'dungeon' | 'wilderness'
export type MapDetailLevel = 'overview' | 'standard' | 'detailed'

// Re-export for convenience
export { MAP_VISUAL_PRESETS }

// Aspect ratio options for map generation
export type MapAspectRatio = 'square' | 'landscape' | 'portrait'

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
  // New: Aspect ratio selection
  aspectRatio?: MapAspectRatio
  // New: Include text labels on map
  includeLabels?: boolean
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
// Now a function to handle includeLabels option
const getCriticalFirstRules = (includeLabels: boolean = false): string => {
  if (includeLabels) {
    return `
⚠️ CRITICAL - READ FIRST ⚠️
THIS MAP MAY INCLUDE LOCATION LABELS.

LABELS ALLOWED:
✓ Elegant, readable location labels for major landmarks
✓ Font style matching the map aesthetic
✓ Labels positioned near features without obscuring terrain

STILL FORBIDDEN:
❌ NO LEGEND - no map key, no explanatory box
❌ NO COMPASS - no compass rose, no "N" arrow
❌ NO UI ELEMENTS - no borders, frames, decorative corners
❌ NO GRID - no hex grid, no square grid

REQUIRED VIEW:
✓ STRICTLY 2D flat top-down view (like looking at paper on a table)
✓ Camera exactly 90° straight down - NO tilt, NO perspective, NO 3D
✓ NO horizon line, NO vanishing points, NO isometric angle
`.trim()
  }

  return `
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
}

// Legacy constant for backwards compatibility
const CRITICAL_FIRST_RULES = getCriticalFirstRules(false)

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

// Get text/label rules based on includeLabels option
const getTextRules = (includeLabels: boolean): string => {
  if (includeLabels) {
    return `
LABELS - Include elegant, stylized location labels:
- Add clear, readable text labels for major landmarks and regions
- Use a font style that matches the map aesthetic (fantasy calligraphy for classic, clean sans-serif for digital, etc.)
- Labels should be decorative but legible
- Position labels near their features without obscuring terrain
- Still NO legend box, NO compass rose, NO title banner
`.trim()
  }
  return `
NO TEXT - Absolutely no text anywhere on the map:
- NO labels, names, titles, or words of any kind
- NO legend or key boxes
- NO compass rose with letters
- NO scale bars with numbers
- Users will add their own interactive markers
`.trim()
}

// ============================================
// GEOGRAPHIC REALISM RULES
// ============================================
const GEOGRAPHIC_REALISM_RULES = `
GEOGRAPHIC LOGIC - The map MUST make real-world geographic sense:

RIVERS (critical):
- Rivers ALWAYS flow from HIGH elevation (mountains/hills) DOWN to sea or lake
- Rivers CONVERGE (join together) as they flow downhill - they do NOT split except at deltas near coast
- Rivers follow valleys BETWEEN hills/mountains, NEVER flow over peaks
- A city cannot be "upstream" of a mountain that blocks the river source

SETTLEMENTS:
- Major cities located at: river mouths, natural harbors, crossroads, or near resources
- Villages cluster near water sources and farmable land
- Fortresses/castles on HIGH GROUND for defense
- NO settlements randomly placed in dense forest or on mountain peaks

TERRAIN DISTRIBUTION:
- Mountains form in CHAINS or RANGES, not randomly scattered individual peaks
- Deserts form on the leeward (rain shadow) side of mountain ranges
- Forests need adequate rainfall - place near water or in wet climate zones
- Swamps/marshes in LOW-LYING areas near coasts or slow river sections
- Farmland NEAR settlements and water sources

ROADS:
- Roads connect settlements following the EASIEST terrain path
- Roads go THROUGH mountain passes, not directly over peaks
- Trade routes follow rivers or coastlines where possible
`.trim()

// Aspect ratio instructions
const getAspectRatioInstructions = (ratio: MapAspectRatio): string => {
  switch (ratio) {
    case 'landscape':
      return `
ASPECT RATIO: LANDSCAPE (wide format, approximately 16:9 or 3:2)
- The map should be WIDER than it is tall
- Compose the terrain to take advantage of the horizontal space
- Good for showing coastlines, mountain ranges running east-west, or wide regions
`.trim()
    case 'portrait':
      return `
ASPECT RATIO: PORTRAIT (tall format, approximately 9:16 or 2:3)
- The map should be TALLER than it is wide
- Compose the terrain to take advantage of the vertical space
- Good for showing river valleys, north-south mountain ranges, or long regions
`.trim()
    default:
      return `
ASPECT RATIO: SQUARE (1:1)
- The map should fill a square canvas evenly
- Balance composition in all directions
`.trim()
  }
}

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
${getCriticalFirstRules(opts.includeLabels)}

${stylePrompt}

${GEOGRAPHIC_REALISM_RULES}

${getAspectRatioInstructions(opts.aspectRatio || 'square')}

Create a fantasy world/continent map for "${opts.locationName}".

WORLD MAP STRUCTURE:
- Landmass(es) surrounded by ocean
- 2-3 mountain RANGES (not scattered peaks) with proper rain shadow effects
- Rivers flowing FROM mountains DOWN to sea, converging as they go
- Multiple distinct biomes placed logically based on geography
- Major cities at river mouths, harbors, or crossroads
- ${Math.max(6, childCount)} distinct regions for marker placement

${NO_BORDERS_RULE}

${opts.description ? `WORLD THEME: ${opts.description}` : ''}
${opts.climate ? `DOMINANT CLIMATE: ${opts.climate}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `KEY REGIONS (place logically based on geography, NOT labeled): ${opts.childLocations!.map((c) => `${c.name} (${c.type})`).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

CRITICAL REMINDERS:
- ZERO text, labels, legend, or compass anywhere
- Strictly 2D TOP-DOWN orthographic view (bird's eye, not angled)
- Edge-to-edge illustration filling the canvas
- Follow the SPECIFIC rendering technique described above - each style should look DRAMATICALLY different
`.trim()
  },

  region: (opts) => {
    const childCount = opts.childLocations?.length || 0
    const stylePrompt = opts.visualStyle
      ? MAP_VISUAL_PRESETS[opts.visualStyle]?.prompt
      : opts.campaignStyle?.prompt || MAP_VISUAL_PRESETS['classic-dnd'].prompt

    return `
${getCriticalFirstRules(opts.includeLabels)}

${stylePrompt}

${GEOGRAPHIC_REALISM_RULES}

${getAspectRatioInstructions(opts.aspectRatio || 'square')}

Create a fantasy regional map for "${opts.locationName}".

REGIONAL MAP STRUCTURE:
- Rivers flowing DOWNHILL from high ground to low, converging (not splitting)
- Roads connecting settlements via LOGICAL paths (through passes, along rivers)
- Terrain placed with geographic logic:
  * Mountains in RANGES, not scattered
  * Forests in areas with adequate rainfall
  * Settlements near water and crossroads
  * Farmland surrounding villages
- ${Math.max(6, childCount)} distinct landmark zones for marker placement

${NO_BORDERS_RULE}

${opts.description ? `REGION THEME: ${opts.description}` : ''}
${opts.terrain ? `PRIMARY TERRAIN: ${opts.terrain}` : ''}
${opts.climate ? `CLIMATE: ${opts.climate}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `KEY LOCATIONS (place based on geographic logic - cities near water/roads, fortresses on high ground, etc.): ${opts.childLocations!.map((c) => `${c.name} (${c.type})`).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

CRITICAL REMINDERS:
- ZERO text, labels, legend, or compass anywhere
- Strictly 2D TOP-DOWN orthographic view (bird's eye, not angled)
- Edge-to-edge illustration filling the canvas
- Follow the SPECIFIC rendering technique described above - each style should look DRAMATICALLY different
`.trim()
  },

  settlement: (opts) => {
    const childCount = opts.childLocations?.length || 0
    const stylePrompt = opts.visualStyle
      ? MAP_VISUAL_PRESETS[opts.visualStyle]?.prompt
      : opts.campaignStyle?.prompt || MAP_VISUAL_PRESETS['classic-dnd'].prompt

    return `
${getCriticalFirstRules(opts.includeLabels)}

${stylePrompt}

${getAspectRatioInstructions(opts.aspectRatio || 'square')}

Create a fantasy city/town map for "${opts.locationName}".

SETTLEMENT LOGIC:
- City placement makes sense: near river, harbor, or crossroads
- If there's a river, it flows THROUGH logically (enters from one side, exits another or to sea)
- Castle/fortress on highest ground for defense
- Market district near main gates or central crossroads
- Docks/harbor district along waterfront if coastal/river city
- Poor districts toward edges, wealthy toward center or high ground

STRUCTURE:
- Clear boundary: walls, river, or natural edge
- Main roads connecting gates through center
- 4-6 visually distinct districts
- Buildings as roof shapes from directly above
- At least 6 clear areas for marker placement

${NO_BORDERS_RULE}

${opts.description ? `SETTLEMENT CHARACTER: ${opts.description}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `KEY DISTRICTS (place logically - docks near water, castle on high ground, etc.): ${opts.childLocations!.map((c) => `${c.name} (${c.type})`).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

CRITICAL REMINDERS:
- ZERO text, labels, legend, or compass anywhere
- Strictly 2D TOP-DOWN orthographic view (bird's eye, not angled)
- Edge-to-edge illustration filling the canvas
- Follow the SPECIFIC rendering technique described above
`.trim()
  },

  building: (opts) => {
    const childCount = opts.childLocations?.length || 0

    return `
${getCriticalFirstRules(opts.includeLabels)}

${getAspectRatioInstructions(opts.aspectRatio || 'square')}

Create a detailed architectural floor plan for "${opts.locationName}".

FLOOR PLAN STYLE:
- Professional tabletop RPG battlemap quality
- Rich textures on floors: wood grain, stone tiles, carpet patterns
- Walls as thick dark lines with clear separation
- High contrast between floor and walls

STRUCTURE:
- Logical room layout with clear flow between spaces
- Doors shown as gaps in walls
- Floor textures vary by room type
- Furniture as simple shapes from above
- One main hall or central organizing space
- Clear walkable paths between furniture

${NO_BORDERS_RULE}

${opts.description ? `BUILDING CHARACTER: ${opts.description}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `ROOMS TO INCLUDE: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

CRITICAL REMINDERS:
- ZERO text, labels, or room names anywhere
- Strictly 2D TOP-DOWN orthographic view
- Edge-to-edge illustration filling the canvas
`.trim()
  },

  dungeon: (opts) => {
    const childCount = opts.childLocations?.length || 0

    return `
${getCriticalFirstRules(opts.includeLabels)}

${getAspectRatioInstructions(opts.aspectRatio || 'square')}

Create a professional dungeon battlemap for "${opts.locationName}".

DUNGEON MAP STYLE:
- High quality tabletop RPG battlemap
- Very high contrast: detailed floor textures against dark solid walls/rock
- Atmospheric but functional for gameplay

STRUCTURE:
- Solid dark rock or stone for walls
- Rich floor textures (stone tiles, rough cave floor)
- Corridors connecting 4-8 chambers
- One large central chamber, several smaller rooms
- Consistent edge style (organic caves OR constructed)
- Clear floor visibility in all playable areas

${NO_BORDERS_RULE}

${opts.description ? `DUNGEON ATMOSPHERE: ${opts.description}` : ''}
${opts.additionalContext ? `THEME: ${opts.additionalContext}` : ''}
${childCount > 0 ? `KEY CHAMBERS: ${opts.childLocations!.map((c) => c.name).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

CRITICAL REMINDERS:
- ZERO text, labels, or room names anywhere
- Strictly 2D TOP-DOWN orthographic view
- Edge-to-edge illustration filling the canvas
`.trim()
  },

  wilderness: (opts) => {
    const childCount = opts.childLocations?.length || 0
    const stylePrompt = opts.visualStyle
      ? MAP_VISUAL_PRESETS[opts.visualStyle]?.prompt
      : opts.campaignStyle?.prompt || MAP_VISUAL_PRESETS['classic-dnd'].prompt

    return `
${getCriticalFirstRules(opts.includeLabels)}

${stylePrompt}

${GEOGRAPHIC_REALISM_RULES}

${getAspectRatioInstructions(opts.aspectRatio || 'square')}

Create a wilderness area map for "${opts.locationName}".

WILDERNESS STRUCTURE:
- Organic natural shapes (no artificial straight lines)
- Water flows DOWNHILL - streams and rivers converge, not split
- Terrain transitions make sense (forest to grassland to desert, not random)
- Primary terrain covering 60-70%
- 2-3 contrasting terrain elements
- Winding paths following natural contours
- 4-6 open clearings for marker placement
- Visual anchors: crossroads, river fords, ruins, cave mouths

${NO_BORDERS_RULE}

${opts.description ? `WILDERNESS CHARACTER: ${opts.description}` : ''}
${opts.terrain ? `PRIMARY TERRAIN: ${opts.terrain}` : ''}
${opts.climate ? `CLIMATE: ${opts.climate}` : ''}
${opts.additionalContext ? `ATMOSPHERE: ${opts.additionalContext}` : ''}
${childCount > 0 ? `POINTS OF INTEREST (place logically in terrain): ${opts.childLocations!.map((c) => `${c.name} (${c.type})`).join(', ')}` : ''}

${getRetryRules(opts.attemptNumber || 1)}

CRITICAL REMINDERS:
- ZERO text, labels, legend, or compass anywhere
- Strictly 2D TOP-DOWN orthographic view (bird's eye, not angled)
- Edge-to-edge illustration filling the canvas
- Follow the SPECIFIC rendering technique described above
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
