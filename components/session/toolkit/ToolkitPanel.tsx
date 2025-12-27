'use client';

import { LibraryPanel } from './LibraryPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Library, Dices, Sparkles } from 'lucide-react';

interface ToolkitPanelProps {
  campaignId: string;
  sessionStatus: string;
}

export function ToolkitPanel({ campaignId }: ToolkitPanelProps) {
  return (
    <div className="h-full flex flex-col p-4">
      <Tabs defaultValue="library" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="library" className="text-xs">
            <Library className="w-4 h-4 mr-1" />
            Library
          </TabsTrigger>
          <TabsTrigger value="dice" className="text-xs">
            <Dices className="w-4 h-4 mr-1" />
            Dice
          </TabsTrigger>
          <TabsTrigger value="forge" className="text-xs">
            <Sparkles className="w-4 h-4 mr-1" />
            Forge
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="flex-1 mt-4 overflow-hidden">
          <LibraryPanel campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="dice" className="flex-1 mt-4">
          <div className="text-center py-8 text-slate-500">
            <Dices className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Dice Roller</p>
            <p className="text-xs">Coming in Phase 3</p>
          </div>
        </TabsContent>

        <TabsContent value="forge" className="flex-1 mt-4">
          <div className="text-center py-8 text-slate-500">
            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Quick Forge</p>
            <p className="text-xs">Coming in Phase 3</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
