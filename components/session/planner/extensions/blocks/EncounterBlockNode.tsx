'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react'
import { Swords, MapPin } from 'lucide-react'
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
import { EntityMultiTypeahead, EntitySelection } from '@/components/ui/entity-multi-typeahead'
import { EntityTypeahead, EntityOption } from '@/components/ui/entity-typeahead'

interface Creature {
  id?: string
  name: string
  count: number
  cr?: string
  isSrd?: boolean
}

// Get campaign ID from URL
function getCampaignIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const pathParts = window.location.pathname.split('/')
  const campaignIndex = pathParts.indexOf('campaigns')
  return campaignIndex !== -1 ? pathParts[campaignIndex + 1] : null
}

// React component for the encounter block
function EncounterBlockComponent({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const title = node.attrs.title as string
  const difficulty = (node.attrs.difficulty as Difficulty) || 'medium'
  const creatures = parseJsonAttr<Creature[]>(node.attrs.creatures, [])
  const locationName = node.attrs.locationName as string | null
  const locationId = node.attrs.locationId as string | null

  const campaignId = getCampaignIdFromUrl()

  // Convert stored creatures to EntitySelection format
  const creatureValues: EntitySelection[] = creatures.map((c, index) => ({
    id: c.id || `temp-${index}`,
    name: c.name,
    entityType: 'creature' as const,
    isSrd: c.isSrd,
    cr: c.cr,
    count: c.count,
  }))

  // Convert stored location to EntityOption format
  const locationValue: EntityOption | null = locationId || locationName
    ? {
        id: locationId || '',
        name: locationName || '',
        entityType: 'location',
      }
    : null

  const handleCreaturesChange = (newCreatures: EntitySelection[]) => {
    updateAttributes({
      creatures: stringifyJsonAttr(newCreatures.map(c => ({
        id: c.id,
        name: c.name,
        count: c.count || 1,
        cr: c.cr,
        isSrd: c.isSrd,
      }))),
    })
  }

  const handleLocationChange = (location: EntityOption | null) => {
    updateAttributes({
      locationId: location?.id || null,
      locationName: location?.name || null,
    })
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
          <div className="flex items-center gap-2" contentEditable={false}>
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
                className="h-7 w-40 text-xs"
              />
            ) : (
              <span className="text-sm text-slate-500">{locationName || 'No location'}</span>
            )}
          </div>
        </>
      }
    >
      {/* Creature List */}
      <div className="space-y-2" contentEditable={false}>
        <span className="text-xs text-red-400 uppercase tracking-wider">
          Creatures
        </span>

        {campaignId ? (
          <EntityMultiTypeahead
            values={creatureValues}
            onChange={handleCreaturesChange}
            campaignId={campaignId}
            entityTypes={['creature']}
            includeSrd={true}
            showCount={true}
            placeholder="Add creatures..."
          />
        ) : (
          <p className="text-xs text-slate-500 italic">
            {creatures.length === 0
              ? 'No creatures added yet'
              : creatures.map(c => `${c.count}x ${c.name}`).join(', ')}
          </p>
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
      tag: 'div[data-encounter-block]',
      getAttrs: (element) => {
        if (typeof element === 'string') return false
        return element.hasAttribute('data-encounter-block') ? {} : false
      },
    }]
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
