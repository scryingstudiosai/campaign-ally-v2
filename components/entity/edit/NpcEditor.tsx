'use client';

import { useState } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
import { StatBlockEditor } from '@/components/form-widgets/StatBlockEditor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Sparkles, Brain, Wrench, Mic, Skull, Shield } from 'lucide-react';

interface NpcEditorProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
    summary?: string;
    description?: string;
    soul?: Record<string, unknown>;
    brain?: Record<string, unknown>;
    voice?: Record<string, unknown>;
    mechanics?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  };
  campaignId: string;
}

export function NpcEditor({ entity, campaignId }: NpcEditorProps): JSX.Element {
  const [formData, setFormData] = useState(() => {
    // Debug: comprehensive logging - check both brain and attributes
    console.log('[NpcEditor] === SEARCHING FOR SECRET ===');
    console.log('[NpcEditor] entity.attributes?.secret:', entity.attributes?.secret);
    console.log('[NpcEditor] entity.brain?.secret:', entity.brain?.secret);
    console.log('[NpcEditor] === SEARCHING FOR PLOT HOOK ===');
    console.log('[NpcEditor] entity.attributes?.plotHook:', entity.attributes?.plotHook);
    console.log('[NpcEditor] entity.brain?.plot_hook:', entity.brain?.plot_hook);
    console.log('[NpcEditor] entity.brain?.plot_hooks:', entity.brain?.plot_hooks);

    // Helper to extract plot_hook from various locations (now returns single string)
    const extractPlotHook = (): string => {
      // Check attributes first (camelCase singular - where detail page reads from)
      if (entity.attributes?.plotHook) {
        return entity.attributes.plotHook as string;
      }
      // Check attributes (snake_case)
      if (entity.attributes?.plot_hook) {
        return entity.attributes.plot_hook as string;
      }
      // If there's a singular plot_hook string in brain
      if (entity.brain?.plot_hook) {
        return entity.brain.plot_hook as string;
      }
      // If it's an array in brain, take the first element
      if (Array.isArray(entity.brain?.plot_hooks) && entity.brain.plot_hooks.length > 0) {
        return entity.brain.plot_hooks[0] as string;
      }
      // If plot_hooks is a string
      if (typeof entity.brain?.plot_hooks === 'string' && entity.brain.plot_hooks) {
        return entity.brain.plot_hooks;
      }
      return '';
    };

    // Helper to extract secret from various locations
    const extractSecret = (): string => {
      // Check attributes first (where detail page reads from)
      if (entity.attributes?.secret) {
        return entity.attributes.secret as string;
      }
      // Fallback to brain
      if (entity.brain?.secret) {
        return entity.brain.secret as string;
      }
      return '';
    };

    return {
      // Basic Info
      name: entity.name || '',
      sub_type: entity.sub_type || '',
      summary: entity.summary || '',
      description: entity.description || '',

      // Soul - map all possible field name variations
      soul: {
        // Spread existing soul data first to preserve extra fields
        ...(entity.soul || {}),
        // Appearance can be in multiple places
        appearance:
          (entity.soul?.appearance as string) ||
          (entity.soul?.physical_description as string) ||
          (entity.description as string) ||
          '',
        personality:
          (entity.soul?.personality as string) || (entity.soul?.demeanor as string) || '',
        first_impression: (entity.soul?.first_impression as string) || '',
        ideal: (entity.soul?.ideal as string) || '',
        bond: (entity.soul?.bond as string) || '',
        flaw: (entity.soul?.flaw as string) || '',
        mannerisms: (entity.soul?.mannerisms as string[]) || [],
        quirks: (entity.soul?.quirks as string[]) || [],
        likes: (entity.soul?.likes as string[]) || [],
        dislikes: (entity.soul?.dislikes as string[]) || [],
      },

      // Brain - map all possible field name variations
      brain: {
        // Spread existing brain data first to preserve extra fields
        ...(entity.brain || {}),
        // Motivation/Desire
        motivation:
          (entity.brain?.motivation as string) ||
          (entity.brain?.desire as string) ||
          '',
        secret: extractSecret(),
        fear: (entity.brain?.fear as string) || '',
        goal: (entity.brain?.goal as string) || '',
        obstacle: (entity.brain?.obstacle as string) || '',
        leverage: (entity.brain?.leverage as string) || '',
        // Line they won't cross - multiple possible names
        line_they_wont_cross:
          (entity.brain?.line_they_wont_cross as string) ||
          (entity.brain?.line as string) ||
          (entity.brain?.moral_line as string) ||
          '',
        what_they_want_from_pcs:
          (entity.brain?.what_they_want_from_pcs as string) ||
          (entity.brain?.wants_from_party as string) ||
          '',
        plot_hook: extractPlotHook(),
        relationships: (entity.brain?.relationships as string) || '',
        // Preserve original villain-specific brain fields
        scheme: (entity.brain?.scheme as string) || '',
        scheme_status: (entity.brain?.scheme_status as string) || 'planning',
        escape_plan: (entity.brain?.escape_plan as string) || '',
        escalation: (entity.brain?.escalation as string) || '',
        resources: (entity.brain?.resources as string[]) || [],
        // Hero-specific brain fields
        limitation: (entity.brain?.limitation as string) || '',
        why_they_cant_solve_it: (entity.brain?.why_they_cant_solve_it as string) || '',
        support_role: (entity.brain?.support_role as string) || '',
        availability: (entity.brain?.availability as string) || 'scheduled',
      },

      // Voice - map all possible field names
      voice: {
        // Spread existing voice data first to preserve extra fields
        ...(entity.voice || {}),
        speech_pattern:
          (entity.voice?.speech_pattern as string) ||
          (Array.isArray(entity.voice?.patterns)
            ? (entity.voice.patterns as string[]).join(', ')
            : '') ||
          '',
        vocabulary: (entity.voice?.vocabulary as string) || '',
        tone:
          (entity.voice?.tone as string) ||
          (Array.isArray(entity.voice?.tones)
            ? (entity.voice.tones as string[]).join(', ')
            : '') ||
          '',
        accent: (entity.voice?.accent as string) || '',
        catchphrase:
          (entity.voice?.catchphrase as string) ||
          (entity.voice?.signature_phrase as string) ||
          '',
        verbal_tics:
          (entity.voice?.verbal_tics as string[]) || (entity.voice?.tells as string[]) || [],
        sample_quotes:
          (entity.voice?.sample_quotes as string[]) || (entity.voice?.quotes as string[]) || [],
        // Preserve original voice fields
        energy: (entity.voice?.energy as string) || '',
        style: (entity.voice?.style as string[]) || [],
      },

      // Mechanics - merge defaults with existing data
      mechanics: {
        // Auto-detect combat role from sub_type if not set
        combat_role:
          (entity.mechanics?.combat_role as string) ||
          (entity.sub_type === 'villain' ? 'villain' : 'non-combatant'),
        ac: (entity.mechanics?.ac as number) ?? 10,
        ac_type: (entity.mechanics?.ac_type as string) || '',
        hp: (entity.mechanics?.hp as number) ?? 4,
        hit_dice: (entity.mechanics?.hit_dice as string) || '',
        speed: (entity.mechanics?.speed as Record<string, number>) || { walk: 30 },
        abilities: (entity.mechanics?.abilities as Record<string, number>) || {
          str: 10,
          dex: 10,
          con: 10,
          int: 10,
          wis: 10,
          cha: 10,
        },
        senses: (entity.mechanics?.senses as Record<string, number>) || {
          passive_perception: 10,
        },
        languages: (entity.mechanics?.languages as string[]) || ['Common'],
        cr: (entity.mechanics?.cr as string) || '',
        xp: (entity.mechanics?.xp as number) || 0,
        // Combat arrays
        actions: (entity.mechanics?.actions as { name: string; description: string }[]) || [],
        bonus_actions:
          (entity.mechanics?.bonus_actions as { name: string; description: string }[]) || [],
        reactions: (entity.mechanics?.reactions as { name: string; description: string }[]) || [],
        special_abilities:
          (entity.mechanics?.special_abilities as { name: string; description: string }[]) || [],
        legendary_actions:
          (entity.mechanics?.legendary_actions as { name: string; description: string }[]) || [],
        // Other combat fields
        saving_throws: (entity.mechanics?.saving_throws as { ability: string; modifier: number }[]) || [],
        skills: (entity.mechanics?.skills as { name: string; modifier: number }[]) || [],
        damage_resistances: (entity.mechanics?.damage_resistances as string[]) || [],
        damage_immunities: (entity.mechanics?.damage_immunities as string[]) || [],
        condition_immunities: (entity.mechanics?.condition_immunities as string[]) || [],
      },
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async (): Promise<void> => {
    console.log('[NpcEditor] === SAVING ===');
    console.log('[NpcEditor] Saving brain.secret:', formData.brain.secret);
    console.log('[NpcEditor] Saving brain.plot_hook:', formData.brain.plot_hook);
    console.log('[NpcEditor] mechanics.actions:', formData.mechanics.actions);
    console.log('[NpcEditor] mechanics.legendary_actions:', formData.mechanics.legendary_actions);

    const payload = {
      name: formData.name,
      sub_type: formData.sub_type,
      summary: formData.summary,
      description: formData.description,
      soul: formData.soul,
      brain: {
        ...formData.brain,
        // Ensure secret is explicitly included
        secret: formData.brain.secret,
        // Save with both field names for compatibility
        desire: formData.brain.motivation,
        line: formData.brain.line_they_wont_cross,
        wants_from_party: formData.brain.what_they_want_from_pcs,
        // Save plot_hook as string
        plot_hook: formData.brain.plot_hook,
        // Hero fields (explicitly included for clarity)
        limitation: formData.brain.limitation,
        why_they_cant_solve_it: formData.brain.why_they_cant_solve_it,
        support_role: formData.brain.support_role,
        availability: formData.brain.availability,
      },
      voice: {
        ...formData.voice,
        // Save with both field names for compatibility
        tells: formData.voice.verbal_tics,
        signature_phrase: formData.voice.catchphrase,
        quotes: formData.voice.sample_quotes,
      },
      mechanics: formData.mechanics,
      // Also save to attributes (where detail page reads from)
      attributes: {
        ...(entity.attributes || {}),
        secret: formData.brain.secret,
        plotHook: formData.brain.plot_hook,
      },
    };

    console.log('[NpcEditor] Sending payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[NpcEditor] Save failed:', error);
      throw new Error('Failed to save');
    }

    const result = await response.json();
    console.log('[NpcEditor] Saved result:', result);
  };

  // Helper updaters
  const updateBasic = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateSoul = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, soul: { ...prev.soul, [field]: value } }));
    setHasChanges(true);
  };

  const updateBrain = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, brain: { ...prev.brain, [field]: value } }));
    setHasChanges(true);
  };

  const updateVoice = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, voice: { ...prev.voice, [field]: value } }));
    setHasChanges(true);
  };

  const updateMechanics = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, mechanics: { ...prev.mechanics, [field]: value } }));
    setHasChanges(true);
  };

  const combatRole = formData.mechanics.combat_role;
  const showFullStats = ['villain', 'hero', 'elite', 'minion'].includes(combatRole);
  const showLegendary = combatRole === 'villain';
  const isVillain = combatRole === 'villain';
  const isHero = combatRole === 'hero';

  // Define tabs
  const tabs = [
    {
      id: 'basics',
      label: 'Basics',
      icon: <User className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateBasic('name', e.target.value)}
                placeholder="Character name"
              />
            </div>
            <div>
              <Label>Role / Occupation</Label>
              <Input
                value={formData.sub_type}
                onChange={(e) => updateBasic('sub_type', e.target.value)}
                placeholder="Blacksmith, Guard Captain, etc."
              />
            </div>
          </div>

          <div>
            <Label>Summary</Label>
            <Input
              value={formData.summary}
              onChange={(e) => updateBasic('summary', e.target.value)}
              placeholder="Brief one-line description"
            />
          </div>

          <div>
            <Label>Full Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateBasic('description', e.target.value)}
              rows={4}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'soul',
      label: 'Soul',
      icon: <Sparkles className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Player-facing information - what they see and experience.
          </p>

          <div>
            <Label>Appearance</Label>
            <Textarea
              value={formData.soul.appearance}
              onChange={(e) => updateSoul('appearance', e.target.value)}
              rows={3}
              placeholder="Physical description, clothing, distinguishing features..."
            />
          </div>

          <div>
            <Label>First Impression</Label>
            <Input
              value={formData.soul.first_impression}
              onChange={(e) => updateSoul('first_impression', e.target.value)}
              placeholder="What players notice immediately..."
            />
          </div>

          <div>
            <Label>Personality</Label>
            <Textarea
              value={formData.soul.personality}
              onChange={(e) => updateSoul('personality', e.target.value)}
              rows={2}
              placeholder="How they act, their demeanor..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Ideal</Label>
              <Input
                value={formData.soul.ideal}
                onChange={(e) => updateSoul('ideal', e.target.value)}
                placeholder="What they believe in"
              />
            </div>
            <div>
              <Label>Bond</Label>
              <Input
                value={formData.soul.bond}
                onChange={(e) => updateSoul('bond', e.target.value)}
                placeholder="What they're connected to"
              />
            </div>
            <div>
              <Label>Flaw</Label>
              <Input
                value={formData.soul.flaw}
                onChange={(e) => updateSoul('flaw', e.target.value)}
                placeholder="Their weakness"
              />
            </div>
          </div>

          <StringArrayInput
            label="Mannerisms"
            value={formData.soul.mannerisms}
            onChange={(val) => updateSoul('mannerisms', val)}
            placeholder="Add a mannerism..."
          />

          <StringArrayInput
            label="Quirks"
            value={formData.soul.quirks}
            onChange={(val) => updateSoul('quirks', val)}
            placeholder="Add a quirk..."
          />

          <div className="grid grid-cols-2 gap-4">
            <StringArrayInput
              label="Likes"
              value={formData.soul.likes}
              onChange={(val) => updateSoul('likes', val)}
              placeholder="Add a like..."
            />
            <StringArrayInput
              label="Dislikes"
              value={formData.soul.dislikes}
              onChange={(val) => updateSoul('dislikes', val)}
              placeholder="Add a dislike..."
            />
          </div>
        </div>
      ),
    },
    {
      id: 'brain',
      label: 'Brain',
      icon: <Brain className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-amber-500">DM-only information - secrets and motivations.</p>

          <div>
            <Label>True Motivation</Label>
            <Textarea
              value={formData.brain.motivation}
              onChange={(e) => updateBrain('motivation', e.target.value)}
              rows={2}
              placeholder="What really drives them..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Goal</Label>
              <Input
                value={formData.brain.goal}
                onChange={(e) => updateBrain('goal', e.target.value)}
                placeholder="What they're trying to achieve"
              />
            </div>
            <div>
              <Label>Obstacle</Label>
              <Input
                value={formData.brain.obstacle}
                onChange={(e) => updateBrain('obstacle', e.target.value)}
                placeholder="What's stopping them"
              />
            </div>
          </div>

          <div>
            <Label className="text-amber-400">Secret</Label>
            <Textarea
              value={formData.brain.secret}
              onChange={(e) => updateBrain('secret', e.target.value)}
              rows={2}
              placeholder="Hidden truth..."
              className="border-amber-700/50 bg-amber-950/20"
            />
          </div>

          <div>
            <Label>Fear</Label>
            <Input
              value={formData.brain.fear}
              onChange={(e) => updateBrain('fear', e.target.value)}
              placeholder="What they're afraid of"
            />
          </div>

          <div>
            <Label>Leverage</Label>
            <Input
              value={formData.brain.leverage}
              onChange={(e) => updateBrain('leverage', e.target.value)}
              placeholder="How to manipulate or persuade them"
            />
          </div>

          <div>
            <Label>Line They Won&apos;t Cross</Label>
            <Input
              value={formData.brain.line_they_wont_cross}
              onChange={(e) => updateBrain('line_they_wont_cross', e.target.value)}
              placeholder="What they absolutely won't do"
            />
          </div>

          <div>
            <Label>What They Want from PCs</Label>
            <Textarea
              value={formData.brain.what_they_want_from_pcs}
              onChange={(e) => updateBrain('what_they_want_from_pcs', e.target.value)}
              rows={2}
              placeholder="Why they'd interact with the party..."
            />
          </div>

          <div>
            <Label>Key Relationships</Label>
            <Textarea
              value={formData.brain.relationships}
              onChange={(e) => updateBrain('relationships', e.target.value)}
              rows={2}
              placeholder="Important connections to other NPCs..."
            />
          </div>

          <div>
            <Label className="text-teal-400">Plot Hook</Label>
            <Textarea
              value={formData.brain.plot_hook}
              onChange={(e) => updateBrain('plot_hook', e.target.value)}
              rows={3}
              placeholder="How this NPC could draw the party into adventure..."
              className="border-teal-700/50"
            />
          </div>

          {/* ========== VILLAIN-SPECIFIC SECTION ========== */}
          {isVillain && (
            <div className="mt-6 p-4 border border-red-900/50 bg-red-950/20 rounded-lg space-y-4">
              <h3 className="text-red-400 font-semibold flex items-center gap-2">
                <Skull className="w-4 h-4" />
                Villain Details
              </h3>

              <div>
                <Label className="text-red-300">Scheme</Label>
                <Textarea
                  value={formData.brain.scheme}
                  onChange={(e) => updateBrain('scheme', e.target.value)}
                  rows={3}
                  placeholder="Their evil plan..."
                  className="border-red-900/50"
                />
              </div>

              <div>
                <Label className="text-red-300">Scheme Status</Label>
                <Select
                  value={formData.brain.scheme_status || 'planning'}
                  onValueChange={(val) => updateBrain('scheme_status', val)}
                >
                  <SelectTrigger className="border-red-900/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="executing">Executing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <StringArrayInput
                label="Resources"
                value={formData.brain.resources}
                onChange={(val) => updateBrain('resources', val)}
                placeholder="Add a resource (minions, artifacts, allies)..."
              />

              <div>
                <Label className="text-red-300">Escape Plan</Label>
                <Textarea
                  value={formData.brain.escape_plan}
                  onChange={(e) => updateBrain('escape_plan', e.target.value)}
                  rows={2}
                  placeholder="How they'll escape if defeated..."
                  className="border-red-900/50"
                />
              </div>

              <div>
                <Label className="text-red-300">Escalation (If Unchecked)</Label>
                <Textarea
                  value={formData.brain.escalation}
                  onChange={(e) => updateBrain('escalation', e.target.value)}
                  rows={2}
                  placeholder="What happens if the party doesn't stop them..."
                  className="border-red-900/50"
                />
              </div>
            </div>
          )}

          {/* ========== HERO-SPECIFIC SECTION ========== */}
          {isHero && (
            <div className="mt-6 p-4 border border-amber-500/30 bg-amber-950/20 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-amber-400 font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Hero Details
              </h3>

              <div className="p-3 bg-amber-900/10 border border-amber-900/30 rounded text-xs text-amber-200/70 italic">
                &quot;A Hero opens the door, but the Party must walk through it.&quot;
                These fields ensure the NPC supports rather than overshadows the players.
              </div>

              <div>
                <Label className="text-amber-300">Limitation / Constraint</Label>
                <Textarea
                  value={formData.brain.limitation || ''}
                  onChange={(e) => updateBrain('limitation', e.target.value)}
                  rows={2}
                  placeholder="Oath-bound to the temple, cursed to never leave the forest, too old to fight..."
                  className="border-amber-900/50 bg-slate-900/50 focus:border-amber-500"
                />
              </div>

              <div>
                <Label className="text-amber-300">Why They Can&apos;t Solve It</Label>
                <Textarea
                  value={formData.brain.why_they_cant_solve_it || ''}
                  onChange={(e) => updateBrain('why_they_cant_solve_it', e.target.value)}
                  rows={3}
                  placeholder="If they leave the shrine, the protective ward fails. Therefore, the players must go to the dungeon."
                  className="border-amber-900/50 bg-slate-900/50 focus:border-amber-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Critical: The reason this powerful ally can&apos;t just handle things themselves
                </p>
              </div>

              <div>
                <Label className="text-amber-300">Support Role</Label>
                <Textarea
                  value={formData.brain.support_role || ''}
                  onChange={(e) => updateBrain('support_role', e.target.value)}
                  rows={2}
                  placeholder="Provides ancient lore, offers safe haven, buffs the party before battle..."
                  className="border-amber-900/50 bg-slate-900/50 focus:border-amber-500"
                />
              </div>

              <div>
                <Label className="text-amber-300">Availability</Label>
                <Select
                  value={formData.brain.availability || 'scheduled'}
                  onValueChange={(val) => updateBrain('availability', val)}
                >
                  <SelectTrigger className="border-amber-900/50 bg-slate-900/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Always Available</SelectItem>
                    <SelectItem value="scheduled">By Appointment / At Location</SelectItem>
                    <SelectItem value="emergency">Emergencies Only</SelectItem>
                    <SelectItem value="once">One-Time Help</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'voice',
      label: 'Voice',
      icon: <Mic className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">How they speak - for roleplay reference.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tone</Label>
              <Input
                value={formData.voice.tone}
                onChange={(e) => updateVoice('tone', e.target.value)}
                placeholder="Gruff, cheerful, nervous..."
              />
            </div>
            <div>
              <Label>Accent</Label>
              <Input
                value={formData.voice.accent}
                onChange={(e) => updateVoice('accent', e.target.value)}
                placeholder="Scottish, French, Brooklyn..."
              />
            </div>
          </div>

          <div>
            <Label>Speech Pattern</Label>
            <Textarea
              value={formData.voice.speech_pattern}
              onChange={(e) => updateVoice('speech_pattern', e.target.value)}
              rows={2}
              placeholder="Speaks slowly, uses big words, always asks questions..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vocabulary Level</Label>
              <Input
                value={formData.voice.vocabulary}
                onChange={(e) => updateVoice('vocabulary', e.target.value)}
                placeholder="Simple, educated, archaic..."
              />
            </div>
            <div>
              <Label>Energy</Label>
              <Input
                value={formData.voice.energy}
                onChange={(e) => updateVoice('energy', e.target.value)}
                placeholder="Measured, manic, calm..."
              />
            </div>
          </div>

          <div>
            <Label>Catchphrase / Signature Phrase</Label>
            <Input
              value={formData.voice.catchphrase}
              onChange={(e) => updateVoice('catchphrase', e.target.value)}
              placeholder="Something they say often..."
            />
          </div>

          <StringArrayInput
            label="Verbal Tics"
            value={formData.voice.verbal_tics}
            onChange={(val) => updateVoice('verbal_tics', val)}
            placeholder="Add a verbal tic..."
          />

          <StringArrayInput
            label="Sample Quotes"
            value={formData.voice.sample_quotes}
            onChange={(val) => updateVoice('sample_quotes', val)}
            placeholder="Add a sample quote..."
          />
        </div>
      ),
    },
    {
      id: 'mechanics',
      label: 'Mechanics',
      icon: <Wrench className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-xs text-slate-500">Combat stats and game mechanics.</p>

          {/* Combat Role Selector */}
          <div>
            <Label>Combat Role</Label>
            <Select
              value={formData.mechanics.combat_role || 'non-combatant'}
              onValueChange={(val) => updateMechanics('combat_role', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non-combatant">Non-combatant (Minimal stats)</SelectItem>
                <SelectItem value="minion">Minion (Basic stats)</SelectItem>
                <SelectItem value="elite">Elite (Full stats)</SelectItem>
                <SelectItem value="villain">Villain/Boss (Full + Legendary)</SelectItem>
                <SelectItem value="hero">Hero/Ally (Full stats)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              {combatRole === 'non-combatant' &&
                'Simple AC/HP for non-combat NPCs like shopkeepers.'}
              {combatRole === 'minion' && 'Basic combat stats for guards, bandits, etc.'}
              {combatRole === 'elite' && 'Full stat block for skilled fighters.'}
              {combatRole === 'villain' && 'Full stat block with legendary actions for bosses.'}
              {combatRole === 'hero' && 'Full stat block for allied NPCs.'}
            </p>
          </div>

          {/* Simple Stats for Non-combatants */}
          {!showFullStats && (
            <div className="p-4 bg-slate-900/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Armor Class</Label>
                  <Input
                    type="number"
                    value={formData.mechanics.ac}
                    onChange={(e) => updateMechanics('ac', parseInt(e.target.value) || 10)}
                  />
                </div>
                <div>
                  <Label>Hit Points</Label>
                  <Input
                    type="number"
                    value={formData.mechanics.hp}
                    onChange={(e) => updateMechanics('hp', parseInt(e.target.value) || 4)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Full Stat Block for Combat NPCs */}
          {showFullStats && (
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base">Full Stat Block</Label>
                <Badge variant="outline" className="text-teal-400 border-teal-700">
                  {combatRole}
                </Badge>
              </div>
              <StatBlockEditor
                value={formData.mechanics}
                onChange={(stats) => {
                  setFormData((prev) => ({
                    ...prev,
                    mechanics: { ...prev.mechanics, ...stats },
                  }));
                  setHasChanges(true);
                }}
                showLegendary={showLegendary}
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <EditEntityShell
      entity={entity}
      campaignId={campaignId}
      onSave={handleSave}
      title={`Edit NPC: ${entity.name}`}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} defaultTab="basics" />
    </EditEntityShell>
  );
}
