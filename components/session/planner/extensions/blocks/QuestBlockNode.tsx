'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import { Flag, Target, X, Plus, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BlockWrapper } from './BlockWrapper'
import { generateBlockId, parseJsonAttr, stringifyJsonAttr } from './shared'

interface Milestone {
  id: string
  text: string
  completed: boolean
}

// React component for the quest block
function QuestBlockComponent({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const title = node.attrs.title as string
  const entityId = node.attrs.entityId as string | null
  const milestones = parseJsonAttr<Milestone[]>(node.attrs.milestones, [])

  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [milestoneInput, setMilestoneInput] = useState('')

  const completedCount = milestones.filter((m) => m.completed).length
  const progress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0

  const updateMilestones = (newMilestones: Milestone[]) => {
    updateAttributes({ milestones: stringifyJsonAttr(newMilestones) })
  }

  const handleAddMilestone = () => {
    if (milestoneInput.trim()) {
      updateMilestones([
        ...milestones,
        {
          id: generateBlockId(),
          text: milestoneInput.trim(),
          completed: false,
        },
      ])
      setMilestoneInput('')
      setIsAddingMilestone(false)
    }
  }

  const handleToggleMilestone = (id: string) => {
    const newMilestones = milestones.map((m) =>
      m.id === id ? { ...m, completed: !m.completed } : m
    )
    updateMilestones(newMilestones)
  }

  const handleRemoveMilestone = (id: string) => {
    const newMilestones = milestones.filter((m) => m.id !== id)
    updateMilestones(newMilestones)
  }

  const handleUpdateMilestoneText = (id: string, text: string) => {
    const newMilestones = milestones.map((m) =>
      m.id === id ? { ...m, text } : m
    )
    updateMilestones(newMilestones)
  }

  return (
    <BlockWrapper
      node={node}
      updateAttributes={updateAttributes}
      deleteNode={deleteNode}
      editor={editor}
      icon={<Flag className="w-4 h-4 text-purple-400" />}
      iconBgColor="bg-purple-900/50"
      title={title}
      onTitleChange={(newTitle) => updateAttributes({ title: newTitle })}
      metadataBar={
        milestones.length > 0 ? (
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>
                {completedCount}/{milestones.length}
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : undefined
      }
    >
      {/* Milestones List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <Target className="w-3 h-3" />
            Milestones
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-slate-500 hover:text-slate-300"
            onClick={() => setIsAddingMilestone(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>

        {milestones.length === 0 && !isAddingMilestone && (
          <p className="text-xs text-slate-500 italic">No milestones added yet</p>
        )}

        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="flex items-start gap-2 p-2 rounded bg-purple-950/30 border border-purple-900/50 group"
          >
            <Checkbox
              checked={milestone.completed}
              onCheckedChange={() => handleToggleMilestone(milestone.id)}
              className="mt-0.5"
            />
            <span
              className={`flex-1 text-sm ${
                milestone.completed ? 'text-slate-500 line-through' : 'text-slate-300'
              }`}
            >
              {milestone.text}
            </span>
            <button
              onClick={() => handleRemoveMilestone(milestone.id)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {isAddingMilestone && (
          <div className="flex gap-2 p-2 rounded bg-slate-800/50 border border-slate-700">
            <Input
              value={milestoneInput}
              onChange={(e) => setMilestoneInput(e.target.value)}
              placeholder="Milestone description..."
              className="flex-1 h-7 bg-slate-800 border-slate-700 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMilestone()
                if (e.key === 'Escape') {
                  setMilestoneInput('')
                  setIsAddingMilestone(false)
                }
              }}
            />
            <Button
              size="sm"
              className="h-7 px-2 bg-purple-600 hover:bg-purple-700"
              onClick={handleAddMilestone}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => {
                setIsAddingMilestone(false)
                setMilestoneInput('')
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Auto-complete suggestion */}
        {milestones.length > 0 && completedCount === milestones.length && node.attrs.status === 'active' && (
          <Button
            size="sm"
            className="w-full mt-2 bg-green-700 hover:bg-green-600"
            onClick={() => updateAttributes({ status: 'completed' })}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            All Milestones Complete - Mark Done
          </Button>
        )}
      </div>
    </BlockWrapper>
  )
}

// Tiptap extension
export const QuestBlockNode = Node.create({
  name: 'questBlock',
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
        default: 'New Quest',
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => ({ 'data-title': attributes.title }),
      },
      entityId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-entity-id'),
        renderHTML: (attributes) => ({ 'data-entity-id': attributes.entityId }),
      },
      milestones: {
        default: '[]',
        parseHTML: (element) => element.getAttribute('data-milestones') || '[]',
        renderHTML: (attributes) => ({ 'data-milestones': attributes.milestones }),
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
    return [{ tag: 'div[data-quest-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-quest-block': '' }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuestBlockComponent)
  },

  addCommands() {
    return {
      insertQuestBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: generateBlockId(),
              title: 'New Quest',
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
    questBlock: {
      insertQuestBlock: (attrs?: Partial<{
        title: string
        entityId: string
        milestones: string
        status: string
      }>) => ReturnType
    }
  }
}
