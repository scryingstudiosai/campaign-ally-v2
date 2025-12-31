'use client';

import { CheckCircle, Plus, ArrowRight, Users, MapPin, Package, Scroll, Shield, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ImportCompleteProps {
  stats: {
    created: number;
    merged: number;
    ignored: number;
  };
  campaignId: string;
  onImportMore: () => void;
}

export function ImportComplete({ stats, campaignId, onImportMore }: ImportCompleteProps) {
  const total = stats.created + stats.merged;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Import Complete!
        </h1>
        <p className="text-slate-400 mb-8">
          Your campaign world just got bigger
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/50 rounded-lg border border-green-500/30 p-4">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {stats.created}
            </div>
            <div className="text-xs text-slate-400">Created</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg border border-blue-500/30 p-4">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {stats.merged}
            </div>
            <div className="text-xs text-slate-400">Merged</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
            <div className="text-3xl font-bold text-slate-400 mb-1">
              {stats.ignored}
            </div>
            <div className="text-xs text-slate-400">Ignored</div>
          </div>
        </div>

        {/* Entity Icons Animation */}
        {total > 0 && (
          <div className="flex items-center justify-center gap-3 mb-8 opacity-60">
            <Users className="w-5 h-5 text-blue-400" />
            <MapPin className="w-5 h-5 text-green-400" />
            <Package className="w-5 h-5 text-amber-400" />
            <Scroll className="w-5 h-5 text-purple-400" />
            <Shield className="w-5 h-5 text-red-400" />
            <Skull className="w-5 h-5 text-orange-400" />
          </div>
        )}

        {/* Summary Message */}
        <div className="bg-slate-900/30 rounded-lg border border-slate-800 p-4 mb-8">
          <p className="text-sm text-slate-300">
            {total === 0 ? (
              'No entities were imported this time.'
            ) : total === 1 ? (
              '1 entity has been added to your campaign library.'
            ) : (
              `${total} entities have been added to your campaign library.`
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={onImportMore}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Import More
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-cyan-600"
          >
            <Link href={`/dashboard/campaigns/${campaignId}`}>
              Go to Campaign
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* View Library Link */}
        <div className="mt-6">
          <Link
            href={`/dashboard/campaigns/${campaignId}/library`}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            View your entity library →
          </Link>
        </div>
      </div>
    </div>
  );
}
