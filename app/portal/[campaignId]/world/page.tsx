import { createClient } from '@/lib/supabase/server';
import { Globe, MapPin, Users, Flag } from 'lucide-react';
import Link from 'next/link';

interface WorldPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function WorldPage({ params }: WorldPageProps) {
  const { campaignId } = await params;
  const supabase = await createClient();

  // Fetch public entities (locations, factions, notable NPCs)
  const { data: locations } = await supabase
    .from('entities')
    .select('id, name, summary, image_url')
    .eq('campaign_id', campaignId)
    .eq('entity_type', 'location')
    .eq('is_public', true)
    .order('name')
    .limit(10);

  const { data: factions } = await supabase
    .from('entities')
    .select('id, name, summary, image_url')
    .eq('campaign_id', campaignId)
    .eq('entity_type', 'faction')
    .eq('is_public', true)
    .order('name')
    .limit(10);

  const { data: npcs } = await supabase
    .from('entities')
    .select('id, name, summary, image_url')
    .eq('campaign_id', campaignId)
    .eq('entity_type', 'npc')
    .eq('is_public', true)
    .order('name')
    .limit(10);

  const hasContent = (locations?.length || 0) + (factions?.length || 0) + (npcs?.length || 0) > 0;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-display text-white">World</h2>
      </div>

      {!hasContent ? (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-display text-slate-300 mb-2">
            World Unexplored
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto text-sm">
            The DM hasn&apos;t revealed any public world information yet.
            Check back after your first session!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Locations */}
          {locations && locations.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm text-slate-400 uppercase tracking-wider">Locations</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {locations.map((location) => (
                  <Link
                    key={location.id}
                    href={`/portal/${campaignId}/world/location/${location.id}`}
                    className="bg-slate-900/50 rounded-xl p-3 border border-white/5 hover:border-emerald-500/30 transition-colors"
                  >
                    {location.image_url ? (
                      <div className="w-full h-20 rounded-lg overflow-hidden mb-2">
                        <img
                          src={location.image_url}
                          alt={location.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-20 rounded-lg bg-slate-800 mb-2 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-slate-700" />
                      </div>
                    )}
                    <h4 className="text-white font-display text-sm truncate">
                      {location.name}
                    </h4>
                    {location.summary && (
                      <p className="text-slate-500 text-xs line-clamp-1">
                        {location.summary}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Factions */}
          {factions && factions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Flag className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm text-slate-400 uppercase tracking-wider">Factions</h3>
              </div>
              <div className="space-y-2">
                {factions.map((faction) => (
                  <Link
                    key={faction.id}
                    href={`/portal/${campaignId}/world/faction/${faction.id}`}
                    className="flex items-center gap-3 bg-slate-900/50 rounded-xl p-3 border border-white/5 hover:border-purple-500/30 transition-colors"
                  >
                    {faction.image_url ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={faction.image_url}
                          alt={faction.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center">
                        <Flag className="w-5 h-5 text-slate-700" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-display text-sm truncate">
                        {faction.name}
                      </h4>
                      {faction.summary && (
                        <p className="text-slate-500 text-xs line-clamp-1">
                          {faction.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Notable NPCs */}
          {npcs && npcs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm text-slate-400 uppercase tracking-wider">Notable People</h3>
              </div>
              <div className="space-y-2">
                {npcs.map((npc) => (
                  <Link
                    key={npc.id}
                    href={`/portal/${campaignId}/world/npc/${npc.id}`}
                    className="flex items-center gap-3 bg-slate-900/50 rounded-xl p-3 border border-white/5 hover:border-blue-500/30 transition-colors"
                  >
                    {npc.image_url ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={npc.image_url}
                          alt={npc.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-700" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-display text-sm truncate">
                        {npc.name}
                      </h4>
                      {npc.summary && (
                        <p className="text-slate-500 text-xs line-clamp-1">
                          {npc.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
