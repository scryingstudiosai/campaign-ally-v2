'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import { Clapperboard, MapPin, Users, X, Plus } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BlockWrapper } from './BlockWrapper'
import { generateBlockId, parseJsonAttr, stringifyJsonAttr } from './shared'

interface LinkedNpc {
  id?: string
  name: string
}

// React component for the scene block
function SceneBlockComponent({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const title = node.attrs.title as string
  const locationName = node.attrs.locationName as string | null
  const locationId = node.attrs.locationId as string | null
  const npcs = parseJsonAttr<LinkedNpc[]>(node.attrs.npcs, [])
  const status = node.attrs.status as string

  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [locationInput, setLocationInput] = useState(locationName || '')
  const [isAddingNpc, setIsAddingNpc] = useState(false)
  const [npcInput, setNpcInput] = useState('')

  const updateNpcs = (newNpcs: LinkedNpc[]) => {
    updateAttributes({ npcs: stringifyJsonAttr(newNpcs) })
  }

  const handleLocationSubmit = () => {
    updateAttributes({ locationName: locationInput || null })
    setIsEditingLocation(false)
  }

  const handleAddNpc = () => {
    if (npcInput.trim()) {
      updateNpcs([...npcs, { name: npcInput.trim() }])
      setNpcInput('')
      setIsAddingNpc(false)
    }
  }

  const handleRemoveNpc = (index: number) => {
    const newNpcs = npcs.filter((_, i) => i !== index)
    updateNpcs(newNpcs)
  }

  const handleRun = () => {
    updateAttributes({ status: 'active' })
  }

  return (
    <BlockWrapper
      node={node}
      updateAttributes={updateAttributes}
      deleteNode={deleteNode}
      editor={editor}
      icon={<Clapperboard className="w-4 h-4 text-blue-400" />}
      iconBgColor="bg-blue-900/50"
      title={title}
      onTitleChange={(newTitle) => updateAttributes({ title: newTitle })}
      isRunnable={true}
      onRun={handleRun}
      metadataBar={
        <>
          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-400" />
            {isEditingLocation ? (
              <div className="flex items-center gap-1">
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Location name..."
                  className="h-6 w-40 bg-slate-800 border-slate-700 text-xs"
                  autoFocus
                  onBlur={handleLocationSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLocationSubmit()
                    if (e.key === 'Escape') {
                      setLocationInput(locationName || '')
                      setIsEditingLocation(false)
                    }
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setIsEditingLocation(true)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                {locationName || 'Add location...'}
              </button>
            )}
          </div>

          {/* NPCs */}
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 text-blue-400" />
            {npcs.map((npc, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-blue-800 text-blue-300 group"
              >
                {npc.name}
                <button
                  onClick={() => handleRemoveNpc(index)}
                  className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {isAddingNpc ? (
              <Input
                value={npcInput}
                onChange={(e) => setNpcInput(e.target.value)}
                placeholder="NPC name..."
                className="h-6 w-28 bg-slate-800 border-slate-700 text-xs"
                autoFocus
                onBlur={() => {
                  if (npcInput.trim()) handleAddNpc()
                  else setIsAddingNpc(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNpc()
                  if (e.key === 'Escape') {
                    setNpcInput('')
                    setIsAddingNpc(false)
                  }
                }}
              />
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-300"
                onClick={() => setIsAddingNpc(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                NPC
              </Button>
            )}
          </div>
        </>
      }
    />
  )
}

// Tiptap extension
export const SceneBlockNode = Node.create({
  name: 'sceneBlock',
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
        default: 'New Scene',
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => ({ 'data-title': attributes.title }),
      },
      locationId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-location-id'),
        renderHTML: (attributes) => ({ 'data-location-id': attributes.locationId }),
      },
      locationName: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-location-name'),
        renderHTML: (attributes) => ({ 'data-location-name': attributes.locationName }),
      },
      npcs: {
        default: '[]',
        parseHTML: (element) => element.getAttribute('data-npcs') || '[]',
        renderHTML: (attributes) => ({ 'data-npcs': attributes.npcs }),
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
    return [{ tag: 'div[data-scene-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-scene-block': '' }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SceneBlockComponent)
  },

  addCommands() {
    return {
      insertSceneBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: generateBlockId(),
              title: 'New Scene',
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
    sceneBlock: {
      insertSceneBlock: (attrs?: Partial<{
        title: string
        locationId: string
        locationName: string
        npcs: string
        status: string
      }>) => ReturnType
    }
  }
}
