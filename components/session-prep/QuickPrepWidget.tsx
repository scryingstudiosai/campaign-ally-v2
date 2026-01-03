'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface QuickPrepWidgetProps {
  campaignId: string;
}

interface StoryThread {
  id: string;
  title: string;
  priority: string;
  is_urgent?: boolean;
  clock_current?: number;
  clock_max?: number;
}

export function QuickPrepWidget({ campaignId }: QuickPrepWidgetProps) {
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string[]>([]);

  useEffect(() => {
    const checkUrgent = async () => {
      try {
        const response = await fetch(`/api/story-threads?campaignId=${campaignId}&status=active`);
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const data = await response.json();

        const threads = (data.threads || []) as StoryThread[];
        const urgent = threads.filter((t) => {
          if (t.priority === 'critical') return true;
          if (t.clock_max && t.clock_current) {
            return t.clock_current / t.clock_max >= 0.75;
          }
          return false;
        });

        setCriticalCount(urgent.length);
        setPreview(urgent.slice(0, 2).map((t) => t.title));
      } catch (error) {
        console.error('Quick prep check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUrgent();
  }, [campaignId]);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-400" />
            Session Prep
          </span>
          {criticalCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {criticalCount} urgent
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking...
          </div>
        ) : criticalCount > 0 ? (
          <div className="space-y-2">
            {preview.map((title, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-red-400">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{title}</span>
              </div>
            ))}
            <Link href={`/dashboard/campaigns/${campaignId}/prep`}>
              <Button variant="outline" size="sm" className="w-full mt-2 border-zinc-700">
                View Full Prep
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">
            No urgent items.
            <Link
              href={`/dashboard/campaigns/${campaignId}/prep`}
              className="text-amber-400 ml-1 hover:underline"
            >
              Generate prep →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
