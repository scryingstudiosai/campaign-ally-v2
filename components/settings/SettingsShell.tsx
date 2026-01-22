'use client';

import { useState, useEffect, useRef } from 'react';
import { useSettings, UserSettings } from '@/hooks/useSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Loader2, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsShellProps {
  initialSettings?: UserSettings | null;
}

export function SettingsShell({ initialSettings }: SettingsShellProps) {
  const { settings, isLoading, isSaving, updateSettings } = useSettings();
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

  const handleSelectChange = async (field: keyof UserSettings, value: string) => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Theme</Label>
                  <p className="text-xs text-slate-500">
                    Choose your preferred color scheme
                  </p>
                </div>
                <Select
                  value={currentSettings?.theme || 'dark'}
                  onValueChange={(value) => handleSelectChange('theme', value)}
                >
                  <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
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
              <CardTitle className="text-lg">Content Generation</CardTitle>
              <CardDescription>
                Settings for AI-generated content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="generationMode">Default Generation Mode</Label>
                  <p className="text-xs text-slate-500">
                    Controls the verbosity of AI-generated content
                  </p>
                </div>
                <Select
                  value={currentSettings?.default_generation_mode || 'balanced'}
                  onValueChange={(value) =>
                    handleSelectChange('default_generation_mode', value)
                  }
                >
                  <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="verbose">Verbose</SelectItem>
                  </SelectContent>
                </Select>
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
                    Display the onboarding checklist on your dashboard
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
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Export</CardTitle>
              <CardDescription>
                Download your campaign data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-slate-600"
                onClick={() => toast.info('Export feature coming soon!')}
              >
                Export All Data
              </Button>
              <p className="mt-2 text-xs text-slate-500">
                Download all your campaigns, entities, and session logs
              </p>
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
                AI-powered campaign management for Dungeon Masters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-700">
                <span className="text-sm text-slate-400">Version</span>
                <span className="text-sm font-medium">v0.9.0 Beta</span>
              </div>

              <div className="space-y-3">
                <a
                  href="https://discord.gg/campaignally"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm">Discord Community</span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm">Documentation</span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm">Privacy Policy</span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm">Terms of Service</span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
