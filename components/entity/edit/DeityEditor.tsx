'use client';

import { useState } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Crown,
  Sun,
  Scroll,
  Users,
  EyeOff,
  Wrench,
  Flame,
  Zap,
  Plus,
  Trash2,
  Eye,
  Star,
} from 'lucide-react';
import { DEITY_RANKS, DEITY_DOMAINS, DEITY_ALIGNMENTS, DeityRank } from '@/types/deity';

interface DeityEditorProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
    summary?: string;
    description?: string;
    soul?: Record<string, unknown>;
    brain?: Record<string, unknown>;
    mechanics?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  };
  campaignId: string;
}

interface BoonCurse {
  trigger: string;
  effect: string;
}

interface DeityFormData {
  name: string;
  summary: string;
  rank: DeityRank;

  portfolio: {
    domains: string[];
    alignment: string;
    symbol: string;
    favored_weapon: string;
    holy_day: string;
    sacred_colors: string[];
    sacred_animal: string;
  };

  identity: {
    titles: string[];
    manifestation: string;
    personality: string;
    voice: string;
  };

  tenets: string[];

  prayers: {
    invocation: string;
    blessing: string;
    oath: string;
  };

  worship: {
    followers: string;
    clergy_title: string;
    temple_style: string;
    rituals: string[];
    offerings: string[];
    taboos: string[];
  };

  dm_secrets: {
    true_nature: string;
    divine_agenda: string;
    secrets: string;
    conflicts: string;
    weaknesses: string;
    hooks: string[];
  };

  signals: {
    distance: string;
    omens_watching: string[];
    omens_pleased: string[];
    omens_angry: string[];
    boons: BoonCurse[];
    curses: BoonCurse[];
  };

  mechanics: {
    cleric_domains: string[];
    channel_divinity: string;
    sacred_spells: string[];
    suggested_classes: string[];
  };
}

export function DeityEditor({ entity, campaignId }: DeityEditorProps): JSX.Element {
  const [formData, setFormData] = useState<DeityFormData>(() => {
    const soul = entity.soul || {};
    const brain = entity.brain || {};
    const mechanics = entity.mechanics || {};
    const attributes = entity.attributes || {};
    const portfolio = (soul.portfolio as Record<string, unknown>) || {};
    const prayers = (soul.prayers as Record<string, unknown>) || {};
    const worship = (soul.worship as Record<string, unknown>) || {};
    const signals = (brain.divine_signals as Record<string, unknown>) || {};
    const omens = (signals.omens as Record<string, unknown>) || {};

    return {
      name: entity.name || '',
      summary: entity.summary || '',
      rank: (attributes.rank as DeityRank) || (entity.sub_type as DeityRank) || 'intermediate_deity',

      portfolio: {
        domains: (portfolio.domains as string[]) || [],
        alignment: (portfolio.alignment as string) || '',
        symbol: (portfolio.symbol as string) || '',
        favored_weapon: (portfolio.favored_weapon as string) || '',
        holy_day: (portfolio.holy_day as string) || '',
        sacred_colors: (portfolio.sacred_colors as string[]) || [],
        sacred_animal: (portfolio.sacred_animal as string) || '',
      },

      identity: {
        titles: (soul.titles as string[]) || [],
        manifestation: (soul.manifestation as string) || '',
        personality: (soul.personality as string) || '',
        voice: (soul.voice as string) || '',
      },

      tenets: (soul.tenets as string[]) || [],

      prayers: {
        invocation: (prayers.invocation as string) || '',
        blessing: (prayers.blessing as string) || '',
        oath: (prayers.oath as string) || '',
      },

      worship: {
        followers: (worship.followers as string) || '',
        clergy_title: (worship.clergy_title as string) || '',
        temple_style: (worship.temple_style as string) || '',
        rituals: (worship.rituals as string[]) || [],
        offerings: (worship.offerings as string[]) || [],
        taboos: (worship.taboos as string[]) || [],
      },

      dm_secrets: {
        true_nature: (brain.true_nature as string) || '',
        divine_agenda: (brain.divine_agenda as string) || '',
        secrets: (brain.secrets as string) || '',
        conflicts: (brain.conflicts as string) || '',
        weaknesses: (brain.weaknesses as string) || '',
        hooks: (brain.hooks as string[]) || [],
      },

      signals: {
        distance: (signals.distance as string) || 'symbolic',
        omens_watching: (omens.watching as string[]) || [],
        omens_pleased: (omens.pleased as string[]) || [],
        omens_angry: (omens.angry as string[]) || [],
        boons: (signals.boons as BoonCurse[]) || [],
        curses: (signals.curses as BoonCurse[]) || [],
      },

      mechanics: {
        cleric_domains: (mechanics.cleric_domains as string[]) || [],
        channel_divinity: (mechanics.channel_divinity as string) || '',
        sacred_spells: (mechanics.sacred_spells as string[]) || [],
        suggested_classes: (mechanics.suggested_classes as string[]) || [],
      },
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateBasic = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updatePortfolio = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      portfolio: { ...prev.portfolio, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateIdentity = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      identity: { ...prev.identity, [field]: value },
    }));
    setHasChanges(true);
  };

  const updatePrayers = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      prayers: { ...prev.prayers, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateWorship = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      worship: { ...prev.worship, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateDmSecrets = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      dm_secrets: { ...prev.dm_secrets, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateSignals = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      signals: { ...prev.signals, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateMechanics = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      mechanics: { ...prev.mechanics, [field]: value },
    }));
    setHasChanges(true);
  };

  // Domain toggle
  const toggleDomain = (domain: string): void => {
    setFormData((prev) => {
      const domains = prev.portfolio.domains;
      if (domains.includes(domain)) {
        return {
          ...prev,
          portfolio: { ...prev.portfolio, domains: domains.filter(d => d !== domain) },
        };
      } else if (domains.length < 3) {
        return {
          ...prev,
          portfolio: { ...prev.portfolio, domains: [...domains, domain] },
        };
      }
      return prev;
    });
    setHasChanges(true);
  };

  // Boon/Curse management
  const addBoon = (): void => {
    setFormData((prev) => ({
      ...prev,
      signals: {
        ...prev.signals,
        boons: [...prev.signals.boons, { trigger: '', effect: '' }],
      },
    }));
    setHasChanges(true);
  };

  const updateBoon = (index: number, field: string, value: string): void => {
    setFormData((prev) => {
      const updated = [...prev.signals.boons];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, signals: { ...prev.signals, boons: updated } };
    });
    setHasChanges(true);
  };

  const removeBoon = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      signals: {
        ...prev.signals,
        boons: prev.signals.boons.filter((_, i) => i !== index),
      },
    }));
    setHasChanges(true);
  };

  const addCurse = (): void => {
    setFormData((prev) => ({
      ...prev,
      signals: {
        ...prev.signals,
        curses: [...prev.signals.curses, { trigger: '', effect: '' }],
      },
    }));
    setHasChanges(true);
  };

  const updateCurse = (index: number, field: string, value: string): void => {
    setFormData((prev) => {
      const updated = [...prev.signals.curses];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, signals: { ...prev.signals, curses: updated } };
    });
    setHasChanges(true);
  };

  const removeCurse = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      signals: {
        ...prev.signals,
        curses: prev.signals.curses.filter((_, i) => i !== index),
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    const saveData = {
      name: formData.name,
      summary: formData.summary,
      sub_type: formData.rank,

      attributes: {
        rank: formData.rank,
      },

      soul: {
        titles: formData.identity.titles,
        manifestation: formData.identity.manifestation,
        personality: formData.identity.personality,
        voice: formData.identity.voice,
        tenets: formData.tenets,
        portfolio: {
          domains: formData.portfolio.domains,
          alignment: formData.portfolio.alignment,
          symbol: formData.portfolio.symbol,
          favored_weapon: formData.portfolio.favored_weapon,
          holy_day: formData.portfolio.holy_day,
          sacred_colors: formData.portfolio.sacred_colors,
          sacred_animal: formData.portfolio.sacred_animal,
        },
        prayers: {
          invocation: formData.prayers.invocation,
          blessing: formData.prayers.blessing,
          oath: formData.prayers.oath,
        },
        worship: {
          followers: formData.worship.followers,
          clergy_title: formData.worship.clergy_title,
          temple_style: formData.worship.temple_style,
          rituals: formData.worship.rituals,
          offerings: formData.worship.offerings,
          taboos: formData.worship.taboos,
        },
      },

      brain: {
        true_nature: formData.dm_secrets.true_nature,
        divine_agenda: formData.dm_secrets.divine_agenda,
        secrets: formData.dm_secrets.secrets,
        conflicts: formData.dm_secrets.conflicts,
        weaknesses: formData.dm_secrets.weaknesses,
        hooks: formData.dm_secrets.hooks,
        divine_signals: {
          distance: formData.signals.distance,
          omens: {
            watching: formData.signals.omens_watching,
            pleased: formData.signals.omens_pleased,
            angry: formData.signals.omens_angry,
          },
          boons: formData.signals.boons,
          curses: formData.signals.curses,
        },
      },

      mechanics: {
        cleric_domains: formData.mechanics.cleric_domains,
        channel_divinity: formData.mechanics.channel_divinity,
        sacred_spells: formData.mechanics.sacred_spells,
        suggested_classes: formData.mechanics.suggested_classes,
      },
    };

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeityEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }
  };

  const tabs = [
    {
      id: 'identity',
      label: 'Identity',
      icon: <Crown className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Deity Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateBasic('name', e.target.value)}
              placeholder="Pelor, Lolth, Moradin..."
            />
          </div>

          <div>
            <Label>Summary</Label>
            <Input
              value={formData.summary}
              onChange={(e) => updateBasic('summary', e.target.value)}
              placeholder="Brief description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Divine Rank</Label>
              <Select
                value={formData.rank}
                onValueChange={(val) => updateBasic('rank', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEITY_RANKS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Alignment</Label>
              <Select
                value={formData.portfolio.alignment || '_auto'}
                onValueChange={(val) => updatePortfolio('alignment', val === '_auto' ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_auto">Not specified</SelectItem>
                  {DEITY_ALIGNMENTS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Domains (up to 3)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DEITY_DOMAINS.map((domain) => (
                <Badge
                  key={domain}
                  variant={formData.portfolio.domains.includes(domain) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${
                    formData.portfolio.domains.includes(domain)
                      ? 'bg-purple-500/80 hover:bg-purple-600 border-purple-500'
                      : 'hover:bg-slate-700 border-slate-600'
                  }`}
                  onClick={() => toggleDomain(domain)}
                >
                  {domain}
                </Badge>
              ))}
            </div>
          </div>

          <StringArrayInput
            label="Titles"
            value={formData.identity.titles}
            onChange={(val) => updateIdentity('titles', val)}
            placeholder="Add title (The Radiant One, Lord of Light)..."
          />

          <div>
            <Label>Manifestation</Label>
            <Textarea
              value={formData.identity.manifestation}
              onChange={(e) => updateIdentity('manifestation', e.target.value)}
              rows={3}
              placeholder="How does this deity appear to mortals?"
            />
          </div>

          <div>
            <Label>Personality</Label>
            <Textarea
              value={formData.identity.personality}
              onChange={(e) => updateIdentity('personality', e.target.value)}
              rows={3}
              placeholder="What is this deity's temperament?"
            />
          </div>

          <div>
            <Label>Divine Voice</Label>
            <Textarea
              value={formData.identity.voice}
              onChange={(e) => updateIdentity('voice', e.target.value)}
              rows={2}
              placeholder="How does this deity communicate with mortals?"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: <Sun className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Holy Symbol</Label>
            <Textarea
              value={formData.portfolio.symbol}
              onChange={(e) => updatePortfolio('symbol', e.target.value)}
              rows={2}
              placeholder="Describe the holy symbol..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Favored Weapon</Label>
              <Input
                value={formData.portfolio.favored_weapon}
                onChange={(e) => updatePortfolio('favored_weapon', e.target.value)}
                placeholder="Mace, Longsword..."
              />
            </div>
            <div>
              <Label>Holy Day</Label>
              <Input
                value={formData.portfolio.holy_day}
                onChange={(e) => updatePortfolio('holy_day', e.target.value)}
                placeholder="Summer Solstice, First Full Moon..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sacred Animal</Label>
              <Input
                value={formData.portfolio.sacred_animal}
                onChange={(e) => updatePortfolio('sacred_animal', e.target.value)}
                placeholder="Eagle, Serpent..."
              />
            </div>
            <div>
              <StringArrayInput
                label="Sacred Colors"
                value={formData.portfolio.sacred_colors}
                onChange={(val) => updatePortfolio('sacred_colors', val)}
                placeholder="Add color..."
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tenets',
      label: 'Tenets & Prayers',
      icon: <Scroll className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <StringArrayInput
            label="Sacred Tenets"
            value={formData.tenets}
            onChange={(val) => updateBasic('tenets', val)}
            placeholder="Add tenet (commandment, rule)..."
          />

          <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg space-y-4">
            <h3 className="text-amber-400 font-semibold flex items-center gap-2">
              <Star className="w-4 h-4" />
              Prayers (for players to speak)
            </h3>

            <div>
              <Label>Invocation</Label>
              <Textarea
                value={formData.prayers.invocation}
                onChange={(e) => updatePrayers('invocation', e.target.value)}
                rows={2}
                placeholder="Opening prayer phrase..."
              />
            </div>

            <div>
              <Label>Blessing</Label>
              <Textarea
                value={formData.prayers.blessing}
                onChange={(e) => updatePrayers('blessing', e.target.value)}
                rows={2}
                placeholder="Blessing to give to others..."
              />
            </div>

            <div>
              <Label>Oath</Label>
              <Textarea
                value={formData.prayers.oath}
                onChange={(e) => updatePrayers('oath', e.target.value)}
                rows={2}
                placeholder="Oath sworn in this deity's name..."
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'worship',
      label: 'Worship',
      icon: <Users className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Followers</Label>
            <Textarea
              value={formData.worship.followers}
              onChange={(e) => updateWorship('followers', e.target.value)}
              rows={2}
              placeholder="Who worships this deity and why?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Clergy Title</Label>
              <Input
                value={formData.worship.clergy_title}
                onChange={(e) => updateWorship('clergy_title', e.target.value)}
                placeholder="Dawnbringer, Soulkeeper..."
              />
            </div>
          </div>

          <div>
            <Label>Temple Style</Label>
            <Textarea
              value={formData.worship.temple_style}
              onChange={(e) => updateWorship('temple_style', e.target.value)}
              rows={3}
              placeholder="What do temples and shrines look like?"
            />
          </div>

          <StringArrayInput
            label="Rituals"
            value={formData.worship.rituals}
            onChange={(val) => updateWorship('rituals', val)}
            placeholder="Add ritual..."
          />

          <StringArrayInput
            label="Offerings"
            value={formData.worship.offerings}
            onChange={(val) => updateWorship('offerings', val)}
            placeholder="Add offering..."
          />

          <StringArrayInput
            label="Taboos"
            value={formData.worship.taboos}
            onChange={(val) => updateWorship('taboos', val)}
            placeholder="Add taboo..."
          />
        </div>
      ),
    },
    {
      id: 'signals',
      label: 'Divine Signals',
      icon: <Eye className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Divine Involvement</Label>
            <Select
              value={formData.signals.distance}
              onValueChange={(val) => updateSignals('distance', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distant">Distant</SelectItem>
                <SelectItem value="symbolic">Symbolic</SelectItem>
                <SelectItem value="interventionist">Interventionist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-teal-500/5 border border-teal-500/30 rounded-lg">
            <h4 className="text-teal-400 font-semibold mb-3">Omens (Read Aloud)</h4>

            <StringArrayInput
              label="When Watching"
              value={formData.signals.omens_watching}
              onChange={(val) => updateSignals('omens_watching', val)}
              placeholder="Add omen sign..."
            />

            <div className="mt-4">
              <StringArrayInput
                label="When Pleased"
                value={formData.signals.omens_pleased}
                onChange={(val) => updateSignals('omens_pleased', val)}
                placeholder="Add favor sign..."
              />
            </div>

            <div className="mt-4">
              <StringArrayInput
                label="When Angry"
                value={formData.signals.omens_angry}
                onChange={(val) => updateSignals('omens_angry', val)}
                placeholder="Add displeasure sign..."
              />
            </div>
          </div>

          {/* Boons */}
          <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-green-400 font-semibold flex items-center gap-2">
                <Flame className="w-4 h-4" /> Divine Boons
              </h4>
              <Button size="sm" variant="outline" onClick={addBoon} className="border-green-700 text-green-400">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            {formData.signals.boons.map((boon, index) => (
              <div key={index} className="p-3 bg-slate-800/50 rounded-lg mb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-400">Boon #{index + 1}</span>
                  <Button size="icon" variant="ghost" onClick={() => removeBoon(index)} className="h-6 w-6 text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input
                  value={boon.trigger}
                  onChange={(e) => updateBoon(index, 'trigger', e.target.value)}
                  placeholder="Trigger condition..."
                />
                <Input
                  value={boon.effect}
                  onChange={(e) => updateBoon(index, 'effect', e.target.value)}
                  placeholder="Reward effect..."
                />
              </div>
            ))}
          </div>

          {/* Curses */}
          <div className="p-4 bg-red-500/5 border border-red-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-red-400 font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" /> Divine Curses
              </h4>
              <Button size="sm" variant="outline" onClick={addCurse} className="border-red-700 text-red-400">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            {formData.signals.curses.map((curse, index) => (
              <div key={index} className="p-3 bg-slate-800/50 rounded-lg mb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-400">Curse #{index + 1}</span>
                  <Button size="icon" variant="ghost" onClick={() => removeCurse(index)} className="h-6 w-6 text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input
                  value={curse.trigger}
                  onChange={(e) => updateCurse(index, 'trigger', e.target.value)}
                  placeholder="Trigger condition..."
                />
                <Input
                  value={curse.effect}
                  onChange={(e) => updateCurse(index, 'effect', e.target.value)}
                  placeholder="Punishment effect..."
                />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'dm_secrets',
      label: 'DM Secrets',
      icon: <EyeOff className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
            <p className="text-xs text-red-400">
              This section contains secrets only the DM knows
            </p>
          </div>

          <div>
            <Label className="text-red-400">True Nature</Label>
            <Textarea
              value={formData.dm_secrets.true_nature}
              onChange={(e) => updateDmSecrets('true_nature', e.target.value)}
              rows={3}
              placeholder="What is this deity REALLY like?"
            />
          </div>

          <div>
            <Label className="text-red-400">Divine Agenda</Label>
            <Textarea
              value={formData.dm_secrets.divine_agenda}
              onChange={(e) => updateDmSecrets('divine_agenda', e.target.value)}
              rows={3}
              placeholder="What are they secretly working toward?"
            />
          </div>

          <div>
            <Label className="text-red-400">Secrets</Label>
            <Textarea
              value={formData.dm_secrets.secrets}
              onChange={(e) => updateDmSecrets('secrets', e.target.value)}
              rows={3}
              placeholder="Hidden truths that could shake followers..."
            />
          </div>

          <div>
            <Label className="text-red-400">Conflicts</Label>
            <Textarea
              value={formData.dm_secrets.conflicts}
              onChange={(e) => updateDmSecrets('conflicts', e.target.value)}
              rows={2}
              placeholder="Rivalries with other divine powers..."
            />
          </div>

          <div>
            <Label className="text-red-400">Weaknesses</Label>
            <Textarea
              value={formData.dm_secrets.weaknesses}
              onChange={(e) => updateDmSecrets('weaknesses', e.target.value)}
              rows={2}
              placeholder="How can this deity be opposed?"
            />
          </div>

          <StringArrayInput
            label="Adventure Hooks"
            value={formData.dm_secrets.hooks}
            onChange={(val) => updateDmSecrets('hooks', val)}
            placeholder="Add adventure hook..."
          />
        </div>
      ),
    },
    {
      id: 'mechanics',
      label: 'Mechanics',
      icon: <Wrench className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <StringArrayInput
            label="Cleric Domains"
            value={formData.mechanics.cleric_domains}
            onChange={(val) => updateMechanics('cleric_domains', val)}
            placeholder="Add domain (Life, Light, War)..."
          />

          <div>
            <Label>Channel Divinity</Label>
            <Textarea
              value={formData.mechanics.channel_divinity}
              onChange={(e) => updateMechanics('channel_divinity', e.target.value)}
              rows={3}
              placeholder="Unique channel divinity ability..."
            />
          </div>

          <StringArrayInput
            label="Sacred Spells"
            value={formData.mechanics.sacred_spells}
            onChange={(val) => updateMechanics('sacred_spells', val)}
            placeholder="Add spell..."
          />

          <StringArrayInput
            label="Suggested Classes"
            value={formData.mechanics.suggested_classes}
            onChange={(val) => updateMechanics('suggested_classes', val)}
            placeholder="Add class (Cleric, Paladin)..."
          />
        </div>
      ),
    },
  ];

  return (
    <EditEntityShell
      entity={entity}
      campaignId={campaignId}
      onSave={handleSave}
      title={`Edit Deity: ${entity.name}`}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} defaultTab="identity" />
    </EditEntityShell>
  );
}
