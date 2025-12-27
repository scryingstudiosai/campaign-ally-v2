'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Package, Skull, Loader2 } from 'lucide-react';

interface QuickForgePanelProps {
  campaignId: string;
  onForged?: (entity: Record<string, unknown>) => void;
}

const FORGE_OPTIONS = [
  { type: 'npc', label: 'Quick NPC', icon: Users, color: 'bg-blue-600 hover:bg-blue-700' },
  { type: 'location', label: 'Quick Location', icon: MapPin, color: 'bg-green-600 hover:bg-green-700' },
  { type: 'item', label: 'Quick Item', icon: Package, color: 'bg-amber-600 hover:bg-amber-700' },
  { type: 'creature', label: 'Quick Creature', icon: Skull, color: 'bg-red-600 hover:bg-red-700' },
];

export function QuickForgePanel({ campaignId, onForged }: QuickForgePanelProps) {
  const [isForging, setIsForging] = useState<string | null>(null);

  const handleQuickForge = async (type: string) => {
    setIsForging(type);

    // TODO: Implement quick forge API call
    // For now, just simulate
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsForging(null);
    onForged?.({ type, name: 'Generated Entity', campaignId });
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
        Quick Forge
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {FORGE_OPTIONS.map(({ type, label, icon: Icon, color }) => (
          <Button
            key={type}
            onClick={() => handleQuickForge(type)}
            disabled={isForging !== null}
            className={`h-20 flex-col gap-2 ${color}`}
          >
            {isForging === type ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Icon className="w-6 h-6" />
            )}
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-4 text-center">
        Instantly generate entities during gameplay
      </p>
    </div>
  );
}
