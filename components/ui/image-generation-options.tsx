'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Settings2, Sparkles } from 'lucide-react';
import {
  ART_STYLES,
  LIGHTING_STYLES,
  COMPOSITION_STYLES,
  getDefaultStylesForEntityType,
  type ImageStyle,
} from '@/lib/image-generation/styles';

export interface ImageGenerationStyles {
  artStyle: string;
  lightingStyle: string;
  compositionStyle: string;
}

interface ImageGenerationOptionsProps {
  value: ImageGenerationStyles;
  onChange: (styles: ImageGenerationStyles) => void;
  entityType?: string;
  compact?: boolean;
  className?: string;
}

function StyleButton({
  style,
  isSelected,
  onClick,
}: {
  style: ImageStyle;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs rounded-md border transition-all',
        isSelected
          ? 'bg-teal-600/30 border-teal-500 text-teal-300'
          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
      )}
    >
      {style.name}
    </button>
  );
}

function StyleSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ImageStyle[];
  onChange: (value: string) => void;
}) {
  const selectedStyle = options.find(s => s.id === value);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-400">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-slate-800 border-slate-700 h-9">
          <SelectValue>
            {selectedStyle?.name || 'Select...'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          {options.map((style) => (
            <SelectItem
              key={style.id}
              value={style.id}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span>{style.name}</span>
                <span className="text-xs text-slate-500">{style.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ImageGenerationOptions({
  value,
  onChange,
  entityType,
  compact = false,
  className,
}: ImageGenerationOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Reset to defaults when entity type changes
  useEffect(() => {
    if (entityType) {
      const defaults = getDefaultStylesForEntityType(entityType);
      onChange(defaults);
    }
  }, [entityType]);

  const updateStyle = (key: keyof ImageGenerationStyles, styleValue: string) => {
    onChange({ ...value, [key]: styleValue });
  };

  const resetToDefaults = () => {
    const defaults = getDefaultStylesForEntityType(entityType);
    onChange(defaults);
  };

  const selectedArtStyle = ART_STYLES.find(s => s.id === value.artStyle);

  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between h-8 px-2 text-xs text-slate-400 hover:text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              Style: {selectedArtStyle?.name || 'Default'}
            </span>
            <ChevronDown className={cn(
              'h-3.5 w-3.5 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          <StyleSelect
            label="Art Style"
            value={value.artStyle}
            options={ART_STYLES}
            onChange={(v) => updateStyle('artStyle', v)}
          />
          <StyleSelect
            label="Lighting"
            value={value.lightingStyle}
            options={LIGHTING_STYLES}
            onChange={(v) => updateStyle('lightingStyle', v)}
          />
          <StyleSelect
            label="Composition"
            value={value.compositionStyle}
            options={COMPOSITION_STYLES}
            onChange={(v) => updateStyle('compositionStyle', v)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-xs text-slate-500 hover:text-slate-400"
            onClick={resetToDefaults}
          >
            Reset to defaults
          </Button>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Full expanded view
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-teal-400" />
          <span className="text-sm font-medium text-slate-300">Image Style</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-slate-500 hover:text-slate-400"
          onClick={resetToDefaults}
        >
          Reset
        </Button>
      </div>

      {/* Art Style - Primary Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-400">Art Style</Label>
        <div className="flex flex-wrap gap-2">
          {ART_STYLES.map((style) => (
            <StyleButton
              key={style.id}
              style={style}
              isSelected={value.artStyle === style.id}
              onClick={() => updateStyle('artStyle', style.id)}
            />
          ))}
        </div>
        {selectedArtStyle && (
          <p className="text-xs text-slate-500 italic">
            {selectedArtStyle.description}
          </p>
        )}
      </div>

      {/* Secondary Options */}
      <div className="grid grid-cols-2 gap-4">
        <StyleSelect
          label="Lighting"
          value={value.lightingStyle}
          options={LIGHTING_STYLES}
          onChange={(v) => updateStyle('lightingStyle', v)}
        />
        <StyleSelect
          label="Composition"
          value={value.compositionStyle}
          options={COMPOSITION_STYLES}
          onChange={(v) => updateStyle('compositionStyle', v)}
        />
      </div>
    </div>
  );
}

/**
 * Hook for managing image generation style state
 */
export function useImageGenerationStyles(entityType?: string) {
  const defaults = getDefaultStylesForEntityType(entityType);
  const [styles, setStyles] = useState<ImageGenerationStyles>(defaults);

  useEffect(() => {
    setStyles(getDefaultStylesForEntityType(entityType));
  }, [entityType]);

  return [styles, setStyles] as const;
}
