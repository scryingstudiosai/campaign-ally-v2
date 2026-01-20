'use client';

import { useState } from 'react';
import { LibraryPanel, Entity } from './LibraryPanel';
import { QuickForgePanel } from './QuickForgePanel';
import { EntityQuickView } from '../EntityQuickView';
import { RelevantLorePanel } from '../lore/RelevantLorePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Library, Dices, Sparkles, Scroll } from 'lucide-react';
import { rollDice, DICE_PRESETS, DiceResult } from '@/lib/dice';

interface ToolkitPanelProps {
  campaignId: string;
  sessionStatus: string;
  isCombatActive?: boolean;
  onAddToCombat?: (entity: Entity) => void;
}

export function ToolkitPanel({ campaignId, isCombatActive, onAddToCombat }: ToolkitPanelProps) {
  const [lastRoll, setLastRoll] = useState<DiceResult | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Quick View state
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

  const handleQuickRoll = (expression: string) => {
    try {
      const result = rollDice(expression);
      setLastRoll(result);
    } catch (error) {
      console.error('Roll error:', error);
    }
  };

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(entity);
    setShowQuickView(true);
  };

  const handleForged = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddToCombat = (entity: Entity) => {
    onAddToCombat?.(entity);
  };

  return (
    <>
      <div className="h-full flex flex-col p-4">
        <Tabs defaultValue="library" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="library" className="text-xs">
              <Library className="w-4 h-4 mr-1" />
              Library
            </TabsTrigger>
            <TabsTrigger value="lore" className="text-xs">
              <Scroll className="w-4 h-4 mr-1" />
              Lore
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
            <LibraryPanel
              campaignId={campaignId}
              isCombatActive={isCombatActive}
              onAddToCombat={handleAddToCombat}
              onEntityClick={handleEntityClick}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>

          <TabsContent value="lore" className="flex-1 mt-4 overflow-y-auto">
            <RelevantLorePanel
              campaignId={campaignId}
              onInsertLoreDrop={(text) => {
                // Dispatch event for SessionPlanner to insert
                window.dispatchEvent(new CustomEvent('insert-lore-drop', {
                  detail: { text }
                }));
              }}
            />
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
            <QuickForgePanel
              campaignId={campaignId}
              onForged={handleForged}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Entity Quick View Modal */}
      <EntityQuickView
        entity={selectedEntity}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        campaignId={campaignId}
        isCombatActive={isCombatActive}
        onAddToCombat={handleAddToCombat}
      />
    </>
  );
}
