'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Combatant, Condition } from '@/types/combat';
import {
  ChevronDown, ChevronRight, Heart, Shield, Skull,
  EyeOff, Zap, User, Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CombatantCardProps {
  combatant: Combatant;
  isActive: boolean;
  onHpChange: (change: number, isDamage: boolean) => void;
  onInitiativeChange: (value: number) => void;
  onConditionToggle: (condition: Condition) => void;
  onRemove: () => void;
}

const CONDITION_COLORS: Record<Condition, string> = {
  blinded: 'bg-gray-600',
  charmed: 'bg-pink-600',
  deafened: 'bg-gray-500',
  exhaustion: 'bg-orange-700',
  frightened: 'bg-purple-600',
  grappled: 'bg-yellow-700',
  incapacitated: 'bg-red-800',
  invisible: 'bg-blue-400',
  paralyzed: 'bg-red-600',
  petrified: 'bg-stone-600',
  poisoned: 'bg-green-700',
  prone: 'bg-amber-700',
  restrained: 'bg-orange-600',
  stunned: 'bg-yellow-600',
  unconscious: 'bg-slate-700',
  concentrating: 'bg-blue-600',
  hidden: 'bg-slate-600',
  dodging: 'bg-cyan-600',
  raging: 'bg-red-500',
};

const ALL_CONDITIONS: Condition[] = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened',
  'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified',
  'poisoned', 'prone', 'restrained', 'stunned', 'unconscious',
  'concentrating', 'hidden', 'dodging', 'raging',
];

export function CombatantCard({
  combatant,
  isActive,
  onHpChange,
  onInitiativeChange,
  onConditionToggle,
  onRemove,
}: CombatantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [hpInput, setHpInput] = useState('');
  const [initInput, setInitInput] = useState(combatant.initiative.toString());
  const hpInputRef = useRef<HTMLInputElement>(null);

  const hpPercentage = (combatant.hp / combatant.maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-amber-500' : 'bg-red-500';

  const TypeIcon = combatant.type === 'player' ? User :
                   combatant.type === 'ally' ? Users : Skull;

  const handleHpKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hpInput) {
      // Parse math input: "+5", "-5", "=10", or just "5" (damage)
      const input = hpInput.trim();

      if (input.startsWith('+')) {
        const value = parseInt(input.slice(1), 10);
        if (!isNaN(value)) onHpChange(value, false);
      } else if (input.startsWith('-')) {
        const value = parseInt(input.slice(1), 10);
        if (!isNaN(value)) onHpChange(-value, true);
      } else if (input.startsWith('=')) {
        const value = parseInt(input.slice(1), 10);
        if (!isNaN(value)) onHpChange(value - combatant.hp, value > combatant.hp);
      } else {
        // Just a number = damage
        const value = parseInt(input, 10);
        if (!isNaN(value)) onHpChange(-value, true);
      }

      setHpInput('');
    }
  };

  const handleInitKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = parseInt(initInput, 10);
      if (!isNaN(value)) {
        onInitiativeChange(value);
      }
    }
  };

  return (
    <div className={`rounded-lg border transition-all ${
      isActive
        ? 'border-amber-500 bg-amber-900/20 ring-2 ring-amber-500/50 scale-[1.02]'
        : combatant.isDefeated
          ? 'border-slate-700 bg-slate-900/50 opacity-60'
          : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
    }`}>
      {/* Main Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-slate-700 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Initiative */}
        <div className="w-12 text-center">
          <Input
            value={initInput}
            onChange={(e) => setInitInput(e.target.value)}
            onKeyDown={handleInitKeyDown}
            onBlur={() => {
              const value = parseInt(initInput, 10);
              if (!isNaN(value)) onInitiativeChange(value);
            }}
            className="w-12 h-8 text-center text-lg font-bold bg-slate-900 border-slate-600 p-1"
          />
        </div>

        {/* Type Icon */}
        <div className={`p-2 rounded-lg ${
          combatant.type === 'player' ? 'bg-blue-900/50' :
          combatant.type === 'ally' ? 'bg-green-900/50' : 'bg-red-900/50'
        }`}>
          <TypeIcon className={`w-5 h-5 ${
            combatant.type === 'player' ? 'text-blue-400' :
            combatant.type === 'ally' ? 'text-green-400' : 'text-red-400'
          }`} />
        </div>

        {/* Name & Conditions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate ${
              combatant.isDefeated ? 'line-through text-slate-500' : 'text-slate-200'
            }`}>
              {combatant.displayName}
            </span>
            {isActive && (
              <Badge variant="outline" className="border-amber-500 text-amber-400 text-xs">
                Active
              </Badge>
            )}
            {!combatant.isVisible && (
              <EyeOff className="w-4 h-4 text-slate-500" />
            )}
          </div>

          {/* Conditions */}
          {combatant.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {combatant.conditions.map(condition => (
                <Badge
                  key={condition}
                  className={`text-xs cursor-pointer ${CONDITION_COLORS[condition]}`}
                  onClick={() => onConditionToggle(condition)}
                >
                  {condition}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* AC */}
        <div className="flex items-center gap-1 text-slate-400">
          <Shield className="w-4 h-4" />
          <span className="font-mono">{combatant.ac}</span>
        </div>

        {/* HP Bar & Input */}
        <div className="w-36">
          <div className="flex items-center gap-2 mb-1">
            <Heart className={`w-4 h-4 ${combatant.isDefeated ? 'text-slate-500' : 'text-red-400'}`} />
            <span className="font-mono text-sm">
              {combatant.hp}/{combatant.maxHp}
              {combatant.tempHp > 0 && (
                <span className="text-blue-400"> +{combatant.tempHp}</span>
              )}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${hpColor}`}
              style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
            />
          </div>
          <Input
            ref={hpInputRef}
            value={hpInput}
            onChange={(e) => setHpInput(e.target.value)}
            onKeyDown={handleHpKeyDown}
            placeholder="-5, +5, =10"
            className="mt-1 h-7 text-xs bg-slate-900 border-slate-600"
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-700 p-3 space-y-3">
          {/* Condition Picker */}
          <div>
            <button
              onClick={() => setShowConditions(!showConditions)}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Add/Remove Conditions
              {showConditions ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>

            {showConditions && (
              <div className="flex flex-wrap gap-1 mt-2">
                {ALL_CONDITIONS.map(condition => (
                  <Badge
                    key={condition}
                    variant={combatant.conditions.includes(condition) ? 'default' : 'outline'}
                    className={`text-xs cursor-pointer ${
                      combatant.conditions.includes(condition) ? CONDITION_COLORS[condition] : ''
                    }`}
                    onClick={() => onConditionToggle(condition)}
                  >
                    {condition}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Stat Block Preview */}
          {combatant.statBlock && (
            <div className="bg-slate-900 rounded p-3 text-sm">
              <p className="text-slate-400">
                <strong>Speed:</strong> {(combatant.statBlock as { speed?: { walk?: string } }).speed?.walk || '30'} ft
              </p>
              {(combatant.statBlock as { actions?: Array<{ name: string; desc?: string }> }).actions && (
                <div className="mt-2">
                  <p className="text-slate-300 font-medium">Actions:</p>
                  {((combatant.statBlock as { actions?: Array<{ name: string; desc?: string }> }).actions || []).slice(0, 3).map((action, i: number) => (
                    <p key={i} className="text-slate-400 text-xs mt-1">
                      <strong>{action.name}:</strong> {action.desc?.slice(0, 100)}...
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Death Saves (for players at 0 HP) */}
          {combatant.type === 'player' && combatant.isDefeated && combatant.deathSaves && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-400">Successes:</span>
                {[0, 1, 2].map(i => (
                  <div
                    key={`success-${i}`}
                    className={`w-4 h-4 rounded-full border-2 ${
                      i < combatant.deathSaves!.successes
                        ? 'bg-green-500 border-green-500'
                        : 'border-green-500'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-400">Failures:</span>
                {[0, 1, 2].map(i => (
                  <div
                    key={`failure-${i}`}
                    className={`w-4 h-4 rounded-full border-2 ${
                      i < combatant.deathSaves!.failures
                        ? 'bg-red-500 border-red-500'
                        : 'border-red-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            Remove from Combat
          </Button>
        </div>
      )}
    </div>
  );
}
