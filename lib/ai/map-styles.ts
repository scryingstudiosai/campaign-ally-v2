// Map style configuration for consistent campaign aesthetics

export interface CampaignMapStyle {
  artDirection: 'parchment-ink' | 'painted-cartography' | 'blueprint-dark' | 'vtt-realistic' | 'darkest-dungeon'
  lineWeight: 'thin' | 'medium' | 'bold'
  texture: 'minimal' | 'subtle' | 'medium'
  palette: 'dark-muted' | 'ashen' | 'sepia-dark' | 'blue-noir' | 'forest-night'
}

export interface MapStylePreset extends CampaignMapStyle {
  label: string
  description: string
}

export const MAP_STYLE_PRESETS: Record<string, MapStylePreset> = {
  'classic-fantasy': {
    label: 'Classic Fantasy',
    description: 'Painted cartography with muted earth tones',
    artDirection: 'painted-cartography',
    lineWeight: 'medium',
    texture: 'subtle',
    palette: 'dark-muted',
  },
  'parchment-ink': {
    label: 'Parchment & Ink',
    description: 'Hand-drawn style like Tolkien maps',
    artDirection: 'parchment-ink',
    lineWeight: 'thin',
    texture: 'subtle',
    palette: 'sepia-dark',
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
  },
  'darkest-dungeon': {
    label: 'Darkest Dungeon',
    description: 'High contrast noir, dramatic shadows',
    artDirection: 'darkest-dungeon',
    lineWeight: 'bold',
    texture: 'minimal',
    palette: 'ashen',
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
