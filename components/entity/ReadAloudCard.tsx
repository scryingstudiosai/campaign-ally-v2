'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { renderWithBold } from '@/lib/text-utils'

interface ReadAloudProps {
  text: string
  entityId: string
  onUpdate?: (newText: string) => void
}

export function ReadAloudCard({ text, entityId, onUpdate }: ReadAloudProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Prevent unused variable warning
  void entityId
  void onUpdate

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRegenerating(true)

    // TODO: Connect to "Update Description" API that reads Active Facts
    // This will regenerate based on current facts (e.g., "Baron now has a broken nose")

    setTimeout(() => {
      setIsRegenerating(false)
      // toast.success("Description updated based on current facts")
    }, 1500)
  }

  return (
    <div
      className={`ca-panel border-l-2 border-primary/50 transition-all duration-200 ${
        isOpen ? 'p-4' : 'p-2 hover:bg-slate-800/50 cursor-pointer'
      }`}
      onClick={() => !isOpen && setIsOpen(true)}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2 text-primary cursor-pointer select-none"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Read Aloud</span>

          {/* Preview text when collapsed */}
          {!isOpen && (
            <span className="text-xs text-slate-500 ml-2 truncate max-w-[300px] italic">
              {text.replace(/\*\*/g, '').substring(0, 50)}...
            </span>
          )}
        </div>

        {isOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-primary"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Update description based on current facts"
          >
            <RefreshCw
              className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`}
            />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="mt-3 pl-6 border-l-2 border-primary/20">
          <p className="text-sm text-slate-300 italic leading-relaxed">
            {renderWithBold(text)}
          </p>
        </div>
      )}
    </div>
  )
}
