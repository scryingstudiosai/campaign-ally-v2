'use client';

import { GenericEditor } from './GenericEditor';

interface EditorProps {
  entity: {
    id: string;
    name: string;
    entity_type: string;
    sub_type?: string;
    summary?: string;
    description?: string;
    soul?: Record<string, unknown>;
    brain?: Record<string, unknown>;
    mechanics?: Record<string, unknown>;
  };
  campaignId: string;
}

// Placeholder - will be replaced with Item-specific implementation
export function ItemEditor(props: EditorProps): JSX.Element {
  return <GenericEditor {...props} />;
}
