export interface DiceResult {
  total: number;
  rolls: number[];
  expression: string;
  modifier: number;
  diceType: string;
  isNat20?: boolean;
  isNat1?: boolean;
}

/**
 * Parse and roll dice expression (e.g., "1d20+5", "2d6-2", "d20", "4d8")
 */
export function rollDice(expression: string): DiceResult {
  const normalized = expression.toLowerCase().trim();

  // Parse expression: [count]d[sides][+/-modifier]
  const match = normalized.match(/^(\d*)d(\d+)([+-]\d+)?$/);

  if (!match) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  const count = parseInt(match[1] || '1', 10);
  const sides = parseInt(match[2], 10);
  const modifier = parseInt(match[3] || '0', 10);

  // Validate
  if (count < 1 || count > 100) throw new Error('Dice count must be 1-100');
  if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) {
    throw new Error('Invalid dice type. Use d4, d6, d8, d10, d12, d20, or d100');
  }

  // Roll the dice
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  const subtotal = rolls.reduce((sum, roll) => sum + roll, 0);
  const total = subtotal + modifier;

  // Check for natural 20/1 (only for single d20)
  const isNat20 = count === 1 && sides === 20 && rolls[0] === 20;
  const isNat1 = count === 1 && sides === 20 && rolls[0] === 1;

  return {
    total,
    rolls,
    expression: normalized,
    modifier,
    diceType: `d${sides}`,
    isNat20,
    isNat1,
  };
}

/**
 * Format dice result for display
 */
export function formatDiceResult(result: DiceResult): string {
  const rollsStr = result.rolls.join(' + ');
  const modStr = result.modifier !== 0
    ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}`
    : '';

  return `${result.expression}: [${rollsStr}]${modStr} = ${result.total}`;
}

/**
 * Roll ability check with modifier
 */
export function rollAbilityCheck(modifier: number): DiceResult {
  const result = rollDice('1d20');
  result.total += modifier;
  result.modifier = modifier;
  return result;
}

/**
 * Quick roll presets
 */
export const DICE_PRESETS = [
  { label: 'd20', expression: '1d20' },
  { label: 'd20+5', expression: '1d20+5' },
  { label: '2d6', expression: '2d6' },
  { label: '1d8+3', expression: '1d8+3' },
  { label: '4d6', expression: '4d6' },
  { label: '1d100', expression: '1d100' },
];
