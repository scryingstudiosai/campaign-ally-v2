'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, MapPin, Package, Skull, Loader2, Sparkles,
  CheckCircle, ExternalLink, Swords, Search, BookOpen
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import type { SrdCreature } from '@/types/srd';

interface QuickForgePanelProps {
  campaignId: string;
  onForged?: (entity: ForgedEntity) => void;
}

interface ForgedEntity {
  id: string;
  name: string;
  summary?: string;
  entity_type?: string;
}

const FORGE_OPTIONS = [
  { type: 'creature', label: 'Creature', icon: Skull, color: 'bg-red-600 hover:bg-red-700', hasSRD: true },
  { type: 'encounter', label: 'Encounter', icon: Swords, color: 'bg-orange-600 hover:bg-orange-700', hasSRD: false },
  { type: 'npc', label: 'NPC', icon: Users, color: 'bg-blue-600 hover:bg-blue-700', hasSRD: false },
  { type: 'location', label: 'Location', icon: MapPin, color: 'bg-green-600 hover:bg-green-700', hasSRD: false },
  { type: 'item', label: 'Item', icon: Package, color: 'bg-amber-600 hover:bg-amber-700', hasSRD: false },
];

export function QuickForgePanel({ campaignId, onForged }: QuickForgePanelProps) {
  const [isForging, setIsForging] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [forgedEntity, setForgedEntity] = useState<ForgedEntity | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // SRD state
  const [srdCreatures, setSrdCreatures] = useState<SrdCreature[]>([]);
  const [srdSearch, setSrdSearch] = useState('');
  const [isLoadingSRD, setIsLoadingSRD] = useState(false);
  const [creatureMode, setCreatureMode] = useState<'generate' | 'srd'>('generate');

  // Search SRD creatures when search query changes
  useEffect(() => {
    if (creatureMode !== 'srd' || srdSearch.length < 2) {
      if (srdSearch.length < 2) setSrdCreatures([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoadingSRD(true);
      try {
        const response = await fetch(`/api/srd/search?q=${encodeURIComponent(srdSearch)}&types=creatures&limit=30`);
        if (response.ok) {
          const data = await response.json();
          setSrdCreatures(data.creatures || []);
        }
      } catch (error) {
        console.error('Failed to search SRD creatures:', error);
      }
      setIsLoadingSRD(false);
    }, 300); // Debounce

    return () => clearTimeout(searchTimeout);
  }, [srdSearch, creatureMode]);

  const handleOpenForge = (type: string) => {
    setSelectedType(type);
    setPrompt('');
    setSrdSearch('');
    setSrdCreatures([]);
    setError(null);
    setForgedEntity(null);
    setShowSuccess(false);
    setCreatureMode('generate');
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

      setForgedEntity(newEntity);
      setShowSuccess(true);
      onForged?.(newEntity);

    } catch (err) {
      console.error('Quick forge error:', err);
      setError(err instanceof Error ? err.message : 'Failed to forge entity');
    }

    setIsForging(null);
  };

  const handleImportSRD = async (creature: SrdCreature) => {
    setIsForging('srd');
    setError(null);

    try {
      // Use the existing add-to-memory API
      const response = await fetch('/api/srd/add-to-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srdEntity: creature,
          campaignId,
          srdType: 'creature',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to import creature');
      }

      const newEntity = await response.json();

      setForgedEntity(newEntity);
      setShowSuccess(true);
      onForged?.(newEntity);

    } catch (err) {
      console.error('SRD import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import creature');
    }

    setIsForging(null);
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setForgedEntity(null);
    setPrompt('');
    setSrdSearch('');
    setSrdCreatures([]);
  };

  const handleClose = () => {
    setShowDialog(false);
    setShowSuccess(false);
    setForgedEntity(null);
    setPrompt('');
    setSrdSearch('');
    setSrdCreatures([]);
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
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
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
          ) : selectedType === 'creature' ? (
            // CREATURE MODE - Tabs for Generate vs SRD
            <Tabs value={creatureMode} onValueChange={(v) => setCreatureMode(v as 'generate' | 'srd')}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="generate" className="text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  Generate New
                </TabsTrigger>
                <TabsTrigger value="srd" className="text-xs gap-1">
                  <BookOpen className="w-3 h-3" />
                  SRD Monster
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">
                    Describe the creature:
                  </label>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A pack of dire wolves hunting in the snow..."
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
                      Generate Creature
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="srd" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={srdSearch}
                    onChange={(e) => setSrdSearch(e.target.value)}
                    placeholder="Search monsters (goblin, dragon, wolf...)"
                    className="pl-10 bg-slate-800 border-slate-600"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded">{error}</p>
                )}

                <div className="h-64 border border-slate-700 rounded-lg overflow-y-auto">
                  {isLoadingSRD ? (
                    <div className="flex items-center justify-center py-8 text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Searching...
                    </div>
                  ) : srdCreatures.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      {srdSearch.length < 2 ? 'Type at least 2 characters to search' : 'No monsters found'}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {srdCreatures.map(creature => (
                        <button
                          key={creature.id}
                          onClick={() => handleImportSRD(creature)}
                          disabled={isForging === 'srd'}
                          className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800 transition-colors text-left disabled:opacity-50"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-slate-200 truncate">{creature.name}</p>
                            <p className="text-xs text-slate-500">
                              {creature.size} {creature.creature_type}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-300">
                              CR {creature.cr}
                            </span>
                            <span className="text-xs text-slate-500">
                              HP {creature.hp}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isForging === 'srd' && (
                  <div className="flex items-center justify-center gap-2 text-teal-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing creature...
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            // OTHER ENTITY TYPES - Standard Generate
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
