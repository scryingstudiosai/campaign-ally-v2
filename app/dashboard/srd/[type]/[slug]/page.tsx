import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Shield, Zap, Eye, Languages, Skull, Sparkles, Sword, Coins, Weight, Star, BookOpen } from 'lucide-react'
import { MaterialCard } from '@/components/ui/material-card'
import { SrdBadge } from '@/components/srd/SrdBadge'
import type { SrdCreature, SrdItem, SrdSpell } from '@/types/srd'

// Map URL types to table names
const typeToTable: Record<string, string> = {
  creature: 'srd_creatures',
  creatures: 'srd_creatures',
  spell: 'srd_spells',
  spells: 'srd_spells',
  item: 'srd_items',
  items: 'srd_items',
}

type PageProps = {
  params: Promise<{ type: string; slug: string }>
}

export default async function SRDEntityPage({ params }: PageProps) {
  const { type, slug } = await params
  const tableName = typeToTable[type]

  if (!tableName) {
    notFound()
  }

  const supabase = await createClient()

  // Query by slug
  const { data: entity, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !entity) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* SRD Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 text-xs font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
            SRD {type}
          </span>
        </div>

        {/* Render based on type */}
        {(type === 'creature' || type === 'creatures') && <MonsterStatBlock creature={entity as SrdCreature} />}
        {(type === 'spell' || type === 'spells') && <SpellCard spell={entity as SrdSpell} />}
        {(type === 'item' || type === 'items') && <ItemCard item={entity as SrdItem} />}
      </div>
    </div>
  )
}

// Helper functions
function formatMod(score?: number): string {
  if (score === undefined) return '+0'
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function formatSpeeds(speeds?: Record<string, number | string>): string {
  if (!speeds) return 'Unknown'
  return Object.entries(speeds)
    .map(([type, value]) => (type === 'walk' ? `${value} ft.` : `${type} ${value} ft.`))
    .join(', ')
}

function formatListField(field: string[] | string | undefined): string {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field.join(', ')
}

function hasListContent(field: string[] | string | undefined): boolean {
  if (!field) return false
  if (typeof field === 'string') return field.length > 0
  return field.length > 0
}

function calculateXP(cr: string | number): string {
  const xpByCR: Record<string, number> = {
    '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
    '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
    '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
    '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
    '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
    '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
    '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000
  }
  return xpByCR[String(cr)]?.toLocaleString() || '0'
}

// Monster Stat Block Component
function MonsterStatBlock({ creature }: { creature: SrdCreature }) {
  const traits = creature.traits || creature.special_abilities || []
  const actions = creature.actions || []
  const legendaryActions = creature.legendary_actions || []
  const legendaryDesc = creature.legendary_description || creature.legendary_desc

  return (
    <MaterialCard className="p-6" entityType="creature">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-rose-500/30 pb-4 mb-4">
        <Skull className="w-6 h-6 text-rose-400" />
        <div className="flex-1">
          <h1 className="text-3xl font-display text-white mb-1">{creature.name}</h1>
          <p className="text-sm text-slate-400 italic capitalize">
            {creature.size} {creature.creature_type}
            {creature.subtype && ` (${creature.subtype})`}, {creature.alignment}
          </p>
        </div>
        <SrdBadge license={creature.license} />
        {creature.cr && (
          <span className="text-amber-400 font-semibold">CR {creature.cr}</span>
        )}
      </div>

      {/* Core Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-xs text-slate-500 uppercase">Armor Class</div>
            <div className="text-white font-semibold">{creature.ac}</div>
            {creature.ac_type && <div className="text-xs text-slate-400">({creature.ac_type})</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400" />
          <div>
            <div className="text-xs text-slate-500 uppercase">Hit Points</div>
            <div className="text-white font-semibold">{creature.hp}</div>
            {creature.hp_formula && <div className="text-xs text-slate-400">({creature.hp_formula})</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-xs text-slate-500 uppercase">Speed</div>
            <div className="text-white font-semibold text-sm">{formatSpeeds(creature.speeds)}</div>
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      {creature.stats && (
        <div className="grid grid-cols-6 gap-2 mb-6 p-4 bg-slate-800/50 rounded-lg">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((ability) => {
            const score = creature.stats?.[ability] ?? 10
            return (
              <div key={ability} className="text-center">
                <div className="text-xs text-slate-500 uppercase">{ability}</div>
                <div className="text-lg font-semibold text-white">{score}</div>
                <div className="text-sm text-teal-400">{formatMod(score)}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Skills, Senses, Languages */}
      <div className="space-y-2 mb-6 text-sm">
        {creature.skills && (typeof creature.skills === 'string' ? creature.skills : Object.keys(creature.skills).length > 0) && (
          <div>
            <span className="text-slate-400">Skills: </span>
            <span className="text-white">
              {typeof creature.skills === 'string'
                ? creature.skills
                : Object.entries(creature.skills)
                    .filter(([, v]) => v !== null)
                    .map(([k, v]) => `${k} +${v}`)
                    .join(', ')}
            </span>
          </div>
        )}
        {hasListContent(creature.damage_resistances) && (
          <div><span className="text-slate-400">Damage Resistances: </span><span className="text-white">{formatListField(creature.damage_resistances)}</span></div>
        )}
        {hasListContent(creature.damage_immunities) && (
          <div><span className="text-slate-400">Damage Immunities: </span><span className="text-white">{formatListField(creature.damage_immunities)}</span></div>
        )}
        {hasListContent(creature.damage_vulnerabilities) && (
          <div><span className="text-slate-400">Damage Vulnerabilities: </span><span className="text-white">{formatListField(creature.damage_vulnerabilities)}</span></div>
        )}
        {hasListContent(creature.condition_immunities) && (
          <div><span className="text-slate-400">Condition Immunities: </span><span className="text-white">{formatListField(creature.condition_immunities)}</span></div>
        )}
        {creature.senses && (
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400">Senses: </span>
              <span className="text-white">
                {typeof creature.senses === 'string'
                  ? creature.senses
                  : typeof creature.senses === 'object' && 'raw' in creature.senses
                    ? String(creature.senses.raw)
                    : Object.entries(creature.senses).map(([k, v]) => `${k} ${v}`).join(', ')}
              </span>
            </div>
          </div>
        )}
        {hasListContent(creature.languages) && (
          <div className="flex items-start gap-2">
            <Languages className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400">Languages: </span>
              <span className="text-white">{formatListField(creature.languages)}</span>
            </div>
          </div>
        )}
        {creature.cr && (
          <div>
            <span className="text-slate-400">Challenge: </span>
            <span className="text-white">{creature.cr} ({creature.xp_value?.toLocaleString() || calculateXP(creature.cr)} XP)</span>
          </div>
        )}
      </div>

      {/* Traits */}
      {traits.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-display text-amber-400 mb-3 border-b border-amber-500/30 pb-1">Traits</h3>
          <div className="space-y-3">
            {traits.map((trait, i) => (
              <div key={i}>
                <span className="font-semibold text-white italic">{trait.name}. </span>
                <span className="text-slate-300">{trait.desc || trait.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-display text-rose-400 mb-3 border-b border-rose-500/30 pb-1">Actions</h3>
          <div className="space-y-3">
            {actions.map((action, i) => (
              <div key={i}>
                <span className="font-semibold text-white italic">{action.name}. </span>
                <span className="text-slate-300">{action.desc || action.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legendary Actions */}
      {legendaryActions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-display text-purple-400 mb-3 border-b border-purple-500/30 pb-1">Legendary Actions</h3>
          {legendaryDesc && (
            <p className="text-slate-400 text-sm mb-3">{legendaryDesc}</p>
          )}
          <div className="space-y-3">
            {legendaryActions.map((action, i) => (
              <div key={i}>
                <span className="font-semibold text-white italic">{action.name}. </span>
                <span className="text-slate-300">{action.desc || action.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Info */}
      <div className="pt-4 border-t border-slate-700 flex justify-between text-xs text-slate-500">
        <span>Source: {creature.source}</span>
        <span>{creature.license}</span>
      </div>
    </MaterialCard>
  )
}

// Spell Card Component
function SpellCard({ spell }: { spell: SrdSpell }) {
  const formatComponents = (): string => {
    if (!spell.components) return ''
    const parts: string[] = []
    if (spell.components.verbal) parts.push('V')
    if (spell.components.somatic) parts.push('S')
    if (spell.components.material) parts.push(`M (${spell.components.material})`)
    return parts.join(', ')
  }

  return (
    <MaterialCard className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-purple-500/30 pb-4 mb-4">
        <Sparkles className="w-6 h-6 text-purple-400" />
        <div className="flex-1">
          <h1 className="text-3xl font-display text-white mb-1">{spell.name}</h1>
          <p className="text-sm text-slate-400 italic">
            {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} {spell.school}
            {spell.ritual && ' (ritual)'}
          </p>
        </div>
        <SrdBadge license={spell.license} />
      </div>

      {/* Spell Info */}
      <div className="space-y-2 mb-6 text-sm">
        <div><span className="text-slate-400">Casting Time: </span><span className="text-white">{spell.casting_time}</span></div>
        <div><span className="text-slate-400">Range: </span><span className="text-white">{spell.range}</span></div>
        <div><span className="text-slate-400">Components: </span><span className="text-white">{formatComponents()}</span></div>
        <div>
          <span className="text-slate-400">Duration: </span>
          <span className="text-white">
            {spell.concentration && 'Concentration, up to '}
            {spell.duration}
          </span>
        </div>
        {spell.classes && spell.classes.length > 0 && (
          <div><span className="text-slate-400">Classes: </span><span className="text-white">{spell.classes.join(', ')}</span></div>
        )}
      </div>

      {/* Description */}
      <div className="text-slate-300 whitespace-pre-wrap mb-4">{spell.description}</div>

      {/* At Higher Levels */}
      {spell.higher_levels && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <span className="font-semibold text-purple-400">At Higher Levels. </span>
          <span className="text-slate-300">{spell.higher_levels}</span>
        </div>
      )}

      {/* Source Info */}
      <div className="pt-4 mt-4 border-t border-slate-700 flex justify-between text-xs text-slate-500">
        <span>Source: {spell.source}</span>
        <span>{spell.license}</span>
      </div>
    </MaterialCard>
  )
}

// Item Card Component
function ItemCard({ item }: { item: SrdItem }) {
  const RARITY_COLORS: Record<string, string> = {
    common: 'text-slate-300 border-slate-500/30 bg-slate-500/10',
    uncommon: 'text-green-300 border-green-500/30 bg-green-500/10',
    rare: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
    'very rare': 'text-purple-300 border-purple-500/30 bg-purple-500/10',
    legendary: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    artifact: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
  }

  const TYPE_ICONS: Record<string, typeof Sword> = {
    weapon: Sword,
    armor: Shield,
    magic_item: Sparkles,
  }

  const Icon = TYPE_ICONS[item.item_type] || Sparkles
  const rarityColor = RARITY_COLORS[item.rarity?.toLowerCase() || 'common'] || RARITY_COLORS.common

  return (
    <MaterialCard className="p-6" entityType="item">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-blue-500/30 pb-4 mb-4">
        <Icon className="w-6 h-6 text-blue-400" />
        <div className="flex-1">
          <h1 className="text-3xl font-display text-white mb-1">{item.name}</h1>
          <p className="text-sm text-slate-400 italic capitalize">
            {item.item_type.replace('_', ' ')}
            {item.subtype && ` (${item.subtype})`}
          </p>
        </div>
        <SrdBadge license={item.license} />
        {item.rarity && (
          <span className={`px-2 py-1 rounded text-xs border ${rarityColor}`}>
            {item.rarity}
          </span>
        )}
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4 mb-6 text-sm">
        {item.value_gp && (
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">{item.value_gp} gp</span>
          </div>
        )}
        {item.weight && (
          <div className="flex items-center gap-1">
            <Weight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">{item.weight} lb.</span>
          </div>
        )}
        {item.requires_attunement && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300">
              Requires Attunement
              {item.attunement_requirements && ` (${item.attunement_requirements})`}
            </span>
          </div>
        )}
      </div>

      {/* Mechanics */}
      {item.mechanics && Object.keys(item.mechanics).length > 0 && (
        <div className="grid grid-cols-2 gap-3 text-sm p-4 bg-slate-800/50 rounded-lg mb-6">
          {item.mechanics.damage && (
            <div>
              <span className="text-slate-500 text-xs uppercase block">Damage</span>
              <span className="text-slate-200">
                {item.mechanics.damage}
                {item.mechanics.damage_type && ` ${item.mechanics.damage_type}`}
              </span>
            </div>
          )}
          {item.mechanics.ac !== undefined && (
            <div>
              <span className="text-slate-500 text-xs uppercase block">AC</span>
              <span className="text-slate-200">{item.mechanics.ac}</span>
            </div>
          )}
          {item.mechanics.ac_bonus !== undefined && (
            <div>
              <span className="text-slate-500 text-xs uppercase block">AC Bonus</span>
              <span className="text-slate-200">+{item.mechanics.ac_bonus}</span>
            </div>
          )}
          {item.mechanics.stealth_disadvantage && (
            <div>
              <span className="text-red-400 text-xs">Stealth Disadvantage</span>
            </div>
          )}
          {item.mechanics.str_minimum && (
            <div>
              <span className="text-slate-500 text-xs uppercase block">Str Required</span>
              <span className="text-slate-200">{item.mechanics.str_minimum}</span>
            </div>
          )}
          {item.mechanics.charges && (
            <div>
              <span className="text-slate-500 text-xs uppercase block">Charges</span>
              <span className="text-slate-200">{item.mechanics.charges}</span>
            </div>
          )}
        </div>
      )}

      {/* Properties */}
      {item.mechanics?.properties && item.mechanics.properties.length > 0 && (
        <div className="mb-6">
          <span className="text-slate-500 text-xs uppercase block mb-2">Properties</span>
          <div className="flex flex-wrap gap-2">
            {item.mechanics.properties.map((p: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="text-slate-300 whitespace-pre-wrap">{item.description}</div>
      )}

      {/* Source Info */}
      <div className="pt-4 mt-4 border-t border-slate-700 flex justify-between text-xs text-slate-500">
        <span>Source: {item.source}</span>
        <span>{item.license}</span>
      </div>
    </MaterialCard>
  )
}
