'use client';

import { useState } from 'react';
import {
  User, Heart, Shield, Swords, Sparkles,
  Edit2, ChevronDown, ChevronUp,
  Scroll, Star, Target, Backpack, MapPin, Users, UserCircle
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
  resources: Record<string, unknown> | null;
  image_url: string | null;
}

interface Campaign {
  id: string;
  name: string;
  image_url: string | null;
}

interface WorldAnchor {
  id: string;
  relationship_type: string;
  surface_description: string | null;
  target: {
    id: string;
    name: string;
    entity_type: string;
    image_url: string | null;
  } | null;
}

interface Props {
  campaignId: string;
  userId: string;
  campaign: Campaign | null;
  character: Character | null;
  membershipId: string;
  worldAnchors?: WorldAnchor[];
}

type EditingSection = 'none' | 'backstory' | 'hp' | 'notes';

export function CharacterSheet({ campaignId, character, worldAnchors = [] }: Props) {
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
  const resources = (char.resources || {}) as Record<string, unknown>;

  // Inspiration from DM-controlled resources
  const hasInspiration = (resources.inspiration as boolean) || false;

  // Read ability scores from soul first (where Player Forge saves them), fall back to mechanics
  const abilityScores = (soul.ability_scores || mechanics.ability_scores || mechanics.stats || {}) as Record<string, number>;
  const stats = abilityScores;

  // Read stats from soul first (Player Forge saves here), fall back to mechanics
  const maxHp = (soul.max_hp || mechanics.max_hp || 0) as number;
  const currentHp = (soul.current_hp ?? mechanics.current_hp ?? maxHp) as number;
  const tempHp = (soul.temp_hp || mechanics.temp_hp || 0) as number;
  const ac = (soul.armor_class || mechanics.ac || mechanics.armor_class || 10) as number;
  const level = (soul.level || mechanics.level || 1) as number;
  const speed = (soul.speed || mechanics.speed || 30) as number;
  const proficiencyBonus = (soul.proficiency_bonus || Math.floor((level - 1) / 4) + 2) as number;
  const savingThrows = (soul.saving_throws || mechanics.saving_throws || []) as string[];
  const languages = (soul.languages || mechanics.languages || ['Common']) as string[];

  // Loadout data from soul
  const loadout = (soul.loadout || {}) as Record<string, unknown>;

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
      // Fall back to entity description if soul.backstory is empty
      setEditBackstory((soul.backstory as string) || char?.description || '');
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

            <div className="pb-2 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display text-white">{char.name}</h1>
                {hasInspiration && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full animate-pulse">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
              </div>
              <p className="text-teal-400">
                Level {level} {char.sub_type || 'Adventurer'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inspiration Banner */}
      {hasInspiration && (
        <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-yellow-500/30 rounded-lg">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          </div>
          <div>
            <p className="text-yellow-200 font-medium text-sm">You have Inspiration!</p>
            <p className="text-yellow-400/70 text-xs">Spend it to gain advantage on an attack, save, or check</p>
          </div>
        </div>
      )}

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

        {/* Equipment & Loadout */}
        {(loadout.weapons || loadout.armor || loadout.focus || loadout.pack) && (
          <CollapsibleSection
            title="Equipment"
            icon={<Backpack className="w-4 h-4" />}
            isExpanded={expandedSections.has('equipment')}
            onToggle={() => toggleSection('equipment')}
          >
            <div className="space-y-3">
              {/* Weapons */}
              {(loadout.weapons as string[])?.length > 0 && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-2">Weapons</h4>
                  <div className="flex flex-wrap gap-2">
                    {(loadout.weapons as string[]).map((weapon, i) => (
                      <span key={i} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-lg">
                        {weapon}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Armor & Shield */}
              {(loadout.armor || loadout.shield) && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-2">Armor</h4>
                  <div className="flex flex-wrap gap-2">
                    {loadout.armor && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg">
                        {loadout.armor as string}
                      </span>
                    )}
                    {loadout.shield && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg">
                        {loadout.shield as string}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Focus / Spellcasting */}
              {loadout.focus && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-2">Spellcasting Focus</h4>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg">
                    {loadout.focus as string}
                  </span>
                </div>
              )}

              {/* Automatic Items (Spellbook, etc.) */}
              {(loadout.automaticItems as string[])?.length > 0 && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-2">Class Items</h4>
                  <div className="flex flex-wrap gap-2">
                    {(loadout.automaticItems as string[]).map((item, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-lg">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pack */}
              {loadout.pack && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-2">Equipment Pack</h4>
                  <span className="px-2 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-lg">
                    {loadout.pack as string}
                  </span>
                </div>
              )}

              {/* Starting Gold */}
              {loadout.gold !== undefined && (loadout.gold as number) > 0 && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-2">Gold</h4>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-lg">
                    {loadout.gold as number} gp
                  </span>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* World Connections (Anchors) */}
        {worldAnchors.length > 0 && (
          <CollapsibleSection
            title="World Connections"
            icon={<MapPin className="w-4 h-4" />}
            isExpanded={expandedSections.has('worldConnections')}
            onToggle={() => toggleSection('worldConnections')}
          >
            <div className="space-y-2">
              {worldAnchors.map((anchor) => {
                if (!anchor.target) return null;

                // Icon and color based on entity type
                const getAnchorStyle = (entityType: string) => {
                  switch (entityType) {
                    case 'location':
                      return {
                        icon: <MapPin className="w-4 h-4" />,
                        bgColor: 'bg-emerald-500/20',
                        borderColor: 'border-emerald-500/30',
                        textColor: 'text-emerald-400',
                      };
                    case 'faction':
                      return {
                        icon: <Users className="w-4 h-4" />,
                        bgColor: 'bg-purple-500/20',
                        borderColor: 'border-purple-500/30',
                        textColor: 'text-purple-400',
                      };
                    case 'npc':
                      return {
                        icon: <UserCircle className="w-4 h-4" />,
                        bgColor: 'bg-blue-500/20',
                        borderColor: 'border-blue-500/30',
                        textColor: 'text-blue-400',
                      };
                    default:
                      return {
                        icon: <Target className="w-4 h-4" />,
                        bgColor: 'bg-slate-500/20',
                        borderColor: 'border-slate-500/30',
                        textColor: 'text-slate-400',
                      };
                  }
                };

                const style = getAnchorStyle(anchor.target.entity_type);
                const relationshipLabel = anchor.relationship_type.replace(/_/g, ' ');

                return (
                  <div
                    key={anchor.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      style.bgColor,
                      style.borderColor
                    )}
                  >
                    {anchor.target.image_url ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                        <img
                          src={anchor.target.image_url}
                          alt={anchor.target.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', style.bgColor, style.textColor)}>
                        {style.icon}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-medium truncate">
                        {anchor.target.name}
                      </div>
                      <div className={cn('text-xs capitalize', style.textColor)}>
                        {relationshipLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

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
              {/* Show backstory from soul, or fall back to entity description */}
              {(soul.backstory || char.description) && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-1">Backstory</h4>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {(soul.backstory as string) || char.description}
                  </p>
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
              {!soul.backstory && !char.description && !soul.personality && !soul.goals && (
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
