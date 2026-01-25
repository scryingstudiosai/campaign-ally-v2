'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsContext } from './SettingsContext';
import { UserSettings } from '@/hooks/useSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Check,
  ExternalLink,
  Info,
  ArrowLeft,
  MessageSquare,
  BookOpen,
  FileText,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface SettingsShellProps {
  initialSettings?: UserSettings | null;
}

export function SettingsShell({ initialSettings }: SettingsShellProps) {
  const router = useRouter();
  // Use context to share state with dashboard
  const { settings, isLoading, updateSettings, markOnboardingComplete } = useSettingsContext();
  const [displayName, setDisplayName] = useState('');
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Use server-side initial settings if available, otherwise use client-fetched
  const currentSettings = settings || initialSettings;

  // Sync display name from settings
  useEffect(() => {
    if (currentSettings?.display_name) {
      setDisplayName(currentSettings.display_name);
    }
  }, [currentSettings?.display_name]);

  // Show save indicator animation
  const showSaveIndicator = () => {
    setSaveIndicator('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setSaveIndicator('saved');
      saveTimeoutRef.current = setTimeout(() => {
        setSaveIndicator('idle');
      }, 2000);
    }, 500);
  };

  const handleDisplayNameBlur = async () => {
    if (displayName !== currentSettings?.display_name) {
      showSaveIndicator();
      await updateSettings({ display_name: displayName || null }, false);
    }
  };

  const handleToggle = async (field: keyof UserSettings, value: boolean) => {
    showSaveIndicator();
    await updateSettings({ [field]: value }, false);
  };

  if (isLoading && !initialSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
          <p className="text-sm text-slate-400">
            Manage your preferences and account settings
          </p>
        </div>
        {saveIndicator !== 'idle' && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {saveIndicator === 'saving' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-teal-400" />
                <span className="text-teal-400">Saved</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>
                Your personal information and display settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={handleDisplayNameBlur}
                  className="max-w-sm bg-slate-800 border-slate-700"
                />
                <p className="text-xs text-slate-500">
                  This is how you&apos;ll appear across the app
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>
                Customize how the app looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme - Coming Soon */}
              <div className="flex items-center justify-between opacity-50">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    Theme
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                      Coming Soon
                    </span>
                  </Label>
                  <p className="text-xs text-slate-500">
                    Dark mode only for now
                  </p>
                </div>
                <div className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-slate-400">
                  Dark
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduceMotion">Reduce Motion</Label>
                  <p className="text-xs text-slate-500">
                    Minimize animations throughout the app
                  </p>
                </div>
                <Switch
                  id="reduceMotion"
                  checked={currentSettings?.reduce_motion ?? false}
                  onCheckedChange={(checked) => handleToggle('reduce_motion', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Dashboard</CardTitle>
              <CardDescription>
                Customize your dashboard experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showGettingStarted">Show Getting Started</Label>
                  <p className="text-xs text-slate-500">
                    Display the onboarding checklist on campaign pages
                  </p>
                </div>
                <Switch
                  id="showGettingStarted"
                  checked={currentSettings?.show_getting_started ?? true}
                  onCheckedChange={(checked) =>
                    handleToggle('show_getting_started', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Generation Note */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">
                    AI generation preferences are configured per-campaign in the{' '}
                    <Link href="/dashboard" className="text-teal-400 hover:underline">
                      Codex
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Export Campaign</CardTitle>
              <CardDescription>
                Download your campaign data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-3">
                Export your campaign data from the Campaign Overview page. Each campaign
                can be exported individually with all its entities, sessions, and notes.
              </p>
              <Button
                variant="outline"
                className="border-slate-600"
                asChild
              >
                <Link
                  href="/dashboard"
                  onClick={() => markOnboardingComplete('export_campaign')}
                >
                  Go to Campaigns
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-red-900/30">
            <CardHeader>
              <CardTitle className="text-lg text-red-400">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete All Campaigns</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all
                      your campaigns, entities, sessions, and related data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 border-slate-700">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => toast.info('This feature is not yet implemented')}
                    >
                      Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="mt-2 text-xs text-slate-500">
                Permanently delete all campaigns and associated data
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Campaign Ally</CardTitle>
              <CardDescription>
                Your AI-powered co-pilot for tabletop RPG campaign management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-400">
                Create NPCs, locations, factions, and more with intelligent world-building
                tools that remember your campaign&apos;s context. Built for Dungeon Masters
                who want to spend less time on prep and more time on play.
              </p>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Version 0.9.0 Beta</span>
                <span>•</span>
                <span>Built by Scrying Studios</span>
              </div>

              <div className="border-t border-slate-700 pt-6 space-y-3">
                <h3 className="font-medium text-slate-200 mb-3">Resources</h3>

                <a
                  href="https://discord.gg/hWpQ8SzC3u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-200">Discord Community</div>
                    <div className="text-xs text-slate-500">Join for support and feedback</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>

                <a
                  href="https://campaignally.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-teal-400" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-200">Documentation</div>
                    <div className="text-xs text-slate-500">Learn how to use Campaign Ally</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>

                <a
                  href="https://campaignally.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-200">Terms of Service</div>
                    <div className="text-xs text-slate-500">Read our terms</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>

                <a
                  href="https://campaignally.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <Shield className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-200">Privacy Policy</div>
                    <div className="text-xs text-slate-500">How we handle your data</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <h3 className="font-medium text-slate-200 mb-3">Feedback</h3>
                <p className="text-sm text-slate-500 mb-3">
                  Have suggestions or found a bug? We&apos;d love to hear from you!
                </p>
                <Button variant="outline" className="border-slate-600" asChild>
                  <a
                    href="https://discord.gg/hWpQ8SzC3u"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Share Feedback
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
