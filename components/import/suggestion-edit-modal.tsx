'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Suggestion {
  id: string;
  entity_name: string;
  entity_type: string;
  proposed_data: Record<string, unknown>;
}

interface SuggestionEditModalProps {
  suggestion: Suggestion;
  onClose: () => void;
  onSave: (updated: Suggestion) => void;
}

const entityTypes = [
  { value: 'npc', label: 'NPC' },
  { value: 'location', label: 'Location' },
  { value: 'item', label: 'Item' },
  { value: 'quest', label: 'Quest' },
  { value: 'faction', label: 'Faction' },
  { value: 'creature', label: 'Creature' },
];

export function SuggestionEditModal({ suggestion, onClose, onSave }: SuggestionEditModalProps) {
  const [name, setName] = useState(suggestion.entity_name);
  const [type, setType] = useState(suggestion.entity_type);
  const proposedSoul = suggestion.proposed_data?.soul as Record<string, unknown> | undefined;
  const [description, setDescription] = useState(
    (proposedSoul?.description as string) || ''
  );

  const handleSave = () => {
    onSave({
      ...suggestion,
      entity_name: name,
      entity_type: type,
      proposed_data: {
        ...suggestion.proposed_data,
        soul: {
          ...(suggestion.proposed_data?.soul as Record<string, unknown> || {}),
          description,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">Edit Suggestion</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-800 border-slate-700 min-h-[100px]"
              placeholder="Brief description of this entity..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save & Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
