'use client';

import { User, Heart, Shield, Zap, Activity, BookOpen, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
} from '@/lib/utils/player-stats';

interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface PlayerSoul {
  race?: string;
  class?: string;
  level?: number;
  background?: string;
  ability_scores?: AbilityScores;
  max_hp?: number;
  current_hp?: number;
  temp_hp?: number;
  armor_class?: number;
  speed?: number;
  proficiency_bonus?: number;
  saving_throws?: string[];
  languages?: string[];
  skills?: string[];
  hit_dice?: {
    current: number;
    max: number;
    face: number;
  };
}

interface PlayerSoulCardProps {
  soul: PlayerSoul;
}

const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
};

const ABILITY_FULL_NAMES: Record<keyof AbilityScores, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export function PlayerSoulCard({ soul }: PlayerSoulCardProps): JSX.Element | null {
  if (!soul || Object.keys(soul).length === 0) return null;

  const abilityScores = soul.ability_scores;
  const savingThrows = soul.saving_throws || [];
  const profBonus = soul.proficiency_bonus || calculateProficiencyBonus(soul.level || 1);

  // Calculate HP percentage for health bar
  const hpPercent =
    soul.max_hp && soul.current_hp !== undefined
      ? Math.round((soul.current_hp / soul.max_hp) * 100)
      : 100;

  const getHpColor = (percent: number): string => {
    if (percent > 50) return 'bg-green-500';
    if (percent > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate Passive Perception: 10 + WIS mod + (proficiency if skilled in Perception)
  const wisdomMod = abilityScores ? calculateModifier(abilityScores.wis ?? 10) : 0;
  const hasPerceptionProficiency = (soul.skills || []).some(
    skill => skill.toLowerCase().includes('perception')
  );
  const passivePerception = 10 + wisdomMod + (hasPerceptionProficiency ? profBonus : 0);

  return (
    <div className="ca-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-teal-400 font-medium border-b border-teal-500/20 pb-2">
        <User className="w-5 h-5" />
        <span>Character Stats</span>
      </div>

      {/* Combat Stats */}
      <div className="grid grid-cols-5 gap-3">
        {/* HP */}
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
          <Heart className="w-4 h-4 mx-auto text-red-400 mb-1" />
          <div className="text-2xl font-bold text-white">
            {soul.current_hp ?? soul.max_hp ?? '—'}
            {soul.max_hp && soul.current_hp !== soul.max_hp && (
              <span className="text-sm text-slate-400">/{soul.max_hp}</span>
            )}
          </div>
          <div className="text-xs text-slate-400">HP</div>
          {soul.max_hp && (
            <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full ${getHpColor(hpPercent)} transition-all`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          )}
          {(soul.temp_hp ?? 0) > 0 && (
            <div className="text-xs text-blue-400 mt-1">+{soul.temp_hp} temp</div>
          )}
        </div>

        {/* AC */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
          <Shield className="w-4 h-4 mx-auto text-blue-400 mb-1" />
          <div className="text-2xl font-bold text-white">{soul.armor_class ?? '—'}</div>
          <div className="text-xs text-slate-400">AC</div>
        </div>

        {/* Speed */}
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
          <Zap className="w-4 h-4 mx-auto text-green-400 mb-1" />
          <div className="text-2xl font-bold text-white">{soul.speed ?? 30}</div>
          <div className="text-xs text-slate-400">Speed</div>
        </div>

        {/* Passive Perception */}
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
          <Eye className="w-4 h-4 mx-auto text-purple-400 mb-1" />
          <div className="text-2xl font-bold text-white">{passivePerception}</div>
          <div className="text-xs text-slate-400">Passive</div>
        </div>

        {/* Proficiency */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
          <Activity className="w-4 h-4 mx-auto text-amber-400 mb-1" />
          <div className="text-2xl font-bold text-white">+{profBonus}</div>
          <div className="text-xs text-slate-400">Prof</div>
        </div>
      </div>

      {/* Hit Dice (if tracked) */}
      {soul.hit_dice && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="text-slate-500">Hit Dice:</span>
          <span className="text-white">
            {soul.hit_dice.current}/{soul.hit_dice.max}d{soul.hit_dice.face}
          </span>
        </div>
      )}

      {/* Ability Scores */}
      {abilityScores && (
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase mb-2">
            <BookOpen className="w-3 h-3" /> Ability Scores
          </div>
          <div className="grid grid-cols-6 gap-2">
            {(Object.keys(ABILITY_LABELS) as Array<keyof AbilityScores>).map((ability) => {
              const score = abilityScores[ability] ?? 10;
              const mod = calculateModifier(score);
              const isSave = savingThrows.includes(ability);

              return (
                <div
                  key={ability}
                  className={`p-2 rounded border text-center ${
                    isSave
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                  title={`${ABILITY_FULL_NAMES[ability]}${isSave ? ' (Saving Throw Proficiency)' : ''}`}
                >
                  <div className="text-xs text-slate-400">{ABILITY_LABELS[ability]}</div>
                  <div className="text-lg font-bold text-white">{score}</div>
                  <div
                    className={`text-xs ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {formatModifier(mod)}
                  </div>
                </div>
              );
            })}
          </div>
          {savingThrows.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              ★ Highlighted = Saving throw proficiency
            </p>
          )}
        </div>
      )}

      {/* Languages */}
      {soul.languages && soul.languages.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 uppercase mb-1">Languages</div>
          <div className="flex flex-wrap gap-1">
            {soul.languages.map((lang) => (
              <Badge key={lang} variant="outline" className="text-xs">
                {lang}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Skills (if tracked) */}
      {soul.skills && soul.skills.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 uppercase mb-1">Skill Proficiencies</div>
          <div className="flex flex-wrap gap-1">
            {soul.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
