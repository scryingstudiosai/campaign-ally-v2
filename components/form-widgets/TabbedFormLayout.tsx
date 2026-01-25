'use client';

import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Brain, Wrench, Mic } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabbedFormLayoutProps {
  tabs: Tab[];
  defaultTab?: string;
}

// Explicit grid classes for Tailwind (dynamic classes don't work)
const GRID_COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function TabbedFormLayout({ tabs, defaultTab }: TabbedFormLayoutProps): JSX.Element {
  const defaultIcons: Record<string, ReactNode> = {
    soul: <Sparkles className="w-4 h-4" />,
    brain: <Brain className="w-4 h-4" />,
    mechanics: <Wrench className="w-4 h-4" />,
    voice: <Mic className="w-4 h-4" />,
  };

  // For many tabs (5+), use flex wrap layout instead of grid
  const usesFlexLayout = tabs.length > 4;
  const gridColsClass = GRID_COLS[tabs.length] || 'grid-cols-4';

  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.id} className="w-full">
      {usesFlexLayout ? (
        <TabsList className="flex w-full h-auto flex-wrap gap-1 bg-slate-900 p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
            >
              {tab.icon || defaultIcons[tab.id]}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      ) : (
        <TabsList className={`grid w-full ${gridColsClass} bg-slate-900`}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon || defaultIcons[tab.id]}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      )}

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-6 space-y-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
