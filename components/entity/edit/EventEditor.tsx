'use client';

import { useState } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  BookOpen,
  EyeOff,
  Scroll,
  MapPin,
  Plus,
  Trash2,
  AlertTriangle,
  Users,
  Sparkles,
} from 'lucide-react';
import { EVENT_SUB_TYPES, EventSubType, LoreDrop } from '@/types/event';
import { v4 as uuidv4 } from 'uuid';

interface EventEditorProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
    summary?: string;
    description?: string;
    event_sort?: number;
    event_era?: string | null;
    event_ongoing?: boolean;
    soul?: Record<string, unknown>;
    brain?: Record<string, unknown>;
    mechanics?: Record<string, unknown>;
  };
  campaignId: string;
}

interface EventFormData {
  name: string;
  summary: string;
  sub_type: EventSubType;
  event_sort: number;
  event_era: string;
  event_ongoing: boolean;

  knowledge: {
    common_knowledge: string;
    scholarly_account: string;
    folklore: string;
    propaganda: string;
  };

  dm_truth: {
    true_history: string;
    hidden_causes: string;
    consequences: string;
    secrets: string;
    reveal_triggers: string[];
    hooks: string[];
  };

  timeline: {
    date_display: string;
    duration: string;
    affected_regions: string[];
    current_evidence: string;
  };

  lore_drops: LoreDrop[];
}

export function EventEditor({ entity, campaignId }: EventEditorProps): JSX.Element {
  const [formData, setFormData] = useState<EventFormData>(() => {
    const soul = entity.soul || {};
    const brain = entity.brain || {};
    const mechanics = entity.mechanics || {};

    return {
      name: entity.name || '',
      summary: entity.summary || '',
      sub_type: (entity.sub_type as EventSubType) || 'historical',
      event_sort: entity.event_sort || 0,
      event_era: entity.event_era || '',
      event_ongoing: entity.event_ongoing || false,

      knowledge: {
        common_knowledge: (soul.common_knowledge as string) || '',
        scholarly_account: (soul.scholarly_account as string) || '',
        folklore: (soul.folklore as string) || '',
        propaganda: (soul.propaganda as string) || '',
      },

      dm_truth: {
        true_history: (brain.true_history as string) || '',
        hidden_causes: (brain.hidden_causes as string) || '',
        consequences: (brain.consequences as string) || '',
        secrets: (brain.secrets as string) || '',
        reveal_triggers: (brain.reveal_triggers as string[]) || [],
        hooks: (brain.hooks as string[]) || [],
      },

      timeline: {
        date_display: (mechanics.date_display as string) || '',
        duration: (mechanics.duration as string) || '',
        affected_regions: (mechanics.affected_regions as string[]) || [],
        current_evidence: (mechanics.current_evidence as string) || '',
      },

      lore_drops: (mechanics.lore_drops as LoreDrop[]) || [],
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateBasic = (field: string, value: unknown): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateKnowledge = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      knowledge: { ...prev.knowledge, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateDmTruth = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      dm_truth: { ...prev.dm_truth, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateTimeline = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      timeline: { ...prev.timeline, [field]: value },
    }));
    setHasChanges(true);
  };

  // Lore Drop management
  const addLoreDrop = (): void => {
    setFormData((prev) => ({
      ...prev,
      lore_drops: [
        ...prev.lore_drops,
        {
          id: uuidv4(),
          trigger: '',
          delivery: '',
          text: '',
          reveal_level: 'public' as const,
        },
      ],
    }));
    setHasChanges(true);
  };

  const updateLoreDrop = (index: number, field: string, value: unknown): void => {
    setFormData((prev) => {
      const updated = [...prev.lore_drops];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, lore_drops: updated };
    });
    setHasChanges(true);
  };

  const removeLoreDrop = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      lore_drops: prev.lore_drops.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    const saveData = {
      name: formData.name,
      summary: formData.summary,
      sub_type: formData.sub_type,
      event_sort: formData.event_sort,
      event_era: formData.event_era || null,
      event_ongoing: formData.event_ongoing,

      soul: {
        common_knowledge: formData.knowledge.common_knowledge,
        scholarly_account: formData.knowledge.scholarly_account,
        folklore: formData.knowledge.folklore,
        propaganda: formData.knowledge.propaganda,
      },

      brain: {
        true_history: formData.dm_truth.true_history,
        hidden_causes: formData.dm_truth.hidden_causes,
        consequences: formData.dm_truth.consequences,
        secrets: formData.dm_truth.secrets,
        reveal_triggers: formData.dm_truth.reveal_triggers,
        hooks: formData.dm_truth.hooks,
      },

      mechanics: {
        date_display: formData.timeline.date_display,
        duration: formData.timeline.duration,
        affected_regions: formData.timeline.affected_regions,
        current_evidence: formData.timeline.current_evidence,
        lore_drops: formData.lore_drops,
      },
    };

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EventEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }
  };

  const tabs = [
    {
      id: 'basics',
      label: 'Basics',
      icon: <Calendar className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Event Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateBasic('name', e.target.value)}
              placeholder="The Sundering, Battle of Blackwater..."
            />
          </div>

          <div>
            <Label>Summary</Label>
            <Input
              value={formData.summary}
              onChange={(e) => updateBasic('summary', e.target.value)}
              placeholder="Brief one-line description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Type</Label>
              <Select
                value={formData.sub_type}
                onValueChange={(val) => updateBasic('sub_type', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_SUB_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Era / Age</Label>
              <Input
                value={formData.event_era}
                onChange={(e) => updateBasic('event_era', e.target.value)}
                placeholder="Age of Dragons, Modern Era..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Date Display
              </Label>
              <Input
                value={formData.timeline.date_display}
                onChange={(e) => updateTimeline('date_display', e.target.value)}
                placeholder="1247 DR, Third Moon of Summer..."
              />
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                value={formData.timeline.duration}
                onChange={(e) => updateTimeline('duration', e.target.value)}
                placeholder="3 days, 100 years..."
              />
            </div>
          </div>

          <div>
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={formData.event_sort}
              onChange={(e) => updateBasic('event_sort', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-slate-500 mt-1">
              Lower numbers appear first on timeline. Use negative numbers for ancient events.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Switch
              checked={formData.event_ongoing}
              onCheckedChange={(checked) => updateBasic('event_ongoing', checked)}
            />
            <div>
              <Label className="text-amber-400">Ongoing Event</Label>
              <p className="text-xs text-slate-400">Check if this event is still happening</p>
            </div>
          </div>

          <StringArrayInput
            label="Affected Regions"
            value={formData.timeline.affected_regions}
            onChange={(val) => updateTimeline('affected_regions', val)}
            placeholder="Add region (Sword Coast, Underdark)..."
          />
        </div>
      ),
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      icon: <BookOpen className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              Common Knowledge
            </Label>
            <Textarea
              value={formData.knowledge.common_knowledge}
              onChange={(e) => updateKnowledge('common_knowledge', e.target.value)}
              rows={4}
              placeholder="What does everyone know about this event?"
            />
            <p className="text-xs text-slate-500 mt-1">
              This is what any commoner would know
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Scroll className="w-4 h-4 text-blue-400" />
              Scholarly Account
            </Label>
            <Textarea
              value={formData.knowledge.scholarly_account}
              onChange={(e) => updateKnowledge('scholarly_account', e.target.value)}
              rows={4}
              placeholder="What do historians and sages say?"
            />
            <p className="text-xs text-slate-500 mt-1">
              Accessible via History checks or research
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Folklore Version
            </Label>
            <Textarea
              value={formData.knowledge.folklore}
              onChange={(e) => updateKnowledge('folklore', e.target.value)}
              rows={4}
              placeholder="How is this event remembered in songs and stories?"
            />
            <p className="text-xs text-slate-500 mt-1">
              The mythologized or legendary version
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Official / Propaganda Version
            </Label>
            <Textarea
              value={formData.knowledge.propaganda}
              onChange={(e) => updateKnowledge('propaganda', e.target.value)}
              rows={4}
              placeholder="What do authorities want people to believe?"
            />
            <p className="text-xs text-slate-500 mt-1">
              The version promoted by those in power
            </p>
          </div>

          <div>
            <Label>Current Evidence</Label>
            <Textarea
              value={formData.timeline.current_evidence}
              onChange={(e) => updateTimeline('current_evidence', e.target.value)}
              rows={3}
              placeholder="What physical traces or evidence of this event still exist?"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'dm_truth',
      label: 'DM Truth',
      icon: <EyeOff className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
            <p className="text-xs text-red-400">
              This section contains secrets only the DM knows
            </p>
          </div>

          <div>
            <Label className="text-red-400">True History</Label>
            <Textarea
              value={formData.dm_truth.true_history}
              onChange={(e) => updateDmTruth('true_history', e.target.value)}
              rows={4}
              placeholder="What really happened?"
            />
          </div>

          <div>
            <Label className="text-red-400">Hidden Causes</Label>
            <Textarea
              value={formData.dm_truth.hidden_causes}
              onChange={(e) => updateDmTruth('hidden_causes', e.target.value)}
              rows={3}
              placeholder="What secretly caused or triggered this event?"
            />
          </div>

          <div>
            <Label className="text-red-400">Consequences</Label>
            <Textarea
              value={formData.dm_truth.consequences}
              onChange={(e) => updateDmTruth('consequences', e.target.value)}
              rows={3}
              placeholder="What are the hidden ongoing effects?"
            />
          </div>

          <div>
            <Label className="text-red-400">Secrets</Label>
            <Textarea
              value={formData.dm_truth.secrets}
              onChange={(e) => updateDmTruth('secrets', e.target.value)}
              rows={3}
              placeholder="What dark truths are hidden?"
            />
          </div>

          <StringArrayInput
            label="Reveal Triggers"
            value={formData.dm_truth.reveal_triggers}
            onChange={(val) => updateDmTruth('reveal_triggers', val)}
            placeholder="Add trigger (DC 20 History check, Talk to elder dragon)..."
          />

          <StringArrayInput
            label="Plot Hooks"
            value={formData.dm_truth.hooks}
            onChange={(val) => updateDmTruth('hooks', val)}
            placeholder="Add adventure hook..."
          />
        </div>
      ),
    },
    {
      id: 'lore_drops',
      label: 'Lore Drops',
      icon: <MapPin className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-teal-400">Lore Drops</h3>
              <p className="text-xs text-slate-500">
                Pieces of information players can discover
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={addLoreDrop}
              className="border-teal-700 text-teal-400"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Lore Drop
            </Button>
          </div>

          {formData.lore_drops.length === 0 && (
            <div className="p-8 border border-dashed border-slate-700 rounded-lg text-center">
              <p className="text-slate-500">No lore drops yet</p>
              <p className="text-xs text-slate-600 mt-1">
                Add discoverable information about this event
              </p>
            </div>
          )}

          {formData.lore_drops.map((drop, index) => (
            <div
              key={drop.id}
              className={`p-4 rounded-lg border space-y-3 ${
                drop.reveal_level === 'dm_truth'
                  ? 'bg-red-500/5 border-red-500/30'
                  : drop.reveal_level === 'partial'
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">
                  Lore Drop #{index + 1}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeLoreDrop(index)}
                  className="text-red-400 h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trigger</Label>
                  <Input
                    value={drop.trigger}
                    onChange={(e) => updateLoreDrop(index, 'trigger', e.target.value)}
                    placeholder="DC 15 History, Visit library..."
                  />
                </div>
                <div>
                  <Label>Delivery</Label>
                  <Input
                    value={drop.delivery}
                    onChange={(e) => updateLoreDrop(index, 'delivery', e.target.value)}
                    placeholder="Old tome, Tavern gossip..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reveal Level</Label>
                  <Select
                    value={drop.reveal_level}
                    onValueChange={(val) => updateLoreDrop(index, 'reveal_level', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="dm_truth">DM Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>DC (Optional)</Label>
                  <Input
                    type="number"
                    value={drop.dc || ''}
                    onChange={(e) => updateLoreDrop(index, 'dc', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="15"
                  />
                </div>
              </div>

              <div>
                <Label>Text (Read Aloud)</Label>
                <Textarea
                  value={drop.text}
                  onChange={(e) => updateLoreDrop(index, 'text', e.target.value)}
                  rows={3}
                  placeholder="The actual lore content to share with players..."
                />
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <EditEntityShell
      entity={entity}
      campaignId={campaignId}
      onSave={handleSave}
      title={`Edit Event: ${entity.name}`}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} defaultTab="basics" />
    </EditEntityShell>
  );
}
