'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { createClient } from '@/lib/supabase/client'
import { User, MapPin, Package, Users, Skull, ScrollText, Swords, Sparkles } from 'lucide-react'

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  npc: User,
  location: MapPin,
  item: Package,
  faction: Users,
  creature: Skull,
  quest: ScrollText,
  encounter: Swords,
}

const ENTITY_COLORS: Record<string, string> = {
  npc: 'text-blue-400',
  location: 'text-amber-400',
  item: 'text-yellow-400',
  faction: 'text-purple-400',
  creature: 'text-red-400',
  quest: 'text-cyan-400',
  encounter: 'text-pink-400',
}

interface Entity {
  id: string
  name: string
  entity_type: string
}

interface MentionableTextareaProps {
  campaignId: string
  value: string
  onChange: (value: string) => void
  onEntityMention?: (entity: Entity) => void
  placeholder?: string
  className?: string
  rows?: number
}

// Suggestion list component
interface SuggestionListProps {
  items: Entity[]
  command: (item: Entity) => void
  loading?: boolean
}

interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

function SuggestionList({ items, command, loading }: SuggestionListProps): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = useCallback((index: number) => {
    const item = items[index]
    if (item) {
      command(item)
    }
  }, [items, command])

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  // Expose onKeyDown through a ref that the parent can access
  const ref = useRef<SuggestionListRef>({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  })

  // Keep ref updated
  useEffect(() => {
    ref.current.onKeyDown = ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    }
  }, [items, selectedIndex, selectItem])

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-md shadow-lg p-2 text-zinc-400 text-sm">
        Searching...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-md shadow-lg p-2 text-zinc-400 text-sm">
        No entities found
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-md shadow-lg overflow-hidden max-h-64 overflow-y-auto">
      {items.map((item, index) => {
        const Icon = ENTITY_ICONS[item.entity_type] || Sparkles
        const colorClass = ENTITY_COLORS[item.entity_type] || 'text-zinc-400'

        return (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-800 ${
              index === selectedIndex ? 'bg-zinc-800' : ''
            }`}
          >
            <Icon className={`h-4 w-4 ${colorClass}`} />
            <span className="text-zinc-100">{item.name}</span>
            <span className={`ml-auto text-xs ${colorClass}`}>
              {item.entity_type}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function MentionableTextarea({
  campaignId,
  value,
  onChange,
  onEntityMention,
  placeholder = 'Type @ to mention an entity...',
  className = '',
  rows = 3,
}: MentionableTextareaProps): JSX.Element {
  const supabase = createClient()

  const editor = useEditor({
    immediatelyRender: false, // Prevent SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        // Disable features we don't need for a simple textarea
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          char: '@',
          items: async ({ query }): Promise<Entity[]> => {
            const { data } = await supabase
              .from('entities')
              .select('id, name, entity_type')
              .eq('campaign_id', campaignId)
              .is('deleted_at', null)
              .ilike('name', `%${query}%`)
              .order('name')
              .limit(10)

            return data || []
          },
          render: () => {
            let component: ReactRenderer | null = null
            let popup: TippyInstance[] | null = null

            return {
              onStart: (props) => {
                component = new ReactRenderer(SuggestionList, {
                  props: { ...props, loading: true },
                  editor: props.editor,
                })

                if (!props.clientRect) return

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },
              onUpdate: (props) => {
                component?.updateProps({ ...props, loading: false })

                if (!props.clientRect || !popup) return

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                })
              },
              onKeyDown: (props) => {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide()
                  return true
                }

                // Access the ref through the component element
                const element = component?.element as HTMLElement & { __ref?: SuggestionListRef }
                return element?.__ref?.onKeyDown?.(props) ?? false
              },
              onExit: () => {
                popup?.[0]?.destroy()
                component?.destroy()
              },
            }
          },
          command: ({ editor, range, props }) => {
            // props contains the entity data from items
            const entity = props as unknown as Entity

            // Insert the mention
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: 'mention',
                  attrs: {
                    id: entity.id,
                    label: entity.name,
                  },
                },
                { type: 'text', text: ' ' },
              ])
              .run()

            // Notify parent that an entity was mentioned
            if (onEntityMention) {
              onEntityMention(entity)
            }
          },
        },
      }),
    ],
    content: value ? `<p>${value}</p>` : '',
    onUpdate: ({ editor }) => {
      // Get plain text content
      const text = editor.getText()
      onChange(text)
    },
    editorProps: {
      attributes: {
        class: `prose prose-invert prose-sm max-w-none focus:outline-none min-h-[${rows * 1.5}rem]`,
      },
    },
  })

  // Sync external value changes to editor
  useEffect(() => {
    if (editor && value !== editor.getText()) {
      editor.commands.setContent(value ? `<p>${value}</p>` : '')
    }
  }, [value, editor])

  // Calculate min height based on rows
  const minHeight = `${rows * 1.5 + 1}rem`

  return (
    <div
      className={`bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100
        focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500
        ${className}`}
      style={{ minHeight }}
    >
      <EditorContent editor={editor} />
      <style jsx global>{`
        .mention {
          background-color: rgba(20, 184, 166, 0.2);
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          color: #14b8a6;
          font-weight: 500;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #71717a;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p {
          margin: 0;
        }
      `}</style>
    </div>
  )
}
