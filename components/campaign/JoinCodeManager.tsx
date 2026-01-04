'use client';

import { useState } from 'react';
import { Copy, RefreshCw, Users, Check, Eye, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface CampaignMember {
  id: string;
  role: 'player' | 'spectator' | 'co_dm';
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  entities: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
}

interface JoinCodeManagerProps {
  campaignId: string;
  initialJoinCode: string | null;
  members: CampaignMember[];
}

export function JoinCodeManager({ campaignId, initialJoinCode, members }: JoinCodeManagerProps) {
  const [joinCode, setJoinCode] = useState<string | null>(initialJoinCode);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [memberList, setMemberList] = useState<CampaignMember[]>(members);

  const supabase = createClient();

  const generateNewCode = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_join_code', {
        campaign_id: campaignId,
      });

      if (!error && data) {
        setJoinCode(data);
      }
    } catch (error) {
      console.error('Failed to generate join code:', error);
    }
    setIsLoading(false);
  };

  const copyJoinLink = () => {
    if (!joinCode) return;
    const link = `${window.location.origin}/join/${joinCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeMember = async (memberId: string) => {
    try {
      await supabase.from('campaign_members').delete().eq('id', memberId);
      setMemberList((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Join Code Section */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" />
            Player Join Code
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateNewCode}
            disabled={isLoading}
            className="text-xs text-slate-500 hover:text-white"
          >
            <RefreshCw className={cn('w-3 h-3 mr-1', isLoading && 'animate-spin')} />
            {joinCode ? 'Regenerate' : 'Generate'}
          </Button>
        </div>

        {joinCode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-800 px-4 py-3 rounded-lg font-mono text-lg text-teal-400 tracking-widest text-center">
                {joinCode}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyJoinLink}
                className="bg-slate-800 border-slate-700 hover:bg-slate-700 flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Share this code with your players to let them join the campaign
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-500 text-sm mb-3">
              Generate a join code to invite players to your campaign
            </p>
            <Button onClick={generateNewCode} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Generate Join Code
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Members List */}
      {memberList.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
          <h3 className="text-sm text-slate-400 uppercase tracking-wider mb-4">
            Campaign Members ({memberList.length})
          </h3>
          <div className="space-y-2">
            {memberList.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                  {member.entities?.image_url || member.profiles.avatar_url ? (
                    <img
                      src={member.entities?.image_url || member.profiles.avatar_url || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Users className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">
                      {member.entities?.name || member.profiles.display_name || 'Unknown'}
                    </span>
                    {member.role === 'spectator' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        <Eye className="w-3 h-3" />
                        Spectator
                      </span>
                    )}
                    {member.role === 'co_dm' && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                        Co-DM
                      </span>
                    )}
                  </div>
                  {member.entities?.name && member.profiles.display_name && (
                    <p className="text-xs text-slate-500 truncate">
                      Played by {member.profiles.display_name}
                    </p>
                  )}
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMember(member.id)}
                  className="flex-shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  <UserX className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {memberList.length === 0 && joinCode && (
        <div className="text-center py-6 text-slate-500">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No players have joined yet</p>
        </div>
      )}
    </div>
  );
}
