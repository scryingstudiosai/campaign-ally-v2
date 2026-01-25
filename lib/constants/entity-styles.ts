/**
 * Semantic Entity Styles
 *
 * A color palette designed for scanability and visual harmony.
 * Organized by conceptual groupings to reduce "gold overload".
 *
 * THE LIVING (Identity):
 * - player (amber) - The heroes, golden and special
 * - npc (sky) - Friendly faces, approachable blue
 * - deity (fuchsia) - Divine beings, mystical pink
 *
 * THE THREATS (Danger):
 * - creature (rose) - Monsters, danger red
 * - encounter (orange) - Combat, urgent action
 *
 * THE WORLD (Environment):
 * - location (emerald) - Places, nature green
 * - faction (indigo) - Organizations, deep power
 * - event (slate) - Lore/history, neutral knowledge
 *
 * OBJECTIVES (Rewards):
 * - item (violet) - Treasures, magical purple
 * - quest (cyan) - Missions, adventure teal
 */

import {
  Users,
  MapPin,
  Package,
  Skull,
  Shield,
  Scroll,
  Swords,
  Sparkles,
  Crown,
  User,
  type LucideIcon,
} from 'lucide-react'

export type EntityType =
  | 'npc'
  | 'player'
  | 'location'
  | 'item'
  | 'creature'
  | 'faction'
  | 'quest'
  | 'encounter'
  | 'event'
  | 'deity'

export interface EntityStyle {
  label: string
  shortLabel: string
  icon: LucideIcon
  // Tailwind color classes
  text: string
  bg: string
  border: string
  hoverBg: string
  // For card left-accent design
  accent: string
  // Combined classes for clickable mentions
  mentionClasses: string
}

/**
 * Main entity style configuration
 * Single source of truth for all entity styling
 */
export const ENTITY_STYLES: Record<EntityType, EntityStyle> = {
  // THE LIVING (Identity)
  player: {
    label: 'Player',
    shortLabel: 'PC',
    icon: Crown,
    text: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/30',
    accent: 'border-l-amber-500',
    mentionClasses: 'text-amber-400 hover:text-amber-300 bg-amber-900/30 hover:bg-amber-900/50',
  },
  npc: {
    label: 'NPC',
    shortLabel: 'NPC',
    icon: User,
    text: 'text-sky-400',
    bg: 'bg-sky-500/20',
    border: 'border-sky-500/30',
    hoverBg: 'hover:bg-sky-500/30',
    accent: 'border-l-sky-500',
    mentionClasses: 'text-sky-400 hover:text-sky-300 bg-sky-900/30 hover:bg-sky-900/50',
  },
  deity: {
    label: 'Deity',
    shortLabel: 'Deity',
    icon: Crown,
    text: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/20',
    border: 'border-fuchsia-500/30',
    hoverBg: 'hover:bg-fuchsia-500/30',
    accent: 'border-l-fuchsia-500',
    mentionClasses: 'text-fuchsia-400 hover:text-fuchsia-300 bg-fuchsia-900/30 hover:bg-fuchsia-900/50',
  },

  // THE THREATS (Danger)
  creature: {
    label: 'Creature',
    shortLabel: 'Creature',
    icon: Skull,
    text: 'text-rose-400',
    bg: 'bg-rose-500/20',
    border: 'border-rose-500/30',
    hoverBg: 'hover:bg-rose-500/30',
    accent: 'border-l-rose-500',
    mentionClasses: 'text-rose-400 hover:text-rose-300 bg-rose-900/30 hover:bg-rose-900/50',
  },
  encounter: {
    label: 'Encounter',
    shortLabel: 'Enc',
    icon: Swords,
    text: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    hoverBg: 'hover:bg-orange-500/30',
    accent: 'border-l-orange-500',
    mentionClasses: 'text-orange-400 hover:text-orange-300 bg-orange-900/30 hover:bg-orange-900/50',
  },

  // THE WORLD (Environment)
  location: {
    label: 'Location',
    shortLabel: 'Loc',
    icon: MapPin,
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    hoverBg: 'hover:bg-emerald-500/30',
    accent: 'border-l-emerald-500',
    mentionClasses: 'text-emerald-400 hover:text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50',
  },
  faction: {
    label: 'Faction',
    shortLabel: 'Faction',
    icon: Shield,
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/20',
    border: 'border-indigo-500/30',
    hoverBg: 'hover:bg-indigo-500/30',
    accent: 'border-l-indigo-500',
    mentionClasses: 'text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50',
  },
  event: {
    label: 'Lore',
    shortLabel: 'Lore',
    icon: Sparkles,
    text: 'text-slate-400',
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/30',
    hoverBg: 'hover:bg-slate-500/30',
    accent: 'border-l-slate-500',
    mentionClasses: 'text-slate-400 hover:text-slate-300 bg-slate-700/30 hover:bg-slate-700/50',
  },

  // OBJECTIVES (Rewards)
  item: {
    label: 'Item',
    shortLabel: 'Item',
    icon: Package,
    text: 'text-violet-400',
    bg: 'bg-violet-500/20',
    border: 'border-violet-500/30',
    hoverBg: 'hover:bg-violet-500/30',
    accent: 'border-l-violet-500',
    mentionClasses: 'text-violet-400 hover:text-violet-300 bg-violet-900/30 hover:bg-violet-900/50',
  },
  quest: {
    label: 'Quest',
    shortLabel: 'Quest',
    icon: Scroll,
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-500/30',
    accent: 'border-l-cyan-500',
    mentionClasses: 'text-cyan-400 hover:text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/50',
  },
}

/**
 * Default style for unknown entity types
 */
export const DEFAULT_ENTITY_STYLE: EntityStyle = {
  label: 'Entity',
  shortLabel: 'Ent',
  icon: Users,
  text: 'text-slate-400',
  bg: 'bg-slate-500/20',
  border: 'border-slate-500/30',
  hoverBg: 'hover:bg-slate-500/30',
  accent: 'border-l-slate-500',
  mentionClasses: 'text-slate-400 hover:text-slate-300 bg-slate-700/30 hover:bg-slate-700/50',
}

/**
 * Get entity style configuration with fallback for unknown types
 */
export function getEntityStyle(type: string): EntityStyle {
  return ENTITY_STYLES[type as EntityType] || DEFAULT_ENTITY_STYLE
}

/**
 * Get just the text color class for an entity type
 */
export function getEntityTextColor(type: string): string {
  return getEntityStyle(type).text
}

/**
 * Get the icon component for an entity type
 */
export function getEntityIcon(type: string): LucideIcon {
  return getEntityStyle(type).icon
}

/**
 * Get all entity types as an array
 */
export function getAllEntityTypes(): EntityType[] {
  return Object.keys(ENTITY_STYLES) as EntityType[]
}

/**
 * Get entity options formatted for selection menus
 */
export function getEntityTypeOptions() {
  return Object.entries(ENTITY_STYLES).map(([type, style]) => ({
    type: type as EntityType,
    label: style.label,
    shortLabel: style.shortLabel,
    icon: style.icon,
    color: style.text,
  }))
}
