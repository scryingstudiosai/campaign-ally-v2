'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportModal } from './export-modal';

interface ExportButtonProps {
  campaignId: string;
  campaignName: string;
}

export function ExportButton({ campaignId, campaignName }: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>

      <ExportModal
        campaignId={campaignId}
        campaignName={campaignName}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
