/**
 * Image Generation Style Presets
 *
 * Professional-grade style presets for AI image generation that complement
 * the entity type prompts. These styles define the artistic approach while
 * entity types define the subject matter.
 */

export interface ImageStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  negativePrompt?: string;
  thumbnail?: string;
}

export interface ImageStyleCategory {
  id: string;
  name: string;
  styles: ImageStyle[];
}

/**
 * Core art style presets
 */
export const ART_STYLES: ImageStyle[] = [
  {
    id: 'classic-fantasy',
    name: 'Classic Fantasy',
    description: 'Traditional fantasy art style inspired by classic RPG illustrations',
    prompt: 'classic fantasy art style, oil painting technique, rich colors, detailed brushwork, reminiscent of Larry Elmore and Keith Parkinson, traditional fantasy RPG illustration',
  },
  {
    id: 'grimdark',
    name: 'Grimdark',
    description: 'Dark, gritty, and atmospheric with muted colors',
    prompt: 'grimdark fantasy style, dark and gritty, muted desaturated colors, heavy shadows, weathered textures, atmospheric fog, ominous mood, realistic proportions',
  },
  {
    id: 'high-fantasy',
    name: 'High Fantasy',
    description: 'Epic, vibrant, and magical with dramatic lighting',
    prompt: 'high fantasy art style, epic and grand, vibrant saturated colors, magical glow effects, dramatic god rays, ethereal atmosphere, painterly technique',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft, dreamy watercolor painting aesthetic',
    prompt: 'watercolor painting style, soft edges, flowing color bleeds, dreamy atmosphere, paper texture visible, delicate details, fantasy storybook illustration',
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese anime/manga inspired art style',
    prompt: 'anime art style, cel-shaded, vibrant colors, clean lines, expressive eyes, dynamic poses, JRPG aesthetic, detailed linework',
  },
  {
    id: 'realistic',
    name: 'Realistic',
    description: 'Photorealistic rendering with fantasy elements',
    prompt: 'photorealistic fantasy art, highly detailed, realistic lighting and textures, cinematic composition, professional digital painting, concept art quality',
  },
  {
    id: 'painterly',
    name: 'Painterly',
    description: 'Visible brushstrokes with impressionistic qualities',
    prompt: 'painterly style, visible expressive brushstrokes, impressionistic quality, rich impasto texture, artistic interpretation, fine art aesthetic',
  },
  {
    id: 'comic-book',
    name: 'Comic Book',
    description: 'Bold lines and dramatic comic book aesthetics',
    prompt: 'comic book art style, bold black outlines, dynamic composition, halftone dots, dramatic shadows, superhero comic aesthetic, inked illustration',
  },
  {
    id: 'art-nouveau',
    name: 'Art Nouveau',
    description: 'Elegant flowing lines and organic forms',
    prompt: 'art nouveau style, elegant flowing organic lines, decorative borders, nature-inspired motifs, Alphonse Mucha influence, ornamental fantasy art',
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    description: 'Retro pixel art style with limited palette',
    prompt: 'pixel art style, retro video game aesthetic, limited color palette, 16-bit era quality, detailed sprites, nostalgic RPG style',
  },
];

/**
 * Lighting/mood modifiers
 */
export const LIGHTING_STYLES: ImageStyle[] = [
  {
    id: 'dramatic',
    name: 'Dramatic Lighting',
    description: 'High contrast with strong directional light',
    prompt: 'dramatic chiaroscuro lighting, high contrast, strong directional light source, deep shadows, rim lighting',
  },
  {
    id: 'soft',
    name: 'Soft Lighting',
    description: 'Gentle diffused light with subtle shadows',
    prompt: 'soft diffused lighting, gentle shadows, even illumination, warm ambient glow, flattering portrait lighting',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Warm sunset/sunrise lighting',
    prompt: 'golden hour lighting, warm orange and amber tones, long shadows, romantic atmosphere, sun flare effects',
  },
  {
    id: 'moonlit',
    name: 'Moonlit',
    description: 'Cool nighttime illumination',
    prompt: 'moonlit night scene, cool blue-silver tones, mysterious shadows, starlit sky, ethereal nocturnal atmosphere',
  },
  {
    id: 'torchlit',
    name: 'Torchlit',
    description: 'Warm flickering firelight',
    prompt: 'torchlit scene, warm flickering firelight, dancing shadows, orange and red tones, dungeon atmosphere, intimate lighting',
  },
  {
    id: 'ethereal',
    name: 'Ethereal Glow',
    description: 'Magical otherworldly illumination',
    prompt: 'ethereal magical glow, soft supernatural light, mystical aura, lens flare effects, divine radiance',
  },
];

/**
 * Composition styles
 */
export const COMPOSITION_STYLES: ImageStyle[] = [
  {
    id: 'portrait',
    name: 'Portrait',
    description: 'Head and shoulders focus',
    prompt: 'portrait composition, head and shoulders, centered subject, shallow depth of field, focused face',
  },
  {
    id: 'full-body',
    name: 'Full Body',
    description: 'Complete figure with environment context',
    prompt: 'full body composition, complete figure visible, environmental context, action pose potential',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Wide aspect ratio with film-like framing',
    prompt: 'cinematic composition, widescreen aspect ratio, rule of thirds, depth layers, movie-like framing',
  },
  {
    id: 'dynamic',
    name: 'Dynamic Action',
    description: 'Motion and energy in the composition',
    prompt: 'dynamic action composition, motion blur hints, diagonal lines, energy and movement, dramatic angles',
  },
  {
    id: 'environmental',
    name: 'Environmental',
    description: 'Subject integrated into larger scene',
    prompt: 'environmental portrait, subject in context, detailed background, atmospheric perspective, storytelling composition',
  },
];

/**
 * Entity type base prompts (improved from current implementation)
 */
export const ENTITY_TYPE_PROMPTS: Record<string, string> = {
  npc: 'fantasy character portrait, detailed face and expression, personality visible through pose and attire',
  player: 'heroic fantasy character, adventurer appearance, distinctive equipment, memorable design',
  location: 'fantasy environment art, immersive atmosphere, architectural or natural details, sense of scale',
  item: 'fantasy item illustration, centered object, detailed craftsmanship, magical properties visible if applicable',
  creature: 'fantasy creature illustration, anatomically coherent, unique design, conveying personality or threat level',
  faction: 'faction representation, symbolic elements, group identity, heraldic or emblematic qualities',
  encounter: 'combat or tense scene, multiple subjects, action energy, dramatic moment',
  quest: 'narrative moment illustration, storytelling composition, emotional weight, epic or intimate as appropriate',
};

/**
 * Quality modifiers that should be appended to all prompts
 */
export const QUALITY_MODIFIERS = {
  high: 'masterpiece, best quality, highly detailed, professional artwork, 8k resolution',
  medium: 'high quality, detailed, professional illustration',
  standard: 'quality artwork, clear details',
};

/**
 * Build a complete generation prompt from components
 */
export function buildGenerationPrompt(options: {
  userPrompt: string;
  entityType?: string;
  artStyle?: string;
  lightingStyle?: string;
  compositionStyle?: string;
  qualityLevel?: 'high' | 'medium' | 'standard';
}): string {
  const {
    userPrompt,
    entityType,
    artStyle = 'classic-fantasy',
    lightingStyle,
    compositionStyle,
    qualityLevel = 'high',
  } = options;

  const parts: string[] = [];

  // Add art style
  const selectedArtStyle = ART_STYLES.find(s => s.id === artStyle);
  if (selectedArtStyle) {
    parts.push(selectedArtStyle.prompt);
  }

  // Add entity type context
  if (entityType && ENTITY_TYPE_PROMPTS[entityType]) {
    parts.push(ENTITY_TYPE_PROMPTS[entityType]);
  }

  // Add composition style
  if (compositionStyle) {
    const selectedComposition = COMPOSITION_STYLES.find(s => s.id === compositionStyle);
    if (selectedComposition) {
      parts.push(selectedComposition.prompt);
    }
  }

  // Add lighting style
  if (lightingStyle) {
    const selectedLighting = LIGHTING_STYLES.find(s => s.id === lightingStyle);
    if (selectedLighting) {
      parts.push(selectedLighting.prompt);
    }
  }

  // Add user's description
  parts.push(userPrompt);

  // Add quality modifiers
  parts.push(QUALITY_MODIFIERS[qualityLevel]);

  return parts.join(', ');
}

/**
 * Get all style categories for UI display
 */
export function getStyleCategories(): ImageStyleCategory[] {
  return [
    {
      id: 'art',
      name: 'Art Style',
      styles: ART_STYLES,
    },
    {
      id: 'lighting',
      name: 'Lighting',
      styles: LIGHTING_STYLES,
    },
    {
      id: 'composition',
      name: 'Composition',
      styles: COMPOSITION_STYLES,
    },
  ];
}

/**
 * Get default style selections for an entity type
 */
export function getDefaultStylesForEntityType(entityType?: string): {
  artStyle: string;
  lightingStyle: string;
  compositionStyle: string;
} {
  switch (entityType) {
    case 'npc':
    case 'player':
      return {
        artStyle: 'classic-fantasy',
        lightingStyle: 'dramatic',
        compositionStyle: 'portrait',
      };
    case 'location':
      return {
        artStyle: 'painterly',
        lightingStyle: 'golden-hour',
        compositionStyle: 'environmental',
      };
    case 'creature':
      return {
        artStyle: 'realistic',
        lightingStyle: 'dramatic',
        compositionStyle: 'dynamic',
      };
    case 'item':
      return {
        artStyle: 'classic-fantasy',
        lightingStyle: 'soft',
        compositionStyle: 'portrait',
      };
    case 'encounter':
      return {
        artStyle: 'painterly',
        lightingStyle: 'torchlit',
        compositionStyle: 'dynamic',
      };
    default:
      return {
        artStyle: 'classic-fantasy',
        lightingStyle: 'dramatic',
        compositionStyle: 'portrait',
      };
  }
}

/**
 * Character loadout data for image generation
 */
export interface CharacterLoadout {
  weapons?: string[];
  armor?: string;
  shield?: string;
  focus?: string;
  pack?: string;
  equipment?: string[];
}

/**
 * Character data for building image prompts
 */
export interface CharacterData {
  name?: string;
  race?: string;
  class?: string;
  appearance?: string;
  gender?: string;
  mechanics?: {
    loadout?: CharacterLoadout;
  };
}

/**
 * Build a character portrait prompt including equipment
 */
export function buildCharacterPrompt(
  character: CharacterData,
  options: {
    artStyle?: string;
    lightingStyle?: string;
    compositionStyle?: string;
    qualityLevel?: 'high' | 'medium' | 'standard';
  } = {}
): string {
  const parts: string[] = [];

  // Core character identity
  if (character.race) parts.push(character.race);
  if (character.class) parts.push(character.class);
  if (character.gender) parts.push(character.gender);
  if (character.appearance) parts.push(character.appearance);

  // Add equipment from loadout
  const loadout = character.mechanics?.loadout;
  if (loadout) {
    // Weapons - filter out ammo for visual prompt
    if (loadout.weapons?.length) {
      const visualWeapons = loadout.weapons.filter(w =>
        !w.toLowerCase().includes('bolt') &&
        !w.toLowerCase().includes('arrow') &&
        !w.toLowerCase().includes('ammunition') &&
        !w.toLowerCase().includes('dart')
      );
      if (visualWeapons.length > 0) {
        // Take first 2 weapons max for cleaner prompt
        const mainWeapons = visualWeapons.slice(0, 2);
        parts.push(`wielding ${mainWeapons.join(' and ').toLowerCase()}`);
      }
    }

    // Armor
    if (loadout.armor && loadout.armor.toLowerCase() !== 'none') {
      parts.push(`wearing ${loadout.armor.toLowerCase()}`);
    }

    // Shield
    if (loadout.shield) {
      parts.push(`carrying a ${loadout.shield.toLowerCase()}`);
    }

    // Spellcasting focus
    if (loadout.focus) {
      if (loadout.focus.toLowerCase().includes('staff')) {
        parts.push('with glowing magical staff');
      } else if (loadout.focus.toLowerCase().includes('orb')) {
        parts.push('holding a glowing arcane orb');
      } else if (loadout.focus.toLowerCase().includes('wand')) {
        parts.push('with magical wand');
      } else if (loadout.focus.toLowerCase().includes('crystal')) {
        parts.push('with glowing crystal focus');
      } else if (loadout.focus.toLowerCase().includes('holy symbol')) {
        parts.push('wearing holy symbol');
      } else if (loadout.focus.toLowerCase().includes('druidic')) {
        parts.push('with wooden druidic focus');
      } else if (loadout.focus.toLowerCase().includes('spellbook')) {
        parts.push('holding a leather-bound spellbook with arcane symbols');
      } else if (
        loadout.focus.toLowerCase().includes('lute') ||
        loadout.focus.toLowerCase().includes('lyre') ||
        loadout.focus.toLowerCase().includes('flute') ||
        loadout.focus.toLowerCase().includes('drum') ||
        loadout.focus.toLowerCase().includes('horn')
      ) {
        parts.push(`carrying a ${loadout.focus.toLowerCase()}`);
      }
    }

    // Class-specific additions
    const classLower = character.class?.toLowerCase() || '';
    if (classLower === 'wizard' && !loadout.focus?.toLowerCase().includes('staff')) {
      // Wizards always have spellbook
      if (!loadout.focus?.toLowerCase().includes('spellbook')) {
        parts.push('with spellbook');
      }
    } else if (classLower === 'cleric' || classLower === 'paladin') {
      if (!loadout.focus) {
        parts.push('with holy symbol');
      }
    } else if (classLower === 'druid') {
      if (!loadout.focus) {
        parts.push('with druidic focus');
      }
    }
  }

  const description = parts.join(', ') || 'fantasy adventurer';

  // Build full prompt with style options
  return buildGenerationPrompt({
    userPrompt: description,
    entityType: 'player',
    artStyle: options.artStyle,
    lightingStyle: options.lightingStyle,
    compositionStyle: options.compositionStyle,
    qualityLevel: options.qualityLevel,
  });
}
