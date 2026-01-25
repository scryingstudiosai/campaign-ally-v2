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
// ============================================
export const MAP_VISUAL_PRESETS: Record<string, { name: string; description: string; prompt: string }> = {
  'classic-dnd': {
    name: 'Classic D&D',
    description: 'Official Sword Coast style - watercolor, soft pastels, professional cartography',
    prompt: `Style: Official Dungeons & Dragons cartography like the Sword Coast map.
Watercolor painting aesthetic with soft but varied colors.
Muted pastels - cyan waters, sage greens, tan deserts, white-gray mountains with snow caps.
Elegant, timeless, professional quality. Subtle parchment texture.
Mountains rendered as dramatic ranges with individually defined peaks and shadows.
Forests as dense clusters of stylized trees with varying shades of green.
Water with rich blue gradients and subtle wave texture.`,
  },
  'vibrant-inkarnate': {
    name: 'Vibrant Digital',
    description: 'Inkarnate style - saturated colors, high detail, video-game quality',
    prompt: `Style: Modern digital fantasy map like Inkarnate premium assets.
Vibrant, saturated colors with high contrast between terrain types.
Crisp details - individual trees, defined mountain peaks, clear water gradients.
Video-game quality illustration, bold and eye-catching.
Deep ocean blues, lush forest greens, golden plains, dramatic gray/brown mountains.
Every terrain type visually DISTINCT and beautiful.
Edge-to-edge illustration, no empty borders.`,
  },
  'painted-epic': {
    name: 'Painted Epic',
    description: 'Rich painted style - dramatic, adventurous, living world feel',
    prompt: `Style: Epic painted fantasy illustration map.
Rich earth tones, dramatic lighting, sense of adventure and scale.
Mountains with atmospheric perspective, forests with depth and shadow.
Decorative stylized waves, dramatic coastlines.
Painterly watercolor aesthetic with vibrant but harmonious colors.
Color palette: Deep ocean blues, lush forest greens, golden plains, brown/gray mountains with snow caps, warm sandy deserts.
Feels like a painting you'd hang on a wall - professional illustration art quality.`,
  },
  'dark-fantasy': {
    name: 'Dark Fantasy',
    description: 'Gritty and atmospheric - muted tones, ominous feel',
    prompt: `Style: Dark fantasy cartography with ominous atmosphere.
Desaturated, moody color palette - deep greens, grays, muted browns.
Foreboding mountains, twisted forests, murky waters.
Weathered parchment feel, slightly gritty texture.
Evokes danger and mystery.
Mountains with sharp, threatening silhouettes.
Forests appear dense and impenetrable.
Still richly detailed, not flat or plain.`,
  },
  'parchment-classic': {
    name: 'Aged Parchment',
    description: 'Hand-drawn on old paper - sepia tones, vintage feel',
    prompt: `Style: Hand-drawn map on aged parchment paper.
Sepia and brown ink tones with cream/tan background.
Crosshatching for terrain, hand-lettered aesthetic (but no actual text).
Vintage cartography feel like an old explorer's map.
Worn edges, subtle staining, historical authenticity.
Mountains drawn as small peaked symbols in ink.
Forests as clustered tree symbols.
Still beautiful and detailed, not plain or generic.`,
  },
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
    prompt: MAP_VISUAL_PRESETS['parchment-classic'].prompt,
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
    prompt: MAP_VISUAL_PRESETS['vibrant-inkarnate'].prompt,
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
