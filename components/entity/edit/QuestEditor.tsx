'use client';

import { useState } from 'react';
import { EditEntityShell } from './EditEntityShell';
import { TabbedFormLayout } from '@/components/form-widgets/TabbedFormLayout';
import { StringArrayInput } from '@/components/form-widgets/StringArrayInput';
import { ObjectivesEditor, type Objective } from '@/components/form-widgets/ObjectivesEditor';
import { RewardsEditor, type QuestRewards } from '@/components/form-widgets/RewardsEditor';
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
import { Scroll, Target, Brain, Wrench } from 'lucide-react';

interface QuestEditorProps {
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

export function QuestEditor({ entity, campaignId }: QuestEditorProps): JSX.Element {
  const [formData, setFormData] = useState({
    // Basic Info
    name: entity.name || '',
    summary: entity.summary || '',

    // Soul (Player-facing)
    soul: {
      hook: (entity.soul?.hook as string) || '',
      stakes: (entity.soul?.stakes as string) || '',
      timeline: (entity.soul?.timeline as string) || '',
      ...(entity.soul || {}),
    },

    // Brain (DM-only)
    brain: {
      true_background: (entity.brain?.true_background as string) || '',
      secret: (entity.brain?.secret as string) || '',
      twists: (entity.brain?.twists as string[]) || [],
      failure_consequences: (entity.brain?.failure_consequences as string) || '',
      ...(entity.brain || {}),
    },

    // Mechanics
    mechanics: {
      quest_type: (entity.mechanics?.quest_type as string) || 'side_quest',
      difficulty: (entity.mechanics?.difficulty as string) || 'medium',
      recommended_level: (entity.mechanics?.recommended_level as number) || 5,
      estimated_sessions: (entity.mechanics?.estimated_sessions as number) || 1,
      objectives: (entity.mechanics?.objectives as Objective[]) || [],
      rewards: (entity.mechanics?.rewards as QuestRewards) || {
        gold: 0,
        xp: 0,
        items: [],
        special: '',
      },
      ...(entity.mechanics || {}),
    },
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async (): Promise<void> => {
    console.log('[QuestEditor] Preparing save data...');

    const saveData = {
      name: formData.name,
      summary: formData.summary,
      soul: formData.soul,
      brain: formData.brain,
      mechanics: formData.mechanics,
    };

    console.log('[QuestEditor] Save data:', saveData);

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[QuestEditor] Save failed:', errorText);
      throw new Error(`Save failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[QuestEditor] Saved successfully:', result.id);
  };

  // Helper updaters
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

  // Define tabs
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Scroll className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 mb-4">
            Player-facing quest information - what they see in their quest log.
          </p>

          <div>
            <Label>Quest Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateBasic('name', e.target.value)}
              placeholder="The Lost Artifact"
            />
          </div>

          <div>
            <Label>Summary</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => updateBasic('summary', e.target.value)}
              rows={2}
              placeholder="One-line quest log entry..."
            />
            <p className="text-xs text-slate-500 mt-1">
              What appears in the player&apos;s quest log
            </p>
          </div>

          <div>
            <Label>Hook</Label>
            <Textarea
              value={formData.soul.hook}
              onChange={(e) => updateSoul('hook', e.target.value)}
              rows={3}
              placeholder="How players discover this quest..."
            />
            <p className="text-xs text-slate-500 mt-1">
              The call to adventure - what draws the party in
            </p>
          </div>

          <div>
            <Label className="text-amber-400">Stakes</Label>
            <Textarea
              value={formData.soul.stakes}
              onChange={(e) => updateSoul('stakes', e.target.value)}
              rows={2}
              placeholder="What happens if they fail or ignore this quest..."
              className="border-amber-700/50"
            />
            <p className="text-xs text-slate-500 mt-1">
              Why this matters - consequences of inaction
            </p>
          </div>

          <div>
            <Label>Timeline</Label>
            <Input
              value={formData.soul.timeline}
              onChange={(e) => updateSoul('timeline', e.target.value)}
              placeholder="3 days until the ritual, before the next full moon..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Any time pressure or deadlines
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'objectives',
      label: 'Objectives',
      icon: <Target className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 mb-4">
            Quest steps and goals. Mark objectives as required, optional, or hidden (secret objectives).
          </p>

          <ObjectivesEditor
            value={formData.mechanics.objectives}
            onChange={(objectives) => updateMechanics('objectives', objectives)}
          />

          {/* Future: Link objectives to locations/NPCs */}
          {/* TODO: Add entity linking capability for objectives */}
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
            DM-only information - the truth behind the quest.
          </p>

          <div>
            <Label>True Background</Label>
            <Textarea
              value={formData.brain.true_background}
              onChange={(e) => updateBrain('true_background', e.target.value)}
              rows={3}
              placeholder="What's REALLY going on behind the scenes..."
            />
            <p className="text-xs text-slate-500 mt-1">
              The full story the players don&apos;t know yet
            </p>
          </div>

          <div>
            <Label className="text-amber-400">Secret</Label>
            <Textarea
              value={formData.brain.secret}
              onChange={(e) => updateBrain('secret', e.target.value)}
              rows={2}
              placeholder="The twist the players haven't discovered..."
              className="border-amber-700/50 bg-amber-950/20"
            />
          </div>

          <StringArrayInput
            label="Potential Twists"
            value={formData.brain.twists}
            onChange={(val) => updateBrain('twists', val)}
            placeholder="Add a plot twist..."
          />

          <div>
            <Label className="text-red-400">Failure Consequences</Label>
            <Textarea
              value={formData.brain.failure_consequences}
              onChange={(e) => updateBrain('failure_consequences', e.target.value)}
              rows={3}
              placeholder="What happens to the world if the party fails..."
              className="border-red-900/50"
            />
            <p className="text-xs text-slate-500 mt-1">
              Concrete outcomes if the quest fails or is abandoned
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'mechanics',
      label: 'Mechanics',
      icon: <Wrench className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <p className="text-xs text-slate-500 mb-4">
            Game mechanics - quest classification, difficulty, and rewards.
          </p>

          {/* Quest Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quest Type</Label>
              <Select
                value={formData.mechanics.quest_type}
                onValueChange={(val) => updateMechanics('quest_type', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main_quest">Main Quest</SelectItem>
                  <SelectItem value="side_quest">Side Quest</SelectItem>
                  <SelectItem value="personal_quest">Personal Quest</SelectItem>
                  <SelectItem value="faction_quest">Faction Quest</SelectItem>
                  <SelectItem value="bounty">Bounty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select
                value={formData.mechanics.difficulty}
                onValueChange={(val) => updateMechanics('difficulty', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trivial">Trivial</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="deadly">Deadly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Recommended Level</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formData.mechanics.recommended_level}
                onChange={(e) =>
                  updateMechanics('recommended_level', parseInt(e.target.value) || 1)
                }
              />
              <p className="text-xs text-slate-500 mt-1">Party level suggestion</p>
            </div>

            <div>
              <Label>Estimated Sessions</Label>
              <Input
                type="number"
                min={1}
                value={formData.mechanics.estimated_sessions}
                onChange={(e) =>
                  updateMechanics('estimated_sessions', parseInt(e.target.value) || 1)
                }
              />
              <p className="text-xs text-slate-500 mt-1">How long to complete</p>
            </div>
          </div>

          {/* Rewards Section */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <RewardsEditor
              value={formData.mechanics.rewards}
              onChange={(rewards) => updateMechanics('rewards', rewards)}
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
      title={`Edit Quest: ${entity.name}`}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
    >
      <TabbedFormLayout tabs={tabs} defaultTab="overview" />
    </EditEntityShell>
  );
}
