-- D&D 5e SRD Adventuring Gear Seed Data
-- Run this in Supabase SQL Editor to populate srd_items with adventuring gear
-- Prices in gold pieces (gp), weights in pounds (lb)

INSERT INTO srd_items (name, slug, item_type, rarity, value_gp, weight, description) VALUES
-- Containers
('Backpack', 'backpack', 'adventuring_gear', 'common', 2, 5, 'A backpack can hold one cubic foot or 30 pounds of gear.'),
('Barrel', 'barrel', 'adventuring_gear', 'common', 2, 70, 'A barrel can hold 40 gallons of liquid or 4 cubic feet of solid material.'),
('Basket', 'basket', 'adventuring_gear', 'common', 0.4, 2, 'A woven basket.'),
('Bucket', 'bucket', 'adventuring_gear', 'common', 0.05, 2, 'A wooden bucket.'),
('Chest', 'chest', 'adventuring_gear', 'common', 5, 25, 'A chest can hold 12 cubic feet or 300 pounds of gear.'),
('Pouch', 'pouch', 'adventuring_gear', 'common', 0.5, 1, 'A cloth or leather pouch can hold up to 20 sling bullets or 50 blowgun needles.'),
('Sack', 'sack', 'adventuring_gear', 'common', 0.01, 0.5, 'A sack can hold 1 cubic foot or 30 pounds of gear.'),
('Quiver', 'quiver', 'adventuring_gear', 'common', 1, 1, 'A quiver can hold up to 20 arrows.'),

-- Rope & Climbing
('Rope, Hempen (50 feet)', 'rope-hempen', 'adventuring_gear', 'common', 1, 10, '50 feet of hempen rope. Has 2 hit points and can be burst with a DC 17 Strength check.'),
('Rope, Silk (50 feet)', 'rope-silk', 'adventuring_gear', 'common', 10, 5, '50 feet of silk rope. Has 2 hit points and can be burst with a DC 17 Strength check.'),
('Grappling Hook', 'grappling-hook', 'adventuring_gear', 'common', 2, 4, 'A grappling hook for climbing.'),
('Piton', 'piton', 'adventuring_gear', 'common', 0.05, 0.25, 'An iron spike for climbing.'),
('Ladder (10-foot)', 'ladder-10ft', 'adventuring_gear', 'common', 0.1, 25, 'A 10-foot wooden ladder.'),
('Pole (10-foot)', 'pole-10ft', 'adventuring_gear', 'common', 0.05, 7, 'A 10-foot wooden pole.'),

-- Light Sources
('Candle', 'candle', 'adventuring_gear', 'common', 0.01, 0, 'A candle sheds bright light in a 5-foot radius and dim light for an additional 5 feet. Burns for 1 hour.'),
('Lamp', 'lamp', 'adventuring_gear', 'common', 0.5, 1, 'A lamp casts bright light in a 15-foot radius and dim light for an additional 30 feet. Burns 6 hours on a flask of oil.'),
('Lantern, Bullseye', 'lantern-bullseye', 'adventuring_gear', 'common', 10, 2, 'Casts bright light in a 60-foot cone and dim light for an additional 60 feet. Burns 6 hours on a flask of oil.'),
('Lantern, Hooded', 'lantern-hooded', 'adventuring_gear', 'common', 5, 2, 'Casts bright light in a 30-foot radius and dim light for an additional 30 feet. Burns 6 hours on a flask of oil.'),
('Torch', 'torch', 'adventuring_gear', 'common', 0.01, 1, 'A torch burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet.'),
('Tinderbox', 'tinderbox', 'adventuring_gear', 'common', 0.5, 1, 'This small container holds flint, fire steel, and tinder used to kindle a fire.'),
('Oil (flask)', 'oil-flask', 'adventuring_gear', 'common', 0.1, 1, 'Oil usually comes in a clay flask. Can be used as fuel or thrown as an improvised weapon.'),

-- Camping & Survival
('Bedroll', 'bedroll', 'adventuring_gear', 'common', 1, 7, 'A portable sleeping roll.'),
('Blanket', 'blanket', 'adventuring_gear', 'common', 0.5, 3, 'A warm blanket.'),
('Tent, Two-Person', 'tent-two-person', 'adventuring_gear', 'common', 2, 20, 'A simple canvas tent that sleeps two.'),
('Rations (1 day)', 'rations-1day', 'adventuring_gear', 'common', 0.5, 2, 'Rations consist of dry foods suitable for extended travel, including jerky, dried fruit, hardtack, and nuts.'),
('Waterskin', 'waterskin', 'adventuring_gear', 'common', 0.2, 5, 'A waterskin can hold 4 pints of liquid.'),
('Mess Kit', 'mess-kit', 'adventuring_gear', 'common', 0.2, 1, 'This tin box contains a cup and simple cutlery.'),
('Hunting Trap', 'hunting-trap', 'adventuring_gear', 'common', 5, 25, 'When you set this trap, it creates a saw-toothed steel ring. DC 13 Dexterity save or take 1d4 piercing and stop moving.'),

-- Tools & Utility
('Crowbar', 'crowbar', 'adventuring_gear', 'common', 2, 5, 'Using a crowbar grants advantage to Strength checks where leverage can be applied.'),
('Hammer', 'hammer', 'adventuring_gear', 'common', 1, 3, 'A standard hammer.'),
('Shovel', 'shovel', 'adventuring_gear', 'common', 2, 5, 'A digging shovel.'),
('Pick, Miner''s', 'pick-miners', 'adventuring_gear', 'common', 2, 10, 'A miner''s pick for digging.'),
('Chain (10 feet)', 'chain-10ft', 'adventuring_gear', 'common', 5, 10, 'A chain has 10 hit points. It can be burst with a DC 20 Strength check.'),
('Lock', 'lock', 'adventuring_gear', 'common', 10, 1, 'A key is provided with the lock. DC 15 Dexterity check with thieves'' tools to pick.'),
('Manacles', 'manacles', 'adventuring_gear', 'common', 2, 6, 'These metal restraints can bind a Small or Medium creature. DC 20 to escape or break.'),

-- Writing & Documents
('Ink (1 ounce bottle)', 'ink-bottle', 'adventuring_gear', 'common', 10, 0, 'Ink for writing.'),
('Ink Pen', 'ink-pen', 'adventuring_gear', 'common', 0.02, 0, 'A pen for writing with ink.'),
('Paper (one sheet)', 'paper-sheet', 'adventuring_gear', 'common', 0.2, 0, 'A sheet of paper.'),
('Parchment (one sheet)', 'parchment-sheet', 'adventuring_gear', 'common', 0.1, 0, 'A sheet of parchment.'),
('Chalk (1 piece)', 'chalk', 'adventuring_gear', 'common', 0.01, 0, 'A piece of chalk.'),
('Sealing Wax', 'sealing-wax', 'adventuring_gear', 'common', 0.5, 0, 'Wax for sealing letters.'),
('Book', 'book', 'adventuring_gear', 'common', 25, 5, 'A blank book for notes.'),

-- Miscellaneous Gear
('Ball Bearings (bag of 1,000)', 'ball-bearings', 'adventuring_gear', 'common', 1, 2, 'As an action, you can spill these on the ground. Creatures moving through must succeed on a DC 10 Dexterity save or fall prone.'),
('Caltrops (bag of 20)', 'caltrops', 'adventuring_gear', 'common', 1, 2, 'Creatures moving through take 1 piercing damage and stop moving if they fail a DC 15 Dexterity save.'),
('Mirror, Steel', 'mirror-steel', 'adventuring_gear', 'common', 5, 0.5, 'A steel mirror.'),
('Spyglass', 'spyglass', 'adventuring_gear', 'common', 1000, 1, 'Objects viewed through a spyglass are magnified to twice their size.'),
('Signal Whistle', 'signal-whistle', 'adventuring_gear', 'common', 0.05, 0, 'A whistle that can be heard up to 600 feet away.'),
('Bell', 'bell', 'adventuring_gear', 'common', 1, 0, 'A small bell.'),
('Flask', 'flask', 'adventuring_gear', 'common', 0.02, 1, 'An empty flask.'),
('Jug', 'jug', 'adventuring_gear', 'common', 0.02, 4, 'A jug that holds 1 gallon.'),
('Pot, Iron', 'pot-iron', 'adventuring_gear', 'common', 2, 10, 'An iron cooking pot.'),
('Whetstone', 'whetstone', 'adventuring_gear', 'common', 0.01, 1, 'A stone for sharpening blades.'),
('Vial', 'vial', 'adventuring_gear', 'common', 1, 0, 'A small glass vial that holds 4 ounces of liquid.'),
('Hourglass', 'hourglass', 'adventuring_gear', 'common', 25, 1, 'An hourglass for timing.'),
('Magnifying Glass', 'magnifying-glass', 'adventuring_gear', 'common', 100, 0, 'This lens allows a closer look at small objects. Useful for starting fires in bright sunlight.'),
('Scale, Merchant''s', 'scale-merchants', 'adventuring_gear', 'common', 5, 3, 'A scale, pans, and weights. Measures up to 2 pounds.'),

-- Substances
('Acid (vial)', 'acid-vial', 'adventuring_gear', 'common', 25, 1, 'As an action, splash onto a creature within 5 feet or throw up to 20 feet. 2d6 acid damage on hit.'),
('Alchemist''s Fire (flask)', 'alchemists-fire', 'adventuring_gear', 'common', 50, 1, 'Throw up to 20 feet. 1d4 fire damage at start of each turn until action used to extinguish.'),
('Antitoxin (vial)', 'antitoxin', 'adventuring_gear', 'common', 50, 0, 'Advantage on saving throws against poison for 1 hour.'),
('Holy Water (flask)', 'holy-water', 'adventuring_gear', 'common', 25, 1, 'Splash onto a fiend or undead within 5 feet or throw up to 20 feet. 2d6 radiant damage on hit.'),
('Perfume (vial)', 'perfume', 'adventuring_gear', 'common', 5, 0, 'A vial of perfume.'),
('Poison, Basic (vial)', 'poison-basic', 'adventuring_gear', 'common', 100, 0, 'Apply to weapon or 3 pieces of ammunition. Target takes 1d4 poison damage on hit. Dries after 1 minute.'),

-- Kits
('Healer''s Kit', 'healers-kit', 'adventuring_gear', 'common', 5, 3, '10 uses. Stabilize a creature at 0 HP without a Wisdom (Medicine) check.'),
('Climber''s Kit', 'climbers-kit', 'adventuring_gear', 'common', 25, 12, 'Includes pitons, boot tips, gloves, and a harness. Anchor yourself to prevent falling more than 25 feet.'),

-- Tools (Artisan)
('Thieves'' Tools', 'thieves-tools', 'tools', 'common', 25, 1, 'Proficiency lets you add your proficiency bonus to checks to disarm traps or open locks.'),
('Herbalism Kit', 'herbalism-kit', 'tools', 'common', 5, 3, 'Proficiency lets you add your proficiency bonus to checks to identify or apply herbs.'),
('Disguise Kit', 'disguise-kit', 'tools', 'common', 25, 3, 'Proficiency lets you add your proficiency bonus to checks to create visual disguises.'),
('Forgery Kit', 'forgery-kit', 'tools', 'common', 15, 5, 'Proficiency lets you add your proficiency bonus to checks to create forged documents.'),
('Navigator''s Tools', 'navigators-tools', 'tools', 'common', 25, 2, 'Proficiency lets you chart courses and follow navigation charts.'),
('Carpenter''s Tools', 'carpenters-tools', 'tools', 'common', 8, 6, 'Proficiency lets you craft wooden objects.'),
('Smith''s Tools', 'smiths-tools', 'tools', 'common', 20, 8, 'Proficiency lets you work metal.'),
('Leatherworker''s Tools', 'leatherworkers-tools', 'tools', 'common', 5, 5, 'Proficiency lets you work leather.'),
('Mason''s Tools', 'masons-tools', 'tools', 'common', 10, 8, 'Proficiency lets you work stone.'),
('Painter''s Supplies', 'painters-supplies', 'tools', 'common', 10, 5, 'Proficiency lets you paint and create art.'),
('Potter''s Tools', 'potters-tools', 'tools', 'common', 10, 3, 'Proficiency lets you create ceramic objects.'),
('Weaver''s Tools', 'weavers-tools', 'tools', 'common', 1, 5, 'Proficiency lets you create cloth.'),
('Woodcarver''s Tools', 'woodcarvers-tools', 'tools', 'common', 1, 5, 'Proficiency lets you carve wood.'),
('Brewer''s Supplies', 'brewers-supplies', 'tools', 'common', 20, 9, 'Proficiency lets you brew alcoholic beverages.'),
('Calligrapher''s Supplies', 'calligraphers-supplies', 'tools', 'common', 10, 5, 'Proficiency lets you write with exceptional style.'),
('Cook''s Utensils', 'cooks-utensils', 'tools', 'common', 1, 8, 'Proficiency lets you prepare meals.'),
('Cobbler''s Tools', 'cobblers-tools', 'tools', 'common', 5, 5, 'Proficiency lets you create and repair shoes.'),
('Glassblower''s Tools', 'glassblowers-tools', 'tools', 'common', 30, 5, 'Proficiency lets you create glass objects.'),
('Jeweler''s Tools', 'jewelers-tools', 'tools', 'common', 25, 2, 'Proficiency lets you craft jewelry.'),
('Tinker''s Tools', 'tinkers-tools', 'tools', 'common', 50, 10, 'Proficiency lets you repair many objects.'),
('Alchemist''s Supplies', 'alchemists-supplies', 'tools', 'common', 50, 8, 'Proficiency lets you create alchemical substances.'),

-- Gaming Sets
('Dice Set', 'dice-set', 'gaming_set', 'common', 0.1, 0, 'A set of gaming dice.'),
('Playing Card Set', 'playing-cards', 'gaming_set', 'common', 0.5, 0, 'A deck of playing cards.'),
('Dragonchess Set', 'dragonchess-set', 'gaming_set', 'common', 1, 0.5, 'A Dragonchess game set.'),
('Three-Dragon Ante Set', 'three-dragon-ante', 'gaming_set', 'common', 1, 0, 'A Three-Dragon Ante card set.'),

-- Component Pouch & Spellbook
('Component Pouch', 'component-pouch', 'adventuring_gear', 'common', 25, 2, 'A small, watertight leather belt pouch with compartments for all material components needed for spellcasting.'),
('Spellbook', 'spellbook', 'adventuring_gear', 'common', 50, 3, 'Essential for wizards. 100 pages of parchment bound in leather.'),

-- Ammunition
('Arrows (20)', 'arrows-20', 'ammunition', 'common', 1, 1, 'A quiver of 20 arrows.'),
('Bolts, Crossbow (20)', 'bolts-crossbow-20', 'ammunition', 'common', 1, 1.5, 'A case of 20 crossbow bolts.'),
('Sling Bullets (20)', 'sling-bullets-20', 'ammunition', 'common', 0.04, 1.5, 'A pouch of 20 sling bullets.'),
('Blowgun Needles (50)', 'blowgun-needles-50', 'ammunition', 'common', 1, 1, 'A case of 50 blowgun needles.'),

-- Clothing
('Common Clothes', 'common-clothes', 'clothing', 'common', 0.5, 3, 'Simple, inexpensive clothing.'),
('Costume Clothes', 'costume-clothes', 'clothing', 'common', 5, 4, 'Clothing for performances or disguises.'),
('Fine Clothes', 'fine-clothes', 'clothing', 'common', 15, 6, 'Expensive, high-quality clothing.'),
('Traveler''s Clothes', 'travelers-clothes', 'clothing', 'common', 2, 4, 'Durable clothes suitable for travel.'),
('Robes', 'robes', 'clothing', 'common', 1, 4, 'Simple robes.')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  item_type = EXCLUDED.item_type,
  rarity = EXCLUDED.rarity,
  value_gp = EXCLUDED.value_gp,
  weight = EXCLUDED.weight,
  description = EXCLUDED.description;
