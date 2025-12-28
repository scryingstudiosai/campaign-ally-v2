'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles, Loader2, Star, MapPin, Users, AlertTriangle,
  Scroll, ArrowRight, CheckCircle, Edit, Save,
  Clock, MessageSquare, Skull, Heart, Flag,
  Package, Target, RefreshCw, Check, Database
} from 'lucide-react';

interface SessionReviewProps {
  sessionId: string;
  sessionName: string;
  duration?: number;
  onClose?: () => void;
  onComplete?: () => void;
}

interface WorldUpdate {
  id: string;
  type: 'status' | 'location' | 'relationship' | 'fact' | 'item' | 'quest';
  entityId?: string;
  entityName: string;
  targetName?: string;
  oldValue?: string;
  newValue?: string;
  value?: string;
  itemName?: string;
  questName?: string;
  action?: string;
  reason: string;
  resolved: boolean;
  isPartyUpdate?: boolean;
}

interface Review {
  summary: string;
  highlights: string[];
  updates: WorldUpdate[];
  openThreads: string[];
  npcsEncountered: string[];
  locationsVisited: string[];
  suggestedXp: number;
  xpReason: string;
  nextSessionHooks: string[];
}

const UPDATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  status: Skull,
  location: MapPin,
  relationship: Heart,
  fact: MessageSquare,
  item: Package,
  quest: Flag,
};

const UPDATE_COLORS: Record<string, string> = {
  status: 'text-red-400 bg-red-900/30 border-red-800',
  location: 'text-green-400 bg-green-900/30 border-green-800',
  relationship: 'text-pink-400 bg-pink-900/30 border-pink-800',
  fact: 'text-blue-400 bg-blue-900/30 border-blue-800',
  item: 'text-amber-400 bg-amber-900/30 border-amber-800',
  quest: 'text-purple-400 bg-purple-900/30 border-purple-800',
};

export function SessionReview({
  sessionId,
  sessionName,
  duration,
  onClose,
  onComplete
}: SessionReviewProps) {
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [editedSummary, setEditedSummary] = useState('');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);

  // Selected updates
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());

  // Applied state
  const [appliedResults, setAppliedResults] = useState<any[]>([]);
  const [hasApplied, setHasApplied] = useState(false);

  // Check for existing review on mount
  useEffect(() => {
    fetchExistingReview();
  }, [sessionId]);

  const fetchExistingReview = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.review) {
          setReview(data.review);
          setEditedSummary(data.review.summary);
          setXpAmount(data.review.suggestedXp || 0);
          // Select all resolved updates by default
          const resolved = (data.review.updates || [])
            .filter((u: WorldUpdate) => u.resolved)
            .map((u: WorldUpdate) => u.id);
          setSelectedUpdates(new Set(resolved));

          // Check if already applied
          if (data.applied_updates?.length > 0) {
            setAppliedResults(data.applied_updates);
            setHasApplied(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch review:', error);
    }
  };

  const generateReview = async () => {
    setIsLoading(true);
    setError(null);
    setHasApplied(false);
    setAppliedResults([]);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/analyze`, {
        method: 'POST',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to analyze session');
      }

      const data = await response.json();
      setReview(data);
      setEditedSummary(data.summary);
      setXpAmount(data.suggestedXp || 0);

      // Select all resolved updates by default
      const resolved = (data.updates || [])
        .filter((u: WorldUpdate) => u.resolved)
        .map((u: WorldUpdate) => u.id);
      setSelectedUpdates(new Set(resolved));

    } catch (err: any) {
      setError(err.message);
    }

    setIsLoading(false);
  };

  const toggleUpdate = (id: string) => {
    setSelectedUpdates(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!review) return;
    const allResolved = review.updates
      .filter(u => u.resolved)
      .map(u => u.id);
    setSelectedUpdates(new Set(allResolved));
  };

  const selectNone = () => {
    setSelectedUpdates(new Set());
  };

  const applyUpdates = async () => {
    if (!review) return;

    setIsApplying(true);
    setError(null);

    try {
      const updatesToApply = review.updates.filter(u => selectedUpdates.has(u.id));

      const response = await fetch(`/api/sessions/${sessionId}/apply-updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: updatesToApply,
          xpAwarded: xpAmount,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to apply updates');
      }

      const result = await response.json();
      setAppliedResults(result.results || []);
      setHasApplied(true);

      // Call onComplete callback
      onComplete?.();

    } catch (err: any) {
      setError(err.message);
    }

    setIsApplying(false);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getUpdateTitle = (update: WorldUpdate) => {
    switch (update.type) {
      case 'status':
        return `Mark ${update.entityName} as ${update.newValue?.toUpperCase()}`;
      case 'location':
        return `${update.entityName} → ${update.newValue}`;
      case 'relationship':
        return `${update.entityName} is now ${update.newValue} toward ${update.targetName || 'Party'}`;
      case 'fact':
        return `Add fact to ${update.entityName}`;
      case 'item':
        return `${update.entityName} ${update.action} ${update.itemName}`;
      case 'quest':
        return `Quest "${update.questName}" → ${update.newValue}`;
      default:
        return `Update ${update.entityName}`;
    }
  };

  const getUpdateDescription = (update: WorldUpdate) => {
    switch (update.type) {
      case 'fact':
        return update.value;
      default:
        return update.reason;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{sessionName}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(duration)}
            </span>
            {hasApplied && (
              <Badge className="bg-green-900/50 text-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Updates Applied
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {review && (
            <Button
              onClick={generateReview}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-slate-600"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Re-analyze
            </Button>
          )}

          {!review && (
            <Button
              onClick={generateReview}
              disabled={isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Session...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Session
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {hasApplied && appliedResults.length > 0 && (
        <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
          <div className="flex items-center gap-2 text-green-300 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              Campaign Updated! ({appliedResults.filter(r => r.success).length} changes applied)
            </span>
          </div>
          <div className="space-y-1 text-sm text-green-200/80">
            {appliedResults.filter(r => r.success).map((r, i) => (
              <p key={i}>✓ {r.message}</p>
            ))}
          </div>
          {xpAmount > 0 && (
            <p className="mt-2 text-amber-300 text-sm">
              ⭐ {xpAmount} XP awarded per player
            </p>
          )}
        </div>
      )}

      {/* Review Content */}
      {review && (
        <Tabs defaultValue="story" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="story" className="gap-2">
              <Scroll className="w-4 h-4" />
              The Story
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-2">
              <Database className="w-4 h-4" />
              World Updates
              {review.updates.length > 0 && (
                <Badge className="ml-1 bg-teal-600 text-xs">
                  {review.updates.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: THE STORY */}
          <TabsContent value="story" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* Summary */}
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Scroll className="w-5 h-5 text-teal-400" />
                      Session Chronicle
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (isEditingSummary) {
                          setReview({ ...review, summary: editedSummary });
                        }
                        setIsEditingSummary(!isEditingSummary);
                      }}
                    >
                      {isEditingSummary ? (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isEditingSummary ? (
                      <Textarea
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        className="min-h-[200px] bg-slate-800 border-slate-600"
                      />
                    ) : (
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {review.summary}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Highlights */}
                {review.highlights.length > 0 && (
                  <Card className="bg-slate-900 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Star className="w-5 h-5 text-amber-400" />
                        Key Moments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {review.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300">
                            <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Open Threads */}
                {review.openThreads.length > 0 && (
                  <Card className="bg-slate-900 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ArrowRight className="w-5 h-5 text-purple-400" />
                        Unresolved Threads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {review.openThreads.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-400">
                            <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar - 1 column */}
              <div className="space-y-4">
                {/* XP Card */}
                <Card className="bg-slate-900 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-400 mb-2">XP Award</p>
                      <Input
                        type="number"
                        value={xpAmount}
                        onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
                        className="text-center text-2xl font-bold bg-slate-800 border-slate-600 text-amber-400 h-14"
                      />
                      <p className="text-xs text-slate-500 mt-2">per player</p>
                      {review.xpReason && (
                        <p className="text-xs text-slate-500 mt-2 italic px-2">
                          "{review.xpReason}"
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* NPCs */}
                {review.npcsEncountered.length > 0 && (
                  <Card className="bg-slate-900 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        NPCs Encountered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {review.npcsEncountered.map((npc, i) => (
                          <Badge key={i} variant="outline" className="border-blue-700 text-blue-300">
                            {npc}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Locations */}
                {review.locationsVisited.length > 0 && (
                  <Card className="bg-slate-900 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-400" />
                        Locations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {review.locationsVisited.map((loc, i) => (
                          <Badge key={i} variant="outline" className="border-green-700 text-green-300">
                            {loc}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Next Session */}
                {review.nextSessionHooks.length > 0 && (
                  <Card className="bg-slate-900 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        Next Session Ideas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {review.nextSessionHooks.map((hook, i) => (
                          <li key={i} className="text-slate-400">• {hook}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: WORLD UPDATES */}
          <TabsContent value="updates" className="mt-6">
            <div className="space-y-6">
              {/* Explanation */}
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-teal-400" />
                  Campaign Database Updates
                </h3>
                <p className="text-sm text-slate-400">
                  Based on session events, the AI identified these world state changes.
                  Review each update, uncheck any you don't want, then click Apply.
                </p>
              </div>

              {/* Updates List */}
              {review.updates.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No world state changes detected</p>
                  <p className="text-sm mt-1">
                    Log more events during your session (notes, combat, deaths) for better analysis
                  </p>
                </div>
              ) : (
                <>
                  {/* Selection Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                        className="border-slate-600 text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectNone}
                        className="border-slate-600 text-xs"
                      >
                        Select None
                      </Button>
                    </div>
                    <p className="text-sm text-slate-400">
                      {selectedUpdates.size} of {review.updates.filter(u => u.resolved).length} selected
                    </p>
                  </div>

                  <div className="h-[400px] overflow-y-auto">
                    <div className="space-y-3 pr-4">
                      {review.updates.map((update) => {
                        const Icon = UPDATE_ICONS[update.type] || Target;
                        const colorClass = UPDATE_COLORS[update.type] || 'text-slate-400 bg-slate-800 border-slate-700';
                        const isSelected = selectedUpdates.has(update.id);
                        const canApply = update.resolved;
                        const wasApplied = appliedResults.find(r => r.id === update.id);

                        return (
                          <div
                            key={update.id}
                            className={`p-4 rounded-lg border transition-all ${colorClass} ${
                              !canApply ? 'opacity-50' : ''
                            } ${isSelected && !hasApplied ? 'ring-2 ring-teal-500 ring-offset-1 ring-offset-slate-900' : ''} ${
                              wasApplied?.success ? 'border-green-500' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {!hasApplied ? (
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleUpdate(update.id)}
                                  disabled={!canApply}
                                  className="mt-1"
                                />
                              ) : wasApplied?.success ? (
                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                              ) : (
                                <div className="w-5 h-5" />
                              )}
                              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">
                                  {getUpdateTitle(update)}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                  {getUpdateDescription(update)}
                                </p>
                                {!canApply && (
                                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Entity "{update.entityName}" not found in database
                                  </p>
                                )}
                                {wasApplied && !wasApplied.success && (
                                  <p className="text-xs text-red-400 mt-2">
                                    Failed to apply: {wasApplied.error || 'Unknown error'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Apply Button */}
                  {!hasApplied && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div className="text-sm text-slate-400">
                        <p>{selectedUpdates.size} updates selected</p>
                        <p className="text-amber-400">{xpAmount} XP will be awarded</p>
                      </div>
                      <Button
                        onClick={applyUpdates}
                        disabled={isApplying || selectedUpdates.size === 0}
                        className="bg-teal-600 hover:bg-teal-700"
                        size="lg"
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Applying Changes...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Apply Selected Updates
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Post-Apply Actions */}
                  {hasApplied && (
                    <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-700">
                      <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-slate-600"
                      >
                        Close Review
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* No Review Yet */}
      {!review && !isLoading && (
        <div className="text-center py-16">
          <Sparkles className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Session Complete!</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Analyze this session to generate a chronicle summary and identify
            world state changes to apply to your campaign database.
          </p>
          <Button
            onClick={generateReview}
            disabled={isLoading}
            size="lg"
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Analyze Session
          </Button>
        </div>
      )}
    </div>
  );
}
