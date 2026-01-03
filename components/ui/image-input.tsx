'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Link,
  Upload,
  Sparkles,
  Loader2,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  ImageGenerationOptions,
  useImageGenerationStyles,
} from '@/components/ui/image-generation-options';

interface ImageInputProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  campaignId: string;
  entityId?: string;
  entityType?: string;
  generationPrompt?: string;
  disabled?: boolean;
  label?: string;
  showStyleOptions?: boolean;
}

export function ImageInput({
  value,
  onChange,
  campaignId,
  entityId,
  entityType,
  generationPrompt,
  disabled,
  label = 'Image',
  showStyleOptions = true,
}: ImageInputProps) {
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(generationPrompt || '');
  const [imageError, setImageError] = useState(false);
  const [showRegenerateMode, setShowRegenerateMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [styles, setStyles] = useImageGenerationStyles(entityType);

  // Check if current value is external URL (not our storage)
  const isExternalUrl = value && !value.includes('supabase.co');

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setImageError(false);
      toast.success('Image URL saved');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaignId', campaignId);
      if (entityId) formData.append('entityId', entityId);

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { url } = await res.json();
      onChange(url);
      setImageError(false);
      setShowRegenerateMode(false);
      toast.success('Image uploaded');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          campaignId,
          entityId,
          entityType,
          artStyle: styles.artStyle,
          lightingStyle: styles.lightingStyle,
          compositionStyle: styles.compositionStyle,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Generation failed');
      }

      const { url } = await res.json();
      onChange(url);
      setImageError(false);
      setShowRegenerateMode(false);
      toast.success('Image generated!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearImage = () => {
    onChange(null);
    setUrlInput('');
    setImageError(false);
    setShowRegenerateMode(false);
  };

  const startRegenerate = () => {
    setShowRegenerateMode(true);
    setActiveTab('generate');
    // Pre-fill with existing prompt if available
    if (generationPrompt && !aiPrompt) {
      setAiPrompt(generationPrompt);
    }
  };

  const cancelRegenerate = () => {
    setShowRegenerateMode(false);
  };

  // Use entity description for AI prompt
  const useEntityDescription = () => {
    if (generationPrompt) {
      setAiPrompt(generationPrompt);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Current Image Preview (when image exists and not in regenerate mode) */}
      {value && !showRegenerateMode && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-zinc-700 group">
          {!imageError ? (
            <Image
              src={value}
              alt="Entity image"
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center text-zinc-500">
              <AlertTriangle className="h-6 w-6 mb-1" />
              <span className="text-xs">Broken</span>
            </div>
          )}

          {/* Hover Overlay with Actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              onClick={startRegenerate}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Change
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 text-xs text-zinc-400 hover:text-white"
              onClick={clearImage}
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>

          {/* External URL Warning Badge */}
          {isExternalUrl && !imageError && (
            <div className="absolute bottom-0 left-0 right-0 bg-yellow-900/80 px-2 py-1 flex items-center gap-1 group-hover:opacity-0 transition-opacity">
              <AlertTriangle className="h-3 w-3 text-yellow-400" />
              <span className="text-xs text-yellow-200">External</span>
            </div>
          )}
        </div>
      )}

      {/* Regenerate Mode Header */}
      {showRegenerateMode && value && (
        <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded overflow-hidden border border-zinc-700">
              <Image
                src={value}
                alt="Current image"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-sm text-zinc-400">Replacing current image</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={cancelRegenerate}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Image Input Options (show when no image OR in regenerate mode) */}
      {(!value || showRegenerateMode) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            <TabsTrigger value="generate" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs gap-1">
              <Upload className="h-3 w-3" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs gap-1">
              <Link className="h-3 w-3" />
              URL
            </TabsTrigger>
          </TabsList>

          {/* Lane 3 (Primary): AI Generation */}
          <TabsContent value="generate" className="space-y-3 pt-3">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="bg-zinc-800 border-zinc-700 min-h-[80px] resize-none"
              disabled={disabled || isGenerating}
            />
            {generationPrompt && aiPrompt !== generationPrompt && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-teal-400 h-auto py-1"
                onClick={useEntityDescription}
              >
                Use description from entity
              </Button>
            )}
            {showStyleOptions && (
              <ImageGenerationOptions
                value={styles}
                onChange={setStyles}
                entityType={entityType}
                compact
              />
            )}
            <Button
              type="button"
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
              onClick={handleGenerate}
              disabled={disabled || isGenerating || !aiPrompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {showRegenerateMode ? 'Regenerate Image' : 'Generate Image'}
                </>
              )}
            </Button>
          </TabsContent>

          {/* Lane 2: Upload */}
          <TabsContent value="upload" className="pt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled || isUploading}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full h-24 border-dashed border-zinc-600 hover:border-teal-500 hover:bg-teal-500/5"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-zinc-400" />
                  <span className="text-sm text-zinc-400">Click to upload</span>
                  <span className="text-xs text-zinc-500">
                    PNG, JPG, WebP, GIF (max 5MB)
                  </span>
                </div>
              )}
            </Button>
          </TabsContent>

          {/* Lane 1: External URL */}
          <TabsContent value="url" className="space-y-3 pt-3">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.png"
              className="bg-zinc-800 border-zinc-700"
              disabled={disabled}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-yellow-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>External links may expire</span>
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim() || disabled}
              >
                Save
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
