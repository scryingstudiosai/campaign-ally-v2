'use client'

import { useState } from 'react'
import { useFacts } from '@/hooks/useFacts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ScrollText,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  History,
} from 'lucide-react'
import { FactCategory, Visibility } from '@/types/living-entity'

interface FactsWidgetProps {
  entityId: string
  campaignId: string
}

const CATEGORY_COLORS: Record<FactCategory, string> = {
  appearance: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  personality: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  lore: 'bg-green-500/20 text-green-400 border-green-500/30',
  plot: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  secret: 'bg-red-500/20 text-red-400 border-red-500/30',
  mechanical: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  flavor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  backstory: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const VISIBILITY_ICONS = {
  public: Eye,
  limited: Eye,
  dm_only: EyeOff,
}

export function FactsWidget({ entityId, campaignId }: FactsWidgetProps) {
  const {
    activeFacts,
    supersededFacts,
    loading,
    addFact,
    toggleVisibility,
    supersedeFact,
    deleteFact,
  } = useFacts(entityId, campaignId)

  const [isOpen, setIsOpen] = useState(true)
  const [showSuperseded, setShowSuperseded] = useState(false)

  // New fact form
  const [isAdding, setIsAdding] = useState(false)
  const [newFactContent, setNewFactContent] = useState('')
  const [newFactCategory, setNewFactCategory] = useState<FactCategory>('lore')
  const [newFactVisibility, setNewFactVisibility] =
    useState<Visibility>('dm_only')

  const handleAddFact = async () => {
    if (!newFactContent.trim()) return

    await addFact(newFactContent.trim(), newFactCategory, newFactVisibility)
    setNewFactContent('')
    setIsAdding(false)
  }

  // Group active facts by category
  const groupedFacts = activeFacts.reduce(
    (acc, fact) => {
      if (!acc[fact.category]) acc[fact.category] = []
      acc[fact.category].push(fact)
      return acc
    },
    {} as Record<string, typeof activeFacts>
  )

  return (
    <div className="ca-panel p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-2 text-slate-400 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <ScrollText className="w-4 h-4" />
          <span className="text-sm font-medium">Facts</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {activeFacts.length}
          </Badge>
        </div>

        {isOpen && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAdding(!isAdding)}
            className="h-7 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="space-y-3">
          {/* Add Fact Form */}
          {isAdding && (
            <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 border border-slate-700">
              <Input
                placeholder="Enter a fact..."
                value={newFactContent}
                onChange={(e) => setNewFactContent(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddFact()}
                autoFocus
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={newFactCategory}
                  onValueChange={(v) => setNewFactCategory(v as FactCategory)}
                >
                  <SelectTrigger className="w-32 h-8 text-xs bg-slate-900/50 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lore">Lore</SelectItem>
                    <SelectItem value="plot">Plot</SelectItem>
                    <SelectItem value="secret">Secret</SelectItem>
                    <SelectItem value="appearance">Appearance</SelectItem>
                    <SelectItem value="personality">Personality</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="flavor">Flavor</SelectItem>
                    <SelectItem value="backstory">Backstory</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={newFactVisibility}
                  onValueChange={(v) => setNewFactVisibility(v as Visibility)}
                >
                  <SelectTrigger className="w-28 h-8 text-xs bg-slate-900/50 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="dm_only">DM Only</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-1 ml-auto">
                  <Button size="sm" onClick={handleAddFact} className="h-8">
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAdding(false)}
                    className="h-8"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Facts List */}
          {loading ? (
            <p className="text-sm text-slate-500">Loading facts...</p>
          ) : activeFacts.length === 0 ? (
            <p className="text-sm text-slate-500 italic">
              No facts recorded yet
            </p>
          ) : (
            <div className="space-y-1">
              {Object.entries(groupedFacts).map(([, categoryFacts]) =>
                categoryFacts.map((fact) => {
                  const VisibilityIcon = VISIBILITY_ICONS[fact.visibility]
                  return (
                    <div
                      key={fact.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-slate-800/50 group"
                    >
                      {/* Visibility indicator */}
                      <button
                        onClick={() => toggleVisibility(fact.id, fact.visibility)}
                        className="mt-0.5 shrink-0"
                        title={`Click to change visibility (${fact.visibility})`}
                      >
                        <VisibilityIcon
                          className={`w-3 h-3 ${
                            fact.visibility === 'public'
                              ? 'text-green-400'
                              : fact.visibility === 'limited'
                                ? 'text-amber-400'
                                : 'text-red-400'
                          }`}
                        />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">{fact.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${CATEGORY_COLORS[fact.category as FactCategory]}`}
                          >
                            {fact.category}
                          </Badge>
                          {fact.source_type === 'generated' && (
                            <span title="AI Generated">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                            </span>
                          )}
                          {fact.established_at_text && (
                            <span className="text-xs text-slate-600">
                              {fact.established_at_text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => supersedeFact(fact.id)}
                          title="Archive (mark as outdated)"
                        >
                          <History className="w-3 h-3 text-slate-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => deleteFact(fact.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Superseded Facts (Collapsed) */}
          {supersededFacts.length > 0 && (
            <div className="pt-2 border-t border-slate-700">
              <button
                onClick={() => setShowSuperseded(!showSuperseded)}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400"
              >
                <History className="w-3 h-3" />
                {showSuperseded ? 'Hide' : 'Show'} past facts (
                {supersededFacts.length})
              </button>

              {showSuperseded && (
                <div className="mt-2 space-y-1 opacity-60">
                  {supersededFacts.map((fact) => (
                    <div
                      key={fact.id}
                      className="flex items-start gap-2 p-2 rounded"
                    >
                      <span className="text-xs text-slate-600 line-through">
                        {fact.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
