'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, RefreshCw, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TacticalProfileData {
  strengths?: string[];
  weaknesses?: string[];
  tags?: string[];
  analyzed_at?: string;
}

interface PartyMember {
  entities: {
    id: string;
    name: string;
    soul: Record<string, unknown> | null;
    mechanics: Record<string, unknown> | null;
  } | null;
}

interface TacticalProfileProps {
  campaignId: string;
  profile: TacticalProfileData | undefined;
  members: PartyMember[];
  onUpdate: () => void;
}

export function TacticalProfile({ campaignId, profile, members, onUpdate }: TacticalProfileProps) {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeParty = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      toast.success('Party analyzed!');
      onUpdate();

    } catch (error) {
      console.error('Failed to analyze party:', error);
      toast.error('Failed to analyze party');
    } finally {
      setAnalyzing(false);
    }
  };

  const strengths = profile?.strengths || [];
  const weaknesses = profile?.weaknesses || [];
  const tags = profile?.tags || [];

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          Tactical Profile
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={analyzeParty}
          disabled={analyzing || members.length === 0}
        >
          {analyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {profile ? 'Re-analyze' : 'Analyze Party'}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!profile ? (
          <div className="text-center py-6 text-zinc-500">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tactical analysis yet</p>
            <p className="text-sm">Click &quot;Analyze Party&quot; to generate insights</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, i: number) => (
                  <Badge key={i} className="bg-purple-600">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4">
              {/* Strengths */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Strengths</span>
                </div>
                <div className="space-y-1">
                  {strengths.map((s: string, i: number) => (
                    <Badge key={i} variant="outline" className="border-emerald-600 text-emerald-400 mr-1">
                      {s}
                    </Badge>
                  ))}
                  {strengths.length === 0 && (
                    <span className="text-xs text-zinc-500">None identified</span>
                  )}
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Weaknesses</span>
                </div>
                <div className="space-y-1">
                  {weaknesses.map((w: string, i: number) => (
                    <Badge key={i} variant="outline" className="border-red-600 text-red-400 mr-1">
                      {w}
                    </Badge>
                  ))}
                  {weaknesses.length === 0 && (
                    <span className="text-xs text-zinc-500">None identified</span>
                  )}
                </div>
              </div>
            </div>

            {/* Last analyzed */}
            {profile.analyzed_at && (
              <p className="text-xs text-zinc-600">
                Last analyzed: {new Date(profile.analyzed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
