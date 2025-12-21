'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { EntityTypeBadge, EntityType } from './entity-type-badge'
import {
  Link2,
  Plus,
  ArrowRight,
  Users,
  MapPin,
  Heart,
  Briefcase,
  Swords,
  Building,
  Sparkles,
  Trash2,
  Loader2,
  GraduationCap,
  Crown,
  Shield,
  Coins,
  Eye,
  Search,
  Scroll,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export interface Relationship {
  id: string
  source_id: string
  target_id: string
  relationship_type: string
  description?: string
  target_entity?: {
    id: string
    name: string
    entity_type: EntityType
  }
  source_entity?: {
    id: string
    name: string
    entity_type: EntityType
  }
}

interface RelationshipDisplayProps {
  relationships: Relationship[]
  currentEntityId: string
  campaignId: string
  onAddRelationship?: () => void
}

const RELATIONSHIP_ICONS: Record<string, typeof Link2> = {
  // Personal
  knows: Users,
  friend: Heart,
  enemy: Swords,
  rival: Swords,
  parent_of: Users,
  child_of: Users,
  sibling_of: Users,
  spouse_of: Heart,
  lover: Heart,
  // Professional
  employs: Briefcase,
  serves: Briefcase,
  leads: Building,
  member_of: Building,
  student_of: GraduationCap,
  mentor_of: GraduationCap,
  // Spatial
  located_in: MapPin,
  contains: MapPin,
  owns: MapPin,
  owned_by: MapPin,
  // Divine
  worships: Crown,
  deity_of: Crown,
  // Duty
  protects: Shield,
  guarded_by: Shield,
  // Intrigue
  debt_to: Coins,
  creditor_of: Coins,
  blackmails: Eye,
  blackmailed_by: Eye,
  // History
  creator_of: Sparkles,
  created_by: Sparkles,
  // Quest
  seeks: Search,
  sought_by: Search,
  // Other
  related_to: Link2,
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  // Personal
  knows: 'Knows',
  friend: 'Friend of',
  enemy: 'Enemy of',
  rival: 'Rival of',
  parent_of: 'Parent of',
  child_of: 'Child of',
  sibling_of: 'Sibling of',
  spouse_of: 'Spouse of',
  lover: 'Lover of',
  // Professional
  employs: 'Employs',
  serves: 'Serves',
  leads: 'Leads',
  member_of: 'Member of',
  student_of: 'Student of',
  mentor_of: 'Mentor of',
  // Spatial
  located_in: 'Located in',
  contains: 'Contains',
  owns: 'Owns',
  owned_by: 'Owned by',
  // Divine
  worships: 'Worships',
  deity_of: 'Deity/Patron of',
  // Duty
  protects: 'Protects/Guards',
  guarded_by: 'Guarded by',
  // Intrigue
  debt_to: 'Indebted to',
  creditor_of: 'Creditor of',
  blackmails: 'Blackmails',
  blackmailed_by: 'Blackmailed by',
  // History
  creator_of: 'Creator of',
  created_by: 'Created by',
  // Quest
  seeks: 'Seeks',
  sought_by: 'Sought by',
  // Other
  related_to: 'Related to',
}

// Maps a relationship type to its reverse (for display from the target's perspective)
const REVERSE_RELATIONSHIP_TYPES: Record<string, string> = {
  // Symmetric relationships (same both ways)
  knows: 'knows',
  friend: 'friend',
  enemy: 'enemy',
  rival: 'rival',
  sibling_of: 'sibling_of',
  spouse_of: 'spouse_of',
  lover: 'lover',
  related_to: 'related_to',
  // Asymmetric relationships (different label for reverse)
  parent_of: 'child_of',
  child_of: 'parent_of',
  employs: 'serves',
  serves: 'employs',
  leads: 'member_of',
  member_of: 'leads',
  student_of: 'mentor_of',
  mentor_of: 'student_of',
  located_in: 'contains',
  contains: 'located_in',
  owns: 'owned_by',
  owned_by: 'owns',
  worships: 'deity_of',
  deity_of: 'worships',
  protects: 'guarded_by',
  guarded_by: 'protects',
  debt_to: 'creditor_of',
  creditor_of: 'debt_to',
  blackmails: 'blackmailed_by',
  blackmailed_by: 'blackmails',
  creator_of: 'created_by',
  created_by: 'creator_of',
  seeks: 'sought_by',
  sought_by: 'seeks',
}

function getReverseRelationshipType(type: string): string {
  return REVERSE_RELATIONSHIP_TYPES[type] || type
}

// Relationship type options for the dropdown
const RELATIONSHIP_TYPE_OPTIONS = [
  { value: 'related_to', label: 'Related to' },
  { value: 'knows', label: 'Knows' },
  { value: 'friend', label: 'Friend of' },
  { value: 'enemy', label: 'Enemy of' },
  { value: 'rival', label: 'Rival of' },
  { value: 'parent_of', label: 'Parent of' },
  { value: 'child_of', label: 'Child of' },
  { value: 'sibling_of', label: 'Sibling of' },
  { value: 'spouse_of', label: 'Spouse of' },
  { value: 'lover', label: 'Lover of' },
  { value: 'employs', label: 'Employs' },
  { value: 'serves', label: 'Serves' },
  { value: 'leads', label: 'Leads' },
  { value: 'member_of', label: 'Member of' },
  { value: 'student_of', label: 'Student of' },
  { value: 'mentor_of', label: 'Mentor of' },
  { value: 'located_in', label: 'Located in' },
  { value: 'contains', label: 'Contains' },
  { value: 'owns', label: 'Owns' },
  { value: 'owned_by', label: 'Owned by' },
  { value: 'worships', label: 'Worships' },
  { value: 'deity_of', label: 'Deity/Patron of' },
  { value: 'protects', label: 'Protects/Guards' },
  { value: 'guarded_by', label: 'Guarded by' },
  { value: 'debt_to', label: 'Indebted to' },
  { value: 'creditor_of', label: 'Creditor of' },
  { value: 'blackmails', label: 'Blackmails' },
  { value: 'blackmailed_by', label: 'Blackmailed by' },
  { value: 'creator_of', label: 'Creator of' },
  { value: 'created_by', label: 'Created by' },
  { value: 'seeks', label: 'Seeks' },
  { value: 'sought_by', label: 'Sought by' },
]

export function RelationshipDisplay({
  relationships,
  currentEntityId,
  campaignId,
  onAddRelationship,
}: RelationshipDisplayProps): JSX.Element {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedType, setEditedType] = useState<string>('')
  const [savingId, setSavingId] = useState<string | null>(null)

  // Process relationships to show the "other" entity with correct perspective
  const processedRelationships = relationships.map((rel) => {
    const isSource = rel.source_id === currentEntityId
    const otherEntity = isSource ? rel.target_entity : rel.source_entity

    // Get the correct relationship type for this perspective
    const displayType = isSource
      ? rel.relationship_type
      : getReverseRelationshipType(rel.relationship_type)

    const relationshipLabel = RELATIONSHIP_LABELS[displayType] || displayType

    return {
      ...rel,
      otherEntity,
      relationshipLabel,
      displayType, // Use this for icon lookup
      isSource,
    }
  }).filter(rel => rel.otherEntity) // Only show relationships where we have the other entity

  const handleDelete = async (rel: Relationship) => {
    setDeletingId(rel.id)

    try {
      const supabase = createClient()

      // Delete the relationship (single row model - no reverse to delete)
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', rel.id)

      if (error) throw error

      toast.success('Relationship deleted')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete relationship:', error)
      toast.error('Failed to delete relationship')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSave = async (rel: (typeof processedRelationships)[0]) => {
    if (!editedType) return
    setSavingId(rel.id)

    try {
      const supabase = createClient()

      // Determine the actual type to save based on perspective
      // If we're viewing from the source's perspective, save the type as-is
      // If we're viewing from the target's perspective, we need to save the reverse type
      const typeToSave = rel.isSource
        ? editedType
        : getReverseRelationshipType(editedType)

      const { error } = await supabase
        .from('relationships')
        .update({ relationship_type: typeToSave })
        .eq('id', rel.id)

      if (error) throw error

      toast.success('Relationship updated')
      setEditingId(null)
      setEditedType('')
      router.refresh()
    } catch (error) {
      console.error('Failed to update relationship:', error)
      toast.error('Failed to update relationship')
    } finally {
      setSavingId(null)
    }
  }

  const startEditing = (rel: (typeof processedRelationships)[0]) => {
    setEditingId(rel.id)
    setEditedType(rel.displayType)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditedType('')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Relationships
          </CardTitle>
          {onAddRelationship && (
            <Button variant="outline" size="sm" onClick={onAddRelationship}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {processedRelationships.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No relationships yet
          </p>
        ) : (
          <TooltipProvider delayDuration={200}>
            <div className="space-y-2">
              {processedRelationships.map((rel) => {
                const Icon = RELATIONSHIP_ICONS[rel.displayType] || Link2
                const isDeleting = deletingId === rel.id
                const isEditing = editingId === rel.id
                const isSaving = savingId === rel.id

                return (
                  <div
                    key={rel.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group overflow-hidden"
                  >
                    {isEditing ? (
                      // Edit mode - two lines
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <Select value={editedType} onValueChange={setEditedType}>
                            <SelectTrigger className="w-36 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_TYPE_OPTIONS.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSave(rel)}
                              disabled={isSaving}
                              className="p-1 rounded hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50"
                              title="Save"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              disabled={isSaving}
                              className="p-1 rounded hover:bg-muted transition-all disabled:opacity-50"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                          <span className="font-medium text-foreground truncate">
                            {rel.otherEntity?.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // View mode - two lines
                      <div className="w-full">
                        {/* Line 1: Relationship type + edit/delete buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="text-xs text-slate-500">
                              {rel.relationshipLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => startEditing(rel)}
                              className="p-0.5 rounded hover:bg-muted transition-all"
                              title="Edit relationship"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(rel)}
                              disabled={isDeleting}
                              className="p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-50"
                              title="Delete relationship"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        {/* Line 2: Entity name with link */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/dashboard/campaigns/${campaignId}/memory/${rel.otherEntity?.id}`}
                                className="text-teal-400 hover:text-teal-300 transition-colors truncate max-w-[140px]"
                              >
                                {rel.otherEntity?.name}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{rel.otherEntity?.name}</p>
                              <p className="text-xs text-slate-400">{rel.otherEntity?.entity_type}</p>
                            </TooltipContent>
                          </Tooltip>
                          <EntityTypeBadge
                            type={rel.otherEntity?.entity_type || 'other'}
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
