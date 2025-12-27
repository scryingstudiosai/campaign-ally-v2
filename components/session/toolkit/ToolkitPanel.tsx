'use client';

import { useState } from 'react';
import { LibraryPanel } from './LibraryPanel';
import { QuickForgePanel } from './QuickForgePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Library, Dices, Sparkles } from 'lucide-react';
import { rollDice, DICE_PRESETS, DiceResult } from '@/lib/dice';

interface ToolkitPanelProps {
  campaignId: string;
  sessionStatus: string;
}

export function ToolkitPanel({ campaignId }: ToolkitPanelProps) {
  const [lastRoll, setLastRoll] = useState<DiceResult | null>(null);

  const handleQuickRoll = (expression: string) => {
    try {
      const result = rollDice(expression);
      setLastRoll(result);
    } catch (error) {
      console.error('Roll error:', error);
    }
  };

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
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Quick Dice
            </h3>

            {/* Dice Presets */}
            <div className="grid grid-cols-3 gap-2">
              {DICE_PRESETS.map((preset) => (
                <Button
                  key={preset.expression}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRoll(preset.expression)}
                  className="border-slate-700 hover:bg-teal-900/30 hover:border-teal-600"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Last Roll Result */}
            {lastRoll && (
              <div className={`p-4 rounded-lg text-center ${
                lastRoll.isNat20 ? 'bg-green-900/30 border border-green-700' :
                lastRoll.isNat1 ? 'bg-red-900/30 border border-red-700' :
                'bg-slate-800/50'
              }`}>
                <p className="text-xs text-slate-400 mb-1">{lastRoll.expression}</p>
                <p className="text-3xl font-bold text-white">
                  {lastRoll.total}
                  {lastRoll.isNat20 && <span className="ml-2 text-green-400 text-sm">🎉</span>}
                  {lastRoll.isNat1 && <span className="ml-2 text-red-400 text-sm">💀</span>}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  [{lastRoll.rolls.join(', ')}]
                  {lastRoll.modifier !== 0 && ` ${lastRoll.modifier > 0 ? '+' : ''}${lastRoll.modifier}`}
                </p>
              </div>
            )}

            <p className="text-xs text-slate-600 text-center">
              Use /roll in chat for more options
            </p>
          </div>
        </TabsContent>

        <TabsContent value="forge" className="flex-1 mt-4 overflow-hidden">
          <QuickForgePanel campaignId={campaignId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
