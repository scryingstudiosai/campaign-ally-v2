'use client';

import { useState } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JsonTextArea } from '@/components/form-widgets/JsonTextArea';
import { Sparkles, Brain, Wrench } from 'lucide-react';

interface GenericEditorProps {
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

export function GenericEditor({ entity, campaignId }: GenericEditorProps): JSX.Element {
  const [formData, setFormData] = useState({
    name: entity.name || '',
    sub_type: entity.sub_type || '',
    summary: entity.summary || '',
    description: entity.description || '',
    soul: entity.soul || {},
    brain: entity.brain || {},
    mechanics: entity.mechanics || {},
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async (): Promise<void> => {
    console.log('[GenericEditor] Saving data...');

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    console.log('[GenericEditor] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GenericEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[GenericEditor] Saved successfully:', result.id);
  };

  const updateField = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <EditEntityShell
      entity={entity}
      campaignId={campaignId}
      onSave={handleSave}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <>
        {/* Basic Fields */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div>
              <Label>Type / Role</Label>
              <Input
                value={formData.sub_type}
                onChange={(e) => updateField('sub_type', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Summary</Label>
            <Input
              value={formData.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="Brief one-line description"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {/* Advanced JSON Editing */}
        <Tabs defaultValue="soul" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900">
            <TabsTrigger value="soul" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Soul
            </TabsTrigger>
            <TabsTrigger value="brain" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Brain
            </TabsTrigger>
            <TabsTrigger value="mechanics" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Mechanics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="soul" className="mt-4">
            <JsonTextArea
              label="Soul Data (Player-facing)"
              value={formData.soul}
              onChange={(val) => updateField('soul', val)}
            />
          </TabsContent>

          <TabsContent value="brain" className="mt-4">
            <JsonTextArea
              label="Brain Data (DM-only)"
              value={formData.brain}
              onChange={(val) => updateField('brain', val)}
            />
          </TabsContent>

          <TabsContent value="mechanics" className="mt-4">
            <JsonTextArea
              label="Mechanics Data"
              value={formData.mechanics}
              onChange={(val) => updateField('mechanics', val)}
            />
          </TabsContent>
        </Tabs>
      </>
    </EditEntityShell>
  );
}
