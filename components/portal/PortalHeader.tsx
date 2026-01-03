'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, LayoutDashboard, RefreshCw, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortalHeaderProps {
  campaign: { id: string; name: string };
  character: { id: string; name: string; image_url: string | null } | null;
  user: { id: string; email?: string };
  isSpectator?: boolean;
  hasDMCampaigns?: boolean;
}

export function PortalHeader({
  campaign,
  character,
  user,
  isSpectator = false,
  hasDMCampaigns = false,
}: PortalHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-sm border-b border-white/10">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Character avatar */}
          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
            {character?.image_url ? (
              <img
                src={character.image_url}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-lg font-display">
                {character?.name?.[0] || '?'}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-white font-display truncate">
              {character?.name || 'Spectator'}
            </h1>
            <p className="text-xs text-slate-500 truncate">{campaign.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Role badge */}
          {isSpectator && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
              Spectator
            </span>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-white truncate">
                  {user.email || 'Player'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {character?.name || 'No character'}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-slate-800" />

              {hasDMCampaigns && (
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 cursor-pointer text-slate-300 focus:text-white focus:bg-slate-800"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  DM Dashboard
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => router.push(`/portal/${campaign.id}/switch-character`)}
                className="flex items-center gap-2 cursor-pointer text-slate-300 focus:text-white focus:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Switch Character
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
