'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dice6, Users, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WelcomePage() {
  const router = useRouter();
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDMPath = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          has_seen_welcome: true,
          primary_role: 'dm',
        });
      }

      router.push('/dashboard/onboarding');
    } catch (error) {
      console.error('Error saving preferences:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerPath = () => {
    setShowInviteInput(true);
  };

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          has_seen_welcome: true,
          primary_role: 'player',
        });
      }

      // Redirect to join page with code
      router.push(`/join/${inviteCode.trim().toUpperCase()}`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process';
      toast.error(message);
      setLoading(false);
    }
  };

  const handleSkipForNow = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          has_seen_welcome: true,
          primary_role: 'player',
        });
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <Dice6 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome to Campaign Ally</h1>
          <p className="text-slate-400 mt-2">Your AI-powered TTRPG companion</p>
        </div>

        {!showInviteInput ? (
          <>
            {/* Role Selection */}
            <div className="space-y-4">
              <p className="text-center text-slate-300">How will you be using the app?</p>

              {/* DM Option */}
              <Card
                className="bg-slate-900 border-slate-800 hover:border-teal-500/50 transition-colors cursor-pointer group"
                onClick={!loading ? handleDMPath : undefined}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-teal-900/30 flex items-center justify-center group-hover:bg-teal-900/50 transition-colors">
                      <Dice6 className="h-7 w-7 text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">I'm a Dungeon Master</h3>
                      <p className="text-sm text-slate-400">Create and run campaigns with AI assistance</p>
                    </div>
                    {loading ? (
                      <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
                    ) : (
                      <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-teal-400 transition-colors" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Player Option */}
              <Card
                className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer group"
                onClick={!loading ? handlePlayerPath : undefined}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-900/50 transition-colors">
                      <Users className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">I'm a Player</h3>
                      <p className="text-sm text-slate-400">Join a friend's campaign</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-xs text-slate-500">
              You can always do both! DMs can join other campaigns as players too.
            </p>
          </>
        ) : (
          <>
            {/* Invite Code Input */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Join a Campaign</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Enter the invite code from your Dungeon Master
                  </p>
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="bg-slate-800 border-slate-700 text-center text-lg tracking-wider uppercase"
                    maxLength={20}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
                    disabled={loading}
                  />

                  <Button
                    onClick={handleJoinWithCode}
                    disabled={loading || !inviteCode.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Join Campaign'
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-900 px-3 text-xs text-slate-500">or</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setShowInviteInput(false)}
                  className="w-full text-slate-400"
                  disabled={loading}
                >
                  Back to options
                </Button>
              </CardContent>
            </Card>

            <button
              onClick={handleSkipForNow}
              disabled={loading}
              className="block w-full text-center text-sm text-slate-500 hover:text-slate-300 disabled:opacity-50"
            >
              I don't have a code yet, skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
