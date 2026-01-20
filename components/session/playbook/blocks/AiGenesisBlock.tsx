'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, RefreshCw, BookOpen, Swords, HelpCircle, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface GeneratedBlock {
  type: 'scene' | 'encounter' | 'quest';
  title: string;
  content: Record<string, unknown>;
}

interface GeneratedOption {
  title: string;
  approach: string;
  summary: string;
  blocks: GeneratedBlock[];
}

interface PlaybookBlock {
  id: string;
  type: 'scene' | 'encounter' | 'quest';
  title: string;
  status: 'pending';
  content: Record<string, unknown>;
}

interface AiGenesisBlockProps {
  campaignId: string;
  onReplace: (blocks: PlaybookBlock[]) => void;
  onRemove: () => void;
}

export function AiGenesisBlock({ campaignId, onReplace, onRemove }: AiGenesisBlockProps) {
  const [prompt, setPrompt] = useState('');
  const [includeLastSession, setIncludeLastSession] = useState(true);
  const [includeActiveThreads, setIncludeActiveThreads] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<GeneratedOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const approachIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    Combat: Swords,
    Social: BookOpen,
    Mystery: HelpCircle,
    Exploration: Map,
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          prompt,
          includeLastSession,
          includeActiveThreads,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setOptions(data.options || []);
    } catch {
      setError('Failed to generate options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (option: GeneratedOption) => {
    // Convert to playbook blocks with IDs and status
    const playbookBlocks: PlaybookBlock[] = option.blocks.map((block, index) => ({
      id: `gen-${Date.now()}-${index}`,
      type: block.type,
      title: block.title,
      status: 'pending' as const,
      content: block.content,
    }));

    onReplace(playbookBlocks);
  };

  // State 1: Drafting
  if (!options) {
    return (
      <div className="border border-dashed border-purple-500/50 bg-purple-950/20 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">AI Genesis Block</span>
        </div>

        <Textarea
          placeholder="Describe what you need... e.g., 'The party arrives at the haunted manor and must find the hidden vault'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] bg-slate-900/50 border-slate-700"
        />

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
            <Checkbox
              checked={includeLastSession}
              onCheckedChange={(c) => setIncludeLastSession(!!c)}
            />
            Include last session context
          </label>
          <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
            <Checkbox
              checked={includeActiveThreads}
              onCheckedChange={(c) => setIncludeActiveThreads(!!c)}
            />
            Include active story threads
          </label>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Consulting the Oracle...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Options
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={onRemove} className="text-slate-500">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // State 2: Selection
  return (
    <div className="border border-dashed border-purple-500/50 bg-purple-950/20 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">Choose Your Path</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOptions(null)}
          className="text-slate-500"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Start Over
        </Button>
      </div>

      <p className="text-sm text-slate-500 italic">&ldquo;{prompt}&rdquo;</p>

      <div className="grid gap-3">
        {options.map((option, index) => {
          const Icon = approachIcons[option.approach] || Sparkles;
          return (
            <div
              key={index}
              className="border border-slate-700 bg-slate-900/50 rounded-lg p-4 hover:border-purple-500/50 transition-colors cursor-pointer group"
              onClick={() => handleSelectOption(option)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="font-medium text-slate-200 truncate">{option.title}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400 shrink-0">
                      {option.approach}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{option.summary}</p>
                  <p className="text-xs text-slate-600 mt-2">
                    Contains: {option.blocks.map(b => b.type).join(' + ')}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-purple-600 hover:bg-purple-700 shrink-0"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Choose
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
