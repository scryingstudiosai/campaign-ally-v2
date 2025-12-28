'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Plus, Clapperboard, Swords, Flag, Info } from 'lucide-react';

interface AddBlockMenuProps {
  onAddBlock: (type: 'scene' | 'encounter' | 'quest' | 'info') => void;
}

const BLOCK_TYPES = [
  {
    type: 'scene' as const,
    label: 'Scene',
    description: 'A narrative moment or location',
    icon: Clapperboard,
    color: 'text-teal-400',
  },
  {
    type: 'encounter' as const,
    label: 'Encounter',
    description: 'Combat or challenge',
    icon: Swords,
    color: 'text-red-400',
  },
  {
    type: 'quest' as const,
    label: 'Quest',
    description: 'Objectives and rewards',
    icon: Flag,
    color: 'text-purple-400',
  },
  {
    type: 'info' as const,
    label: 'Info',
    description: 'Notes, secrets, reminders',
    icon: Info,
    color: 'text-blue-400',
  },
];

export function AddBlockMenu({ onAddBlock }: AddBlockMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-dashed border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700">
        <DropdownMenuLabel className="text-slate-400">Block Type</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-700" />
        {BLOCK_TYPES.map((blockType) => {
          const IconComponent = blockType.icon;
          return (
            <DropdownMenuItem
              key={blockType.type}
              onClick={() => onAddBlock(blockType.type)}
              className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
            >
              <div className="flex items-start gap-3">
                <IconComponent className={`w-5 h-5 mt-0.5 ${blockType.color}`} />
                <div>
                  <p className="font-medium text-slate-200">{blockType.label}</p>
                  <p className="text-xs text-slate-500">{blockType.description}</p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
