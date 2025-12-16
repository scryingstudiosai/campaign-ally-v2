'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

interface EmptyForgeStateProps {
  forgeType: string
  description?: string
}

export function EmptyForgeState({
  forgeType,
  description,
}: EmptyForgeStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16">
      <div className="p-4 bg-muted/50 rounded-full mb-4">
        <Sparkles className="w-12 h-12 text-primary/50" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Ready to Forge
      </h3>
      <p className="text-muted-foreground max-w-sm">
        {description ||
          `Fill in the details on the left and click "Generate ${forgeType}" to create something new.`}
      </p>
    </div>
  )
}
