'use client'

import React from 'react'

/**
 * Parses markdown bold syntax (**text**) and renders as JSX with styled <strong> tags.
 * Returns empty fragment for null/undefined input.
 */
export function renderWithBold(text: string | undefined | null): React.ReactElement {
  if (!text) return <></>

  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="text-foreground font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}
