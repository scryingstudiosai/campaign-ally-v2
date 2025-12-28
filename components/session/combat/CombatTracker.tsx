'use client';

import { useState } from 'react';
import { CombatState, Condition, CombatantType } from '@/types/combat';
import { CombatantCard } from './CombatantCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Swords, SkipForward, SkipBack, Flag, Plus,
  Trophy, Scroll, Users
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CombatTrackerProps {
  combatState: CombatState;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onEndCombat: (generateLoot: boolean) => void;
  onHpChange: (combatantId: string, change: number, isDamage: boolean) => void;
  onInitiativeChange: (combatantId: string, value: number) => void;
  onConditionToggle: (combatantId: string, condition: Condition) => void;
  onAddCombatant: (combatant: NewCombatantData) => void;
  onRemoveCombatant: (combatantId: string) => void;
}

interface NewCombatantData {
  id?: string;
  name: string;
  displayName?: string;
  type: CombatantType;
  initiative: number;
  hp: number;
  maxHp?: number;
  ac: number;
}

export function CombatTracker({
  combatState,
  onNextTurn,
  onPreviousTurn,
  onEndCombat,
  onHpChange,
  onInitiativeChange,
  onConditionToggle,
  onAddCombatant,
  onRemoveCombatant,
}: CombatTrackerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCombatant, setNewCombatant] = useState<{
    name: string;
    type: CombatantType;
    initiative: number;
    hp: number;
    ac: number;
  }>({
    name: '',
    type: 'monster',
    initiative: 10,
    hp: 10,
    ac: 10,
  });

  const activeCombatant = combatState.combatants[combatState.turnIndex];
  const aliveCount = combatState.combatants.filter(c => !c.isDefeated).length;
  const monstersAlive = combatState.combatants.filter(c => c.type === 'monster' && !c.isDefeated).length;
  const playersAlive = combatState.combatants.filter(c => c.type === 'player' && !c.isDefeated).length;

  const handleAddCombatant = () => {
    onAddCombatant({
      ...newCombatant,
      id: `added-${Date.now()}`,
      displayName: newCombatant.name,
      maxHp: newCombatant.hp,
    });
    setNewCombatant({ name: '', type: 'monster', initiative: 10, hp: 10, ac: 10 });
    setShowAddDialog(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Combat Header */}
      <div className="border-b border-slate-800 bg-gradient-to-r from-red-900/20 to-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/50 rounded-lg">
              <Swords className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-300">COMBAT</h2>
              <p className="text-sm text-slate-400">
                Round {combatState.round} - {aliveCount} combatants
              </p>
            </div>
          </div>

          {/* Combat Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-blue-400">
              <Users className="w-4 h-4 inline mr-1" />
              {playersAlive} Players
            </div>
            <div className="text-red-400">
              <Swords className="w-4 h-4 inline mr-1" />
              {monstersAlive} Enemies
            </div>
          </div>
        </div>

        {/* Current Turn Banner */}
        {activeCombatant && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-medium">Current Turn:</span>
              <span className="text-lg font-bold text-white">{activeCombatant.displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousTurn}
                className="border-slate-600"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                onClick={onNextTurn}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Next Turn
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Combatant List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {combatState.combatants.map((combatant, index) => (
          <CombatantCard
            key={combatant.id}
            combatant={combatant}
            isActive={index === combatState.turnIndex}
            onHpChange={(change, isDamage) => onHpChange(combatant.id, change, isDamage)}
            onInitiativeChange={(value) => onInitiativeChange(combatant.id, value)}
            onConditionToggle={(condition) => onConditionToggle(combatant.id, condition)}
            onRemove={() => onRemoveCombatant(combatant.id)}
          />
        ))}
      </div>

      {/* Combat Footer */}
      <div className="border-t border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          {/* Add Combatant */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-600">
                <Plus className="w-4 h-4 mr-1" />
                Add Combatant
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle>Add Combatant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400">Name</label>
                  <Input
                    value={newCombatant.name}
                    onChange={(e) => setNewCombatant(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Goblin Reinforcement"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-sm text-slate-400">Initiative</label>
                    <Input
                      type="number"
                      value={newCombatant.initiative}
                      onChange={(e) => setNewCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">HP</label>
                    <Input
                      type="number"
                      value={newCombatant.hp}
                      onChange={(e) => setNewCombatant(prev => ({ ...prev, hp: parseInt(e.target.value) || 1 }))}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">AC</label>
                    <Input
                      type="number"
                      value={newCombatant.ac}
                      onChange={(e) => setNewCombatant(prev => ({ ...prev, ac: parseInt(e.target.value) || 10 }))}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['monster', 'ally', 'npc'] as const).map(type => (
                    <Button
                      key={type}
                      variant={newCombatant.type === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewCombatant(prev => ({ ...prev, type }))}
                      className={newCombatant.type === type ? 'bg-slate-700' : 'border-slate-600'}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
                <Button onClick={handleAddCombatant} className="w-full">
                  Add to Combat
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Combat Log Toggle */}
          <Button variant="ghost" className="text-slate-400">
            <Scroll className="w-4 h-4 mr-1" />
            Combat Log ({combatState.combatLog.length})
          </Button>

          {/* End Combat */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onEndCombat(false)}
              className="border-slate-600 text-slate-400"
            >
              <Flag className="w-4 h-4 mr-1" />
              End (No Loot)
            </Button>
            <Button
              onClick={() => onEndCombat(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Victory & Loot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
