'use client';

import { useState } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Sword,
  Shield,
  Zap,
  Coins,
  Scale,
  BookOpen,
  Sparkles,
  Brain,
  Wrench,
  FlaskConical,
  AlertTriangle,
  Battery,
} from 'lucide-react';

interface ItemEditorProps {
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

interface ItemFormData {
  name: string;
  summary: string;
  sub_type: string;

  soul: {
    description: string;
    origin: string;
    visuals: string;
    lore: string;
  };

  brain: {
    secret: string;
    dm_notes: string;
  };

  mechanics: {
    // Universal
    rarity: string;
    value_gp: number;
    weight_lb: number;
    requires_attunement: boolean;
    attunement_requirements: string;
    properties: string[];
    is_magical: boolean;

    // Magical Properties
    ability: string;         // Main magical effect
    trigger: string;         // Activation condition
    cost_drawback: string;   // Negative effects or costs

    // SRD Reference
    srd_id: string | null;
    srd_name: string | null;
    is_srd_base: boolean;

    // Weapon-specific
    damage_dice: string;
    damage_type: string;
    weapon_category: string;
    range: string;

    // Armor-specific
    armor_class: number;
    ac_bonus: number;
    armor_type: string;
    stealth_disadvantage: boolean;
    strength_requirement: number;

    // Charged items
    max_charges: number | null;
    current_charges: number | null;
    recharge_rate: string;

    // Consumables
    uses: number;
    effect: string;
    spell_level: number;

    // Spellcasting items
    spells: string[];
  };
}

// Rarity color mapping
const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  very_rare: 'text-purple-400',
  legendary: 'text-amber-400',
  artifact: 'text-red-400',
};

export function ItemEditor({ entity, campaignId }: ItemEditorProps): JSX.Element {
  // Initialize form state from entity data
  const [formData, setFormData] = useState<ItemFormData>(() => {
    const soul = entity.soul || {};
    const brain = entity.brain || {};
    const mechanics = entity.mechanics || {};
    const attributes = entity.attributes || {};

    return {
      name: entity.name || '',
      summary: entity.summary || '',
      sub_type: entity.sub_type || (mechanics.item_type as string) || 'wondrous',

      soul: {
        description: (soul.description as string) || (soul.full_description as string) || entity.description || '',
        // Check soul first, then brain for origin
        origin: (soul.origin as string) || (soul.history as string) || (soul.backstory as string) ||
          (soul.creation as string) || (brain.origin as string) || '',
        visuals: (soul.visuals as string) || (soul.visual_details as string) || (soul.appearance as string) ||
          (soul.physical_description as string) || '',
        // Check soul first, then brain.history for lore
        lore: (soul.lore as string) || (soul.legend as string) || (soul.legends as string) ||
          (soul.mythology as string) || (brain.history as string) || '',
      },

      brain: {
        secret: (brain.secret as string) || (attributes.secret as string) || '',
        dm_notes: (brain.dm_notes as string) || '',
      },

      mechanics: {
        // Universal
        rarity: (mechanics.rarity as string) || (attributes.rarity as string) || 'common',
        value_gp: (mechanics.value_gp as number) || (attributes.value_gp as number) || 0,
        weight_lb: (mechanics.weight_lb as number) || (mechanics.weight as number) || (attributes.weight as number) || 0,
        requires_attunement: (mechanics.requires_attunement as boolean) || false,
        attunement_requirements: (mechanics.attunement_requirements as string) || '',
        properties: (mechanics.properties as string[]) || [],
        is_magical: (mechanics.is_magical as boolean) || (attributes.magical_aura as boolean) ||
          !!(mechanics.ability || mechanics.effect || mechanics.magical_properties) || false,

        // Magical Properties - check mechanics first, then abilities array, then brain
        ability: (mechanics.ability as string) || (mechanics.effect as string) ||
          (mechanics.magical_effect as string) || (mechanics.power as string) ||
          (mechanics.magical_properties as string) ||
          // Check abilities array (AI sometimes stores as array)
          (Array.isArray(mechanics.abilities) && (mechanics.abilities as Array<{name?: string; description?: string}>)[0]
            ? `${(mechanics.abilities as Array<{name?: string; description?: string}>)[0].name || ''}: ${(mechanics.abilities as Array<{name?: string; description?: string}>)[0].description || ''}`.trim().replace(/^: |: $/g, '')
            : '') || '',
        // Check mechanics first, then brain.trigger
        trigger: (mechanics.trigger as string) || (mechanics.trigger_condition as string) ||
          (mechanics.activation as string) || (mechanics.activated_by as string) ||
          (brain.trigger as string) || '',
        // Check mechanics first, then brain.cost
        cost_drawback: (mechanics.cost_drawback as string) || (mechanics.drawback as string) ||
          (mechanics.cost as string) || (brain.cost_drawback as string) || (brain.drawback as string) ||
          (brain.cost as string) || '',

        // SRD Reference
        srd_id: (mechanics.srd_id as string) || null,
        srd_name: (mechanics.srd_name as string) || null,
        is_srd_base: (mechanics.is_srd_base as boolean) || false,

        // Weapon-specific
        damage_dice: (mechanics.damage_dice as string) || '',
        damage_type: (mechanics.damage_type as string) || '',
        weapon_category: (mechanics.weapon_category as string) || '',
        range: (mechanics.range as string) || '',

        // Armor-specific
        armor_class: (mechanics.armor_class as number) || 0,
        ac_bonus: (mechanics.ac_bonus as number) || 0,
        armor_type: (mechanics.armor_type as string) || '',
        stealth_disadvantage: (mechanics.stealth_disadvantage as boolean) || false,
        strength_requirement: (mechanics.strength_requirement as number) || 0,

        // Charged items - check flat fields first, then nested charges object
        max_charges: (mechanics.max_charges as number) ??
          ((mechanics.charges as {max?: number})?.max) ??
          (typeof mechanics.charges === 'number' ? mechanics.charges : null),
        current_charges: (mechanics.current_charges as number) ??
          ((mechanics.charges as {current?: number})?.current) ??
          (typeof mechanics.charges === 'number' ? mechanics.charges : null),
        recharge_rate: (mechanics.recharge_rate as string) ||
          ((mechanics.charges as {recharge?: string})?.recharge) ||
          (mechanics.recharge as string) || '',

        // Consumables
        uses: (mechanics.uses as number) || 1,
        effect: (mechanics.effect as string) || '',
        spell_level: (mechanics.spell_level as number) || 0,

        // Spellcasting items
        spells: (mechanics.spells as string[]) || [],
      },
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Helper functions to update nested state
  const updateBasic = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateSoul = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      soul: { ...prev.soul, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateBrain = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      brain: { ...prev.brain, [field]: value },
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

  const handleSave = async (): Promise<void> => {
    console.log('[ItemEditor] Preparing save data...');

    const saveData: Record<string, unknown> = {
      name: formData.name,
      sub_type: formData.sub_type,
      summary: formData.summary,
      description: formData.soul.description,
      soul: formData.soul,
      brain: formData.brain,
      mechanics: formData.mechanics,
    };

    console.log('[ItemEditor] Save data keys:', Object.keys(saveData));

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    });

    console.log('[ItemEditor] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ItemEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[ItemEditor] Saved successfully:', result.id);
  };

  // Check item type for conditional sections
  const subType = formData.sub_type;
  const isWeapon = ['weapon', 'ammunition'].includes(subType);
  const isArmor = ['armor', 'shield'].includes(subType);
  const isChargedItem = ['wand', 'staff', 'ring', 'wondrous'].includes(subType);
  const isConsumable = ['potion', 'scroll'].includes(subType);

  // Define the tabs
  const tabs = [
    {
      id: 'basics',
      label: 'Basics',
      icon: <Package className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label>Item Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateBasic('name', e.target.value)}
              placeholder="Flame Tongue Longsword"
            />
          </div>

          {/* SRD Badge - if based on SRD item */}
          {formData.mechanics.is_srd_base && (
            <div className="p-2 bg-blue-900/20 border border-blue-700/50 rounded flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">
                Based on SRD: {formData.mechanics.srd_name}
              </span>
              <Badge variant="outline" className="text-xs border-blue-600 text-blue-400">
                SRD
              </Badge>
            </div>
          )}

          {/* Type & Rarity Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Item Type</Label>
              <Select
                value={formData.sub_type}
                onValueChange={(val) => updateBasic('sub_type', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weapon">Weapon</SelectItem>
                  <SelectItem value="armor">Armor</SelectItem>
                  <SelectItem value="shield">Shield</SelectItem>
                  <SelectItem value="potion">Potion</SelectItem>
                  <SelectItem value="scroll">Scroll</SelectItem>
                  <SelectItem value="wand">Wand</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="ring">Ring</SelectItem>
                  <SelectItem value="wondrous">Wondrous Item</SelectItem>
                  <SelectItem value="ammunition">Ammunition</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="gear">Adventuring Gear</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rarity</Label>
              <Select
                value={formData.mechanics.rarity}
                onValueChange={(val) => updateMechanics('rarity', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">
                    <span className="text-slate-400">Common</span>
                  </SelectItem>
                  <SelectItem value="uncommon">
                    <span className="text-green-400">Uncommon</span>
                  </SelectItem>
                  <SelectItem value="rare">
                    <span className="text-blue-400">Rare</span>
                  </SelectItem>
                  <SelectItem value="very_rare">
                    <span className="text-purple-400">Very Rare</span>
                  </SelectItem>
                  <SelectItem value="legendary">
                    <span className="text-amber-400">Legendary</span>
                  </SelectItem>
                  <SelectItem value="artifact">
                    <span className="text-red-400">Artifact</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Value & Weight Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <Coins className="w-3 h-3" /> Value (gp)
              </Label>
              <Input
                type="number"
                value={formData.mechanics.value_gp || ''}
                onChange={(e) => updateMechanics('value_gp', parseInt(e.target.value) || 0)}
                placeholder="100"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Scale className="w-3 h-3" /> Weight (lb)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={formData.mechanics.weight_lb || ''}
                onChange={(e) => updateMechanics('weight_lb', parseFloat(e.target.value) || 0)}
                placeholder="3"
              />
            </div>
          </div>

          {/* Magical Checkbox */}
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.mechanics.is_magical}
              onCheckedChange={(val) => updateMechanics('is_magical', val)}
            />
            <Label>Magical Item</Label>
          </div>

          {/* Summary */}
          <div>
            <Label>Summary</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => updateBasic('summary', e.target.value)}
              placeholder="A brief description for item lists..."
              rows={2}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'mechanics',
      label: 'Mechanics',
      icon: <Wrench className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Universal: Attunement */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.mechanics.requires_attunement}
                onCheckedChange={(val) => updateMechanics('requires_attunement', val)}
              />
              <Label>Requires Attunement</Label>
            </div>

            {formData.mechanics.requires_attunement && (
              <Input
                value={formData.mechanics.attunement_requirements}
                onChange={(e) => updateMechanics('attunement_requirements', e.target.value)}
                placeholder="by a spellcaster, by a cleric..."
                className="flex-1"
              />
            )}
          </div>

          {/* Universal: Properties */}
          <StringArrayInput
            label="Properties"
            value={formData.mechanics.properties}
            onChange={(val) => updateMechanics('properties', val)}
            placeholder="Add property (Finesse, Light, Versatile...)"
          />

          {/* ========== ABILITY / EFFECT ========== */}
          <div>
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Ability / Effect
            </Label>
            <Textarea
              value={formData.mechanics.ability}
              onChange={(e) => updateMechanics('ability', e.target.value)}
              rows={4}
              placeholder="Describe the item's magical ability or effect..."
              className="bg-slate-900/50 border-slate-700"
            />
            <p className="text-xs text-slate-500 mt-1">
              The main magical power or effect of this item
            </p>
          </div>

          {/* ========== TRIGGER / ACTIVATION ========== */}
          <div>
            <Label className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Trigger / Activation
            </Label>
            <Input
              value={formData.mechanics.trigger}
              onChange={(e) => updateMechanics('trigger', e.target.value)}
              placeholder="Command word, bonus action, when you hit with an attack..."
              className="bg-slate-900/50 border-slate-700"
            />
            <p className="text-xs text-slate-500 mt-1">
              How is the ability activated?
            </p>
          </div>

          {/* ========== COST / DRAWBACK ========== */}
          <div>
            <Label className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Cost / Drawback
            </Label>
            <Textarea
              value={formData.mechanics.cost_drawback}
              onChange={(e) => updateMechanics('cost_drawback', e.target.value)}
              rows={2}
              placeholder="Expend 1 charge, take 1d6 necrotic damage, can't use until dawn..."
              className="bg-slate-900/50 border-slate-700"
            />
            <p className="text-xs text-slate-500 mt-1">
              Any cost, limitation, or negative effect
            </p>
          </div>

          {/* ========== CHARGES SECTION ========== */}
          <div className="p-4 border border-purple-900/30 bg-purple-950/10 rounded-lg space-y-4">
            <h4 className="text-purple-400 font-medium flex items-center gap-2">
              <Battery className="w-4 h-4" />
              Charges (if applicable)
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Max Charges</Label>
                <Input
                  type="number"
                  value={formData.mechanics.max_charges ?? ''}
                  onChange={(e) => updateMechanics('max_charges', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="7"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
              <div>
                <Label>Current Charges</Label>
                <Input
                  type="number"
                  value={formData.mechanics.current_charges ?? ''}
                  onChange={(e) => updateMechanics('current_charges', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="7"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
              <div>
                <Label>Recharge Rate</Label>
                <Input
                  value={formData.mechanics.recharge_rate}
                  onChange={(e) => updateMechanics('recharge_rate', e.target.value)}
                  placeholder="1d6+1 at dawn"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* ========== WEAPON SECTION ========== */}
          {isWeapon && (
            <div className="p-4 border border-red-900/30 bg-red-950/10 rounded-lg space-y-4">
              <h3 className="text-red-400 font-semibold flex items-center gap-2">
                <Sword className="w-4 h-4" />
                Weapon Stats
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Damage Dice</Label>
                  <Input
                    value={formData.mechanics.damage_dice}
                    onChange={(e) => updateMechanics('damage_dice', e.target.value)}
                    placeholder="1d8"
                  />
                </div>
                <div>
                  <Label>Damage Type</Label>
                  <Select
                    value={formData.mechanics.damage_type}
                    onValueChange={(val) => updateMechanics('damage_type', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slashing">Slashing</SelectItem>
                      <SelectItem value="piercing">Piercing</SelectItem>
                      <SelectItem value="bludgeoning">Bludgeoning</SelectItem>
                      <SelectItem value="fire">Fire</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                      <SelectItem value="lightning">Lightning</SelectItem>
                      <SelectItem value="thunder">Thunder</SelectItem>
                      <SelectItem value="acid">Acid</SelectItem>
                      <SelectItem value="poison">Poison</SelectItem>
                      <SelectItem value="necrotic">Necrotic</SelectItem>
                      <SelectItem value="radiant">Radiant</SelectItem>
                      <SelectItem value="force">Force</SelectItem>
                      <SelectItem value="psychic">Psychic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.mechanics.weapon_category}
                    onValueChange={(val) => updateMechanics('weapon_category', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple_melee">Simple Melee</SelectItem>
                      <SelectItem value="simple_ranged">Simple Ranged</SelectItem>
                      <SelectItem value="martial_melee">Martial Melee</SelectItem>
                      <SelectItem value="martial_ranged">Martial Ranged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Range</Label>
                  <Input
                    value={formData.mechanics.range}
                    onChange={(e) => updateMechanics('range', e.target.value)}
                    placeholder="Melee or 20/60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========== ARMOR SECTION ========== */}
          {isArmor && (
            <div className="p-4 border border-blue-900/30 bg-blue-950/10 rounded-lg space-y-4">
              <h3 className="text-blue-400 font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Armor Stats
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Base AC</Label>
                  <Input
                    type="number"
                    value={formData.mechanics.armor_class || ''}
                    onChange={(e) => updateMechanics('armor_class', parseInt(e.target.value) || 0)}
                    placeholder="14"
                  />
                </div>
                <div>
                  <Label>AC Bonus</Label>
                  <Input
                    type="number"
                    value={formData.mechanics.ac_bonus || ''}
                    onChange={(e) => updateMechanics('ac_bonus', parseInt(e.target.value) || 0)}
                    placeholder="+1"
                  />
                </div>
                <div>
                  <Label>Armor Type</Label>
                  <Select
                    value={formData.mechanics.armor_type}
                    onValueChange={(val) => updateMechanics('armor_type', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                      <SelectItem value="shield">Shield</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.mechanics.stealth_disadvantage}
                    onCheckedChange={(val) => updateMechanics('stealth_disadvantage', val)}
                  />
                  <Label>Stealth Disadvantage</Label>
                </div>
                <div>
                  <Label>Strength Requirement</Label>
                  <Input
                    type="number"
                    value={formData.mechanics.strength_requirement || ''}
                    onChange={(e) => updateMechanics('strength_requirement', parseInt(e.target.value) || 0)}
                    placeholder="13"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========== SPELLCASTING ITEMS (Wand, Staff, Ring, Wondrous) ========== */}
          {isChargedItem && formData.mechanics.spells.length > 0 && (
            <div className="p-4 border border-purple-900/30 bg-purple-950/10 rounded-lg space-y-4">
              <h3 className="text-purple-400 font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Spellcasting
              </h3>

              <StringArrayInput
                label="Spells"
                value={formData.mechanics.spells}
                onChange={(val) => updateMechanics('spells', val)}
                placeholder="Add spell name..."
              />
            </div>
          )}

          {/* Add Spells Button for spellcasting item types */}
          {isChargedItem && formData.mechanics.spells.length === 0 && (
            <button
              type="button"
              onClick={() => updateMechanics('spells', [''])}
              className="w-full p-3 border border-dashed border-purple-700/50 rounded-lg text-purple-400 hover:bg-purple-950/20 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Add Spells to This Item
            </button>
          )}

          {/* ========== CONSUMABLES (Potion, Scroll) ========== */}
          {isConsumable && (
            <div className="p-4 border border-green-900/30 bg-green-950/10 rounded-lg space-y-4">
              <h3 className="text-green-400 font-semibold flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Consumable Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Uses</Label>
                  <Input
                    type="number"
                    value={formData.mechanics.uses || 1}
                    onChange={(e) => updateMechanics('uses', parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                </div>
                {formData.sub_type === 'scroll' && (
                  <div>
                    <Label>Spell Level</Label>
                    <Input
                      type="number"
                      value={formData.mechanics.spell_level || ''}
                      onChange={(e) => updateMechanics('spell_level', parseInt(e.target.value) || 0)}
                      placeholder="3"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Effect</Label>
                <Textarea
                  value={formData.mechanics.effect}
                  onChange={(e) => updateMechanics('effect', e.target.value)}
                  placeholder="Describe the effect when used..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'soul',
      label: 'Soul',
      icon: <Sparkles className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 mb-4">
            Player-facing description and lore about the item.
          </p>

          <div>
            <Label>Full Description</Label>
            <Textarea
              value={formData.soul.description}
              onChange={(e) => updateSoul('description', e.target.value)}
              rows={4}
              placeholder="Detailed description of the item's appearance and abilities..."
            />
          </div>

          <div>
            <Label>Visual Details</Label>
            <Textarea
              value={formData.soul.visuals}
              onChange={(e) => updateSoul('visuals', e.target.value)}
              rows={3}
              placeholder="What does it look like? Materials, colors, markings..."
            />
          </div>

          <div>
            <Label>Origin / History</Label>
            <Textarea
              value={formData.soul.origin}
              onChange={(e) => updateSoul('origin', e.target.value)}
              rows={3}
              placeholder="Where did it come from? Who made it?"
            />
          </div>

          <div>
            <Label>Lore & Legend</Label>
            <Textarea
              value={formData.soul.lore}
              onChange={(e) => updateSoul('lore', e.target.value)}
              rows={3}
              placeholder="Any myths or stories about this item?"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'brain',
      label: 'DM Secrets',
      icon: <Brain className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-amber-500 mb-4">
            DM-only information - hidden properties and notes.
          </p>

          <div>
            <Label className="text-amber-400">Secret Properties</Label>
            <Textarea
              value={formData.brain.secret}
              onChange={(e) => updateBrain('secret', e.target.value)}
              rows={3}
              placeholder="Hidden abilities, curses, or properties the players don't know yet..."
              className="border-amber-700/50 bg-amber-950/20"
            />
            <p className="text-xs text-slate-500 mt-1">
              Only visible to you, not players
            </p>
          </div>

          <div>
            <Label>DM Notes</Label>
            <Textarea
              value={formData.brain.dm_notes}
              onChange={(e) => updateBrain('dm_notes', e.target.value)}
              rows={4}
              placeholder="Your notes about this item, plot hooks, future plans..."
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <EditEntityShell
      entity={entity}
      campaignId={campaignId}
      onSave={handleSave}
      title={`Edit Item: ${entity.name}`}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} defaultTab="basics" />
    </EditEntityShell>
  );
}
