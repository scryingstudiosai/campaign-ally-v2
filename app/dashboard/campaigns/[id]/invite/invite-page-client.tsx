'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MaterialCard } from '@/components/ui/material-card'
import { toast } from 'sonner'
import { useSettingsContext } from '@/components/settings/SettingsContext'
import {
  ArrowLeft,
  UserPlus,
  Copy,
  Check,
  Mail,
  MessageSquare,
  QrCode,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
} from 'lucide-react'

interface InvitePageClientProps {
  campaignId: string
  campaignName: string
  joinCode: string | null
  inviteUrl: string | null
}

export function InvitePageClient({
  campaignId,
  campaignName,
  joinCode: initialJoinCode,
  inviteUrl: initialInviteUrl,
}: InvitePageClientProps) {
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState(initialJoinCode)
  const [inviteUrl, setInviteUrl] = useState(initialInviteUrl)
  const [generating, setGenerating] = useState(false)
  const { markOnboardingComplete } = useSettingsContext()

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      // Mark onboarding task complete
      await markOnboardingComplete('invite_player')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleGenerateCode = async () => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/join-code`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to generate code')
      const data = await response.json()
      setJoinCode(data.join_code)
      const baseUrl = window.location.origin
      setInviteUrl(`${baseUrl}/join/${data.join_code}`)
      toast.success('Invite code generated!')
    } catch {
      toast.error('Failed to generate invite code')
    } finally {
      setGenerating(false)
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Join my D&D campaign: ${campaignName}`)
    const body = encodeURIComponent(
      `Hey!\n\nI'd like to invite you to join my D&D campaign "${campaignName}" on Campaign Ally.\n\n` +
        `Click this link to join: ${inviteUrl}\n\n` +
        `See you at the table!`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }

  const handleSmsShare = () => {
    const message = encodeURIComponent(
      `Join my D&D campaign "${campaignName}" on Campaign Ally: ${inviteUrl}`
    )
    // SMS URI scheme works on mobile
    window.open(`sms:?body=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen text-foreground p-6" style={{ backgroundColor: 'var(--ca-bg-base)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/campaigns/${campaignId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {campaignName}
          </Link>
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30">
            <UserPlus className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Invite Players</h1>
            <p className="text-slate-400 text-sm">Share your campaign with your party</p>
          </div>
        </div>

        {/* Invite Link Card */}
        <MaterialCard className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-teal-400" />
            <h2 className="font-display font-semibold text-white">Campaign Invite Link</h2>
          </div>

          {inviteUrl ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg font-mono text-sm text-slate-300 truncate">
                  {inviteUrl}
                </div>
                <Button
                  onClick={() => handleCopy(inviteUrl)}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Join Code:</span>
                <code className="px-2 py-0.5 bg-slate-800 rounded text-teal-400 font-mono">
                  {joinCode}
                </code>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 mb-4">
                Generate an invite link to share with your players
              </p>
              <Button onClick={handleGenerateCode} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Invite Link
                  </>
                )}
              </Button>
            </div>
          )}
        </MaterialCard>

        {/* Share Options */}
        {inviteUrl && (
          <MaterialCard className="p-6 mb-6">
            <h2 className="font-display font-semibold text-white mb-4">Share Via</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Copy Link */}
              <button
                onClick={() => handleCopy(inviteUrl)}
                className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-teal-500/30 hover:bg-slate-800 transition-all text-left"
              >
                <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30">
                  <Copy className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Copy Link</p>
                  <p className="text-xs text-slate-500">Copy to clipboard</p>
                </div>
              </button>

              {/* Email */}
              <button
                onClick={handleEmailShare}
                className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/30 hover:bg-slate-800 transition-all text-left"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Email</p>
                  <p className="text-xs text-slate-500">Send via email</p>
                </div>
              </button>

              {/* SMS/Text */}
              <button
                onClick={handleSmsShare}
                className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-green-500/30 hover:bg-slate-800 transition-all text-left"
              >
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Text / SMS</p>
                  <p className="text-xs text-slate-500">Send via text message</p>
                </div>
              </button>

              {/* QR Code - Coming Soon */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 opacity-60 cursor-not-allowed">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <QrCode className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">QR Code</p>
                  <p className="text-xs text-slate-500">Coming Soon</p>
                </div>
              </div>
            </div>
          </MaterialCard>
        )}

        {/* Info Card */}
        <MaterialCard className="p-4 bg-slate-800/30">
          <p className="text-sm text-slate-400">
            When players join using your invite link, they&apos;ll be able to access the Player Portal
            where they can view their character sheet, session notes, and campaign information you
            choose to share with them.
          </p>
        </MaterialCard>
      </div>
    </div>
  )
}
