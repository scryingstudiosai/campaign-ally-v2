'use client';

import { useParams } from 'next/navigation';
import { LoreBoard } from '@/components/player-portal/LoreBoard';

export default function LorePage() {
  const params = useParams();
  const campaignId = params?.campaignId as string;

  return (
    <div className="p-4 pb-20">
      <LoreBoard campaignId={campaignId} />
    </div>
  );
}
