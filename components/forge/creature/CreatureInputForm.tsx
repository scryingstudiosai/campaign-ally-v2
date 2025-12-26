'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Dices, Search, X } from 'lucide-react';
import type { PreValidationResult, BaseForgeInput } from '@/types/forge';
import { PreValidationAlert } from '@/components/forge/PreValidationAlert';
import { QuickReference } from '@/components/forge/QuickReference';
import { SrdLookupPopover } from '@/components/srd';
import type { SrdCreature } from '@/types/srd';
import { toast } from 'sonner';
import {
  CREATURE_TYPES,
  CREATURE_SIZES,
  CHALLENGE_RATINGS,
  ENVIRONMENTS,
} from '@/lib/forge/prompts/creature-prompts';

export interface CreatureInputData extends BaseForgeInput {
  name?: string;
  concept: string;
  creatureType: string;
  size: string;
  challengeRating: string;
  environment: string[];
  basedOnSrdSlug?: string;
  basedOnSrdName?: string;
  referencedEntityIds?: string[];
}

interface CreatureInputFormProps {
  onSubmit: (data: CreatureInputData) => void;
  isLocked: boolean;
  preValidation?: PreValidationResult | null;
  onProceedAnyway?: () => void;
  onDismissValidation?: () => void;
  campaignId: string;
  initialValues?: {
    name?: string;
    concept?: string;
  };
}

const CONCEPT_SEEDS = [
  'elemental variant of a common beast',
  'corrupted by dark magic',
  'guardian of an ancient ruin',
  'pack hunter that uses teamwork',
  'ambush predator that mimics objects',
  'undead version with spectral abilities',
  'construct created by a mad wizard',
  'hybrid of two creatures',
  'intelligent beast that can speak',
  'creature that phases between planes',
  'parasitic creature that controls hosts',
  'swarm intelligence hive creature',
  'creature that feeds on emotions',
  'beast blessed by a nature deity',
  'prehistoric creature awakened from stasis',
];

export function CreatureInputForm({
  onSubmit,
  isLocked,
  preValidation,
  onProceedAnyway,
  onDismissValidation,
  campaignId,
  initialValues,
}: CreatureInputFormProps): JSX.Element {
  const [name, setName] = useState(initialValues?.name || '');
  const [concept, setConcept] = useState(initialValues?.concept || '');
  const [creatureType, setCreatureType] = useState('let_ai_decide');
  const [size, setSize] = useState('let_ai_decide');
  const [challengeRating, setChallengeRating] = useState('let_ai_decide');
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);

  // SRD base creature
  const [basedOnSrd, setBasedOnSrd] = useState<{ slug: string; name: string } | null>(null);

  // Context tracking (for Quick Reference)
  const [referencedEntities, setReferencedEntities] = useState<{ id: string; name: string }[]>([]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!concept.trim() && !basedOnSrd) return;

    onSubmit({
      name: name.trim() || undefined,
      concept: concept.trim(),
      creatureType: creatureType === 'let_ai_decide' ? '' : creatureType,
      size: size === 'let_ai_decide' ? '' : size,
      challengeRating: challengeRating === 'let_ai_decide' ? '' : challengeRating,
      environment: selectedEnvironments,
      basedOnSrdSlug: basedOnSrd?.slug,
      basedOnSrdName: basedOnSrd?.name,
      referencedEntityIds: referencedEntities.map((e) => e.id),
    });
  };

  const randomizeConcept = (): void => {
    const randomSeed = CONCEPT_SEEDS[Math.floor(Math.random() * CONCEPT_SEEDS.length)];
    setConcept(randomSeed);
  };

  const randomizeType = (): void => {
    const types = CREATURE_TYPES.filter((t) => t !== 'let_ai_decide');
    const randomType = types[Math.floor(Math.random() * types.length)];
    setCreatureType(randomType);
  };

  const randomizeCR = (): void => {
    // Bias toward lower CRs
    const weights = CHALLENGE_RATINGS.map((cr, i) => Math.max(1, CHALLENGE_RATINGS.length - i));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < CHALLENGE_RATINGS.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        setChallengeRating(CHALLENGE_RATINGS[i]);
        return;
      }
    }
    setChallengeRating(CHALLENGE_RATINGS[0]);
  };

  const toggleEnvironment = (env: string): void => {
    setSelectedEnvironments((prev) =>
      prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env]
    );
  };

  // Handle SRD creature selection
  const handleSrdCreatureSelect = (creature: SrdCreature): void => {
    setBasedOnSrd({ slug: creature.slug, name: creature.name });

    // Auto-set type, size, and CR from the SRD creature
    if (creature.creature_type) {
      const normalizedType = creature.creature_type.toLowerCase().split(' ')[0];
      if (CREATURE_TYPES.includes(normalizedType as typeof CREATURE_TYPES[number])) {
        setCreatureType(normalizedType);
      }
    }
    if (creature.size) {
      setSize(creature.size);
    }
    if (creature.cr) {
      setChallengeRating(creature.cr);
    }

    toast.success(`Using ${creature.name} as base creature`);
  };

  const clearSrdBase = (): void => {
    setBasedOnSrd(null);
  };

  const isValid = concept.trim() || basedOnSrd;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pre-validation alert */}
      {preValidation &&
        (preValidation.conflicts.length > 0 || preValidation.warnings.length > 0) && (
          <PreValidationAlert
            result={preValidation}
            onProceedAnyway={onProceedAnyway || (() => {})}
            onDismiss={onDismissValidation || (() => {})}
          />
        )}

      {/* SRD Base Creature */}
      <div className="space-y-2">
        <Label>Base on SRD Creature (Optional)</Label>
        {basedOnSrd ? (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-rose-500/10 border-rose-500/30">
            <div>
              <span className="font-medium text-rose-400">{basedOnSrd.name}</span>
              <p className="text-xs text-slate-400 mt-1">
                The AI will use this creature&apos;s stats as a starting point for your variant
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSrdBase}
              disabled={isLocked}
              className="text-slate-400 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div>
            <SrdLookupPopover
              types={['creatures']}
              campaignId={campaignId}
              onSelectCreature={handleSrdCreatureSelect}
              triggerLabel="Search SRD Creatures"
              placeholder="Search for creatures by name..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Start from an existing D&D 5e SRD creature and modify it
            </p>
          </div>
        )}
      </div>

      {/* Concept - Primary guidance for AI */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="concept">
            {basedOnSrd ? 'Modifications / Variant Concept' : 'Creature Concept'}{' '}
            {!basedOnSrd && <span className="text-destructive">*</span>}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={randomizeConcept}
            disabled={isLocked}
            className="h-6 px-2 text-xs text-primary hover:text-primary/80"
          >
            <Dices className="w-3 h-3 mr-1" />
            Surprise me
          </Button>
        </div>
        <Textarea
          id="concept"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder={
            basedOnSrd
              ? `Describe how to modify the ${basedOnSrd.name}...`
              : 'e.g., "A pack-hunting reptile that can camouflage in rocky terrain..."'
          }
          rows={3}
          required={!basedOnSrd}
          disabled={isLocked}
        />
        <p className="text-xs text-muted-foreground">
          {basedOnSrd
            ? 'Describe what makes your variant unique - element changes, mutations, abilities...'
            : "Describe the creature's nature, behavior, and what makes it unique"}
        </p>

        {/* Quick Reference */}
        <QuickReference
          campaignId={campaignId}
          onSelect={(name, entityId) => {
            setConcept((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + name);
            setReferencedEntities((prev) =>
              prev.some((e) => e.id === entityId) ? prev : [...prev, { id: entityId, name }]
            );
          }}
        />

        {/* Show referenced entities */}
        {referencedEntities.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-800/30 rounded-lg border border-slate-700 mt-2">
            <span className="text-xs text-slate-500">Context from:</span>
            {referencedEntities.map((entity) => (
              <span
                key={entity.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300"
              >
                {entity.name}
                <button
                  type="button"
                  onClick={() =>
                    setReferencedEntities((prev) => prev.filter((e) => e.id !== entity.id))
                  }
                  className="text-slate-500 hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name (optional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leave blank to auto-generate"
            disabled={isLocked}
          />
        </div>

        {/* Creature Type */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="creature-type">Creature Type</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={randomizeType}
              disabled={isLocked}
              className="h-6 px-2 text-xs"
            >
              <Dices className="w-3 h-3" />
            </Button>
          </div>
          <Select value={creatureType} onValueChange={setCreatureType} disabled={isLocked}>
            <SelectTrigger id="creature-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="let_ai_decide">Let AI decide</SelectItem>
              {CREATURE_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Select value={size} onValueChange={setSize} disabled={isLocked}>
            <SelectTrigger id="size">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="let_ai_decide">Let AI decide</SelectItem>
              {CREATURE_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Challenge Rating */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="cr">Challenge Rating</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={randomizeCR}
              disabled={isLocked}
              className="h-6 px-2 text-xs"
            >
              <Dices className="w-3 h-3" />
            </Button>
          </div>
          <Select value={challengeRating} onValueChange={setChallengeRating} disabled={isLocked}>
            <SelectTrigger id="cr">
              <SelectValue placeholder="Select CR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="let_ai_decide">Let AI decide</SelectItem>
              {CHALLENGE_RATINGS.map((cr) => (
                <SelectItem key={cr} value={cr}>
                  CR {cr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Environment */}
      <div className="space-y-2">
        <Label>Environment (optional, multi-select)</Label>
        <div className="flex flex-wrap gap-2">
          {ENVIRONMENTS.map((env) => (
            <Badge
              key={env}
              variant={selectedEnvironments.includes(env) ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                selectedEnvironments.includes(env)
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'hover:bg-slate-700'
              }`}
              onClick={() => !isLocked && toggleEnvironment(env)}
            >
              {env}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Select environments where this creature is typically found
        </p>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={!isValid || isLocked} className="w-full" size="lg">
        {isLocked ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Forging Creature...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Creature
          </>
        )}
      </Button>
    </form>
  );
}
