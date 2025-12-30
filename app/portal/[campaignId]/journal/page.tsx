import { BookOpen, Calendar, PenLine } from 'lucide-react';

interface JournalPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function JournalPage({ params }: JournalPageProps) {
  // We'll fetch journal entries in Sprint 2

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display text-white">Journal</h2>
        <button
          className="flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
          disabled
        >
          <PenLine className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-display text-slate-300 mb-2">
          Your Adventure Awaits
        </h3>
        <p className="text-slate-500 max-w-sm mx-auto text-sm">
          Record your thoughts, track important events, and document your journey through the campaign.
        </p>
      </div>

      {/* Sample Entry Placeholder */}
      <div className="space-y-3 opacity-50">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Calendar className="w-3 h-3" />
            <span>Session 1 • Example Entry</span>
          </div>
          <h4 className="text-white font-display mb-1">The Journey Begins</h4>
          <p className="text-slate-400 text-sm line-clamp-2">
            Our party met at the tavern in the small village of Thornwick.
            Little did we know what adventures awaited us...
          </p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-slate-500 text-sm bg-slate-900/50 px-4 py-2 rounded-full">
          <BookOpen className="w-4 h-4" />
          Journal entries coming in Sprint 2
        </div>
      </div>
    </div>
  );
}
