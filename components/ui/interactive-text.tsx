'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Users, MapPin, Package, Scroll, Shield, Skull, Swords, Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Entity types supported - all 9 entity types
export type EntityType = 'npc' | 'location' | 'item' | 'quest' | 'faction' | 'creature' | 'encounter' | 'event' | 'deity';

// Highlight data structure
export interface TextHighlight {
  id?: string;
  text: string;
  startIndex: number;
  endIndex: number;
  confidence?: number;
  type?: EntityType;
  status?: 'pending' | 'accepted' | 'rejected' | 'merged';
}

// Selection range
export interface TextRange {
  start: number;
  end: number;
  text: string;
}

interface InteractiveTextProps {
  content: string;
  highlights?: TextHighlight[];
  selectedHighlightId?: string;
  onHighlightClick?: (highlight: TextHighlight) => void;
  onManualSelect?: (text: string, type: EntityType, range: TextRange) => void;
  className?: string;
  readOnly?: boolean;
}

const entityOptions: { type: EntityType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'npc', label: 'NPC', icon: Users, color: 'text-blue-400 hover:bg-blue-500/20' },
  { type: 'location', label: 'Location', icon: MapPin, color: 'text-green-400 hover:bg-green-500/20' },
  { type: 'item', label: 'Item', icon: Package, color: 'text-amber-400 hover:bg-amber-500/20' },
  { type: 'creature', label: 'Creature', icon: Skull, color: 'text-red-400 hover:bg-red-500/20' },
  { type: 'faction', label: 'Faction', icon: Shield, color: 'text-purple-400 hover:bg-purple-500/20' },
  { type: 'quest', label: 'Quest', icon: Scroll, color: 'text-teal-400 hover:bg-teal-500/20' },
  { type: 'encounter', label: 'Encounter', icon: Swords, color: 'text-orange-400 hover:bg-orange-500/20' },
  { type: 'event', label: 'Lore', icon: Sparkles, color: 'text-cyan-400 hover:bg-cyan-500/20' },
  { type: 'deity', label: 'Deity', icon: Crown, color: 'text-yellow-400 hover:bg-yellow-500/20' },
];

export function InteractiveText({
  content,
  highlights = [],
  selectedHighlightId,
  onHighlightClick,
  onManualSelect,
  className,
  readOnly = false,
}: InteractiveTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<TextRange | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    if (readOnly || !onManualSelect) return;

    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.isCollapsed) {
      setSelection(null);
      setPopoverPosition(null);
      return;
    }

    const selectedText = windowSelection.toString().trim();
    if (!selectedText || selectedText.length < 2) {
      setSelection(null);
      setPopoverPosition(null);
      return;
    }

    // Get selection range relative to content
    const range = windowSelection.getRangeAt(0);
    const container = containerRef.current;

    if (!container) return;

    // Check if selection is within our container
    if (!container.contains(range.commonAncestorContainer)) {
      return;
    }

    // Calculate text position in original content
    const preSelectionRange = document.createRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preSelectionRange.toString().length;
    const endIndex = startIndex + selectedText.length;

    // Get position for popover
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setSelection({
      start: startIndex,
      end: endIndex,
      text: selectedText,
    });

    setPopoverPosition({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 10,
    });
  }, [readOnly, onManualSelect]);

  // Handle entity type selection from popover
  const handleEntitySelect = (type: EntityType) => {
    if (selection && onManualSelect) {
      onManualSelect(selection.text, type, selection);
    }
    setSelection(null);
    setPopoverPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  // Close popover
  const handleClickOutside = useCallback(() => {
    setSelection(null);
    setPopoverPosition(null);
  }, []);

  // Build segments from content and highlights
  const segments = useMemo(() => {
    if (!highlights.length) {
      return [{ type: 'plain' as const, text: content, startIndex: 0, endIndex: content.length }];
    }

    // Sort highlights by start index and filter valid ones
    const sortedHighlights = [...highlights]
      .filter(h => h.startIndex != null && h.endIndex != null && h.startIndex < h.endIndex)
      .sort((a, b) => a.startIndex - b.startIndex);

    if (sortedHighlights.length === 0) {
      return [{ type: 'plain' as const, text: content, startIndex: 0, endIndex: content.length }];
    }

    // Remove overlapping highlights (keep first one)
    const filteredHighlights: TextHighlight[] = [];
    let lastEnd = 0;
    for (const highlight of sortedHighlights) {
      if (highlight.startIndex >= lastEnd) {
        filteredHighlights.push(highlight);
        lastEnd = highlight.endIndex;
      }
    }

    const result: Array<{
      type: 'plain' | 'highlight';
      text: string;
      startIndex: number;
      endIndex: number;
      highlight?: TextHighlight;
    }> = [];

    let currentIndex = 0;
    for (const highlight of filteredHighlights) {
      // Text before highlight
      if (highlight.startIndex > currentIndex) {
        result.push({
          type: 'plain',
          text: content.slice(currentIndex, highlight.startIndex),
          startIndex: currentIndex,
          endIndex: highlight.startIndex,
        });
      }

      // Highlighted text
      result.push({
        type: 'highlight',
        text: content.slice(highlight.startIndex, highlight.endIndex),
        startIndex: highlight.startIndex,
        endIndex: highlight.endIndex,
        highlight,
      });

      currentIndex = highlight.endIndex;
    }

    // Remaining text
    if (currentIndex < content.length) {
      result.push({
        type: 'plain',
        text: content.slice(currentIndex),
        startIndex: currentIndex,
        endIndex: content.length,
      });
    }

    return result;
  }, [content, highlights]);

  // Render content with highlights
  const renderContent = () => {
    return segments.map((segment, index) => {
      if (segment.type === 'plain') {
        return (
          <span key={`plain-${index}`} className="whitespace-pre-wrap">
            {segment.text}
          </span>
        );
      }

      const highlight = segment.highlight!;
      const isHighConfidence = (highlight.confidence ?? 0.8) >= 0.8;
      const isSelected = selectedHighlightId === highlight.id;
      const isRejected = highlight.status === 'rejected';

      return (
        <mark
          key={`highlight-${highlight.id || index}`}
          onClick={() => onHighlightClick?.(highlight)}
          className={cn(
            'rounded px-0.5 transition-all',
            isRejected
              ? 'bg-stone-700/50 line-through opacity-50'
              : isHighConfidence
              ? 'bg-green-500/30 hover:bg-green-500/50'
              : 'bg-yellow-500/30 hover:bg-yellow-500/50',
            isSelected && 'ring-2 ring-teal-500',
            onHighlightClick && 'cursor-pointer'
          )}
        >
          {segment.text}
        </mark>
      );
    });
  };

  return (
    <div className="relative" onClick={handleClickOutside}>
      {/* Text Content */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className={cn(
          'font-mono text-sm leading-relaxed text-stone-300',
          !readOnly && onManualSelect && 'cursor-text select-text',
          className
        )}
      >
        {renderContent()}
      </div>

      {/* Selection Popover */}
      {popoverPosition && selection && (
        <div
          className="absolute z-50 transform -translate-x-1/2"
          style={{ left: popoverPosition.x, top: popoverPosition.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-stone-800 rounded-lg border border-stone-700 shadow-xl p-1 flex gap-1 animate-in fade-in zoom-in-95 duration-150">
            {entityOptions.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => handleEntitySelect(type)}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors',
                  color
                )}
                title={`Create ${label}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-stone-700" />
        </div>
      )}
    </div>
  );
}
