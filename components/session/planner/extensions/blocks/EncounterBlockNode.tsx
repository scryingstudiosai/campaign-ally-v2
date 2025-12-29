'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import { Swords, Skull, MapPin, X, Plus } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BlockWrapper } from './BlockWrapper'
import {
  generateBlockId,
  parseJsonAttr,
  stringifyJsonAttr,
  Difficulty,
  DIFFICULTY_CONFIG,
} from './shared'

interface Creature {
  id?: string
  name: string
  count: number
  cr?: string
  isSrd?: boolean
}

// React component for the encounter block
function EncounterBlockComponent({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const title = node.attrs.title as string
  const entityId = node.attrs.entityId as string | null
  const difficulty = (node.attrs.difficulty as Difficulty) || 'medium'
  const creatures = parseJsonAttr<Creature[]>(node.attrs.creatures, [])
  const locationName = node.attrs.locationName as string | null

  const [isAddingCreature, setIsAddingCreature] = useState(false)
  const [creatureInput, setCreatureInput] = useState('')
  const [creatureCount, setCreatureCount] = useState(1)
  const [creatureCr, setCreatureCr] = useState('')

  const difficultyConfig = DIFFICULTY_CONFIG[difficulty]

  const updateCreatures = (newCreatures: Creature[]) => {
    updateAttributes({ creatures: stringifyJsonAttr(newCreatures) })
  }

  const handleAddCreature = () => {
    if (creatureInput.trim()) {
      updateCreatures([
        ...creatures,
        {
          name: creatureInput.trim(),
          count: creatureCount,
          cr: creatureCr || undefined,
        },
      ])
      setCreatureInput('')
      setCreatureCount(1)
      setCreatureCr('')
      setIsAddingCreature(false)
    }
  }

  const handleRemoveCreature = (index: number) => {
    const newCreatures = creatures.filter((_, i) => i !== index)
    updateCreatures(newCreatures)
  }

  const handleRunEncounter = () => {
    updateAttributes({ status: 'active' })
    // Dispatch event for combat system
    window.dispatchEvent(
      new CustomEvent('run-encounter', {
        detail: {
          id: node.attrs.id,
          name: title,
          creatures,
        },
      })
    )
  }

  return (
    <BlockWrapper
      node={node}
      updateAttributes={updateAttributes}
      deleteNode={deleteNode}
      editor={editor}
      icon={<Swords className="w-4 h-4 text-orange-400" />}
      iconBgColor="bg-orange-900/50"
      title={title}
      onTitleChange={(newTitle) => updateAttributes({ title: newTitle })}
      isRunnable={true}
      onRun={handleRunEncounter}
      metadataBar={
        <>
          {/* Difficulty */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Difficulty:</span>
            <Select
              value={difficulty}
              onValueChange={(value) => updateAttributes({ difficulty: value })}
            >
              <SelectTrigger className="h-7 w-24 bg-slate-800 border-slate-700 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    <Badge className={`${cfg.color} text-xs`}>{cfg.label}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          {locationName && (
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="text-sm">{locationName}</span>
            </div>
          )}
        </>
      }
    >
      {/* Creature List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-red-400 uppercase tracking-wider flex items-center gap-1">
            <Skull className="w-3 h-3" />
            Creatures
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-slate-500 hover:text-slate-300"
            onClick={() => setIsAddingCreature(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>

        {creatures.length === 0 && !isAddingCreature && (
          <p className="text-xs text-slate-500 italic">No creatures added yet</p>
        )}

        {creatures.map((creature, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 rounded bg-red-950/30 border border-red-900/50 group"
          >
            <div className="flex items-center gap-2">
              <Skull className="w-3 h-3 text-red-400" />
              <span className="text-slate-300 text-sm">
                {creature.count > 1 ? `${creature.count}× ` : ''}
                {creature.name}
              </span>
              {creature.cr && (
                <Badge variant="outline" className="border-red-800 text-red-400 text-xs">
                  CR {creature.cr}
                </Badge>
              )}
            </div>
            <button
              onClick={() => handleRemoveCreature(index)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {isAddingCreature && (
          <div className="flex gap-2 p-2 rounded bg-slate-800/50 border border-slate-700">
            <Input
              value={creatureInput}
              onChange={(e) => setCreatureInput(e.target.value)}
              placeholder="Creature name..."
              className="flex-1 h-7 bg-slate-800 border-slate-700 text-xs"
              autoFocus
            />
            <Input
              type="number"
              min={1}
              value={creatureCount}
              onChange={(e) => setCreatureCount(parseInt(e.target.value) || 1)}
              className="w-14 h-7 bg-slate-800 border-slate-700 text-xs"
              placeholder="#"
            />
            <Input
              value={creatureCr}
              onChange={(e) => setCreatureCr(e.target.value)}
              placeholder="CR"
              className="w-16 h-7 bg-slate-800 border-slate-700 text-xs"
            />
            <Button
              size="sm"
              className="h-7 px-2 bg-red-600 hover:bg-red-700"
              onClick={handleAddCreature}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => {
                setIsAddingCreature(false)
                setCreatureInput('')
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </BlockWrapper>
  )
}

// Tiptap extension
export const EncounterBlockNode = Node.create({
  name: 'encounterBlock',
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
        default: 'New Encounter',
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => ({ 'data-title': attributes.title }),
      },
      entityId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-entity-id'),
        renderHTML: (attributes) => ({ 'data-entity-id': attributes.entityId }),
      },
      difficulty: {
        default: 'medium',
        parseHTML: (element) => element.getAttribute('data-difficulty'),
        renderHTML: (attributes) => ({ 'data-difficulty': attributes.difficulty }),
      },
      creatures: {
        default: '[]',
        parseHTML: (element) => element.getAttribute('data-creatures') || '[]',
        renderHTML: (attributes) => ({ 'data-creatures': attributes.creatures }),
      },
      locationName: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-location-name'),
        renderHTML: (attributes) => ({ 'data-location-name': attributes.locationName }),
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
    return [{ tag: 'div[data-encounter-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-encounter-block': '' }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EncounterBlockComponent)
  },

  addCommands() {
    return {
      insertEncounterBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: generateBlockId(),
              title: 'New Encounter',
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
    encounterBlock: {
      insertEncounterBlock: (attrs?: Partial<{
        title: string
        entityId: string
        difficulty: Difficulty | string
        creatures: string
        locationName: string
        status: string
      }>) => ReturnType
    }
  }
}
