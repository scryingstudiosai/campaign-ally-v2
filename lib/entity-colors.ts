/**
 * Unified Entity Type Colors and Icons
 *
 * This file provides a single source of truth for entity type styling.
 * Use these constants throughout the app to ensure consistency.
 *
 * Color scheme rationale:
 * - NPC (blue): People/characters - calm, trustworthy
 * - Player (yellow): Party members - heroic, gold, special
 * - Location (emerald): Places - nature, geography
 * - Item (amber): Objects/treasure - valuable, material
 * - Creature (red): Monsters - danger, combat
 * - Faction (purple): Organizations - power, mystery
 * - Quest (teal): Missions - adventure, journey
 * - Encounter (orange): Combat - action, urgency
 * - Event/Lore (cyan): History - knowledge, time
 * - Deity (violet): Divine - mystical, holy
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

export interface EntityTypeConfig {
  label: string
  shortLabel: string
  icon: LucideIcon
  // Text color
  color: string
  // Background color (with opacity)
  bgColor: string
  // Border color (with opacity)
  borderColor: string
  // Hover states for interactive elements
  hoverBg: string
  // Combined classes for clickable mentions
  mentionClasses: string
}

/**
 * Main entity type configuration
 * Use this as the single source of truth for all entity styling
 */
export const ENTITY_TYPE_CONFIG: Record<EntityType, EntityTypeConfig> = {
  npc: {
    label: 'NPC',
    shortLabel: 'NPC',
    icon: User,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/30',
    mentionClasses: 'text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50',
  },
  player: {
    label: 'Player',
    shortLabel: 'PC',
    icon: Crown,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    hoverBg: 'hover:bg-yellow-500/30',
    mentionClasses: 'text-yellow-400 hover:text-yellow-300 bg-yellow-900/30 hover:bg-yellow-900/50',
  },
  location: {
    label: 'Location',
    shortLabel: 'Loc',
    icon: MapPin,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    hoverBg: 'hover:bg-emerald-500/30',
    mentionClasses: 'text-emerald-400 hover:text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50',
  },
  item: {
    label: 'Item',
    shortLabel: 'Item',
    icon: Package,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/30',
    mentionClasses: 'text-amber-400 hover:text-amber-300 bg-amber-900/30 hover:bg-amber-900/50',
  },
  creature: {
    label: 'Creature',
    shortLabel: 'Creature',
    icon: Skull,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    hoverBg: 'hover:bg-red-500/30',
    mentionClasses: 'text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50',
  },
  faction: {
    label: 'Faction',
    shortLabel: 'Faction',
    icon: Shield,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    hoverBg: 'hover:bg-purple-500/30',
    mentionClasses: 'text-purple-400 hover:text-purple-300 bg-purple-900/30 hover:bg-purple-900/50',
  },
  quest: {
    label: 'Quest',
    shortLabel: 'Quest',
    icon: Scroll,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
    hoverBg: 'hover:bg-teal-500/30',
    mentionClasses: 'text-teal-400 hover:text-teal-300 bg-teal-900/30 hover:bg-teal-900/50',
  },
  encounter: {
    label: 'Encounter',
    shortLabel: 'Enc',
    icon: Swords,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    hoverBg: 'hover:bg-orange-500/30',
    mentionClasses: 'text-orange-400 hover:text-orange-300 bg-orange-900/30 hover:bg-orange-900/50',
  },
  event: {
    label: 'Lore',
    shortLabel: 'Lore',
    icon: Sparkles,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-500/30',
    mentionClasses: 'text-cyan-400 hover:text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/50',
  },
  deity: {
    label: 'Deity',
    shortLabel: 'Deity',
    icon: Crown,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/30',
    hoverBg: 'hover:bg-violet-500/30',
    mentionClasses: 'text-violet-400 hover:text-violet-300 bg-violet-900/30 hover:bg-violet-900/50',
  },
}

/**
 * Default config for unknown entity types
 */
export const DEFAULT_ENTITY_CONFIG: EntityTypeConfig = {
  label: 'Entity',
  shortLabel: 'Ent',
  icon: Users,
  color: 'text-slate-400',
  bgColor: 'bg-slate-500/20',
  borderColor: 'border-slate-500/30',
  hoverBg: 'hover:bg-slate-500/30',
  mentionClasses: 'text-slate-400 hover:text-slate-300 bg-slate-900/30 hover:bg-slate-900/50',
}

/**
 * Get entity type configuration, with fallback for unknown types
 */
export function getEntityConfig(type: string): EntityTypeConfig {
  return ENTITY_TYPE_CONFIG[type as EntityType] || DEFAULT_ENTITY_CONFIG
}

/**
 * Get just the text color class for an entity type
 */
export function getEntityColor(type: string): string {
  return getEntityConfig(type).color
}

/**
 * Get the icon component for an entity type
 */
export function getEntityIcon(type: string): LucideIcon {
  return getEntityConfig(type).icon
}

/**
 * Get all entity types as an array (useful for selection menus)
 */
export function getAllEntityTypes(): EntityType[] {
  return Object.keys(ENTITY_TYPE_CONFIG) as EntityType[]
}

/**
 * Get entity options formatted for selection menus
 */
export function getEntityTypeOptions() {
  return Object.entries(ENTITY_TYPE_CONFIG).map(([type, config]) => ({
    type: type as EntityType,
    label: config.label,
    shortLabel: config.shortLabel,
    icon: config.icon,
    color: config.color,
  }))
}
