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

export function TabbedFormLayout({ tabs, defaultTab }: TabbedFormLayoutProps): JSX.Element {
  const defaultIcons: Record<string, ReactNode> = {
    soul: <Sparkles className="w-4 h-4" />,
    brain: <Brain className="w-4 h-4" />,
    mechanics: <Wrench className="w-4 h-4" />,
    voice: <Mic className="w-4 h-4" />,
  };

  // Determine grid columns class based on number of tabs
  const gridColsClass =
    tabs.length === 2
      ? 'grid-cols-2'
      : tabs.length === 3
        ? 'grid-cols-3'
        : tabs.length === 4
          ? 'grid-cols-4'
          : 'grid-cols-3';

  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.id} className="w-full">
      <TabsList className={`grid w-full ${gridColsClass} bg-slate-900`}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
            {tab.icon || defaultIcons[tab.id]}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-4 space-y-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
