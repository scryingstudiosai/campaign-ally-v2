'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import { Info, AlertTriangle, Eye, ScrollText, Lightbulb } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BlockWrapper } from './BlockWrapper'
import { NoteType, NOTE_TYPE_CONFIG, generateBlockId } from './shared'

// Icon mapping for note types
const NOTE_ICONS: Record<NoteType, React.ComponentType<{ className?: string }>> = {
  note: Info,
  warning: AlertTriangle,
  secret: Eye,
  lore: ScrollText,
  reminder: Lightbulb,
}

// React component for the note block
function NoteBlockComponent({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const noteType = (node.attrs.noteType as NoteType) || 'note'
  const title = node.attrs.title as string
  const config = NOTE_TYPE_CONFIG[noteType]
  const Icon = NOTE_ICONS[noteType]

  return (
    <BlockWrapper
      node={node}
      updateAttributes={updateAttributes}
      deleteNode={deleteNode}
      editor={editor}
      icon={<Icon className={`w-4 h-4 ${config.color}`} />}
      iconBgColor={config.bgColor}
      title={title}
      onTitleChange={(newTitle) => updateAttributes({ title: newTitle })}
      metadataBar={
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Type:</span>
          <Select
            value={noteType}
            onValueChange={(value) => updateAttributes({ noteType: value })}
          >
            <SelectTrigger className="h-7 w-28 bg-slate-800 border-slate-700 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {Object.entries(NOTE_TYPE_CONFIG).map(([key, cfg]) => {
                const TypeIcon = NOTE_ICONS[key as NoteType]
                return (
                  <SelectItem key={key} value={key} className="text-xs">
                    <div className="flex items-center gap-2">
                      <TypeIcon className={`w-3 h-3 ${cfg.color}`} />
                      {cfg.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      }
    />
  )
}

// Tiptap extension
export const NoteBlockNode = Node.create({
  name: 'noteBlock',
  group: 'block',
  content: 'block+',
  draggable: true,
  defining: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => ({ 'data-id': attributes.id }),
      },
      title: {
        default: 'New Note',
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => ({ 'data-title': attributes.title }),
      },
      noteType: {
        default: 'note',
        parseHTML: (element) => element.getAttribute('data-note-type'),
        renderHTML: (attributes) => ({ 'data-note-type': attributes.noteType }),
      },
      isCollapsed: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-collapsed') === 'true',
        renderHTML: (attributes) => ({ 'data-collapsed': attributes.isCollapsed }),
      },
      status: {
        default: 'pending',
        parseHTML: (element) => element.getAttribute('data-status'),
        renderHTML: (attributes) => ({ 'data-status': attributes.status }),
      },
    }
  },

  parseHTML() {
    return [{
      tag: 'div[data-note-block]',
      getAttrs: (element) => {
        if (typeof element === 'string') return false
        return element.hasAttribute('data-note-block') ? {} : false
      },
    }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-note-block': '' }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteBlockComponent)
  },

  addCommands() {
    return {
      insertNoteBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: generateBlockId(),
              title: 'New Note',
              noteType: 'note',
              ...attrs,
            },
            content: [{ type: 'paragraph' }],
          })
        },
    }
  },
})

// Type augmentation for commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteBlock: {
      insertNoteBlock: (attrs?: Partial<{
        title: string
        noteType: NoteType
        status: string
      }>) => ReturnType
    }
  }
}
