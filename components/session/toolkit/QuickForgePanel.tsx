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
    generateApi: '/api/generate/npc',
    inputKey: 'concept',
  },
  {
    type: 'location',
    label: 'Quick Location',
    icon: MapPin,
    color: 'bg-green-600 hover:bg-green-700',
    placeholder: 'A hidden grove with ancient ruins...',
    generateApi: '/api/generate/location',
    inputKey: 'concept',
  },
  {
    type: 'item',
    label: 'Quick Item',
    icon: Package,
    color: 'bg-amber-600 hover:bg-amber-700',
    placeholder: 'A cursed sword that whispers...',
    generateApi: '/api/generate/item',
    inputKey: 'concept',
  },
  {
    type: 'creature',
    label: 'Quick Creature',
    icon: Skull,
    color: 'bg-red-600 hover:bg-red-700',
    placeholder: 'A pack of dire wolves hunting...',
    generateApi: '/api/generate/creature',
    inputKey: 'concept',
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

    const option = FORGE_OPTIONS.find(o => o.type === selectedType);
    if (!option) return;

    try {
      // Build inputs based on entity type
      const inputs: Record<string, unknown> = {
        [option.inputKey]: prompt.trim(),
      };

      // Add type-specific defaults
      if (selectedType === 'npc') {
        inputs.combatRole = 'non-combatant';
      } else if (selectedType === 'location') {
        inputs.locationType = 'building';
      } else if (selectedType === 'item') {
        inputs.itemType = 'wondrous';
      } else if (selectedType === 'creature') {
        inputs.creatureType = 'beast';
        inputs.challengeRating = '1';
      }

      // Call the generation API
      const response = await fetch(option.generateApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          inputs,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Failed to generate ${selectedType}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Extract the generated content (different APIs return different keys)
      const generatedContent = data.npc || data.location || data.item || data.creature || data;

      // Save to the database
      const saveResponse = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          forgeType: selectedType,
          output: generatedContent,
        }),
      });

      if (!saveResponse.ok) {
        const text = await saveResponse.text();
        let errorMessage = `Failed to save ${selectedType}`;
        try {
          const saveError = JSON.parse(text);
          errorMessage = saveError.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const newEntity = await saveResponse.json();

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
        AI-powered entity generation
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

            <p className="text-xs text-slate-500 text-center">
              AI generates a complete {selectedType} with full details
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
