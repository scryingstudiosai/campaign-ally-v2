'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, MapPin, Package, Skull, Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuickForgePanelProps {
  campaignId: string;
  onForged?: (entity: Record<string, unknown>) => void;
}

const FORGE_OPTIONS = [
  {
    type: 'npc',
    label: 'Quick NPC',
    icon: Users,
    color: 'bg-blue-600 hover:bg-blue-700',
    placeholder: 'A mysterious merchant with a secret...',
  },
  {
    type: 'location',
    label: 'Quick Location',
    icon: MapPin,
    color: 'bg-green-600 hover:bg-green-700',
    placeholder: 'A hidden grove with ancient ruins...',
  },
  {
    type: 'item',
    label: 'Quick Item',
    icon: Package,
    color: 'bg-amber-600 hover:bg-amber-700',
    placeholder: 'A cursed sword that whispers...',
  },
  {
    type: 'creature',
    label: 'Quick Creature',
    icon: Skull,
    color: 'bg-red-600 hover:bg-red-700',
    placeholder: 'A pack of dire wolves hunting...',
  },
];

export function QuickForgePanel({ campaignId, onForged }: QuickForgePanelProps) {
  const [isForging, setIsForging] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleOpenForge = (type: string) => {
    setSelectedType(type);
    setPrompt('');
    setError(null);
    setShowDialog(true);
  };

  const handleQuickForge = async () => {
    if (!selectedType || !prompt.trim()) return;

    setIsForging(selectedType);
    setError(null);

    try {
      let response;
      let newEntity;

      if (selectedType === 'npc') {
        // Use existing NPC generation API
        response = await fetch('/api/generate/npc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            inputs: {
              concept: prompt.trim(),
              combatRole: 'non-combatant',
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate NPC');
        }

        const data = await response.json();

        // Save the NPC to the database
        const saveResponse = await fetch('/api/entities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            forgeType: 'npc',
            output: data.npc,
          }),
        });

        if (!saveResponse.ok) {
          const saveError = await saveResponse.json();
          throw new Error(saveError.error || 'Failed to save NPC');
        }

        newEntity = await saveResponse.json();
      } else {
        // For other types, create a stub entity that can be expanded later
        // Extract a reasonable name from the prompt (first few words, capitalized)
        const words = prompt.trim().split(/\s+/);
        let name = words.slice(0, 3).join(' ');
        // Capitalize first letter of each word
        name = name.replace(/\b\w/g, c => c.toUpperCase());

        response = await fetch('/api/entities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            entity: {
              name,
              entity_type: selectedType,
              summary: prompt.trim(),
              forge_status: 'stub',
              attributes: {
                is_stub: true,
                needs_review: true,
                quick_forge_prompt: prompt.trim(),
              },
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to create ${selectedType}`);
        }

        newEntity = await response.json();
      }

      // Notify parent
      onForged?.(newEntity);

      // Close dialog
      setShowDialog(false);
      setPrompt('');

      // Dispatch event to add to live log
      window.dispatchEvent(new CustomEvent('session-forge-complete', {
        detail: {
          entity: newEntity,
          message: `Forged new ${selectedType}: ${newEntity.name}`,
        },
      }));
    } catch (err) {
      console.error('Quick forge error:', err);
      setError(err instanceof Error ? err.message : 'Failed to forge entity');
    }

    setIsForging(null);
  };

  const selectedOption = FORGE_OPTIONS.find(o => o.type === selectedType);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
        Quick Forge
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {FORGE_OPTIONS.map(({ type, label, icon: Icon, color }) => (
          <Button
            key={type}
            onClick={() => handleOpenForge(type)}
            disabled={isForging !== null}
            className={`h-20 flex-col gap-2 ${color}`}
          >
            {isForging === type ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Icon className="w-6 h-6" />
            )}
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-4 text-center">
        Instantly generate entities during gameplay
      </p>

      {/* Forge Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              Quick Forge {selectedType?.toUpperCase()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Describe what you need:
              </label>
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={selectedOption?.placeholder}
                className="bg-slate-800 border-slate-600"
                onKeyDown={(e) => e.key === 'Enter' && !isForging && handleQuickForge()}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button
              onClick={handleQuickForge}
              disabled={!prompt.trim() || isForging !== null}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {isForging ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Forging...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Forge {selectedType}
                </>
              )}
            </Button>

            {selectedType === 'npc' && (
              <p className="text-xs text-slate-500 text-center">
                NPCs are fully generated with personality, voice, and stats
              </p>
            )}
            {selectedType !== 'npc' && (
              <p className="text-xs text-slate-500 text-center">
                Creates a stub entity you can expand later in the Forge
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
