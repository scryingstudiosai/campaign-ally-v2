-- Enable fuzzy search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===================
-- SRD CREATURES TABLE
-- ===================
CREATE TABLE srd_creatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,

  -- System
  game_system TEXT NOT NULL DEFAULT '5e_2014',
  source TEXT NOT NULL DEFAULT 'open5e',
  license TEXT NOT NULL DEFAULT 'ogl_1.0a',

  -- Classification
  size TEXT,
  creature_type TEXT,
  subtype TEXT,
  alignment TEXT,

  -- Combat
  cr TEXT,
  cr_numeric NUMERIC,
  xp_value INTEGER,
  ac INTEGER,
  ac_type TEXT,
  hp INTEGER,
  hp_formula TEXT,

  -- Stats
  stats JSONB DEFAULT '{}',
  speeds JSONB DEFAULT '{}',
  saves JSONB DEFAULT '{}',
  skills JSONB DEFAULT '{}',

  -- Defenses
  damage_resistances TEXT[],
  damage_immunities TEXT[],
  damage_vulnerabilities TEXT[],
  condition_immunities TEXT[],

  -- Senses & Languages
  senses JSONB DEFAULT '{}',
  languages TEXT[],

  -- Abilities
  traits JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  bonus_actions JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  legendary_actions JSONB DEFAULT '[]',
  legendary_description TEXT,

  -- Description
  description TEXT,

  -- Search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(creature_type, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(subtype, '')), 'C')
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creature Indexes
CREATE INDEX idx_srd_creatures_game_system ON srd_creatures(game_system);
CREATE INDEX idx_srd_creatures_cr ON srd_creatures(cr_numeric);
CREATE INDEX idx_srd_creatures_type ON srd_creatures(creature_type);
CREATE INDEX idx_srd_creatures_search ON srd_creatures USING gin(search_vector);
CREATE INDEX idx_srd_creatures_name_trgm ON srd_creatures USING gin(name gin_trgm_ops);


-- ===================
-- SRD ITEMS TABLE
-- ===================
CREATE TABLE srd_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,

  -- System
  game_system TEXT NOT NULL DEFAULT '5e_2014',
  source TEXT NOT NULL DEFAULT 'open5e',
  license TEXT NOT NULL DEFAULT 'ogl_1.0a',

  -- Classification
  item_type TEXT NOT NULL,
  subtype TEXT,
  rarity TEXT,
  requires_attunement BOOLEAN DEFAULT FALSE,
  attunement_requirements TEXT,

  -- Economics
  value_gp NUMERIC,
  weight NUMERIC,

  -- Mechanics (flexible JSONB)
  mechanics JSONB DEFAULT '{}',

  -- Description
  description TEXT,

  -- Search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(item_type, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(rarity, '')), 'C')
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item Indexes
CREATE INDEX idx_srd_items_game_system ON srd_items(game_system);
CREATE INDEX idx_srd_items_type ON srd_items(item_type);
CREATE INDEX idx_srd_items_rarity ON srd_items(rarity);
CREATE INDEX idx_srd_items_search ON srd_items USING gin(search_vector);
CREATE INDEX idx_srd_items_name_trgm ON srd_items USING gin(name gin_trgm_ops);


-- ===================
-- SRD SPELLS TABLE
-- ===================
CREATE TABLE srd_spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,

  -- System
  game_system TEXT NOT NULL DEFAULT '5e_2014',
  source TEXT NOT NULL DEFAULT 'open5e',
  license TEXT NOT NULL DEFAULT 'ogl_1.0a',

  -- Classification
  level INTEGER NOT NULL,
  school TEXT,
  ritual BOOLEAN DEFAULT FALSE,
  concentration BOOLEAN DEFAULT FALSE,

  -- Casting
  casting_time TEXT,
  range TEXT,
  components JSONB DEFAULT '{}',
  duration TEXT,

  -- Classes
  classes TEXT[],

  -- Effect
  description TEXT,
  higher_levels TEXT,
  mechanics JSONB DEFAULT '{}',

  -- Search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(school, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(classes, ' '), '')), 'C')
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spell Indexes
CREATE INDEX idx_srd_spells_game_system ON srd_spells(game_system);
CREATE INDEX idx_srd_spells_level ON srd_spells(level);
CREATE INDEX idx_srd_spells_school ON srd_spells(school);
CREATE INDEX idx_srd_spells_classes ON srd_spells USING gin(classes);
CREATE INDEX idx_srd_spells_search ON srd_spells USING gin(search_vector);
CREATE INDEX idx_srd_spells_name_trgm ON srd_spells USING gin(name gin_trgm_ops);


-- ===================
-- UPDATE CODEX TABLE
-- ===================
ALTER TABLE codex ADD COLUMN IF NOT EXISTS game_system TEXT DEFAULT '5e_2014';
