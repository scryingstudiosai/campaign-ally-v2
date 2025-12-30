'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import { Clapperboard, MapPin, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BlockWrapper } from './BlockWrapper'
import { generateBlockId, parseJsonAttr, stringifyJsonAttr } from './shared'
import { EntityTypeahead, EntityOption } from '@/components/ui/entity-typeahead'
import { EntityMultiTypeahead, EntitySelection } from '@/components/ui/entity-multi-typeahead'

interface LinkedNpc {
  id?: string
  name: string
}

// Get campaign ID from URL
function getCampaignIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const pathParts = window.location.pathname.split('/')
  const campaignIndex = pathParts.indexOf('campaigns')
  return campaignIndex !== -1 ? pathParts[campaignIndex + 1] : null
}

// React component for the scene block
function SceneBlockComponent({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const title = node.attrs.title as string
  const locationName = node.attrs.locationName as string | null
  const locationId = node.attrs.locationId as string | null
  const npcs = parseJsonAttr<LinkedNpc[]>(node.attrs.npcs, [])

  const campaignId = getCampaignIdFromUrl()

  // Convert stored location to EntityOption format
  const locationValue: EntityOption | null = locationId || locationName
    ? {
        id: locationId || '',
        name: locationName || '',
        entityType: 'location',
      }
    : null

  // Convert stored NPCs to EntitySelection format
  const npcValues: EntitySelection[] = npcs.map((npc, index) => ({
    id: npc.id || `temp-${index}`,
    name: npc.name,
    entityType: 'npc' as const,
  }))

  const handleLocationChange = (location: EntityOption | null) => {
    updateAttributes({
      locationId: location?.id || null,
      locationName: location?.name || null,
    })
  }

  const handleNpcsChange = (newNpcs: EntitySelection[]) => {
    updateAttributes({
      npcs: stringifyJsonAttr(newNpcs.map(n => ({ id: n.id, name: n.name }))),
    })
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
          <div className="flex items-center gap-2" contentEditable={false}>
            <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
            {campaignId ? (
              <EntityTypeahead
                value={locationValue}
                onChange={handleLocationChange}
                campaignId={campaignId}
                entityTypes={['location']}
                includeSrd={false}
                placeholder="Select location..."
                className="h-7 w-48 text-xs"
              />
            ) : (
              <span className="text-sm text-slate-500">{locationName || 'No location'}</span>
            )}
          </div>

          {/* NPCs */}
          <div className="flex items-center gap-2" contentEditable={false}>
            <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
            {campaignId ? (
              <EntityMultiTypeahead
                values={npcValues}
                onChange={handleNpcsChange}
                campaignId={campaignId}
                entityTypes={['npc', 'player']}
                includeSrd={false}
                showCount={false}
                placeholder="Add NPCs..."
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {npcs.map((npc, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-blue-800 text-blue-300"
                  >
                    {npc.name}
                  </Badge>
                ))}
              </div>
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
    return [{
      tag: 'div[data-scene-block]',
      getAttrs: (element) => {
        if (typeof element === 'string') return false
        return element.hasAttribute('data-scene-block') ? {} : false
      },
    }]
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
