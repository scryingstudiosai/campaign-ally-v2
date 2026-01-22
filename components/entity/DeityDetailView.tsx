'use client';

import { useState } from 'react';
import {
  Crown,
  Sun,
  Scroll,
  Star,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Flame,
  Zap,
  Users,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Expandable } from '@/components/ui/motion';
import { toast } from 'sonner';

interface DeityDetailViewProps {
  deity: {
    id: string;
    name: string;
    sub_type?: string;
    soul?: {
      titles?: string[];
      portfolio?: {
        domains?: string[];
        alignment?: string;
        symbol?: string;
        favored_weapon?: string;
        holy_day?: string;
        sacred_colors?: string[];
        sacred_animal?: string;
      };
      manifestation?: string;
      personality?: string;
      voice?: string;
      tenets?: string[];
      prayers?: {
        invocation?: string;
        blessing?: string;
        oath?: string;
      };
      worship?: {
        followers?: string;
        clergy_title?: string;
        temple_style?: string;
        rituals?: string[];
        offerings?: string[];
        taboos?: string[];
      };
    };
    brain?: {
      true_nature?: string;
      divine_agenda?: string;
      secrets?: string;
      conflicts?: string;
      weaknesses?: string;
      hooks?: string[];
      divine_signals?: {
        distance?: string;
        omens?: {
          watching?: string[];
          pleased?: string[];
          angry?: string[];
        };
        boons?: { trigger: string; effect: string }[];
        curses?: { trigger: string; effect: string }[];
      };
    };
    mechanics?: {
      cleric_domains?: string[];
      channel_divinity?: string;
      sacred_spells?: string[];
      suggested_classes?: string[];
    };
    attributes?: {
      rank?: string;
    };
  };
  campaignId: string;
}

export function DeityDetailView({ deity, campaignId }: DeityDetailViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['portfolio', 'tenets', 'worship', 'signals', 'mechanics'])
  );
  const [showDmContent, setShowDmContent] = useState(true);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${field} copied!`);
  };

  const soul = deity.soul || {};
  const brain = deity.brain || {};
  const mechanics = deity.mechanics || {};
  const portfolio = soul.portfolio || {};
  const prayers = soul.prayers || {};
  const worship = soul.worship || {};
  const signals = brain.divine_signals || {};
  const omens = signals.omens || {};

  const rank = deity.attributes?.rank || deity.sub_type || 'deity';
  const rankLabel = rank.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header with Titles and Badges */}
      <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-amber-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
              <Crown className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              {/* Titles */}
              {soul.titles && soul.titles.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {soul.titles.map((title, i) => (
                    <span key={i} className="text-sm text-purple-300/80 italic">
                      {title}{i < soul.titles!.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                  {rankLabel}
                </Badge>
                {portfolio.alignment && (
                  <Badge variant="outline" className="text-slate-400 border-slate-600">
                    {portfolio.alignment}
                  </Badge>
                )}
                {portfolio.domains?.map((domain, i) => (
                  <Badge key={i} variant="outline" className="text-amber-400 border-amber-500/30">
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDmContent(!showDmContent)}
          >
            {showDmContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="ml-2">{showDmContent ? 'Hide' : 'Show'} DM Content</span>
          </Button>
        </div>
      </div>

      {/* Holy Symbol */}
      {portfolio.symbol && (
        <div className="p-4 bg-purple-500/5 border-l-4 border-purple-500 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
            <Sun className="w-4 h-4" /> Holy Symbol
          </h3>
          <p className="text-slate-200 text-lg">{portfolio.symbol}</p>
        </div>
      )}

      {/* Portfolio Card */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('portfolio')}
          className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
        >
          <h3 className="text-sm font-semibold text-slate-300 uppercase flex items-center gap-2">
            Portfolio
          </h3>
          {expandedSections.has('portfolio') ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>
        <Expandable isOpen={expandedSections.has('portfolio')}>
          <div className="p-4 border-t border-slate-700 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {portfolio.favored_weapon && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Favored Weapon</h4>
                  <p className="text-slate-300">{portfolio.favored_weapon}</p>
                </div>
              )}
              {portfolio.holy_day && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Holy Day</h4>
                  <p className="text-slate-300">{portfolio.holy_day}</p>
                </div>
              )}
              {portfolio.sacred_colors && portfolio.sacred_colors.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Sacred Colors</h4>
                  <div className="flex gap-2 flex-wrap">
                    {portfolio.sacred_colors.map((color, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-sm">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {portfolio.sacred_animal && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Sacred Animal</h4>
                  <p className="text-slate-300">{portfolio.sacred_animal}</p>
                </div>
              )}
            </div>

            {soul.manifestation && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Manifestation</h4>
                <p className="text-slate-300 leading-relaxed">{soul.manifestation}</p>
              </div>
            )}

            {soul.personality && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Personality</h4>
                <p className="text-slate-300 leading-relaxed">{soul.personality}</p>
              </div>
            )}

            {soul.voice && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Divine Voice</h4>
                <p className="text-slate-300 leading-relaxed italic">{soul.voice}</p>
              </div>
            )}
          </div>
        </Expandable>
      </div>

      {/* Tenets & Prayers */}
      {(soul.tenets?.length || prayers.invocation || prayers.blessing || prayers.oath) && (
        <div className="border border-purple-500/20 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('tenets')}
            className="w-full flex items-center justify-between p-4 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
          >
            <h3 className="text-sm font-semibold text-purple-400 uppercase flex items-center gap-2">
              <Scroll className="w-4 h-4" /> Tenets & Prayers
            </h3>
            {expandedSections.has('tenets') ? (
              <ChevronDown className="w-4 h-4 text-purple-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-purple-400" />
            )}
          </button>
          <Expandable isOpen={expandedSections.has('tenets')}>
            <div className="p-4 border-t border-purple-500/20 space-y-4">
              {/* Tenets */}
              {soul.tenets && soul.tenets.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-purple-400 uppercase mb-3">Sacred Tenets</h4>
                  <div className="space-y-2">
                    {soul.tenets.map((tenet, i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-800/50 rounded-lg border-l-4 border-purple-500/50"
                      >
                        <span className="text-purple-400 font-bold mr-2">{i + 1}.</span>
                        <span className="text-slate-200">{tenet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prayers */}
              {(prayers.invocation || prayers.blessing || prayers.oath) && (
                <div>
                  <h4 className="text-xs font-semibold text-amber-400 uppercase mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" /> Prayers
                    <span className="text-xs font-normal text-slate-500">(for players to speak)</span>
                  </h4>
                  <div className="space-y-3">
                    {prayers.invocation && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-amber-400 uppercase">Invocation</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(prayers.invocation!, 'Invocation')}
                            className="h-6 w-6 p-0"
                          >
                            {copiedField === 'Invocation' ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-slate-200 italic">&ldquo;{prayers.invocation}&rdquo;</p>
                      </div>
                    )}

                    {prayers.blessing && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-amber-400 uppercase">Blessing</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(prayers.blessing!, 'Blessing')}
                            className="h-6 w-6 p-0"
                          >
                            {copiedField === 'Blessing' ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-slate-200 italic">&ldquo;{prayers.blessing}&rdquo;</p>
                      </div>
                    )}

                    {prayers.oath && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-amber-400 uppercase">Oath</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(prayers.oath!, 'Oath')}
                            className="h-6 w-6 p-0"
                          >
                            {copiedField === 'Oath' ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-slate-200 italic">&ldquo;{prayers.oath}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Expandable>
        </div>
      )}

      {/* Worship Section */}
      {(worship.followers || worship.clergy_title || worship.temple_style ||
        worship.rituals?.length || worship.offerings?.length || worship.taboos?.length) && (
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('worship')}
            className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
          >
            <h3 className="text-sm font-semibold text-slate-300 uppercase flex items-center gap-2">
              <Users className="w-4 h-4" /> Worship
            </h3>
            {expandedSections.has('worship') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          <Expandable isOpen={expandedSections.has('worship')}>
            <div className="p-4 border-t border-slate-700 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {worship.followers && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Followers</h4>
                    <p className="text-slate-300">{worship.followers}</p>
                  </div>
                )}
                {worship.clergy_title && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Clergy Title</h4>
                    <p className="text-slate-300 font-medium text-lg">{worship.clergy_title}</p>
                  </div>
                )}
              </div>

              {worship.temple_style && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Temple Style</h4>
                  <p className="text-slate-300 leading-relaxed">{worship.temple_style}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {worship.rituals && worship.rituals.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Rituals</h4>
                    <ul className="space-y-1">
                      {worship.rituals.map((ritual, i) => (
                        <li key={i} className="text-slate-300 flex items-start gap-2">
                          <span className="text-purple-400">*</span>
                          {ritual}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {worship.offerings && worship.offerings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Offerings</h4>
                    <ul className="space-y-1">
                      {worship.offerings.map((offering, i) => (
                        <li key={i} className="text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400">*</span>
                          {offering}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {worship.taboos && worship.taboos.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">Taboos</h4>
                  <ul className="space-y-1">
                    {worship.taboos.map((taboo, i) => (
                      <li key={i} className="text-slate-300 flex items-start gap-2">
                        <span className="text-red-400">X</span>
                        {taboo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Expandable>
        </div>
      )}

      {/* Divine Signals Section */}
      {(signals.distance || omens.watching?.length || omens.pleased?.length ||
        omens.angry?.length || signals.boons?.length || signals.curses?.length) && (
        <div className="border border-teal-500/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('signals')}
            className="w-full flex items-center justify-between p-4 bg-teal-500/10 hover:bg-teal-500/15 transition-colors"
          >
            <h3 className="text-sm font-semibold text-teal-400 uppercase flex items-center gap-2">
              Divine Signals
            </h3>
            {expandedSections.has('signals') ? (
              <ChevronDown className="w-4 h-4 text-teal-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-teal-400" />
            )}
          </button>
          <Expandable isOpen={expandedSections.has('signals')}>
            <div className="p-4 border-t border-teal-500/20 space-y-4">
              {/* Distance Indicator */}
              {signals.distance && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">Divine Involvement:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    signals.distance === 'interventionist'
                      ? 'bg-green-500/20 text-green-400'
                      : signals.distance === 'symbolic'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {signals.distance.charAt(0).toUpperCase() + signals.distance.slice(1)}
                  </span>
                </div>
              )}

              {/* Omens */}
              {(omens.watching?.length || omens.pleased?.length || omens.angry?.length) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-teal-400 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Omens
                    <span className="text-xs font-normal text-slate-500">(Read Aloud)</span>
                  </h4>

                  {omens.watching && omens.watching.length > 0 && (
                    <div className="p-4 bg-teal-500/5 border border-teal-500/30 rounded-lg">
                      <h5 className="text-xs font-semibold text-teal-400 uppercase mb-2">
                        When {deity.name} is Watching...
                      </h5>
                      <ul className="space-y-2">
                        {omens.watching.map((omen, i) => (
                          <li key={i} className="text-slate-300 flex items-start gap-2">
                            <span className="text-teal-400">*</span>
                            <span className="italic">{omen}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {omens.pleased && omens.pleased.length > 0 && (
                    <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
                      <h5 className="text-xs font-semibold text-green-400 uppercase mb-2">
                        Signs of Divine Favor...
                      </h5>
                      <ul className="space-y-2">
                        {omens.pleased.map((omen, i) => (
                          <li key={i} className="text-slate-300 flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="italic">{omen}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {omens.angry && omens.angry.length > 0 && (
                    <div className="p-4 bg-red-500/5 border border-red-500/30 rounded-lg">
                      <h5 className="text-xs font-semibold text-red-400 uppercase mb-2">
                        Signs of Divine Displeasure...
                      </h5>
                      <ul className="space-y-2">
                        {omens.angry.map((omen, i) => (
                          <li key={i} className="text-slate-300 flex items-start gap-2">
                            <span className="text-red-400">!</span>
                            <span className="italic">{omen}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Boons */}
              {signals.boons && signals.boons.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> Divine Boons
                  </h4>
                  <div className="grid gap-3">
                    {signals.boons.map((boon, i) => (
                      <div key={i} className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
                        <div className="text-xs text-green-400 mb-1 uppercase font-semibold">Trigger:</div>
                        <p className="text-slate-300 mb-2">{boon.trigger}</p>
                        <div className="text-xs text-green-400 mb-1 uppercase font-semibold">Effect:</div>
                        <p className="text-green-200 font-medium">{boon.effect}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Curses */}
              {signals.curses && signals.curses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Divine Curses
                  </h4>
                  <div className="grid gap-3">
                    {signals.curses.map((curse, i) => (
                      <div key={i} className="p-4 bg-red-500/5 border border-red-500/30 rounded-lg">
                        <div className="text-xs text-red-400 mb-1 uppercase font-semibold">Trigger:</div>
                        <p className="text-slate-300 mb-2">{curse.trigger}</p>
                        <div className="text-xs text-red-400 mb-1 uppercase font-semibold">Punishment:</div>
                        <p className="text-red-200 font-medium">{curse.effect}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Expandable>
        </div>
      )}

      {/* DM Secrets Section */}
      {showDmContent && (brain.true_nature || brain.divine_agenda || brain.secrets ||
        brain.conflicts || brain.weaknesses || brain.hooks?.length) && (
        <div className="border border-red-500/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('dm_secrets')}
            className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/15 transition-colors"
          >
            <h3 className="text-sm font-semibold text-red-400 uppercase flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              DM Secrets
              <AlertTriangle className="w-4 h-4" />
            </h3>
            {expandedSections.has('dm_secrets') ? (
              <ChevronDown className="w-4 h-4 text-red-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-red-400" />
            )}
          </button>
          <Expandable isOpen={expandedSections.has('dm_secrets')}>
            <div className="p-4 border-t border-red-500/20 space-y-4">
              {brain.true_nature && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-1">True Nature</h4>
                  <p className="text-slate-300 leading-relaxed">{brain.true_nature}</p>
                </div>
              )}

              {brain.divine_agenda && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-1">Divine Agenda</h4>
                  <p className="text-slate-300 leading-relaxed">{brain.divine_agenda}</p>
                </div>
              )}

              {brain.secrets && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-1">Secrets</h4>
                  <p className="text-slate-300 leading-relaxed">{brain.secrets}</p>
                </div>
              )}

              {brain.conflicts && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-1">Conflicts</h4>
                  <p className="text-slate-300 leading-relaxed">{brain.conflicts}</p>
                </div>
              )}

              {brain.weaknesses && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-1">Weaknesses</h4>
                  <p className="text-slate-300 leading-relaxed">{brain.weaknesses}</p>
                </div>
              )}

              {brain.hooks && brain.hooks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400/80 mb-2">Adventure Hooks</h4>
                  <ul className="space-y-2">
                    {brain.hooks.map((hook, i) => (
                      <li key={i} className="text-slate-300 p-3 bg-slate-800/50 rounded-lg flex items-start gap-2">
                        <span className="text-purple-400 font-bold">{i + 1}.</span>
                        {hook}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Expandable>
        </div>
      )}

      {/* Mechanics Section */}
      {(mechanics.cleric_domains?.length || mechanics.channel_divinity ||
        mechanics.sacred_spells?.length || mechanics.suggested_classes?.length) && (
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('mechanics')}
            className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
          >
            <h3 className="text-sm font-semibold text-slate-300 uppercase flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Mechanics
            </h3>
            {expandedSections.has('mechanics') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          <Expandable isOpen={expandedSections.has('mechanics')}>
            <div className="p-4 border-t border-slate-700 space-y-4">
              {mechanics.cleric_domains && mechanics.cleric_domains.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Cleric Domains</h4>
                  <div className="flex flex-wrap gap-2">
                    {mechanics.cleric_domains.map((domain, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-md text-sm">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mechanics.channel_divinity && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Channel Divinity</h4>
                  <p className="text-slate-300 leading-relaxed p-3 bg-slate-800/50 rounded-lg">
                    {mechanics.channel_divinity}
                  </p>
                </div>
              )}

              {mechanics.sacred_spells && mechanics.sacred_spells.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Sacred Spells</h4>
                  <div className="flex flex-wrap gap-2">
                    {mechanics.sacred_spells.map((spell, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-md text-sm">
                        {spell}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mechanics.suggested_classes && mechanics.suggested_classes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Suggested Classes</h4>
                  <div className="flex flex-wrap gap-2">
                    {mechanics.suggested_classes.map((cls, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md text-sm">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Expandable>
        </div>
      )}
    </div>
  );
}
