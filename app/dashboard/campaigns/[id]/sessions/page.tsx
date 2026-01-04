'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Calendar, Clock, Play, CheckCircle,
  FileText, Search, ChevronRight, Swords
} from 'lucide-react';
import Link from 'next/link';

interface Session {
  id: string;
  name: string;
  status: 'planning' | 'active' | 'completed';
  session_number: number;
  scheduled_date?: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  created_at: string;
  combat_state?: { isActive?: boolean };
}

export default function SessionsListPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [campaignId]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions?campaignId=${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
    setIsLoading(false);
  };

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const nextNumber = sessions.length > 0
        ? Math.max(...sessions.map(s => s.session_number || 0)) + 1
        : 1;

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          name: `Session ${nextNumber}`,
          session_number: nextNumber,
          status: 'planning',
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        router.push(`/dashboard/campaigns/${campaignId}/sessions/${newSession.id}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    setIsCreating(false);
  };

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string, hasCombat: boolean) => {
    if (hasCombat) {
      return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-red-900/50 text-red-300 flex items-center gap-1">
          <Swords className="w-3 h-3" />
          In Combat
        </span>
      );
    }

    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/50 text-green-300">
            Live
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-900/50 text-blue-300">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">
            Planning
          </span>
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Sessions</h1>
            <p className="text-slate-400 mt-1">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} in this campaign
            </p>
          </div>
          <Button
            onClick={handleCreateSession}
            disabled={isCreating}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="pl-10 bg-slate-900 border-slate-700"
          />
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">
              {searchQuery ? 'No sessions match your search' : 'No sessions yet'}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleCreateSession}
                variant="outline"
                className="mt-4 border-slate-600"
              >
                Create your first session
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions
              .sort((a, b) => (b.session_number || 0) - (a.session_number || 0))
              .map(session => (
                <Link
                  key={session.id}
                  href={`/dashboard/campaigns/${campaignId}/sessions/${session.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-800/50 transition-all group">
                    {/* Status Icon */}
                    <div className="p-2 bg-slate-800 rounded-lg">
                      {getStatusIcon(session.status)}
                    </div>

                    {/* Session Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-white truncate">
                          {session.name}
                        </h3>
                        {getStatusBadge(session.status, !!session.combat_state?.isActive)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        {session.scheduled_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(session.scheduled_date)}
                          </span>
                        )}
                        {session.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.duration_minutes)}
                          </span>
                        )}
                        {!session.scheduled_date && !session.duration_minutes && (
                          <span>Created {formatDate(session.created_at)}</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
