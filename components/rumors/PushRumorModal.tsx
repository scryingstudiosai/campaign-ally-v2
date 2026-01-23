'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Megaphone, Users, User, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useSettingsContext } from '@/components/settings/SettingsContext';

interface Player {
  id: string;
  name: string;
}

interface PushRumorModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  initialContent?: string;
  sourceEntityId?: string;
  sourceType?: string;
  sourceName?: string;
}

const SKILL_CHECKS = [
  'History',
  'Arcana',
  'Religion',
  'Nature',
  'Investigation',
  'Insight',
  'Perception',
  'Medicine',
  'Survival',
];

export function PushRumorModal({
  isOpen,
  onClose,
  campaignId,
  initialContent = '',
  sourceEntityId,
  sourceType,
  sourceName,
}: PushRumorModalProps) {
  const supabase = createClient();
  const { markOnboardingComplete } = useSettingsContext();
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState('');
  const [targetType, setTargetType] = useState<'party' | 'player'>('party');
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');
  const [skillCheck, setSkillCheck] = useState<string>('');
  const [dc, setDc] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  // Reset form when modal opens with new content
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setTitle('');
      setTargetType('party');
      setTargetPlayerId('');
      setSkillCheck('');
      setDc('');
      fetchPlayers();
    }
  }, [isOpen, initialContent]);

  const fetchPlayers = async () => {
    setIsLoadingPlayers(true);
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('id, name')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'player')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please enter rumor content');
      return;
    }

    if (targetType === 'player' && !targetPlayerId) {
      toast.error('Please select a player character');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('rumors').insert({
        campaign_id: campaignId,
        content: content.trim(),
        title: title.trim() || null,
        source_entity_id: sourceEntityId || null,
        source_type: sourceType || 'manual',
        source_name: sourceName || null,
        target_type: targetType,
        target_player_id: targetType === 'player' ? targetPlayerId : null,
        skill_check: skillCheck || null,
        dc: dc ? parseInt(dc) : null,
        created_by: userData.user?.id || null,
      });

      if (error) throw error;

      const targetText =
        targetType === 'party'
          ? 'the party'
          : players.find((p) => p.id === targetPlayerId)?.name || 'player';
      toast.success(`Lore drop pushed to ${targetText}!`);
      // Mark onboarding task complete
      await markOnboardingComplete('push_rumor');
      onClose();
    } catch (error) {
      console.error('Failed to push rumor:', error);
      toast.error('Failed to push lore drop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            Push Lore Drop
          </DialogTitle>
          {sourceName && (
            <DialogDescription>
              From: <span className="text-slate-300">{sourceName}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Title (optional) */}
          <div className="space-y-2">
            <Label htmlFor="rumor-title">Title (Optional)</Label>
            <Input
              id="rumor-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Whispers about the Old War"
              disabled={isSubmitting}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="rumor-content">
              Lore Content <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="rumor-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do they hear, learn, or discover?"
              rows={4}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>

          {/* Target Selection */}
          <div className="space-y-3">
            <Label>Who Receives This?</Label>
            <RadioGroup
              value={targetType}
              onValueChange={(v) => setTargetType(v as 'party' | 'player')}
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="party" id="target-party" />
                <Label
                  htmlFor="target-party"
                  className="flex items-center gap-2 cursor-pointer font-normal"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  Whole Party
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="player" id="target-player" />
                <Label
                  htmlFor="target-player"
                  className="flex items-center gap-2 cursor-pointer font-normal"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Specific Player
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Player Selection (if specific player) */}
          {targetType === 'player' && (
            <div className="space-y-2">
              <Label htmlFor="target-player-select">Select Player Character</Label>
              {isLoadingPlayers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              ) : players.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">
                  No player characters found in this campaign
                </p>
              ) : (
                <Select
                  value={targetPlayerId}
                  onValueChange={setTargetPlayerId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="target-player-select">
                    <SelectValue placeholder="Choose a player character" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Optional: Skill Check */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skill-check">Skill Check (Optional)</Label>
              <Select
                value={skillCheck}
                onValueChange={setSkillCheck}
                disabled={isSubmitting}
              >
                <SelectTrigger id="skill-check">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {SKILL_CHECKS.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dc">DC (Optional)</Label>
              <Input
                id="dc"
                type="number"
                value={dc}
                onChange={(e) => setDc(e.target.value)}
                placeholder="e.g., 15"
                min={1}
                max={30}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !content.trim() ||
              (targetType === 'player' && !targetPlayerId)
            }
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Pushing...
              </>
            ) : (
              <>
                <Megaphone className="w-4 h-4 mr-2" />
                Push Lore Drop
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
