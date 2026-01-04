'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, X } from 'lucide-react';
import { CopilotChat } from './CopilotChat';

interface CopilotButtonProps {
  campaignId: string;
  campaignName?: string;
}

export function CopilotButton({ campaignId, campaignName }: CopilotButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 ${
          isOpen ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-purple-600 hover:bg-purple-500'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Brain className="h-6 w-6" />}
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[400px] z-40 shadow-2xl">
          <CopilotChat campaignId={campaignId} campaignName={campaignName} />
        </div>
      )}
    </>
  );
}
