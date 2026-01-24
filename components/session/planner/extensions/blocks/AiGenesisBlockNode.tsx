'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState } from 'react'
import { Sparkles, Loader2, Check, RefreshCw, BookOpen, Swords, HelpCircle, Map, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface GeneratedBlock {
  type: 'scene' | 'encounter' | 'quest' | 'note'
  title: string
  content: Record<string, unknown>
}

interface GeneratedOption {
  title: string
  approach: string
  summary: string
  blocks: GeneratedBlock[]
}

// Get campaign ID from URL
function getCampaignIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const pathParts = window.location.pathname.split('/')
  const campaignIndex = pathParts.indexOf('campaigns')
  return campaignIndex !== -1 ? pathParts[campaignIndex + 1] : null
}

// The React component for the node
function AiGenesisComponent({ deleteNode, editor }: NodeViewProps) {
  const [prompt, setPrompt] = useState('')
  const [includeLastSession, setIncludeLastSession] = useState(true)
  const [includeActiveThreads, setIncludeActiveThreads] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<GeneratedOption[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const campaignId = getCampaignIdFromUrl()

  const approachIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    Combat: Swords,
    Social: BookOpen,
    Mystery: HelpCircle,
    Exploration: Map,
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || !campaignId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          prompt,
          includeLastSession,
          includeActiveThreads,
        }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()
      setOptions(data.options || [])
    } catch {
      setError('Failed to generate options. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectOption = (option: GeneratedOption) => {
    // Delete this AI block first
    deleteNode()

    // Insert the generated blocks using editor commands
    option.blocks.forEach((block) => {
      const content = block.content as Record<string, unknown>

      switch (block.type) {
        case 'scene':
          editor.chain().focus().insertSceneBlock({
            title: block.title,
            locationName: content.location_name as string || null,
            npcs: JSON.stringify(content.npcs || []),
            readAloud: content.read_aloud as string || '',
            goals: JSON.stringify(content.goals || []),
            dmNotes: content.dm_notes as string || '',
          }).run()
          break
        case 'encounter':
          editor.chain().focus().insertEncounterBlock({
            title: block.title,
            locationName: content.location_name as string || null,
            difficulty: content.difficulty as string || 'medium',
            creatures: JSON.stringify(content.creatures || []),
            tactics: content.tactics as string || '',
            dmNotes: content.dm_notes as string || '',
          }).run()
          break
        case 'quest':
          editor.chain().focus().insertQuestBlock({
            title: block.title,
            objective: content.objective as string || '',
            milestones: JSON.stringify(content.milestones || []),
            rewards: JSON.stringify(content.rewards || {}),
            dmNotes: content.dm_notes as string || '',
          }).run()
          break
        case 'note':
          editor.chain().focus().insertNoteBlock({
            title: block.title,
            noteContent: content.dm_notes as string || '',
          }).run()
          break
      }
    })
  }

  return (
    <NodeViewWrapper className="ai-genesis-block my-4" contentEditable={false}>
      {!options ? (
        // Drafting State
        <div className="border border-dashed border-purple-500/50 bg-purple-950/20 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">AI Genesis Block</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => deleteNode()} className="h-6 w-6 p-0 text-slate-500">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            placeholder="Describe what you need... e.g., 'The party arrives at the haunted manor and must find the hidden vault'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] bg-slate-900/50 border-slate-700 text-sm"
          />

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
              <Checkbox
                checked={includeLastSession}
                onCheckedChange={(c) => setIncludeLastSession(!!c)}
              />
              Last session context
            </label>
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
              <Checkbox
                checked={includeActiveThreads}
                onCheckedChange={(c) => setIncludeActiveThreads(!!c)}
              />
              Active story threads
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading || !campaignId}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Options
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        // Selection State
        <div className="border border-dashed border-purple-500/50 bg-purple-950/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">Choose Your Path</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOptions(null)}
              className="text-slate-500 h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>

          <p className="text-xs text-slate-500 italic">&ldquo;{prompt}&rdquo;</p>

          <div className="space-y-2">
            {options.map((option, index) => {
              const Icon = approachIcons[option.approach] || Sparkles
              return (
                <div
                  key={index}
                  className="border border-slate-700 bg-slate-900/50 rounded-lg p-3 hover:border-purple-500/50 transition-colors cursor-pointer group"
                  onClick={() => handleSelectOption(option)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-purple-400 shrink-0" />
                        <span className="font-medium text-slate-200 text-sm">{option.title}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                          {option.approach}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{option.summary}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Contains: {option.blocks.map(b => b.type).join(' + ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-purple-600 hover:bg-purple-700 h-7 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}

// Extend the Commands interface
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiGenesisBlock: {
      insertAiGenesisBlock: () => ReturnType
    }
  }
}

// The Tiptap extension
export const AiGenesisBlockNode = Node.create({
  name: 'aiGenesisBlock',
  group: 'block',
  atom: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="ai-genesis-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    // No content hole (0) for atom nodes - they are leaf nodes with no children
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'ai-genesis-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiGenesisComponent)
  },

  addCommands() {
    return {
      insertAiGenesisBlock:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          })
        },
    }
  },
})
