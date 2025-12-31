'use client';

import { useState } from 'react';
import { Download, Database, FileText, Loader2, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExportModalProps {
  campaignId: string;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'json' | 'markdown';

export function ExportModal({ campaignId, campaignName, isOpen, onClose }: ExportModalProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [completed, setCompleted] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    setCompleted(null);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/export?format=${format}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${campaignName}_export.${format === 'markdown' ? 'zip' : 'json'}`;

      // Download file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCompleted(format);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      format: 'json' as ExportFormat,
      icon: Database,
      title: 'Data Backup (JSON)',
      description: 'Raw campaign data for backup or migration. Can be re-imported later.',
      buttonText: 'Download JSON',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20',
    },
    {
      format: 'markdown' as ExportFormat,
      icon: FileText,
      title: 'Wiki Export (Markdown)',
      description: 'Organized folder of .md files with [[WikiLinks]]. Works with Obsidian, Notion, and more.',
      buttonText: 'Download ZIP',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-stone-900 rounded-xl border border-stone-700 w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30">
              <Download className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Export Campaign</h2>
              <p className="text-sm text-stone-400">{campaignName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isExporting = exporting === option.format;
            const isCompleted = completed === option.format;

            return (
              <div
                key={option.format}
                className={cn(
                  'rounded-lg border p-4 transition-all',
                  option.bgColor
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg bg-stone-800', option.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{option.title}</h3>
                    <p className="text-sm text-stone-400 mt-1">{option.description}</p>

                    <Button
                      onClick={() => handleExport(option.format)}
                      disabled={!!exporting}
                      size="sm"
                      className="mt-3"
                      variant={isCompleted ? 'outline' : 'default'}
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                          Downloaded!
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          {option.buttonText}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-stone-800 bg-stone-900/50">
          <p className="text-xs text-stone-500 text-center">
            Your data belongs to you. Export anytime, no restrictions.
          </p>
        </div>
      </div>
    </div>
  );
}
