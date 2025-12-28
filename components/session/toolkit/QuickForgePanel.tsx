'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, MapPin, Package, Skull, Loader2, Sparkles,
  CheckCircle, ExternalLink, Swords
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

interface QuickForgePanelProps {
  campaignId: string;
  onForged?: (entity: any) => void;
}

const FORGE_OPTIONS = [
  { type: 'creature', label: 'Creature', icon: Skull, color: 'bg-red-600 hover:bg-red-700' },
  { type: 'encounter', label: 'Encounter', icon: Swords, color: 'bg-orange-600 hover:bg-orange-700' },
  { type: 'npc', label: 'NPC', icon: Users, color: 'bg-blue-600 hover:bg-blue-700' },
  { type: 'location', label: 'Location', icon: MapPin, color: 'bg-green-600 hover:bg-green-700' },
  { type: 'item', label: 'Item', icon: Package, color: 'bg-amber-600 hover:bg-amber-700' },
];

export function QuickForgePanel({ campaignId, onForged }: QuickForgePanelProps) {
  const [isForging, setIsForging] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [forgedEntity, setForgedEntity] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleOpenForge = (type: string) => {
    setSelectedType(type);
    setPrompt('');
    setError(null);
    setForgedEntity(null);
    setShowSuccess(false);
    setShowDialog(true);
  };

  const handleQuickForge = async () => {
    if (!selectedType || !prompt.trim()) return;

    setIsForging(selectedType);
    setError(null);

    try {
      const response = await fetch('/api/forge/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          entityType: selectedType,
          prompt: prompt.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Forge failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) throw new Error('Empty response from server');

      const newEntity = JSON.parse(text);

      // Show success state
      setForgedEntity(newEntity);
      setShowSuccess(true);

      // Notify parent to refresh library
      onForged?.(newEntity);

    } catch (err: any) {
      console.error('Quick forge error:', err);
      setError(err.message || 'Failed to forge entity');
    }

    setIsForging(null);
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setForgedEntity(null);
    setPrompt('');
  };

  const handleClose = () => {
    setShowDialog(false);
    setShowSuccess(false);
    setForgedEntity(null);
    setPrompt('');
    setError(null);
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
            className={`h-16 flex-col gap-1 ${color}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-4 text-center">
        Instantly generate content during gameplay
      </p>

      {/* Forge Dialog */}
      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOption && <selectedOption.icon className="w-5 h-5 text-teal-400" />}
              Quick Forge {selectedOption?.label}
            </DialogTitle>
          </DialogHeader>

          {showSuccess && forgedEntity ? (
            // SUCCESS STATE
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-green-300 font-medium">Created Successfully!</p>
                  <p className="text-xl text-white font-bold truncate mt-1">{forgedEntity.name}</p>
                  {forgedEntity.summary && (
                    <p className="text-sm text-slate-400 mt-2 line-clamp-3">{forgedEntity.summary}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/campaigns/${campaignId}/memory/${forgedEntity.id}`}
                  target="_blank"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full border-slate-600">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                <Button
                  onClick={handleCreateAnother}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Another
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={handleClose}
                className="w-full text-slate-400"
              >
                Done
              </Button>
            </div>
          ) : (
            // INPUT STATE
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Describe what you need:
                </label>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    selectedType === 'npc' ? 'A mysterious merchant with a secret...' :
                    selectedType === 'location' ? 'A hidden grove with ancient ruins...' :
                    selectedType === 'item' ? 'A cursed sword that whispers...' :
                    selectedType === 'creature' ? 'A pack of dire wolves hunting...' :
                    selectedType === 'encounter' ? '3 goblins ambush from the trees, medium difficulty...' :
                    'Describe what you want to create...'
                  }
                  className="bg-slate-800 border-slate-600"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleQuickForge()}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded">{error}</p>
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
                    Forge {selectedOption?.label}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
