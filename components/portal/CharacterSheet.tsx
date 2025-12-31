'use client';

import { useState } from 'react';
import {
  User, Heart, Shield, Swords, Sparkles,
  Edit2, ChevronDown, ChevronUp,
  Scroll, Star, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Character {
  id: string;
  name: string;
  type: string;
  sub_type: string | null;
  description: string | null;
  soul: Record<string, unknown> | null;
  mechanics: Record<string, unknown> | null;
  brain: Record<string, unknown> | null;
  image_url: string | null;
}

interface Campaign {
  id: string;
  name: string;
  image_url: string | null;
}

interface Props {
  campaignId: string;
  userId: string;
  campaign: Campaign | null;
  character: Character | null;
  membershipId: string;
}

type EditingSection = 'none' | 'backstory' | 'hp' | 'notes';

export function CharacterSheet({ campaignId, character }: Props) {
  const [char, setChar] = useState<Character | null>(character);
  const [editingSection, setEditingSection] = useState<EditingSection>('none');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['stats', 'combat']));
  const [isSaving, setIsSaving] = useState(false);

  // Edit form states
  const [editBackstory, setEditBackstory] = useState('');
  const [editPersonality, setEditPersonality] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCurrentHp, setEditCurrentHp] = useState(0);
  const [editTempHp, setEditTempHp] = useState(0);

  if (!char) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 pb-24">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-display text-white mb-2">No Character</h2>
          <p className="text-slate-400">You haven't claimed a character in this campaign yet.</p>
        </div>
      </div>
    );
  }

  const mechanics = (char.mechanics || {}) as Record<string, unknown>;
  const soul = (char.soul || {}) as Record<string, unknown>;
  const stats = (mechanics.ability_scores || mechanics.stats || {}) as Record<string, number>;

  // Handle HP - can be a number or an object {max, current}
  const hpValue = mechanics.hp;
  const isHpObject = hpValue && typeof hpValue === 'object' && 'max' in (hpValue as object);
  const maxHp = (mechanics.max_hp || (isHpObject ? (hpValue as { max: number }).max : hpValue) || 0) as number;
  const currentHp = (mechanics.current_hp ?? (isHpObject ? (hpValue as { current: number }).current : maxHp)) as number;
  const tempHp = (mechanics.temp_hp || 0) as number;
  const ac = (mechanics.ac || mechanics.armor_class || 10) as number;
  const level = (mechanics.level || 1) as number;
  const proficiencyBonus = Math.floor((level - 1) / 4) + 2;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const startEdit = (section: EditingSection) => {
    if (section === 'backstory') {
      setEditBackstory((soul.backstory as string) || '');
      setEditPersonality((soul.personality as string) || '');
      setEditGoals((soul.goals as string) || '');
    } else if (section === 'hp') {
      setEditCurrentHp(currentHp);
      setEditTempHp(tempHp);
    } else if (section === 'notes') {
      setEditNotes((mechanics.notes as string) || (soul.notes as string) || '');
    }
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setEditingSection('none');
  };

  const saveEdit = async () => {
    setIsSaving(true);

    let updates: Record<string, unknown> = {};

    if (editingSection === 'backstory') {
      updates.soul = {
        backstory: editBackstory,
        personality: editPersonality,
        goals: editGoals,
      };
    } else if (editingSection === 'hp') {
      updates.mechanics = {
        current_hp: editCurrentHp,
        temp_hp: editTempHp,
      };
    } else if (editingSection === 'notes') {
      updates.mechanics = {
        notes: editNotes,
      };
    }

    const res = await fetch('/api/portal/character', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        characterId: char.id,
        updates,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setChar(updated);
    }

    setIsSaving(false);
    setEditingSection('none');
  };

  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const hpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;
  const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Character Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-b from-slate-800 to-slate-950 overflow-hidden">
          {char.image_url && (
            <img
              src={char.image_url}
              alt={char.name}
              className="w-full h-full object-cover opacity-30"
            />
          )}
        </div>

        <div className="px-4 -mt-16 relative">
          <div className="flex gap-4 items-end">
            <div className="w-24 h-24 rounded-xl bg-slate-800 border-4 border-slate-950 overflow-hidden flex-shrink-0">
              {char.image_url ? (
                <img
                  src={char.image_url}
                  alt={char.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-600" />
                </div>
              )}
            </div>

            <div className="pb-2">
              <h1 className="text-2xl font-display text-white">{char.name}</h1>
              <p className="text-teal-400">
                Level {level} {char.sub_type || 'Adventurer'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="px-4 py-4 grid grid-cols-3 gap-3">
        {/* HP - Tappable to edit */}
        <button
          onClick={() => startEdit('hp')}
          className="bg-slate-900/50 border border-white/10 rounded-xl p-3 text-center hover:border-red-500/30 transition-colors"
        >
          <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
            <Heart className="w-4 h-4" />
            <span className="text-xs">HP</span>
          </div>
          <div className="text-xl font-bold text-white">
            {currentHp}/{maxHp}
          </div>
          {tempHp > 0 && (
            <div className="text-xs text-blue-400">+{tempHp} temp</div>
          )}
          <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all", hpColor)}
              style={{ width: `${Math.min(hpPercentage, 100)}%` }}
            />
          </div>
        </button>

        {/* AC - Display only (DM controlled) */}
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-xs">AC</span>
          </div>
          <div className="text-xl font-bold text-white">{ac}</div>
        </div>

        {/* Level - Display only (DM controlled) */}
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">Level</span>
          </div>
          <div className="text-xl font-bold text-white">{level}</div>
          <div className="text-xs text-slate-500">+{proficiencyBonus} prof</div>
        </div>
      </div>

      {/* HP Edit Modal */}
      {editingSection === 'hp' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-white/10 p-4 w-full max-w-sm">
            <h3 className="text-lg font-display text-white mb-4">Update HP</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Current HP (max {maxHp})</label>
                <input
                  type="number"
                  value={editCurrentHp}
                  onChange={(e) => setEditCurrentHp(Math.min(maxHp, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-center text-xl"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1">Temporary HP</label>
                <input
                  type="number"
                  value={editTempHp}
                  onChange={(e) => setEditTempHp(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-center text-xl"
                />
              </div>

              {/* Quick Adjust Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditCurrentHp(prev => Math.max(0, prev - 1))}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 font-medium"
                >
                  -1
                </button>
                <button
                  onClick={() => setEditCurrentHp(prev => Math.max(0, prev - 5))}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 font-medium"
                >
                  -5
                </button>
                <button
                  onClick={() => setEditCurrentHp(prev => Math.min(maxHp, prev + 1))}
                  className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 font-medium"
                >
                  +1
                </button>
                <button
                  onClick={() => setEditCurrentHp(prev => Math.min(maxHp, prev + 5))}
                  className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 font-medium"
                >
                  +5
                </button>
              </div>

              <button
                onClick={() => setEditCurrentHp(maxHp)}
                className="w-full py-2 rounded-lg bg-teal-500/20 text-teal-400 font-medium"
              >
                Full Heal
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={cancelEdit}
                className="flex-1 py-2 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={isSaving}
                className="flex-1 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="px-4 space-y-3">
        {/* Ability Scores */}
        <CollapsibleSection
          title="Ability Scores"
          icon={<Swords className="w-4 h-4" />}
          isExpanded={expandedSections.has('stats')}
          onToggle={() => toggleSection('stats')}
        >
          <div className="grid grid-cols-6 gap-2">
            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((stat) => {
              const score = stats[stat.toLowerCase()] || stats[stat] || 10;
              return (
                <div key={stat} className="text-center">
                  <div className="text-[10px] text-slate-500 mb-1">{stat}</div>
                  <div className="bg-slate-800 rounded-lg py-2">
                    <div className="text-lg font-bold text-white">{getModifier(score)}</div>
                    <div className="text-xs text-slate-500">{score}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* Backstory & Personality - Editable */}
        <CollapsibleSection
          title="Backstory & Personality"
          icon={<Scroll className="w-4 h-4" />}
          isExpanded={expandedSections.has('backstory')}
          onToggle={() => toggleSection('backstory')}
          action={
            editingSection !== 'backstory' && (
              <button
                onClick={(e) => { e.stopPropagation(); startEdit('backstory'); }}
                className="p-1 text-slate-400 hover:text-teal-400"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )
          }
        >
          {editingSection === 'backstory' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Backstory</label>
                <textarea
                  value={editBackstory}
                  onChange={(e) => setEditBackstory(e.target.value)}
                  rows={4}
                  placeholder="Your character's history..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Personality</label>
                <textarea
                  value={editPersonality}
                  onChange={(e) => setEditPersonality(e.target.value)}
                  rows={2}
                  placeholder="How do they act?"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Goals</label>
                <textarea
                  value={editGoals}
                  onChange={(e) => setEditGoals(e.target.value)}
                  rows={2}
                  placeholder="What do they want?"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={cancelEdit} className="px-3 py-1.5 text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {soul.backstory && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-1">Backstory</h4>
                  <p className="text-sm text-slate-300">{soul.backstory as string}</p>
                </div>
              )}
              {soul.personality && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-1">Personality</h4>
                  <p className="text-sm text-slate-300">{soul.personality as string}</p>
                </div>
              )}
              {soul.goals && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-1">Goals</h4>
                  <p className="text-sm text-slate-300">{soul.goals as string}</p>
                </div>
              )}
              {!soul.backstory && !soul.personality && !soul.goals && (
                <p className="text-slate-500 text-sm italic">
                  No backstory yet. Tap the edit button to add one!
                </p>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* Features & Traits - Display only */}
        {((mechanics.features as unknown[])?.length > 0 || (mechanics.traits as unknown[])?.length > 0) && (
          <CollapsibleSection
            title="Features & Traits"
            icon={<Star className="w-4 h-4" />}
            isExpanded={expandedSections.has('features')}
            onToggle={() => toggleSection('features')}
          >
            <div className="space-y-2">
              {[...((mechanics.features as unknown[]) || []), ...((mechanics.traits as unknown[]) || [])].map((feature: unknown, i: number) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                  <h4 className="text-white font-medium text-sm">
                    {typeof feature === 'string' ? feature : (feature as Record<string, unknown>).name as string}
                  </h4>
                  {typeof feature === 'object' && (feature as Record<string, unknown>).description && (
                    <p className="text-slate-400 text-xs mt-1">{(feature as Record<string, unknown>).description as string}</p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Spells - Display only */}
        {(mechanics.spells as unknown[])?.length > 0 && (
          <CollapsibleSection
            title="Spells"
            icon={<Sparkles className="w-4 h-4" />}
            isExpanded={expandedSections.has('spells')}
            onToggle={() => toggleSection('spells')}
          >
            <div className="space-y-2">
              {(mechanics.spells as unknown[]).map((spell: unknown, i: number) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium text-sm">
                      {typeof spell === 'string' ? spell : (spell as Record<string, unknown>).name as string}
                    </h4>
                    {typeof spell === 'object' && (spell as Record<string, unknown>).level !== undefined && (
                      <span className="text-xs text-purple-400">
                        {(spell as Record<string, unknown>).level === 0 ? 'Cantrip' : `Level ${(spell as Record<string, unknown>).level}`}
                      </span>
                    )}
                  </div>
                  {typeof spell === 'object' && (spell as Record<string, unknown>).description && (
                    <p className="text-slate-400 text-xs mt-1">{(spell as Record<string, unknown>).description as string}</p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Personal Notes - Editable */}
        <CollapsibleSection
          title="Notes"
          icon={<Target className="w-4 h-4" />}
          isExpanded={expandedSections.has('notes')}
          onToggle={() => toggleSection('notes')}
          action={
            editingSection !== 'notes' && (
              <button
                onClick={(e) => { e.stopPropagation(); startEdit('notes'); }}
                className="p-1 text-slate-400 hover:text-teal-400"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )
          }
        >
          {editingSection === 'notes' ? (
            <div className="space-y-3">
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                placeholder="Personal notes, reminders, plans..."
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={cancelEdit} className="px-3 py-1.5 text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <p className={cn(
              "text-sm",
              mechanics.notes || soul.notes ? "text-slate-300 whitespace-pre-wrap" : "text-slate-500 italic"
            )}>
              {(mechanics.notes as string) || (soul.notes as string) || 'No notes yet. Tap the edit button to add some!'}
            </p>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, isExpanded, onToggle, action, children }: CollapsibleSectionProps) {
  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-white">
          <span className="text-teal-400">{icon}</span>
          <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
