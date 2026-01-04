import { classes } from '@/lib/data/srd-packs';

// Calculate ability modifier from score
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Format modifier with + or - prefix
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Calculate proficiency bonus based on level
export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

// Calculate passive perception
export function calculatePassivePerception(
  wisdomScore: number,
  proficient: boolean,
  level: number
): number {
  const wisdomMod = calculateModifier(wisdomScore);
  const profBonus = proficient ? calculateProficiencyBonus(level) : 0;
  return 10 + wisdomMod + profBonus;
}

// Calculate max HP based on class, level, and constitution
export function calculateMaxHP(
  classValue: string,
  level: number,
  constitutionScore: number
): number {
  const classData = classes.find((c) => c.value === classValue);
  if (!classData) return 0;

  const hitDie = classData.hitDie;
  const conMod = calculateModifier(constitutionScore);

  // Level 1: max hit die + con mod
  // Subsequent levels: average hit die (rounded up) + con mod per level
  const level1HP = hitDie + conMod;
  const subsequentHP = (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod);

  return Math.max(1, level1HP + subsequentHP);
}

// Calculate hit dice information
export function calculateHitDice(
  classValue: string,
  level: number
): { current: number; max: number; face: number } {
  const classData = classes.find((c) => c.value === classValue);
  const face = classData?.hitDie ?? 8;

  return {
    current: level,
    max: level,
    face,
  };
}

// Calculate armor class (base 10 + dex mod for unarmored)
export function calculateArmorClass(
  dexterityScore: number,
  armorType?: string
): number {
  const dexMod = calculateModifier(dexterityScore);

  // Simple armor calculations
  switch (armorType) {
    case 'Leather Armor':
      return 11 + dexMod;
    case 'Studded Leather':
      return 12 + dexMod;
    case 'Hide Armor':
      return 12 + Math.min(dexMod, 2);
    case 'Chain Shirt':
      return 13 + Math.min(dexMod, 2);
    case 'Scale Mail':
      return 14 + Math.min(dexMod, 2);
    case 'Breastplate':
      return 14 + Math.min(dexMod, 2);
    case 'Half Plate':
      return 15 + Math.min(dexMod, 2);
    case 'Ring Mail':
      return 14;
    case 'Chain Mail':
      return 16;
    case 'Splint':
      return 17;
    case 'Plate':
      return 18;
    default:
      return 10 + dexMod; // Unarmored
  }
}

// Calculate initiative bonus
export function calculateInitiative(dexterityScore: number): number {
  return calculateModifier(dexterityScore);
}

// Calculate speed based on race
export function getBaseSpeed(raceValue: string): number {
  const speeds: Record<string, number> = {
    human: 30,
    elf: 30,
    dwarf: 25,
    halfling: 25,
    dragonborn: 30,
    gnome: 25,
    'half-elf': 30,
    'half-orc': 30,
    tiefling: 30,
  };
  return speeds[raceValue] ?? 30;
}

// Calculate saving throw bonus
export function calculateSavingThrow(
  abilityScore: number,
  proficient: boolean,
  level: number
): number {
  const mod = calculateModifier(abilityScore);
  const profBonus = proficient ? calculateProficiencyBonus(level) : 0;
  return mod + profBonus;
}

// Get class saving throw proficiencies
export function getClassSavingThrows(classValue: string): string[] {
  const classData = classes.find((c) => c.value === classValue);
  return classData?.savingThrows ?? [];
}
