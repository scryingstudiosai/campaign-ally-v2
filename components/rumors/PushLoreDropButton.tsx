'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';
import { PushRumorModal } from './PushRumorModal';

interface PushLoreDropButtonProps {
  campaignId: string;
  entityId: string;
  entityType: string;
  entityName: string;
  loreContent?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Get appropriate lore content based on entity type
 */
function getDefaultLoreContent(
  entityType: string,
  soul?: Record<string, unknown>,
  description?: string
): string {
  switch (entityType) {
    case 'event':
      return (
        (soul?.common_knowledge as string) ||
        (soul?.folklore_version as string) ||
        (soul?.folklore as string) ||
        description ||
        ''
      );
    case 'npc':
      return (
        (soul?.public_knowledge as string) ||
        (soul?.rumors as string) ||
        description ||
        ''
      );
    case 'location':
      return (
        (soul?.known_for as string) ||
        (soul?.rumors as string) ||
        (soul?.atmosphere as string) ||
        description ||
        ''
      );
    case 'item':
      return (
        (soul?.legend as string) ||
        (soul?.history as string) ||
        description ||
        ''
      );
    case 'faction':
      return (
        (soul?.public_perception as string) ||
        (soul?.reputation as string) ||
        description ||
        ''
      );
    case 'deity':
      return (
        (soul?.common_beliefs as string) ||
        (soul?.public_doctrine as string) ||
        description ||
        ''
      );
    default:
      return description || '';
  }
}

export function PushLoreDropButton({
  campaignId,
  entityId,
  entityType,
  entityName,
  loreContent,
  variant = 'outline',
  size = 'default',
  className,
}: PushLoreDropButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        <Megaphone className="w-4 h-4 mr-2" />
        Push Lore Drop
      </Button>

      <PushRumorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaignId={campaignId}
        initialContent={loreContent || ''}
        sourceEntityId={entityId}
        sourceType={entityType}
        sourceName={entityName}
      />
    </>
  );
}

// Export utility function for use in other components
export { getDefaultLoreContent };
