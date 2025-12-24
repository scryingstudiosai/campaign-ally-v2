'use client'

import { Scale } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SrdBadgeProps {
  license?: string
  className?: string
}

const LICENSE_INFO: Record<string, { name: string; description: string }> = {
  'ogl_1.0a': {
    name: 'OGL 1.0a',
    description: 'Open Gaming License v1.0a',
  },
  'cc_by_4.0': {
    name: 'CC-BY 4.0',
    description: 'Creative Commons Attribution 4.0',
  },
  orc: {
    name: 'ORC',
    description: 'Open RPG Creative License',
  },
}

export function SrdBadge({ license = 'ogl_1.0a', className = '' }: SrdBadgeProps): JSX.Element {
  const licenseInfo = LICENSE_INFO[license] || { name: license, description: license }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded text-[10px] text-teal-400 font-medium cursor-help ${className}`}
          >
            <Scale className="w-3 h-3" />
            SRD
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Official content used under the {licenseInfo.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
