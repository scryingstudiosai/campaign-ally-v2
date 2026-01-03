'use client';

import { useState } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageInput } from '@/components/ui/image-input';
import { Badge } from '@/components/ui/badge';
import { User, Sparkles, Brain, EyeOff, Heart, BookOpen } from 'lucide-react';

interface PlayerEditorProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
    summary?: string;
    description?: string;
    image_url?: string | null;
    soul?: Record<string, unknown>;
    brain?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  };
  campaignId: string;
}

export function PlayerEditor({ entity, campaignId }: PlayerEditorProps): JSX.Element {
  const [formData, setFormData] = useState(() => {
    // Extract DM secrets from various locations
    const extractDmSecrets = (): string => {
      if (entity.attributes?.dm_secrets) {
        return entity.attributes.dm_secrets as string;
      }
      if (entity.brain?.dm_secrets) {
        return entity.brain.dm_secrets as string;
      }
      if (entity.brain?.secrets) {
        return entity.brain.secrets as string;
      }
      return '';
    };

    const soul = entity.soul || {};

    return {
      // Basic Info
      name: entity.name || '',
      sub_type: entity.sub_type || '',
      summary: entity.summary || '',
      description: entity.description || '',
      image_url: entity.image_url || null,

      // Soul data - preserve stats and extract displayable fields
      soul: {
        ...soul,
        backstory: (soul.backstory as string) || '',
        personality: (soul.personality as string) || '',
        appearance: (soul.appearance as string) || '',
      },

      // Brain data - DM secrets
      brain: {
        ...(entity.brain || {}),
        dm_secrets: extractDmSecrets(),
      },

      // Attributes
      attributes: {
        ...(entity.attributes || {}),
        dm_secrets: extractDmSecrets(),
      },
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async (): Promise<void> => {
    console.log('[PlayerEditor] Saving data...');

    // Build the payload
    const payload = {
      name: formData.name,
      sub_type: formData.sub_type,
      summary: formData.summary,
      description: formData.description,
      image_url: formData.image_url,
      soul: formData.soul,
      brain: formData.brain,
      attributes: formData.attributes,
    };

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('[PlayerEditor] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PlayerEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[PlayerEditor] Saved successfully:', result.id);
  };

  const updateField = (field: string, value: unknown): void => {
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

  const updateDmSecrets = (value: string): void => {
    setFormData((prev) => ({
      ...prev,
      brain: { ...prev.brain, dm_secrets: value },
      attributes: { ...prev.attributes, dm_secrets: value },
    }));
    setHasChanges(true);
  };

  // Get player class/race info for description generation prompt
  const playerInfo = formData.soul as Record<string, unknown>;
  const race = playerInfo.race as string || '';
  const playerClass = playerInfo.class as string || '';
  const appearance = playerInfo.appearance as string || '';
  const generationPrompt = [race, playerClass, appearance].filter(Boolean).join(', ') || 'Fantasy character portrait';

  const tabs = [
    {
      id: 'identity',
      label: 'Identity',
      icon: <User className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {/* Image */}
          <ImageInput
            value={formData.image_url}
            onChange={(url) => updateField('image_url', url)}
            campaignId={campaignId}
            entityId={entity.id}
            entityType="player"
            generationPrompt={generationPrompt}
            label="Character Portrait"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Character Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter character name"
              />
            </div>

            <div>
              <Label>Type (Race + Class)</Label>
              <Input
                value={formData.sub_type}
                onChange={(e) => updateField('sub_type', e.target.value)}
                placeholder="e.g., Human Fighter"
              />
            </div>

            <div>
              <Label>Summary</Label>
              <Input
                value={formData.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder="e.g., Level 5 Human Fighter"
              />
            </div>
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
          <div>
            <Label>Backstory</Label>
            <Textarea
              value={(formData.soul.backstory as string) || formData.description || ''}
              onChange={(e) => {
                updateSoul('backstory', e.target.value);
                updateField('description', e.target.value);
              }}
              placeholder="Character's background, history, and journey..."
              className="min-h-[150px]"
            />
            <p className="text-xs text-slate-500 mt-1">This will be displayed as the character's backstory.</p>
          </div>

          <div>
            <Label>Personality</Label>
            <Textarea
              value={(formData.soul.personality as string) || ''}
              onChange={(e) => updateSoul('personality', e.target.value)}
              placeholder="Personality traits, bonds, ideals, and flaws..."
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label>Appearance</Label>
            <Textarea
              value={(formData.soul.appearance as string) || ''}
              onChange={(e) => updateSoul('appearance', e.target.value)}
              placeholder="Physical description, distinguishing features..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'dm',
      label: 'DM Secrets',
      icon: <EyeOff className="w-4 h-4" />,
      badge: (
        <Badge variant="outline" className="ml-2 text-xs text-red-400 border-red-500/30 bg-red-500/10">
          Hidden
        </Badge>
      ),
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
            <Label className="text-red-400 flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              DM Secrets
            </Label>
            <Textarea
              value={(formData.brain.dm_secrets as string) || ''}
              onChange={(e) => updateDmSecrets(e.target.value)}
              placeholder="Secret information only the DM knows about this character..."
              className="min-h-[150px] mt-2 bg-red-950/30 border-red-500/30 placeholder:text-red-300/50"
            />
            <p className="text-xs text-red-400/70 mt-2">
              This information is hidden from players and only visible to the DM.
            </p>
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
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} />
    </EditEntityShell>
  );
}
