'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Combatant, Condition } from '@/types/combat';
import {
  ChevronDown, ChevronRight, Heart, Shield, Skull,
  EyeOff, Zap, User, Users, Footprints, Target,
  Swords, Sparkles, Brain
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ManaBar } from '@/components/ui/mana-bar';
import { StatBlock } from '@/components/ui/stat-block';
import { CarvedPanel } from '@/components/ui/carved-panel';

interface CombatantCardProps {
  combatant: Combatant;
  isActive: boolean;
  onHpChange: (change: number, isDamage: boolean) => void;
  onInitiativeChange: (value: number) => void;
  onConditionToggle: (condition: Condition) => void;
  onRemove: () => void;
  hideActiveRing?: boolean;
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

// Helper function to get ability modifier
function getMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Stat block display component
function CombatStatBlock({ combatant }: { combatant: Combatant }) {
  const stats = combatant.statBlock;
  const fullEntity = (combatant as { fullEntity?: Record<string, unknown> }).fullEntity;

  if (!stats && !fullEntity) {
    return (
      <p className="text-slate-500 text-sm italic">No stat block available</p>
    );
  }

  // Merge stats from statBlock and fullEntity
  const mechanics = (stats || fullEntity?.mechanics || {}) as Record<string, unknown>;
  const brain = (fullEntity?.brain || {}) as Record<string, unknown>;

  // Parse abilities
  const abilities = (mechanics.abilities || {}) as Record<string, number>;
  const getAbility = (key: string): number => {
    const val = abilities[key] ?? mechanics[key];
    return typeof val === 'number' ? val : 10;
  };
  const abilityScores: { name: string; value: number }[] = [
    { name: 'STR', value: getAbility('str') },
    { name: 'DEX', value: getAbility('dex') },
    { name: 'CON', value: getAbility('con') },
    { name: 'INT', value: getAbility('int') },
    { name: 'WIS', value: getAbility('wis') },
    { name: 'CHA', value: getAbility('cha') },
  ];

  const speed = mechanics.speed as { walk?: number | string } | number | string;
  const speedValue = typeof speed === 'object' ? speed?.walk : speed;

  // Pre-extract arrays with proper type guards to avoid 'unknown' issues
  const damageResistances: string[] = Array.isArray(mechanics.damage_resistances)
    ? mechanics.damage_resistances as string[] : [];
  const damageImmunities: string[] = Array.isArray(mechanics.damage_immunities)
    ? mechanics.damage_immunities as string[] : [];
  const specialAbilities = (Array.isArray(mechanics.special_abilities) ? mechanics.special_abilities :
    Array.isArray(mechanics.traits) ? mechanics.traits : []) as Array<{ name: string; desc?: string; description?: string }>;
  const actions = (Array.isArray(mechanics.actions) ? mechanics.actions : []) as Array<{
    name: string;
    desc?: string;
    description?: string;
    attack_bonus?: number;
    damage?: Array<{ damage_dice: string; damage_type?: { name?: string } | string }>
  }>;
  const legendaryActions = (Array.isArray(mechanics.legendary_actions) ? mechanics.legendary_actions : []) as Array<{
    name: string;
    desc?: string;
    description?: string
  }>;
  const tactics = typeof brain.tactics === 'string' ? brain.tactics : null;

  return (
    <div className="space-y-3 text-sm">
      {/* Quick Stats Row */}
      <div className="flex items-center gap-4 p-2 bg-slate-800/50 rounded-lg flex-wrap">
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-400" />
          <span>{combatant.hp}/{combatant.maxHp}</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>AC {combatant.ac}</span>
        </div>
        {speedValue != null ? (
          <div className="flex items-center gap-1">
            <Footprints className="w-4 h-4 text-green-400" />
            <span>{String(speedValue)} ft</span>
          </div>
        ) : null}
        {mechanics.cr != null ? (
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4 text-amber-400" />
            <span>CR {String(mechanics.cr)}</span>
          </div>
        ) : null}
      </div>

      {/* Ability Scores */}
      <StatBlock
        columns={6}
        stats={abilityScores.map(({ name, value }) => ({
          label: name,
          value: `${value} (${getMod(value)})`,
        }))}
      />

      {/* Skills */}
      {(() => {
        const skills = mechanics.skills as Record<string, number> | undefined;
        if (!skills || Object.keys(skills).length === 0) return null;
        return (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Skills</p>
            <p className="text-slate-300 text-xs">
              {Object.entries(skills).map(([skill, value]) =>
                `${skill} +${value}`
              ).join(', ')}
            </p>
          </div>
        );
      })()}

      {/* Damage Resistances/Immunities */}
      {damageResistances.length > 0 ? (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Damage Resistances</p>
          <p className="text-slate-300 text-xs">{damageResistances.join(', ')}</p>
        </div>
      ) : null}

      {damageImmunities.length > 0 ? (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Damage Immunities</p>
          <p className="text-slate-300 text-xs">{damageImmunities.join(', ')}</p>
        </div>
      ) : null}

      {/* Special Abilities / Traits */}
      {specialAbilities.length > 0 ? (
        <div>
          <p className="text-xs text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Special Abilities
          </p>
          <div className="space-y-2">
            {specialAbilities.slice(0, 3).map((ability, i) => (
              <div key={i} className="bg-slate-800/50 p-2 rounded">
                <p className="font-medium text-amber-300 text-xs">{ability.name}</p>
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">{ability.desc || ability.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Actions */}
      {actions.length > 0 ? (
        <div>
          <p className="text-xs text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Swords className="w-3 h-3" />
            Actions
          </p>
          <div className="space-y-2">
            {actions.slice(0, 4).map((action, i) => (
              <div key={i} className="bg-red-900/20 border border-red-900/30 p-2 rounded">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-red-300 text-xs">{action.name}</p>
                  {action.attack_bonus !== undefined && (
                    <Badge variant="outline" className="text-xs border-red-700 text-red-400 h-5">
                      +{action.attack_bonus} hit
                    </Badge>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">{action.desc || action.description}</p>
                {action.damage && action.damage.length > 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    {action.damage.map(d => `${d.damage_dice} ${typeof d.damage_type === 'object' ? d.damage_type?.name : d.damage_type || ''}`).join(' + ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Legendary Actions */}
      {legendaryActions.length > 0 ? (
        <div>
          <p className="text-xs text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Legendary Actions
          </p>
          <div className="space-y-2">
            {legendaryActions.slice(0, 3).map((action, i) => (
              <div key={i} className="bg-purple-900/20 border border-purple-900/30 p-2 rounded">
                <p className="font-medium text-purple-300 text-xs">{action.name}</p>
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">{action.desc || action.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Brain - Tactics (for DM reference) */}
      {tactics !== null ? (
        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Tactics (DM Only)
          </p>
          <p className="text-slate-400 text-xs italic">{tactics}</p>
        </div>
      ) : null}
    </div>
  );
}

export function CombatantCard({
  combatant,
  isActive,
  onHpChange,
  onInitiativeChange,
  onConditionToggle,
  onRemove,
  hideActiveRing = false,
}: CombatantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [hpInput, setHpInput] = useState('');
  const [initInput, setInitInput] = useState(combatant.initiative.toString());
  const hpInputRef = useRef<HTMLInputElement>(null);

  const hpPercentage = (combatant.hp / combatant.maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-amber-500' : 'bg-red-500';

  // Handle NPC type with distinct styling
  const TypeIcon = combatant.type === 'player' ? User :
                   combatant.type === 'ally' ? Users :
                   combatant.type === 'npc' ? User : Skull;

  const handleHpKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hpInput) {
      // Parse math input: "+5", "-5", "=10", or just "5" (damage)
      const input = hpInput.trim();

      if (input.startsWith('+')) {
        // HEAL: +5 means add 5 HP
        const value = parseInt(input.slice(1), 10);
        if (!isNaN(value) && value > 0) onHpChange(value, false);
      } else if (input.startsWith('-')) {
        // DAMAGE (explicit): -5 means take 5 damage
        const value = parseInt(input.slice(1), 10);
        if (!isNaN(value) && value > 0) onHpChange(-value, true);
      } else if (input.startsWith('=')) {
        // SET: =10 means set HP to exactly 10
        const targetHp = parseInt(input.slice(1), 10);
        if (!isNaN(targetHp)) {
          const change = targetHp - combatant.hp;
          if (change !== 0) {
            // isDamage is true if we're reducing HP (change is negative)
            onHpChange(change, change < 0);
          }
        }
      } else {
        // Just a number = DAMAGE by default
        const value = parseInt(input, 10);
        if (!isNaN(value) && value > 0) onHpChange(-value, true);
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

  // Build class names for the card
  const cardClasses = [
    'rounded-lg border transition-all overflow-hidden',
    combatant.isDefeated
      ? 'border-slate-700 bg-slate-900/50 opacity-60'
      : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800',
  ];

  // Only add active styling if not hidden
  if (isActive && !hideActiveRing) {
    cardClasses.push('border-amber-500 bg-amber-900/20 ring-2 ring-amber-500/50');
  }

  return (
    <div className={cardClasses.join(' ')}>
      {/* Main Row */}
      <div className="flex items-center gap-2 p-3 min-h-[60px]">
        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-slate-700 rounded flex-shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Initiative - fixed width */}
        <div className="w-10 flex-shrink-0 text-center">
          <Input
            value={initInput}
            onChange={(e) => setInitInput(e.target.value)}
            onKeyDown={handleInitKeyDown}
            onBlur={() => {
              const value = parseInt(initInput, 10);
              if (!isNaN(value)) onInitiativeChange(value);
            }}
            className="w-10 h-8 text-center text-sm font-bold bg-slate-900 border-slate-600 p-1"
          />
        </div>

        {/* Type Icon - fixed width */}
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
          combatant.type === 'player' ? 'bg-blue-900/50' :
          combatant.type === 'ally' ? 'bg-green-900/50' :
          combatant.type === 'npc' ? 'bg-purple-900/50' : 'bg-red-900/50'
        }`}>
          <TypeIcon className={`w-4 h-4 ${
            combatant.type === 'player' ? 'text-blue-400' :
            combatant.type === 'ally' ? 'text-green-400' :
            combatant.type === 'npc' ? 'text-purple-400' : 'text-red-400'
          }`} />
        </div>

        {/* Name & Conditions - flexible but truncate */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate text-sm ${
              combatant.isDefeated ? 'line-through text-slate-500' : 'text-slate-200'
            }`}>
              {combatant.displayName}
            </span>
            {isActive && (
              <Badge variant="outline" className="border-amber-500 text-amber-400 text-xs flex-shrink-0">
                Active
              </Badge>
            )}
            {!combatant.isVisible && (
              <EyeOff className="w-4 h-4 text-slate-500 flex-shrink-0" />
            )}
          </div>

          {/* Conditions - wrap if needed */}
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

        {/* AC - fixed width */}
        <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
          <Shield className="w-3 h-3" />
          <span className="font-mono text-sm">{combatant.ac}</span>
        </div>

        {/* HP Section - fixed width */}
        <div className="w-32 flex-shrink-0">
          <ManaBar
            value={combatant.hp}
            max={combatant.maxHp}
            variant={hpPercentage > 50 ? 'emerald' : hpPercentage > 25 ? 'gold' : 'blood'}
            showValue={true}
          />
          {combatant.tempHp > 0 && (
            <span className="text-xs text-arcane">+{combatant.tempHp} temp</span>
          )}
          <Input
            ref={hpInputRef}
            value={hpInput}
            onChange={(e) => setHpInput(e.target.value)}
            onKeyDown={handleHpKeyDown}
            placeholder="-5"
            className="mt-1 h-6 text-xs bg-slate-900 border-slate-600 px-2"
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-700 p-3 space-y-3">
          {/* Quick Combat Stats */}
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>Init Mod: <span className="text-white">+{String(combatant.initiativeModifier || 0)}</span></span>
          </div>

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

          {/* Full Stat Block */}
          {(combatant.statBlock || (combatant as { fullEntity?: unknown }).fullEntity) ? (
            <CarvedPanel deep className="max-h-80 overflow-y-auto">
              <CombatStatBlock combatant={combatant} />
            </CarvedPanel>
          ) : null}

          {/* Death Saves (for players at 0 HP) */}
          {combatant.type === 'player' && combatant.isDefeated && combatant.deathSaves && (
            <div className="flex items-center gap-4 p-2 bg-slate-800 rounded">
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-400">Saves:</span>
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
                <span className="text-sm text-red-400">Fails:</span>
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
