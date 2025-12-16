'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Search } from 'lucide-react'

interface SelectionPopoverProps {
  containerRef: React.RefObject<HTMLElement>
  onCreateDiscovery: (text: string, type: string) => void
  onSearchExisting: (text: string) => void
  existingEntities?: Array<{ id: string; name: string; type: string }>
}

export function SelectionPopover({
  containerRef,
  onCreateDiscovery,
  onSearchExisting,
  existingEntities = [],
}: SelectionPopoverProps): JSX.Element | null {
  const [selection, setSelection] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<typeof existingEntities>(
    []
  )

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    const selectedText = sel?.toString().trim()

    if (selectedText && selectedText.length >= 2 && selectedText.length < 100) {
      const range = sel?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()

      // Check if selection is within our container
      if (
        rect &&
        containerRef.current?.contains(range?.commonAncestorContainer || null)
      ) {
        setSelection({
          text: selectedText,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        })
        setShowSearch(false)

        // Check for matching existing entities
        const matches = existingEntities.filter(
          (e) =>
            e.name.toLowerCase().includes(selectedText.toLowerCase()) ||
            selectedText.toLowerCase().includes(e.name.toLowerCase())
        )
        setSearchResults(matches)
      }
    } else {
      setSelection(null)
      setShowSearch(false)
    }
  }, [containerRef, existingEntities])

  const handleClickOutside = useCallback((e: MouseEvent) => {
    // Don't close if clicking inside the popover
    const target = e.target as HTMLElement
    if (target.closest('.selection-popover')) return

    setSelection(null)
    setShowSearch(false)
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleMouseUp, handleClickOutside])

  const handleTypeSelect = (type: string): void => {
    if (selection) {
      onCreateDiscovery(selection.text, type)
      setSelection(null)
      window.getSelection()?.removeAllRanges()
    }
  }

  const handleLinkExisting = (entityId: string): void => {
    onSearchExisting(entityId)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  if (!selection) return null

  return (
    <div
      className="selection-popover fixed z-50 animate-in fade-in zoom-in-95"
      style={{
        left: selection.x,
        top: selection.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-1">
        {showSearch ? (
          // Search/Link Mode
          <div className="p-2 min-w-[200px]">
            <p className="text-xs text-slate-400 mb-2">Link to existing:</p>
            {searchResults.length > 0 ? (
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {searchResults.map((entity) => (
                  <button
                    key={entity.id}
                    onClick={() => handleLinkExisting(entity.id)}
                    className="w-full text-left px-2 py-1 text-sm rounded hover:bg-slate-700 flex items-center justify-between"
                  >
                    <span className="text-slate-200">{entity.name}</span>
                    <span className="text-xs text-slate-500">{entity.type}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No matches found</p>
            )}
            <button
              onClick={() => setShowSearch(false)}
              className="mt-2 text-xs text-slate-400 hover:text-white"
            >
              &larr; Back to create
            </button>
          </div>
        ) : (
          // Create Mode
          <div className="flex items-center gap-1">
            {/* Search/Link Button */}
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Link to existing entity"
            >
              <Search className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-700 mx-1" />

            <span className="text-xs font-medium text-slate-500 px-1">
              Create:
            </span>

            <button
              onClick={() => handleTypeSelect('npc')}
              className="px-2 py-1 text-xs font-medium text-teal-400 hover:bg-slate-700 rounded transition-colors"
            >
              NPC
            </button>
            <button
              onClick={() => handleTypeSelect('location')}
              className="px-2 py-1 text-xs font-medium text-amber-400 hover:bg-slate-700 rounded transition-colors"
            >
              Loc
            </button>
            <button
              onClick={() => handleTypeSelect('item')}
              className="px-2 py-1 text-xs font-medium text-purple-400 hover:bg-slate-700 rounded transition-colors"
            >
              Item
            </button>
          </div>
        )}
      </div>

      {/* Arrow pointing down to selection */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full">
        <div className="border-8 border-transparent border-t-slate-800" />
      </div>
    </div>
  )
}
