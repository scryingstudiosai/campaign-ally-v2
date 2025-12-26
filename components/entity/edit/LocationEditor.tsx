'use client';

import { useState } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Sparkles, Brain, Wrench } from 'lucide-react';

interface LocationEditorProps {
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
  };
  campaignId: string;
}

export function LocationEditor({ entity, campaignId }: LocationEditorProps): JSX.Element {
  // Initialize form state from entity data
  const [formData, setFormData] = useState({
    // Basic Info
    name: entity.name || '',
    sub_type: entity.sub_type || '',
    summary: entity.summary || '',
    description: entity.description || '',

    // Soul (Player-facing)
    soul: {
      first_impression: (entity.soul?.first_impression as string) || '',
      distinctive_feature: (entity.soul?.distinctive_feature as string) || '',
      atmosphere: (entity.soul?.atmosphere as string) || '',
      sights: (entity.soul?.sights as string[]) || [],
      sounds: (entity.soul?.sounds as string[]) || [],
      smells: (entity.soul?.smells as string[]) || [],
      read_aloud: (entity.soul?.read_aloud as string) || '',
    },

    // Brain (DM-only)
    brain: {
      history: (entity.brain?.history as string) || '',
      secret: (entity.brain?.secret as string) || '',
      current_situation: (entity.brain?.current_situation as string) || '',
      potential_encounters: (entity.brain?.potential_encounters as string[]) || [],
      hazards: (entity.brain?.hazards as string[]) || [],
      hidden_features: (entity.brain?.hidden_features as string) || '',
      plot_hooks: (entity.brain?.plot_hooks as string[]) || [],
    },

    // Mechanics
    mechanics: {
      size: (entity.mechanics?.size as string) || '',
      terrain: (entity.mechanics?.terrain as string) || 'normal',
      lighting: (entity.mechanics?.lighting as string) || 'bright',
      is_shop: (entity.mechanics?.is_shop as boolean) || false,
      shop_type: (entity.mechanics?.shop_type as string) || '',
      price_modifier: (entity.mechanics?.price_modifier as number) || 1.0,
      safe_rest: entity.mechanics?.safe_rest !== false,
      long_rest: (entity.mechanics?.long_rest as boolean) || false,
      rest_cost: (entity.mechanics?.rest_cost as string) || '',
      resources: (entity.mechanics?.resources as string[]) || [],
    },
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async (): Promise<void> => {
    console.log('[LocationEditor] Preparing save data...');

    // Build save data - only include fields that have actual values
    const saveData: Record<string, unknown> = {
      name: formData.name,
      sub_type: formData.sub_type,
      summary: formData.summary,
      description: formData.description,
    };

    // Helper to check if an object has any non-empty values
    const hasValues = (obj: Record<string, unknown>): boolean => {
      return Object.values(obj).some((v) => {
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'string') return v.trim() !== '';
        if (typeof v === 'boolean') return true; // booleans always count
        if (typeof v === 'number') return true; // numbers always count
        return v !== null && v !== undefined;
      });
    };

    // Only include soul if it has data
    if (hasValues(formData.soul)) {
      saveData.soul = formData.soul;
    }

    // Only include brain if it has data
    if (hasValues(formData.brain)) {
      saveData.brain = formData.brain;
    }

    // Always include mechanics (has important flags like is_shop, safe_rest)
    saveData.mechanics = formData.mechanics;

    console.log('[LocationEditor] Save data keys:', Object.keys(saveData));

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    });

    console.log('[LocationEditor] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LocationEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[LocationEditor] Saved successfully:', result.id);
  };

  // Helper to update nested state
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

  const updateBasic = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Define the tabs
  const tabs = [
    {
      id: 'basics',
      label: 'Basics',
      icon: <MapPin className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateBasic('name', e.target.value)}
                placeholder="The Rusty Anchor"
              />
            </div>
            <div>
              <Label>Location Type</Label>
              <Input
                value={formData.sub_type}
                onChange={(e) => updateBasic('sub_type', e.target.value)}
                placeholder="Tavern, Shop, Dungeon, etc."
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
              placeholder="Detailed description of the location..."
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
          <p className="text-xs text-slate-500 mb-4">
            Player-facing information - what they see, hear, and experience.
          </p>

          <div>
            <Label>First Impression</Label>
            <Textarea
              value={formData.soul.first_impression}
              onChange={(e) => updateSoul('first_impression', e.target.value)}
              rows={2}
              placeholder="What players notice immediately upon arrival..."
            />
          </div>

          <div>
            <Label>Distinctive Feature</Label>
            <Input
              value={formData.soul.distinctive_feature}
              onChange={(e) => updateSoul('distinctive_feature', e.target.value)}
              placeholder="The one thing that makes this place memorable"
            />
          </div>

          <div>
            <Label>Atmosphere</Label>
            <Input
              value={formData.soul.atmosphere}
              onChange={(e) => updateSoul('atmosphere', e.target.value)}
              placeholder="Cozy, foreboding, bustling, serene..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StringArrayInput
              label="Sights"
              value={formData.soul.sights}
              onChange={(val) => updateSoul('sights', val)}
              placeholder="Add a sight..."
            />
            <StringArrayInput
              label="Sounds"
              value={formData.soul.sounds}
              onChange={(val) => updateSoul('sounds', val)}
              placeholder="Add a sound..."
            />
            <StringArrayInput
              label="Smells"
              value={formData.soul.smells}
              onChange={(val) => updateSoul('smells', val)}
              placeholder="Add a smell..."
            />
          </div>

          <div>
            <Label>Read-Aloud Text</Label>
            <Textarea
              value={formData.soul.read_aloud}
              onChange={(e) => updateSoul('read_aloud', e.target.value)}
              rows={4}
              placeholder="Text to read aloud when players enter..."
              className="italic"
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
          <p className="text-xs text-amber-500 mb-4">
            DM-only information - secrets, history, and plot hooks.
          </p>

          <div>
            <Label>History</Label>
            <Textarea
              value={formData.brain.history}
              onChange={(e) => updateBrain('history', e.target.value)}
              rows={3}
              placeholder="The backstory of this location..."
            />
          </div>

          <div>
            <Label className="text-amber-400">Secret (DM Only)</Label>
            <Textarea
              value={formData.brain.secret}
              onChange={(e) => updateBrain('secret', e.target.value)}
              rows={2}
              placeholder="Hidden truth about this place..."
              className="border-amber-700/50 bg-amber-950/20"
            />
          </div>

          <div>
            <Label>Current Situation</Label>
            <Textarea
              value={formData.brain.current_situation}
              onChange={(e) => updateBrain('current_situation', e.target.value)}
              rows={2}
              placeholder="What's happening here right now..."
            />
          </div>

          <div>
            <Label>Hidden Features</Label>
            <Textarea
              value={formData.brain.hidden_features}
              onChange={(e) => updateBrain('hidden_features', e.target.value)}
              rows={2}
              placeholder="Secret doors, hidden compartments, etc..."
            />
          </div>

          <StringArrayInput
            label="Hazards"
            value={formData.brain.hazards}
            onChange={(val) => updateBrain('hazards', val)}
            placeholder="Add a hazard..."
          />

          <StringArrayInput
            label="Potential Encounters"
            value={formData.brain.potential_encounters}
            onChange={(val) => updateBrain('potential_encounters', val)}
            placeholder="Add an encounter idea..."
          />

          <StringArrayInput
            label="Plot Hooks"
            value={formData.brain.plot_hooks}
            onChange={(val) => updateBrain('plot_hooks', val)}
            placeholder="Add a plot hook..."
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
          <p className="text-xs text-slate-500 mb-4">
            Game mechanics - terrain, shop settings, resting rules.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Size</Label>
              <Input
                value={formData.mechanics.size}
                onChange={(e) => updateMechanics('size', e.target.value)}
                placeholder="Small shop, Large warehouse, etc."
              />
            </div>
            <div>
              <Label>Terrain</Label>
              <Select
                value={formData.mechanics.terrain}
                onValueChange={(val) => updateMechanics('terrain', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="difficult">Difficult Terrain</SelectItem>
                  <SelectItem value="hazardous">Hazardous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Lighting</Label>
            <Select
              value={formData.mechanics.lighting}
              onValueChange={(val) => updateMechanics('lighting', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bright">Bright Light</SelectItem>
                <SelectItem value="dim">Dim Light</SelectItem>
                <SelectItem value="darkness">Darkness</SelectItem>
                <SelectItem value="magical_darkness">Magical Darkness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shop Settings */}
          <div className="p-4 bg-slate-900/50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>This is a Shop</Label>
                <p className="text-xs text-slate-500">Enable shop inventory and pricing</p>
              </div>
              <Switch
                checked={formData.mechanics.is_shop}
                onCheckedChange={(val) => updateMechanics('is_shop', val)}
              />
            </div>

            {formData.mechanics.is_shop && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
                <div>
                  <Label>Shop Type</Label>
                  <Select
                    value={formData.mechanics.shop_type}
                    onValueChange={(val) => updateMechanics('shop_type', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Store</SelectItem>
                      <SelectItem value="weapons">Weapons</SelectItem>
                      <SelectItem value="armor">Armor</SelectItem>
                      <SelectItem value="potions">Potions/Alchemy</SelectItem>
                      <SelectItem value="magic">Magic Items</SelectItem>
                      <SelectItem value="food">Food & Drink</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Price Modifier</Label>
                  <Select
                    value={formData.mechanics.price_modifier?.toString()}
                    onValueChange={(val) => updateMechanics('price_modifier', parseFloat(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8">20% Discount (0.8x)</SelectItem>
                      <SelectItem value="0.9">10% Discount (0.9x)</SelectItem>
                      <SelectItem value="1">Standard Prices (1x)</SelectItem>
                      <SelectItem value="1.1">10% Markup (1.1x)</SelectItem>
                      <SelectItem value="1.2">20% Markup (1.2x)</SelectItem>
                      <SelectItem value="1.5">50% Markup (1.5x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Resting Settings */}
          <div className="p-4 bg-slate-900/50 rounded-lg space-y-4">
            <Label className="text-base">Resting</Label>

            <div className="flex items-center justify-between">
              <div>
                <Label>Safe for Short Rest</Label>
                <p className="text-xs text-slate-500">Party can rest here safely</p>
              </div>
              <Switch
                checked={formData.mechanics.safe_rest}
                onCheckedChange={(val) => updateMechanics('safe_rest', val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allows Long Rest</Label>
                <p className="text-xs text-slate-500">Full rest available</p>
              </div>
              <Switch
                checked={formData.mechanics.long_rest}
                onCheckedChange={(val) => updateMechanics('long_rest', val)}
              />
            </div>

            {formData.mechanics.long_rest && (
              <div>
                <Label>Rest Cost</Label>
                <Input
                  value={formData.mechanics.rest_cost}
                  onChange={(e) => updateMechanics('rest_cost', e.target.value)}
                  placeholder="5 sp/night, Free, etc."
                />
              </div>
            )}
          </div>

          <StringArrayInput
            label="Available Resources"
            value={formData.mechanics.resources}
            onChange={(val) => updateMechanics('resources', val)}
            placeholder="Add a resource..."
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
      title={`Edit Location: ${entity.name}`}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} defaultTab="basics" />
    </EditEntityShell>
  );
}
