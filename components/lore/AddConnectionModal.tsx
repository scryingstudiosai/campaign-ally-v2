'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Loader2,
  X,
  ArrowRight,
  ArrowLeft,
  Users,
  MapPin,
  Package,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { EntityTypeBadge } from '@/components/memory/entity-type-badge';
import { toast } from 'sonner';

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  sub_type?: string;
}

interface AddConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  campaignId: string;
  onSaved?: () => void;
}

const RELATIONSHIP_TYPES = [
  { value: 'caused_by', label: 'Caused By', description: 'This event was caused by...', icon: ArrowLeft, color: 'text-red-400' },
  { value: 'led_to', label: 'Led To', description: 'This event led to...', icon: ArrowRight, color: 'text-green-400' },
  { value: 'involved', label: 'Involved', description: 'Participated in this event', icon: Users, color: 'text-blue-400' },
  { value: 'location_of', label: 'Location Of', description: 'Where this event occurred', icon: MapPin, color: 'text-teal-400' },
  { value: 'related_to', label: 'Related To', description: 'General connection', icon: LinkIcon, color: 'text-purple-400' },
];

const ENTITY_TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'npc', label: 'NPCs' },
  { value: 'location', label: 'Locations' },
  { value: 'faction', label: 'Factions' },
  { value: 'item', label: 'Items' },
  { value: 'event', label: 'Events' },
  { value: 'quest', label: 'Quests' },
];

export function AddConnectionModal({
  open,
  onOpenChange,
  eventId,
  eventName,
  campaignId,
  onSaved,
}: AddConnectionModalProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [relationshipType, setRelationshipType] = useState('related_to');
  const [contextNote, setContextNote] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchEntities();
      // Reset form on open
      setSearchQuery('');
      setTypeFilter('all');
      setSelectedEntity(null);
      setRelationshipType('related_to');
      setContextNote('');
    }
  }, [open, campaignId]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('id, name, entity_type, sub_type')
        .eq('campaign_id', campaignId)
        .neq('id', eventId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error('Failed to fetch entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntities = useMemo(() => {
    let result = entities;

    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter(e => e.entity_type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(query));
    }

    return result;
  }, [entities, typeFilter, searchQuery]);

  const handleSave = async () => {
    if (!selectedEntity) {
      toast.error('Please select an entity');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('relationships').insert({
        source_id: eventId,
        target_id: selectedEntity.id,
        relationship_type: relationshipType,
        description: contextNote || null,
      });

      if (error) throw error;

      toast.success(`Connected to ${selectedEntity.name}`);
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create connection:', error);
      toast.error('Failed to create connection');
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeInfo = RELATIONSHIP_TYPES.find(t => t.value === relationshipType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-amber-400" />
            Add Connection
          </DialogTitle>
          <p className="text-sm text-slate-400">
            Link &quot;{eventName}&quot; to another entity
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Step 1: Select Entity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">1. Select Entity</Label>

            {selectedEntity ? (
              <div className="flex items-center gap-2 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                <EntityTypeBadge
                  type={selectedEntity.entity_type as 'npc' | 'location' | 'event' | 'other'}
                  size="sm"
                />
                <span className="font-medium text-slate-200">{selectedEntity.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntity(null)}
                  className="ml-auto h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                {/* Search and filter */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder="Search entities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-slate-800/50"
                    />
                  </div>
                </div>

                {/* Type filter tabs */}
                <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                  <TabsList className="bg-slate-800 h-8">
                    {ENTITY_TYPE_FILTERS.map(filter => (
                      <TabsTrigger
                        key={filter.value}
                        value={filter.value}
                        className="text-xs px-2 h-6"
                      >
                        {filter.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {/* Entity list */}
                <div className="max-h-[200px] overflow-y-auto border border-slate-800 rounded-lg">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                  ) : filteredEntities.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-500">
                      No matching entities found
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {filteredEntities.map(entity => (
                        <button
                          key={entity.id}
                          onClick={() => setSelectedEntity(entity)}
                          className="w-full flex items-center gap-2 p-2 text-left hover:bg-slate-800/50 transition-colors"
                        >
                          <EntityTypeBadge
                            type={entity.entity_type as 'npc' | 'location' | 'event' | 'other'}
                            size="sm"
                          />
                          <span className="text-sm text-slate-200">{entity.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Step 2: Relationship Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">2. Relationship Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RELATIONSHIP_TYPES.map(type => {
                const IconComponent = type.icon;
                const isSelected = relationshipType === type.value;

                return (
                  <button
                    key={type.value}
                    onClick={() => setRelationshipType(type.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-amber-400' : type.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isSelected ? 'text-amber-200' : 'text-slate-300'}`}>
                        {type.label}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
            {selectedTypeInfo && (
              <p className="text-xs text-slate-500">{selectedTypeInfo.description}</p>
            )}
          </div>

          {/* Step 3: Context Note */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">3. Context Note (Optional)</Label>
            <Textarea
              placeholder="e.g., 'Led the assault', 'Was destroyed during', 'Witnessed the event'..."
              value={contextNote}
              onChange={(e) => setContextNote(e.target.value)}
              className="bg-slate-800/50 min-h-[60px]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedEntity || saving}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 mr-2" />
                Create Connection
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
