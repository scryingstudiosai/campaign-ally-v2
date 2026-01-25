'use client';

import { useState, useEffect, useCallback, RefObject } from 'react';

export interface SelectionPosition {
  x: number;
  y: number;
}

export interface UseTextSelectionResult {
  selectedText: string;
  selectionPosition: SelectionPosition | null;
  clearSelection: () => void;
}

/**
 * Hook to track text selection within a container element
 * Useful for showing contextual menus when text is selected
 */
export function useTextSelection(
  containerRef: RefObject<HTMLElement | null>,
  options?: {
    minLength?: number;
    maxLength?: number;
    disabled?: boolean;
  }
): UseTextSelectionResult {
  const { minLength = 2, maxLength = 100, disabled = false } = options || {};

  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<SelectionPosition | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    if (disabled) {
      clearSelection();
      return;
    }

    const handleMouseUp = (e: MouseEvent) => {
      // Small delay to let selection complete
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length >= minLength && text.length <= maxLength) {
          // Check if selection is within our container
          if (containerRef.current && selection?.anchorNode) {
            if (containerRef.current.contains(selection.anchorNode)) {
              setSelectedText(text);

              // Position menu near the selection
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              setSelectionPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + 10 + window.scrollY,
              });
              return;
            }
          }
        }

        // Clear if no valid selection
        setSelectedText('');
        setSelectionPosition(null);
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Don't clear if clicking inside a selection-menu (to allow button clicks)
      const target = e.target as HTMLElement;
      if (target.closest('.selection-menu')) return;

      setSelectedText('');
      setSelectionPosition(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Clear selection on Escape
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, minLength, maxLength, disabled, clearSelection]);

  return { selectedText, selectionPosition, clearSelection };
}
