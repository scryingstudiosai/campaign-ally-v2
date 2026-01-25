'use client'

import { Mark, mergeAttributes } from '@tiptap/core'

/**
 * EntityLinkMark - A TipTap mark that makes entity references clickable
 *
 * Unlike EntityMention which uses @-prefix syntax, this mark wraps
 * entity names without changing their display, just making them clickable.
 *
 * Usage:
 * ```typescript
 * // Apply mark to text
 * {
 *   type: 'text',
 *   text: 'Grimjaw',
 *   marks: [{
 *     type: 'entityLink',
 *     attrs: { entityId: '123', entityType: 'npc', entityName: 'Grimjaw' }
 *   }]
 * }
 * ```
 */
export const EntityLinkMark = Mark.create({
  name: 'entityLink',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      entityId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-entity-id'),
        renderHTML: (attributes) => {
          if (!attributes.entityId) return {}
          return { 'data-entity-id': attributes.entityId }
        },
      },
      entityType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-entity-type'),
        renderHTML: (attributes) => {
          if (!attributes.entityType) return {}
          return { 'data-entity-type': attributes.entityType }
        },
      },
      entityName: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-entity-name'),
        renderHTML: (attributes) => {
          if (!attributes.entityName) return {}
          return { 'data-entity-name': attributes.entityName }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-entity-link]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const entityType = HTMLAttributes['data-entity-type'] || 'npc'

    // Color classes based on entity type
    const colorMap: Record<string, string> = {
      npc: 'entity-link--npc',
      player: 'entity-link--player',
      location: 'entity-link--location',
      item: 'entity-link--item',
      creature: 'entity-link--creature',
      faction: 'entity-link--faction',
      quest: 'entity-link--quest',
      encounter: 'entity-link--encounter',
    }

    const colorClass = colorMap[entityType] || colorMap.npc

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-entity-link': '',
        class: `entity-link ${colorClass}`,
      }),
      0,
    ]
  },
})

/**
 * CSS styles for entity links (add to globals.css)
 *
 * .entity-link {
 *   cursor: pointer;
 *   text-decoration: underline;
 *   text-decoration-style: dotted;
 *   text-underline-offset: 2px;
 *   transition: all 0.15s ease;
 *   padding: 0 2px;
 *   border-radius: 2px;
 * }
 *
 * .entity-link--npc { color: rgb(96 165 250); }
 * .entity-link--npc:hover { background-color: rgba(30, 64, 175, 0.3); }
 *
 * .entity-link--location { color: rgb(52 211 153); }
 * .entity-link--location:hover { background-color: rgba(6, 95, 70, 0.3); }
 *
 * etc...
 */
