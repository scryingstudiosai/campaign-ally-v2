import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const OPEN5E_BASE = 'https://api.open5e.com/v1';
const BATCH_SIZE = 50;

// ============ HELPERS ============

async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${OPEN5E_BASE}${endpoint}`;
  let pageCount = 0;

  while (url) {
    pageCount++;
    console.log(`  Page ${pageCount}: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const data = await response.json();
    results.push(...data.results);
    url = data.next;

    // Rate limiting - be nice to the API
    await new Promise((r) => setTimeout(r, 250));
  }

  return results;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseCR(cr: string): number {
  if (!cr) return 0;
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
}

// ============ TRANSFORMERS ============

function transformCreature(raw: any): any {
  return {
    slug: raw.slug || slugify(raw.name),
    name: raw.name,
    game_system: '5e_2014',
    source: 'open5e',
    license: 'ogl_1.0a',

    size: raw.size,
    creature_type: raw.type,
    subtype: raw.subtype || null,
    alignment: raw.alignment,

    cr: raw.cr || raw.challenge_rating,
    cr_numeric: parseCR(raw.cr || raw.challenge_rating),
    xp_value: null,
    ac: raw.armor_class,
    ac_type: raw.armor_desc || null,
    hp: raw.hit_points,
    hp_formula: raw.hit_dice,

    stats: {
      str: raw.strength,
      dex: raw.dexterity,
      con: raw.constitution,
      int: raw.intelligence,
      wis: raw.wisdom,
      cha: raw.charisma,
    },
    speeds: raw.speed || {},
    saves: {
      str: raw.strength_save,
      dex: raw.dexterity_save,
      con: raw.constitution_save,
      int: raw.intelligence_save,
      wis: raw.wisdom_save,
      cha: raw.charisma_save,
    },
    skills: raw.skills || {},

    damage_resistances: raw.damage_resistances
      ? typeof raw.damage_resistances === 'string'
        ? raw.damage_resistances.split(', ')
        : raw.damage_resistances
      : [],
    damage_immunities: raw.damage_immunities
      ? typeof raw.damage_immunities === 'string'
        ? raw.damage_immunities.split(', ')
        : raw.damage_immunities
      : [],
    damage_vulnerabilities: raw.damage_vulnerabilities
      ? typeof raw.damage_vulnerabilities === 'string'
        ? raw.damage_vulnerabilities.split(', ')
        : raw.damage_vulnerabilities
      : [],
    condition_immunities: raw.condition_immunities
      ? typeof raw.condition_immunities === 'string'
        ? raw.condition_immunities.split(', ')
        : raw.condition_immunities
      : [],

    senses:
      typeof raw.senses === 'string' ? { raw: raw.senses } : raw.senses || {},
    languages: raw.languages
      ? typeof raw.languages === 'string'
        ? raw.languages.split(', ')
        : raw.languages
      : [],

    traits: raw.special_abilities || [],
    actions: raw.actions || [],
    bonus_actions: raw.bonus_actions || [],
    reactions: raw.reactions || [],
    legendary_actions: raw.legendary_actions || [],
    legendary_description: raw.legendary_desc || null,

    description: raw.desc || null,
  };
}

function transformItem(raw: any, itemType: string): any {
  const costMatch = raw.cost ? raw.cost.match(/(\d+\.?\d*)/) : null;

  return {
    slug: raw.slug || slugify(raw.name),
    name: raw.name,
    game_system: '5e_2014',
    source: 'open5e',
    license: 'ogl_1.0a',

    item_type: itemType,
    subtype:
      raw.category || raw.weapon_category || raw.armor_category || null,
    rarity: raw.rarity || (itemType === 'magic_item' ? 'uncommon' : 'common'),
    requires_attunement:
      raw.requires_attunement === 'requires attunement' ||
      raw.requires_attunement === true ||
      (typeof raw.requires_attunement === 'string' &&
        raw.requires_attunement.length > 0),
    attunement_requirements:
      typeof raw.requires_attunement === 'string' &&
      raw.requires_attunement.includes('by')
        ? raw.requires_attunement
        : null,

    value_gp: costMatch ? parseFloat(costMatch[1]) : null,
    weight: raw.weight ? parseFloat(raw.weight) : null,

    mechanics: {
      damage: raw.damage_dice || raw.damage || null,
      damage_type: raw.damage_type || null,
      properties: raw.properties || [],
      ac: raw.base_ac || null,
      ac_bonus: raw.ac_bonus || null,
      stealth_disadvantage: raw.stealth_disadvantage || false,
      str_minimum: raw.str_minimum || null,
    },

    description: raw.desc || raw.document__desc || null,
  };
}

function transformSpell(raw: any): any {
  const level =
    raw.level_int !== undefined
      ? raw.level_int
      : raw.level === 'Cantrip'
        ? 0
        : parseInt(raw.level) || 0;

  return {
    slug: raw.slug || slugify(raw.name),
    name: raw.name,
    game_system: '5e_2014',
    source: 'open5e',
    license: 'ogl_1.0a',

    level: level,
    school: raw.school,
    ritual: raw.ritual === 'yes' || raw.ritual === true,
    concentration: raw.concentration === 'yes' || raw.concentration === true,

    casting_time: raw.casting_time,
    range: raw.range,
    components: {
      verbal: raw.components ? raw.components.includes('V') : false,
      somatic: raw.components ? raw.components.includes('S') : false,
      material: raw.material || null,
    },
    duration: raw.duration,

    classes: raw.dnd_class
      ? raw.dnd_class.split(', ').map((c: string) => c.trim().toLowerCase())
      : [],

    description: raw.desc,
    higher_levels: raw.higher_level || null,
    mechanics: {},
  };
}

// ============ SEEDERS ============

async function seedCreatures() {
  console.log('\n🐉 Seeding Creatures...');

  try {
    const raw = await fetchAllPages<any>('/monsters/?document__slug=wotc-srd');
    console.log(`Fetched ${raw.length} creatures from API`);

    const transformed = raw.map(transformCreature);

    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
      const batch = transformed.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('srd_creatures')
        .upsert(batch, { onConflict: 'slug' });

      if (error) {
        console.error(`  Error batch ${i}-${i + batch.length}:`, error.message);
        errors++;
      } else {
        inserted += batch.length;
        console.log(
          `  ✓ Inserted ${i + 1}-${Math.min(i + BATCH_SIZE, transformed.length)}`
        );
      }
    }

    console.log(`✅ Creatures complete: ${inserted} inserted, ${errors} errors`);
  } catch (err) {
    console.error('Failed to seed creatures:', err);
  }
}

async function seedItems() {
  console.log('\n⚔️ Seeding Items...');

  try {
    console.log('  Fetching weapons...');
    const weapons = await fetchAllPages<any>(
      '/weapons/?document__slug=wotc-srd'
    );

    console.log('  Fetching armor...');
    const armor = await fetchAllPages<any>('/armor/?document__slug=wotc-srd');

    console.log('  Fetching magic items...');
    const magicItems = await fetchAllPages<any>(
      '/magicitems/?document__slug=wotc-srd'
    );

    const transformed = [
      ...weapons.map((w) => transformItem(w, 'weapon')),
      ...armor.map((a) => transformItem(a, 'armor')),
      ...magicItems.map((m) => transformItem(m, 'magic_item')),
    ];

    console.log(`Fetched ${transformed.length} total items`);

    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
      const batch = transformed.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('srd_items')
        .upsert(batch, { onConflict: 'slug' });

      if (error) {
        console.error(`  Error batch ${i}-${i + batch.length}:`, error.message);
        errors++;
      } else {
        inserted += batch.length;
        console.log(
          `  ✓ Inserted ${i + 1}-${Math.min(i + BATCH_SIZE, transformed.length)}`
        );
      }
    }

    console.log(`✅ Items complete: ${inserted} inserted, ${errors} errors`);
  } catch (err) {
    console.error('Failed to seed items:', err);
  }
}

async function seedSpells() {
  console.log('\n✨ Seeding Spells...');

  try {
    const raw = await fetchAllPages<any>('/spells/?document__slug=wotc-srd');
    console.log(`Fetched ${raw.length} spells from API`);

    const transformed = raw.map(transformSpell);

    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
      const batch = transformed.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('srd_spells')
        .upsert(batch, { onConflict: 'slug' });

      if (error) {
        console.error(`  Error batch ${i}-${i + batch.length}:`, error.message);
        errors++;
      } else {
        inserted += batch.length;
        console.log(
          `  ✓ Inserted ${i + 1}-${Math.min(i + BATCH_SIZE, transformed.length)}`
        );
      }
    }

    console.log(`✅ Spells complete: ${inserted} inserted, ${errors} errors`);
  } catch (err) {
    console.error('Failed to seed spells:', err);
  }
}

// ============ MAIN ============

async function main() {
  console.log('🎲 Starting D&D 5e (2014) SRD Seeding');
  console.log('=====================================\n');
  console.log('Using Supabase URL:', supabaseUrl);

  const startTime = Date.now();

  await seedCreatures();
  await seedItems();
  await seedSpells();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Seeding complete in ${elapsed}s`);
}

main().catch(console.error);
