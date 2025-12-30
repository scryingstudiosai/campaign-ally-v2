'use client'

import { ReactRenderer } from '@tiptap/react'
import Mention from '@tiptap/extension-mention'
import { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { MentionList, MentionListRef, fetchMentionSuggestions } from './MentionList'

interface MentionItem {
  id: string
  name: string
  entityType: string
}

// Get campaign ID from URL
function getCampaignIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const pathParts = window.location.pathname.split('/')
  const campaignIndex = pathParts.indexOf('campaigns')
  return campaignIndex !== -1 ? pathParts[campaignIndex + 1] : null
}

// Create the suggestion configuration
const suggestion: Partial<SuggestionOptions<MentionItem>> = {
  char: '@',
  allowSpaces: true,

  items: async ({ query }) => {
    const campaignId = getCampaignIdFromUrl()
    return fetchMentionSuggestions(query, campaignId)
  },

  render: () => {
    let component: ReactRenderer<MentionListRef>
    let popup: TippyInstance[]

    return {
      onStart: (props: SuggestionProps<MentionItem>) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          zIndex: 9999,
          theme: 'dark',
        })
      },

      onUpdate: (props: SuggestionProps<MentionItem>) => {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        })
      },

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }

        return component.ref?.onKeyDown(props) ?? false
      },

      onExit: () => {
        popup[0].destroy()
        component.destroy()
      },
    }
  },
}

// Create the EntityMention extension
export const EntityMention = Mention.configure({
  HTMLAttributes: {
    class: 'entity-mention',
  },
  suggestion,
  renderLabel({ node }) {
    return `@${node.attrs.label ?? node.attrs.id}`
  },
}).extend({
  name: 'entityMention',

  addAttributes() {
    return {
      ...this.parent?.(),
      entityType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-entity-type'),
        renderHTML: (attributes) => {
          if (!attributes.entityType) {
            return {}
          }
          return { 'data-entity-type': attributes.entityType }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-mention]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false
          return {
            id: element.getAttribute('data-id'),
            label: element.textContent?.replace('@', ''),
            entityType: element.getAttribute('data-entity-type'),
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-mention': '',
        'data-id': node.attrs.id,
        'data-entity-type': node.attrs.entityType,
        class: `entity-mention entity-mention--${node.attrs.entityType || 'default'}`,
      },
      `@${node.attrs.label ?? node.attrs.id}`,
    ]
  },
})
