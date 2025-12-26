'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, Link, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SrdItem {
  id: string;
  name: string;
  item_type: string;
  rarity: string | null;
  value_gp: number | null;
  weight: number | null;
}

interface SrdLinkDialogProps {
  open: boolean;
  inventoryInstanceId: string;
  customItemName: string;
  onClose: () => void;
  onLinked: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-slate-600 text-slate-200',
  uncommon: 'bg-green-800 text-green-200',
  rare: 'bg-blue-800 text-blue-200',
  'very rare': 'bg-purple-800 text-purple-200',
  legendary: 'bg-orange-800 text-orange-200',
  artifact: 'bg-red-800 text-red-200',
};

export function SrdLinkDialog({
  open,
  inventoryInstanceId,
  customItemName,
  onClose,
  onLinked,
}: SrdLinkDialogProps): JSX.Element {
  const supabase = createClient();
  const [search, setSearch] = useState(customItemName);
  const [results, setResults] = useState<SrdItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);

  // Debounced search
  const searchSrdItems = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('srd_items')
        .select('id, name, item_type, rarity, value_gp, weight')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        return;
      }

      setResults(data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Search when dialog opens or search term changes
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        searchSrdItems(search);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, open, searchSrdItems]);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearch(customItemName);
    }
  }, [open, customItemName]);

  const handleLink = async (srdItem: SrdItem) => {
    setLinking(true);
    try {
      // Update the inventory instance to link to the SRD item
      // Must clear custom_entity_id to satisfy the item_reference_check constraint
      // (database requires either srd_item_id OR custom_entity_id, not both)
      const { error } = await supabase
        .from('inventory_instances')
        .update({
          srd_item_id: srdItem.id,
          custom_entity_id: null,
          // Preserve original custom name in notes if different from SRD name
          notes: customItemName !== srdItem.name ? `Originally: ${customItemName}` : null,
        })
        .eq('id', inventoryInstanceId);

      if (error) {
        throw error;
      }

      toast.success(`Linked to "${srdItem.name}" - now has full game stats!`);
      onLinked();
      onClose();
    } catch (err) {
      console.error('Link failed:', err);
      toast.error('Failed to link item');
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-200 flex items-center gap-2">
            <Link className="w-5 h-5" />
            Link to SRD Item
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Link &quot;{customItemName}&quot; to an official D&D 5e SRD item to get game stats (damage, weight, value, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SRD items..."
              className="pl-10 bg-slate-800 border-slate-700 text-slate-200"
            />
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No SRD items found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-teal-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-200">{item.name}</span>
                      {item.rarity && item.rarity !== 'common' && (
                        <Badge className={`text-[10px] ${RARITY_COLORS[item.rarity.toLowerCase()] || RARITY_COLORS.common}`}>
                          {item.rarity}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="capitalize">{item.item_type}</span>
                      {item.weight != null && <span>{item.weight} lb.</span>}
                      {item.value_gp != null && <span>{item.value_gp} gp</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleLink(item)}
                    disabled={linking}
                    className="bg-teal-600 hover:bg-teal-500 ml-2"
                  >
                    {linking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Link className="w-3 h-3 mr-1" />
                        Link
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-500">
            Linking to an SRD item adds official D&D 5e stats while keeping your custom name and description.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
