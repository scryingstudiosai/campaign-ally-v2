'use client';

import { useState } from 'react';
import { Upload, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImportUploadProps {
  campaignId: string;
  onComplete: (batchId: string, sourceDocId: string) => void;
  onScanning: () => void;
}

export function ImportUpload({ campaignId, onComplete, onScanning }: ImportUploadProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please provide a title and content');
      return;
    }

    setIsProcessing(true);
    setError(null);
    onScanning();

    try {
      const response = await fetch('/api/import/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          title: title.trim(),
          content: content.trim(),
          fileType: 'text',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onComplete(data.batchId, data.sourceDocId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process import');
      setIsProcessing(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center border border-teal-500/30">
          <Upload className="w-8 h-8 text-teal-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Import Content</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Paste your campaign notes, session logs, or world-building documents.
          Our AI will extract NPCs, locations, items, and more.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6 bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Document Title</Label>
          <Input
            id="title"
            placeholder="e.g., Session 5 Notes, Waterdeep Lore, NPC Ideas..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-900 border-slate-700"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Content</Label>
            <span className="text-xs text-slate-500">{wordCount} words</span>
          </div>
          <Textarea
            id="content"
            placeholder="Paste your notes here...

Example:
The party arrived in Silvermoon Village, a small settlement nestled in the foothills. They met Thalor the Blacksmith, who told them about the missing shipments from the Iron Hills mine. Mayor Elara Brightwood offered 500 gold for investigating the disappearances..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-slate-900 border-slate-700 min-h-[300px] font-mono text-sm"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Supports plain text, markdown, and session notes
          </p>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !title.trim() || !content.trim()}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isProcessing ? 'Scanning...' : 'Scan for Entities'}
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Named Characters', desc: 'NPCs with names will be extracted automatically' },
          { title: 'Locations', desc: 'Towns, dungeons, taverns - anywhere with a name' },
          { title: 'Items & Quests', desc: 'Notable items and mission hooks get captured' },
        ].map((tip) => (
          <div key={tip.title} className="p-4 rounded-lg bg-slate-900/30 border border-slate-800/50">
            <h3 className="font-medium text-slate-300 text-sm">{tip.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
