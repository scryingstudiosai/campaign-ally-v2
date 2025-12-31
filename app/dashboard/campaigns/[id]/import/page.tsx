'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ImportUpload } from '@/components/import/import-upload';
import { ScanningState } from '@/components/import/scanning-state';
import { StagingArea } from '@/components/import/staging-area';
import { ImportComplete } from '@/components/import/import-complete';

type ImportStep = 'upload' | 'scanning' | 'review' | 'complete';

interface ImportStats {
  created: number;
  merged: number;
  ignored: number;
}

export default function ImportPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [step, setStep] = useState<ImportStep>('upload');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [sourceDocId, setSourceDocId] = useState<string | null>(null);
  const [completedStats, setCompletedStats] = useState<ImportStats | null>(null);

  const handleUploadComplete = (newBatchId: string, newSourceDocId: string) => {
    setBatchId(newBatchId);
    setSourceDocId(newSourceDocId);
    setStep('review');
  };

  const handleCommitComplete = (stats: ImportStats) => {
    setCompletedStats(stats);
    setStep('complete');
  };

  const handleStartOver = () => {
    setBatchId(null);
    setSourceDocId(null);
    setCompletedStats(null);
    setStep('upload');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {step === 'upload' && (
        <ImportUpload
          campaignId={campaignId}
          onComplete={handleUploadComplete}
          onScanning={() => setStep('scanning')}
        />
      )}

      {step === 'scanning' && (
        <ScanningState />
      )}

      {step === 'review' && batchId && (
        <StagingArea
          campaignId={campaignId}
          batchId={batchId}
          onCommitComplete={handleCommitComplete}
          onCancel={handleStartOver}
        />
      )}

      {step === 'complete' && completedStats && (
        <ImportComplete
          stats={completedStats}
          campaignId={campaignId}
          onImportMore={handleStartOver}
        />
      )}
    </div>
  );
}
