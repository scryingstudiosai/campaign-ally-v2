// Map style configuration for consistent campaign aesthetics

export interface CampaignMapStyle {
  artDirection: 'parchment-ink' | 'painted-cartography' | 'blueprint-dark' | 'vtt-realistic' | 'darkest-dungeon'
  lineWeight: 'thin' | 'medium' | 'bold'
  texture: 'minimal' | 'subtle' | 'medium'
  palette: 'dark-muted' | 'ashen' | 'sepia-dark' | 'blue-noir' | 'forest-night'
  // Optional rich prompt text for visual style
  prompt?: string
}

export interface MapStylePreset extends CampaignMapStyle {
  label: string
  description: string
  // New: Rich prompt text for high-quality visual output
  prompt?: string
}

// ============================================
// NEW: Visual Quality Style Presets
// These produce professional D&D-quality cartography
// Each style has SPECIFIC rendering techniques to look dramatically different
// ============================================
export const MAP_VISUAL_PRESETS: Record<string, { name: string; description: string; prompt: string }> = {
  'classic-dnd': {
    name: 'Classic D&D',
    description: 'Soft watercolor, muted pastels, Forgotten Realms style',
    prompt: `
RENDERING TECHNIQUE: Traditional watercolor cartography
- Soft wet-on-wet watercolor washes with visible paper texture showing through
- Pigment granulation and subtle color bleeding at terrain edges
- MUTED, DESATURATED color palette: sage greens, dusty blues, cream, tan, soft grays
- NO bright saturated colors - everything should look faded and elegant
- Delicate linework underneath the watercolor, barely visible
- Mountains rendered as soft, hazy shapes with white snow caps fading into mist
- Forests as clustered soft green dabs, NOT individual trees
- Water with gentle gradient from light to dark blue toward center
- Overall feeling: aged, elegant, like a map from a 1980s fantasy novel
- Reference style: Classic TSR/Wizards of the Coast Forgotten Realms maps
`.trim()
  },

  'ink-lineart': {
    name: 'Ink Line Art',
    description: 'Black and white only - hand-drawn ink with crosshatching',
    prompt: `
RENDERING TECHNIQUE: Black ink on parchment, ABSOLUTELY NO COLOR
- Pure BLACK INK LINES ONLY on cream/beige parchment background
- Cross-hatching and stippling for ALL shading and texture
- Varying line weights: thick outlines, thin details
- Mountains drawn with parallel hatching lines for shadow side
- Forests as individual stylized tree SYMBOLS in clusters (not filled shapes)
- Water indicated by HORIZONTAL WAVE LINES pattern, NOT solid fill
- NO COLOR FILLS ANYWHERE - only black ink marks on light background
- Hand-drawn aesthetic with slight imperfections and wobbly lines
- This should look like a medieval manuscript or Tolkien's own hand-drawn maps
- CRITICAL: If you add ANY color beyond black/cream, you have failed
`.trim()
  },

  'vibrant-digital': {
    name: 'Vibrant Digital',
    description: 'Inkarnate/video game style - saturated colors, crisp edges',
    prompt: `
RENDERING TECHNIQUE: Modern digital illustration, CRISP and CLEAN
- Highly SATURATED, VIBRANT colors with STRONG contrast between zones
- CLEAN, SHARP, HARD EDGES between terrain types - NOT soft or painterly
- Cel-shaded aesthetic with distinct color zones and clear boundaries
- Individual tree ASSETS clearly visible as distinct shapes, not blobby clusters
- Mountains with HARD GEOMETRIC FACETS and bold cast shadows
- Water as SOLID GRADIENT FILLS with a very distinct, crisp shoreline
- Colors: BRIGHT rich greens, golden yellows, deep blues, warm browns
- Video game aesthetic - should look like a Civilization or strategy game map
- NO soft edges, NO watercolor effects, NO painterly brushstrokes
- Reference style: Inkarnate premium maps, video game world maps
`.trim()
  },

  'dark-fantasy': {
    name: 'Dark Fantasy',
    description: 'Gritty and ominous - heavily desaturated, deep shadows',
    prompt: `
RENDERING TECHNIQUE: Dark, gritty, OMINOUS illustration
- HEAVILY DESATURATED palette: charcoal grays, MUTED olive greens, deep browns, dried blood reds
- HIGH CONTRAST with DEEP BLACK SHADOWS and very limited highlights
- Scratchy, textured brush strokes suggesting decay and corruption
- TWISTED, GNARLED tree shapes in forests - nothing looks healthy
- Mountains as JAGGED, THREATENING silhouettes against dark sky
- Water as DARK, MURKY pools - no bright reflections, looks stagnant
- Overall OPPRESSIVE, FOREBODING atmosphere - this world is dangerous
- VIGNETTE DARKENING at all edges of the image
- Everything should feel threatening and unwelcoming
- Reference style: Dark Souls concept art, Darkest Dungeon game maps
`.trim()
  },

  'parchment-antique': {
    name: 'Antique Parchment',
    description: 'Aged explorer map - sepia/brown only, worn paper',
    prompt: `
RENDERING TECHNIQUE: Aged historical map on OLD PARCHMENT
- COLOR PALETTE: SEPIA, BROWN, TAN, AND CREAM ONLY - absolutely NO greens, blues, or other colors
- Aged, YELLOWED parchment texture with visible stains, foxing, and wear marks
- ALL terrain drawn in BROWN/SEPIA INK only
- Mountains as simple TRIANGULAR SYMBOLS arranged in rows
- Forests as small clustered TREE PICTOGRAMS (symbolic, not realistic)
- Water areas filled with HORIZONTAL LINE PATTERN, not solid color
- Worn edges, FOLD CREASES visible, coffee-ring stains
- HANDWRITTEN aesthetic for all elements - nothing looks mechanical
- Should look like a 16th century exploration map or portolan chart
- CRITICAL: If ANY color besides sepia/brown/cream appears, you have failed
`.trim()
  },

  'painted-epic': {
    name: 'Painted Epic',
    description: 'Fantasy concept art - dramatic lighting, cinematic',
    prompt: `
RENDERING TECHNIQUE: Epic fantasy CONCEPT ART painting
- Rich OIL PAINTING aesthetic with VISIBLE BRUSHSTROKES
- DRAMATIC LIGHTING with god rays, atmospheric haze, and rim lighting
- Highly detailed terrain with strong sense of DEPTH and DIMENSION
- Mountains with ATMOSPHERIC PERSPECTIVE (distant mountains = hazy blue)
- Forests with individual tree canopy detail and DAPPLED SHADOWS
- Water with REALISTIC REFLECTIONS and subtle wave texture
- WARM/COOL COLOR CONTRAST for visual drama (warm foreground, cool distance)
- CINEMATIC COMPOSITION with clear focal points and visual flow
- This should look like professional fantasy book cover art
- Reference style: Lord of the Rings concept art, Magic: The Gathering landscapes
`.trim()
  }
}

// Legacy presets for backwards compatibility
export const MAP_STYLE_PRESETS: Record<string, MapStylePreset> = {
  'classic-fantasy': {
    label: 'Classic Fantasy',
    description: 'Painted cartography with muted earth tones',
    artDirection: 'painted-cartography',
    lineWeight: 'medium',
    texture: 'subtle',
    palette: 'dark-muted',
    prompt: MAP_VISUAL_PRESETS['painted-epic'].prompt,
  },
  'parchment-ink': {
    label: 'Parchment & Ink',
    description: 'Hand-drawn style like Tolkien maps',
    artDirection: 'parchment-ink',
    lineWeight: 'thin',
    texture: 'subtle',
    palette: 'sepia-dark',
    prompt: MAP_VISUAL_PRESETS['parchment-antique'].prompt,
  },
  'blueprint': {
    label: 'Blueprint',
    description: 'Clean technical style, high contrast',
    artDirection: 'blueprint-dark',
    lineWeight: 'medium',
    texture: 'minimal',
    palette: 'blue-noir',
  },
  'vtt-battlemap': {
    label: 'VTT Battlemap',
    description: 'Realistic style optimized for virtual tabletop',
    artDirection: 'vtt-realistic',
    lineWeight: 'bold',
    texture: 'medium',
    palette: 'dark-muted',
    prompt: MAP_VISUAL_PRESETS['vibrant-digital'].prompt,
  },
  'darkest-dungeon': {
    label: 'Darkest Dungeon',
    description: 'High contrast noir, dramatic shadows',
    artDirection: 'darkest-dungeon',
    lineWeight: 'bold',
    texture: 'minimal',
    palette: 'ashen',
    prompt: MAP_VISUAL_PRESETS['dark-fantasy'].prompt,
  },
}

export const DEFAULT_MAP_STYLE: CampaignMapStyle = {
  artDirection: MAP_STYLE_PRESETS['classic-fantasy'].artDirection,
  lineWeight: MAP_STYLE_PRESETS['classic-fantasy'].lineWeight,
  texture: MAP_STYLE_PRESETS['classic-fantasy'].texture,
  palette: MAP_STYLE_PRESETS['classic-fantasy'].palette,
}

// Get style preset key from a CampaignMapStyle object
export function getStylePresetKey(style: CampaignMapStyle): string | null {
  for (const [key, preset] of Object.entries(MAP_STYLE_PRESETS)) {
    if (preset.artDirection === style.artDirection) {
      return key
    }
  }
  return null
}
