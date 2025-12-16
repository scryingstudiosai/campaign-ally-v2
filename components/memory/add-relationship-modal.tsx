'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Link2, ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'
import { EntityTypeBadge, EntityType } from './entity-type-badge'
import { cn } from '@/lib/utils'

interface Entity {
  id: string
  name: string
  entity_type: EntityType
}

interface AddRelationshipModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceEntityId: string
  sourceEntityName: string
  campaignId: string
}

const RELATIONSHIP_TYPES = [
  { value: 'knows', label: 'Knows', category: 'Personal' },
  { value: 'family', label: 'Family of', category: 'Personal' },
  { value: 'friend', label: 'Friend of', category: 'Personal' },
  { value: 'enemy', label: 'Enemy of', category: 'Personal' },
  { value: 'rival', label: 'Rival of', category: 'Personal' },
  { value: 'lover', label: 'Lover of', category: 'Personal' },
  { value: 'employs', label: 'Employs', category: 'Professional' },
  { value: 'serves', label: 'Serves', category: 'Professional' },
  { value: 'member_of', label: 'Member of', category: 'Professional' },
  { value: 'leads', label: 'Leads', category: 'Professional' },
  { value: 'located_in', label: 'Located in', category: 'Spatial' },
  { value: 'contains', label: 'Contains', category: 'Spatial' },
  { value: 'owns', label: 'Owns', category: 'Spatial' },
  { value: 'owned_by', label: 'Owned by', category: 'Spatial' },
  { value: 'created_by', label: 'Created by', category: 'Other' },
  { value: 'created', label: 'Created', category: 'Other' },
  { value: 'related_to', label: 'Related to', category: 'Other' },
]

export function AddRelationshipModal({
  open,
  onOpenChange,
  sourceEntityId,
  sourceEntityName,
  campaignId,
}: AddRelationshipModalProps): JSX.Element {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<Entity[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [targetEntityId, setTargetEntityId] = useState<string>('')
  const [relationshipType, setRelationshipType] = useState<string>('')
  const [description, setDescription] = useState('')
  const [bidirectional, setBidirectional] = useState(false)

  // Fetch entities
  useEffect(() => {
    if (!open) return

    const fetchEntities = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('entities')
          .select('id, name, entity_type')
          .eq('campaign_id', campaignId)
          .neq('id', sourceEntityId)
          .is('deleted_at', null)
          .order('name')

        if (error) throw error
        setEntities(data || [])
      } catch (error) {
        console.error('Failed to fetch entities:', error)
        toast.error('Failed to load entities')
      } finally {
        setLoading(false)
      }
    }

    fetchEntities()
  }, [open, campaignId, sourceEntityId])

  // Filter entities by search
  const filteredEntities = entities.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!targetEntityId || !relationshipType) {
      toast.error('Please select a target entity and relationship type')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      // Create the relationship
      const { error: relationshipError } = await supabase
        .from('relationships')
        .insert({
          campaign_id: campaignId,
          source_id: sourceEntityId,
          target_id: targetEntityId,
          relationship_type: relationshipType,
          description: description.trim() || null,
        })

      if (relationshipError) throw relationshipError

      // Create reverse relationship if bidirectional
      if (bidirectional) {
        const reverseType = getReverseRelationshipType(relationshipType)
        const { error: reverseError } = await supabase
          .from('relationships')
          .insert({
            campaign_id: campaignId,
            source_id: targetEntityId,
            target_id: sourceEntityId,
            relationship_type: reverseType,
            description: description.trim() || null,
          })

        if (reverseError) {
          console.error('Failed to create reverse relationship:', reverseError)
        }
      }

      toast.success('Relationship added')
      onOpenChange(false)
      router.refresh()

      // Reset form
      setTargetEntityId('')
      setRelationshipType('')
      setDescription('')
      setBidirectional(false)
      setSearchTerm('')
    } catch (error) {
      console.error('Failed to create relationship:', error)
      toast.error('Failed to add relationship')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Add Relationship
          </DialogTitle>
          <DialogDescription>
            Create a relationship from <strong>{sourceEntityName}</strong> to another entity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target Entity */}
          <div className="space-y-2">
            <Label>Target Entity *</Label>
            {targetEntityId ? (
              // Show selected entity
              <div className="flex items-center justify-between p-3 border rounded-md bg-primary/10">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {entities.find(e => e.id === targetEntityId)?.name}
                  </span>
                  <EntityTypeBadge
                    type={entities.find(e => e.id === targetEntityId)?.entity_type || 'other'}
                    size="sm"
                    showIcon={false}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTargetEntityId('')
                    setSearchTerm('')
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              // Show search and list
              <>
                <Input
                  placeholder="Search entities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-[200px] overflow-y-auto border rounded-md">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredEntities.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      {entities.length === 0 ? 'No other entities in this campaign' : 'No matching entities'}
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredEntities.map((entity) => (
                        <button
                          key={entity.id}
                          type="button"
                          onClick={() => setTargetEntityId(entity.id)}
                          className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors text-left"
                        >
                          <span className="font-medium">{entity.name}</span>
                          <EntityTypeBadge type={entity.entity_type} size="sm" showIcon={false} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Relationship Type */}
          <div className="space-y-2">
            <Label>Relationship Type *</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="knows" className="text-muted-foreground text-xs" disabled>
                  — Personal —
                </SelectItem>
                {RELATIONSHIP_TYPES.filter(r => r.category === 'Personal').map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
                <SelectItem value="_professional" className="text-muted-foreground text-xs" disabled>
                  — Professional —
                </SelectItem>
                {RELATIONSHIP_TYPES.filter(r => r.category === 'Professional').map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
                <SelectItem value="_spatial" className="text-muted-foreground text-xs" disabled>
                  — Spatial —
                </SelectItem>
                {RELATIONSHIP_TYPES.filter(r => r.category === 'Spatial').map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
                <SelectItem value="_other" className="text-muted-foreground text-xs" disabled>
                  — Other —
                </SelectItem>
                {RELATIONSHIP_TYPES.filter(r => r.category === 'Other').map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., secretly resents, old war buddy"
            />
          </div>

          {/* Bidirectional */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bidirectional"
              checked={bidirectional}
              onChange={(e) => setBidirectional(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="bidirectional" className="flex items-center gap-2 cursor-pointer">
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
              Create reverse relationship too
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !targetEntityId || !relationshipType}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Relationship'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getReverseRelationshipType(type: string): string {
  const reverseMap: Record<string, string> = {
    employs: 'serves',
    serves: 'employs',
    leads: 'member_of',
    member_of: 'leads',
    owns: 'owned_by',
    owned_by: 'owns',
    located_in: 'contains',
    contains: 'located_in',
    created_by: 'created',
    created: 'created_by',
  }
  return reverseMap[type] || type
}
