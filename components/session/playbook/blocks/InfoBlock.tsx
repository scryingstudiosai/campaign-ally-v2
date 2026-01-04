'use client';

import { useState } from 'react';
import { BlockWrapper } from './BlockWrapper';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info, AlertTriangle, Lightbulb, ScrollText, Eye } from 'lucide-react';

interface InfoBlockProps {
  block: {
    id: string;
    title: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    content: {
      info_type?: 'note' | 'warning' | 'secret' | 'lore' | 'reminder';
      text?: string;
      revealed?: boolean;
    };
  };
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const INFO_TYPES = [
  { value: 'note', label: 'Note', icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-900/30', borderColor: 'border-blue-900/50' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-400', bgColor: 'bg-amber-900/30', borderColor: 'border-amber-900/50' },
  { value: 'secret', label: 'Secret', icon: Eye, color: 'text-purple-400', bgColor: 'bg-purple-900/30', borderColor: 'border-purple-900/50' },
  { value: 'lore', label: 'Lore', icon: ScrollText, color: 'text-emerald-400', bgColor: 'bg-emerald-900/30', borderColor: 'border-emerald-900/50' },
  { value: 'reminder', label: 'Reminder', icon: Lightbulb, color: 'text-yellow-400', bgColor: 'bg-yellow-900/30', borderColor: 'border-yellow-900/50' },
];

export function InfoBlock({ block, onUpdate, onDelete, onDuplicate }: InfoBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  const content = block.content || {};
  const infoType = content.info_type || 'note';
  const typeConfig = INFO_TYPES.find(t => t.value === infoType) || INFO_TYPES[0];
  const IconComponent = typeConfig.icon;

  const handleUpdateContent = (field: string, value: any) => {
    onUpdate({ content: { ...content, [field]: value } });
  };

  return (
    <BlockWrapper
      id={block.id}
      type="info"
      title={block.title}
      status={block.status}
      icon={<IconComponent className={`w-4 h-4 ${typeConfig.color}`} />}
      color={typeConfig.bgColor}
      isEditing={isEditing}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onStatusChange={(status) => onUpdate({ status })}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      {isEditing ? (
        // === EDIT MODE ===
        <div className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Title</label>
            <Input
              placeholder="e.g. Remember this..."
              value={block.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="bg-slate-800 border-slate-700 font-medium"
            />
          </div>

          {/* Info Type */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Type</label>
            <Select
              value={infoType}
              onValueChange={(value) => handleUpdateContent('info_type', value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {INFO_TYPES.map(type => {
                  const TypeIcon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`w-4 h-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Content</label>
            <Textarea
              placeholder="Your note content..."
              value={content.text || ''}
              onChange={(e) => handleUpdateContent('text', e.target.value)}
              className="bg-slate-800 border-slate-700 min-h-[100px]"
            />
          </div>

          {/* Revealed toggle for secrets */}
          {infoType === 'secret' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`revealed-${block.id}`}
                checked={content.revealed || false}
                onChange={(e) => handleUpdateContent('revealed', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800"
              />
              <label htmlFor={`revealed-${block.id}`} className="text-sm text-slate-400">
                Mark as revealed to players
              </label>
            </div>
          )}
        </div>
      ) : (
        // === VIEW MODE ===
        <div className="mt-4">
          {/* Type Badge */}
          <Badge
            variant="outline"
            className={`mb-3 ${typeConfig.color} ${typeConfig.borderColor}`}
          >
            <IconComponent className="w-3 h-3 mr-1" />
            {typeConfig.label}
            {infoType === 'secret' && content.revealed && (
              <span className="ml-1 text-xs opacity-75">(Revealed)</span>
            )}
          </Badge>

          {/* Content */}
          {content.text ? (
            <div className={`p-3 rounded ${typeConfig.bgColor} ${typeConfig.borderColor} border`}>
              <p className="text-slate-300 whitespace-pre-wrap">{content.text}</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">
              Click the edit button to add content.
            </p>
          )}
        </div>
      )}
    </BlockWrapper>
  );
}
