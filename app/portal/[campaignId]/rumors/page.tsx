'use client';

import { useParams } from 'next/navigation';
import { RumorsBoard } from '@/components/player-portal/RumorsBoard';

export default function RumorsPage() {
  const params = useParams();
  const campaignId = params?.campaignId as string;

  return (
    <div className="p-4 pb-20">
      <RumorsBoard campaignId={campaignId} />
    </div>
  );
}
