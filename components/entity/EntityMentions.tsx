'use client'

import { useMemo, Fragment } from 'react'
import { cn } from '@/lib/utils'

/**
 * Entity data shape for mention detection
 */
export interface MentionableEntity {
  id: string
  name: string
  entity_type: string
}

/**
 * Color mapping for entity types
 */
const ENTITY_COLORS: Record<string, string> = {
  npc: 'text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50',
  player: 'text-green-400 hover:text-green-300 bg-green-900/30 hover:bg-green-900/50',
  location: 'text-emerald-400 hover:text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50',
  item: 'text-amber-400 hover:text-amber-300 bg-amber-900/30 hover:bg-amber-900/50',
  creature: 'text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50',
  faction: 'text-purple-400 hover:text-purple-300 bg-purple-900/30 hover:bg-purple-900/50',
  quest: 'text-teal-400 hover:text-teal-300 bg-teal-900/30 hover:bg-teal-900/50',
  encounter: 'text-orange-400 hover:text-orange-300 bg-orange-900/30 hover:bg-orange-900/50',
}

interface EntityMentionsProps {
  /** The text to scan for entity mentions */
  text: string
  /** Array of entities to detect in the text */
  entities: MentionableEntity[]
  /** Callback when an entity is clicked */
  onEntityClick?: (entity: MentionableEntity) => void
  /** Additional class names for the container */
  className?: string
}

interface TextSegment {
  type: 'text' | 'entity'
  content: string
  entity?: MentionableEntity
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * EntityMentions component
 *
 * Scans text for entity names and makes them clickable.
 * Entity names are highlighted with colors based on their type.
 *
 * @example
 * ```tsx
 * <EntityMentions
 *   text="Visit the Rusty Anchor tavern and speak with Grimjaw the bartender."
 *   entities={[
 *     { id: '1', name: 'Rusty Anchor', entity_type: 'location' },
 *     { id: '2', name: 'Grimjaw', entity_type: 'npc' }
 *   ]}
 *   onEntityClick={(entity) => openQuickView(entity)}
 * />
 * ```
 */
export function EntityMentions({
  text,
  entities,
  onEntityClick,
  className,
}: EntityMentionsProps) {
  /**
   * Parse the text and split it into segments of plain text and entity mentions
   */
  const segments = useMemo<TextSegment[]>(() => {
    if (!text || entities.length === 0) {
      return [{ type: 'text', content: text }]
    }

    // Sort entities by name length (longest first) to match longer names first
    // This prevents "The Black Hand" from matching just "Black" if both exist
    const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length)

    // Filter out very short names (less than 3 chars) to avoid false positives
    const matchableEntities = sortedEntities.filter(e => e.name.length >= 3)

    if (matchableEntities.length === 0) {
      return [{ type: 'text', content: text }]
    }

    // Create a regex pattern that matches any entity name (case-insensitive, word boundaries)
    const pattern = matchableEntities
      .map(e => escapeRegex(e.name))
      .join('|')

    // Use word boundaries to match whole words/phrases only
    const regex = new RegExp(`(${pattern})`, 'gi')

    // Split text by entity names
    const parts = text.split(regex)

    // Map each part to a segment
    const result: TextSegment[] = []

    for (const part of parts) {
      if (!part) continue

      // Check if this part matches an entity name (case-insensitive)
      const matchedEntity = matchableEntities.find(
        e => e.name.toLowerCase() === part.toLowerCase()
      )

      if (matchedEntity) {
        result.push({
          type: 'entity',
          content: part,
          entity: matchedEntity,
        })
      } else {
        result.push({
          type: 'text',
          content: part,
        })
      }
    }

    return result
  }, [text, entities])

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Fragment key={index}>{segment.content}</Fragment>
        }

        const entity = segment.entity!
        const colorClass = ENTITY_COLORS[entity.entity_type] || ENTITY_COLORS.npc

        return (
          <button
            key={index}
            onClick={() => onEntityClick?.(entity)}
            className={cn(
              'inline px-1 py-0.5 rounded cursor-pointer transition-colors',
              'font-medium underline decoration-dotted underline-offset-2',
              colorClass
            )}
            title={`View ${entity.name} (${entity.entity_type})`}
          >
            {segment.content}
          </button>
        )
      })}
    </span>
  )
}

/**
 * Utility function to detect which entities are mentioned in text
 * Useful for pre-filtering entities before passing to EntityMentions
 */
export function findMentionedEntities(
  text: string,
  entities: MentionableEntity[]
): MentionableEntity[] {
  const textLower = text.toLowerCase()

  return entities.filter(entity => {
    // Skip very short names
    if (entity.name.length < 3) return false

    // Check if name appears in text (case-insensitive)
    return textLower.includes(entity.name.toLowerCase())
  })
}
