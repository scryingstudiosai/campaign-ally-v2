'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  ArrowRight,
  ArrowLeftRight,
  Eye,
  Lock,
  Zap,
  Link2,
  Check,
  ChevronsUpDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  STATE_LABELS,
  getStrengthLabel,
  getVolatilityLabel,
  getRelationshipLineStyle,
} from '@/lib/relationships/types';

interface Entity {
  id: string;
  name: string;
  entity_type: string;
}

interface RelationshipType {
  id: string;
  key: string;
  label: string;
  category: string;
  directed: boolean;
  reverse_key?: string;
  default_strength: number;
  default_volatility: number;
}

interface ExistingRelationship {
  id: string;
  target_entity_id: string;
  category?: string;
  type_key?: string;
  descriptor?: string;
  description?: string;
  strength?: number;
  volatility?: number;
  state?: string;
  visibility?: string;
}

interface RelationshipEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  sourceEntity?: Entity;
  existingRelationship?: ExistingRelationship;
  onSaved: () => void;
}

export function RelationshipEditor({
  open,
  onOpenChange,
  campaignId,
  sourceEntity,
  existingRelationship,
  onSaved,
}: RelationshipEditorProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);

  // Form state
  const [targetEntityId, setTargetEntityId] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [typeKey, setTypeKey] = useState<string>('');
  const [descriptor, setDescriptor] = useState('');
  const [description, setDescription] = useState('');
  const [strength, setStrength] = useState(3);
  const [volatility, setVolatility] = useState(3);
  const [state, setState] = useState<string>('active');
  const [visibility, setVisibility] = useState<'public' | 'dm_only'>('public');

  const [entitySearchOpen, setEntitySearchOpen] = useState(false);

  // Load entities and relationship types
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      // Load entities
      const { data: entitiesData } = await supabase
        .from('entities')
        .select('id, name, entity_type')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('name');

      setEntities(entitiesData || []);

      // Load relationship types
      const { data: typesData } = await supabase
        .from('relationship_types')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('category', { ascending: true });

      setRelationshipTypes(typesData || []);
    };

    loadData();
  }, [open, campaignId, supabase]);

  // Populate form for editing
  useEffect(() => {
    if (existingRelationship) {
      setTargetEntityId(existingRelationship.target_entity_id);
      setCategory(existingRelationship.category || 'other');
      setTypeKey(existingRelationship.type_key || '');
      setDescriptor(existingRelationship.descriptor || '');
      setDescription(existingRelationship.description || '');
      setStrength(existingRelationship.strength || 3);
      setVolatility(existingRelationship.volatility || 3);
      setState(existingRelationship.state || 'active');
      setVisibility((existingRelationship.visibility as 'public' | 'dm_only') || 'public');
    } else {
      // Reset form
      setTargetEntityId('');
      setCategory('other');
      setTypeKey('');
      setDescriptor('');
      setDescription('');
      setStrength(3);
      setVolatility(3);
      setState('active');
      setVisibility('public');
    }
  }, [existingRelationship, open]);

  // When type is selected, apply defaults
  const handleTypeSelect = (key: string) => {
    setTypeKey(key);
    const type = relationshipTypes.find((t) => t.key === key);
    if (type) {
      setCategory(type.category);
      setStrength(type.default_strength);
      setVolatility(type.default_volatility);
    }
  };

  // Filter types by category
  const getTypesForCategory = (cat: string) => {
    return relationshipTypes.filter((t) => t.category === cat);
  };

  // Get selected type info
  const selectedType = relationshipTypes.find((t) => t.key === typeKey);
  const isDirected = selectedType?.directed ?? false;
  const reverseLabel = selectedType?.reverse_key
    ? relationshipTypes.find((t) => t.key === selectedType.reverse_key)?.label
    : null;

  const handleSave = async () => {
    if (!sourceEntity || !targetEntityId) {
      toast.error('Please select a target entity');
      return;
    }

    if (sourceEntity.id === targetEntityId) {
      toast.error('Cannot create relationship with self');
      return;
    }

    setLoading(true);
    try {
      // Use the API endpoint instead of direct Supabase
      const response = await fetch('/api/relationships', {
        method: existingRelationship ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingRelationship?.id,
          campaignId,
          sourceEntityId: sourceEntity.id,
          targetEntityId,
          category,
          typeKey: typeKey || null,
          descriptor: descriptor || null,
          description: description || null,
          strength,
          volatility,
          state,
          visibility,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save relationship');
      }

      const result = await response.json();

      if (result.reverseId) {
        toast.success('Relationship created (with reverse)');
      } else {
        toast.success(existingRelationship ? 'Relationship updated' : 'Relationship created');
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save relationship');
    } finally {
      setLoading(false);
    }
  };

  const targetEntity = entities.find((e) => e.id === targetEntityId);
  const categoryColor =
    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other;
  const lineStyle = getRelationshipLineStyle(strength, volatility, state);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-teal-400" />
            {existingRelationship ? 'Edit Relationship' : 'Create Relationship'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Source -> Target Display */}
          <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
            <div className="flex-1">
              <div className="text-xs text-zinc-500">From</div>
              <div className="font-medium text-zinc-200">{sourceEntity?.name || 'Select entity'}</div>
              <div className="text-xs text-zinc-500">{sourceEntity?.entity_type}</div>
            </div>

            {isDirected ? (
              <ArrowRight className="h-5 w-5 text-zinc-500" />
            ) : (
              <ArrowLeftRight className="h-5 w-5 text-zinc-500" />
            )}

            <div className="flex-1">
              <div className="text-xs text-zinc-500">To</div>
              <Popover open={entitySearchOpen} onOpenChange={setEntitySearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-zinc-800 border-zinc-700"
                  >
                    {targetEntity?.name || 'Select entity...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-zinc-900 border-zinc-700">
                  <Command>
                    <CommandInput placeholder="Search entities..." />
                    <CommandList>
                      <CommandEmpty>No entity found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {entities
                          .filter((e) => e.id !== sourceEntity?.id)
                          .map((entity) => (
                            <CommandItem
                              key={entity.id}
                              onSelect={() => {
                                setTargetEntityId(entity.id);
                                setEntitySearchOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  targetEntityId === entity.id ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              <span>{entity.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {entity.entity_type}
                              </Badge>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Directed relationship info */}
          {isDirected && reverseLabel && targetEntity && (
            <div className="text-xs text-zinc-500 bg-zinc-800/50 p-2 rounded flex items-center gap-2">
              <ArrowLeftRight className="h-3 w-3" />
              Auto-creates reverse: <span className="text-zinc-300">{targetEntity.name}</span>
              <ArrowRight className="h-3 w-3" />
              <span className="text-zinc-300">{sourceEntity?.name}</span> as &quot;{reverseLabel}&quot;
            </div>
          )}

          {/* Category Selection */}
          <div>
            <Label>Category</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const colors = CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS];
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className={`${
                      category === key ? `${colors.bg} ${colors.border} ${colors.text}` : 'border-zinc-700'
                    }`}
                    onClick={() => {
                      setCategory(key);
                      setTypeKey(''); // Reset type when category changes
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Type Selection (filtered by category) */}
          <div>
            <Label>Relationship Type (optional)</Label>
            <Select value={typeKey} onValueChange={handleTypeSelect}>
              <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select a type..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value=" ">Custom (use descriptor)</SelectItem>
                {getTypesForCategory(category).map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.label}
                    {type.directed && <span className="text-zinc-500 ml-2">→ {type.reverse_key}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descriptor (free text flavor) */}
          <div>
            <Label>Descriptor (flavor text)</Label>
            <Input
              value={descriptor}
              onChange={(e) => setDescriptor(e.target.value)}
              placeholder="e.g., Reluctant Mentor, Bitter Rival, Secret Lover..."
              className="mt-2 bg-zinc-800 border-zinc-700"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Add nuance beyond the type. This appears in the graph and AI context.
            </p>
          </div>

          {/* Description (the why) */}
          <div>
            <Label>Description (the &quot;why&quot;)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="They fought together in the War of the Silver Rose..."
              className="mt-2 bg-zinc-800 border-zinc-700"
              rows={2}
            />
          </div>

          {/* Strength & Volatility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center justify-between">
                <span>Strength</span>
                <Badge variant="outline" className="text-xs">
                  {getStrengthLabel(strength)}
                </Badge>
              </Label>
              <Slider
                value={[strength]}
                onValueChange={([v]) => setStrength(v)}
                min={1}
                max={5}
                step={1}
                className="mt-3"
              />
              <p className="text-xs text-zinc-500 mt-1">How strong is this bond?</p>
            </div>

            <div>
              <Label className="flex items-center justify-between">
                <span>Volatility</span>
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {getVolatilityLabel(volatility)}
                </Badge>
              </Label>
              <Slider
                value={[volatility]}
                onValueChange={([v]) => setVolatility(v)}
                min={1}
                max={5}
                step={1}
                className="mt-3"
              />
              <p className="text-xs text-zinc-500 mt-1">How likely to change?</p>
            </div>
          </div>

          {/* State (current condition) */}
          <div>
            <Label>Current State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {Object.entries(STATE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500 mt-1">Same relationship type, different current status.</p>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-2">
              {visibility === 'public' ? (
                <Eye className="h-4 w-4 text-green-400" />
              ) : (
                <Lock className="h-4 w-4 text-amber-400" />
              )}
              <div>
                <div className="text-sm font-medium">
                  {visibility === 'public' ? 'Public' : 'DM Only (Secret)'}
                </div>
                <div className="text-xs text-zinc-500">
                  {visibility === 'public' ? 'Visible in player-facing views' : 'Hidden from players'}
                </div>
              </div>
            </div>
            <Switch
              checked={visibility === 'dm_only'}
              onCheckedChange={(checked) => setVisibility(checked ? 'dm_only' : 'public')}
            />
          </div>

          {/* Live Preview */}
          <div className={`p-4 rounded-lg border ${categoryColor.border} ${categoryColor.bg}`}>
            <div className="text-xs text-zinc-400 mb-2">Live Preview</div>

            {/* Entity names */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-zinc-200">{sourceEntity?.name}</span>
              <div
                className="flex-1 h-0 border-t-2"
                style={{
                  borderColor: categoryColor.line,
                  borderWidth: `${lineStyle.strokeWidth}px`,
                  borderStyle: lineStyle.strokeDasharray ? 'dashed' : 'solid',
                  opacity: lineStyle.opacity,
                }}
              />
              <span className="font-medium text-zinc-200">{targetEntity?.name || '?'}</span>
            </div>

            {/* Label */}
            <div className={`text-sm ${categoryColor.text}`}>
              {descriptor || selectedType?.label || CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              {state !== 'active' && <span className="text-zinc-500 ml-1">({state})</span>}
            </div>

            {/* Stats */}
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Strength: {strength}/5
              </Badge>
              <Badge variant="outline" className="text-xs">
                Volatility: {volatility}/5
              </Badge>
              {visibility === 'dm_only' && (
                <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                  <Lock className="h-2 w-2 mr-1" />
                  Secret
                </Badge>
              )}
            </div>

            {/* Line style explanation */}
            <div className="text-xs text-zinc-500 mt-2">
              Line: {lineStyle.strokeWidth >= 3 ? 'Thick' : lineStyle.strokeWidth >= 2 ? 'Medium' : 'Thin'},{' '}
              {lineStyle.strokeDasharray ? 'Dashed' : 'Solid'}, Opacity: {Math.round(lineStyle.opacity * 100)}%
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !targetEntityId}
            className="bg-teal-600 hover:bg-teal-500"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {existingRelationship ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
