// Default relationship types to seed for new campaigns
export const DEFAULT_RELATIONSHIP_TYPES = [
  // Alliance
  { key: 'ally', label: 'Ally', category: 'alliance', directed: false, default_strength: 3, default_volatility: 3 },
  { key: 'friend', label: 'Friend', category: 'alliance', directed: false, default_strength: 4, default_volatility: 2 },
  { key: 'lover', label: 'Lover', category: 'alliance', directed: false, default_strength: 5, default_volatility: 4 },
  { key: 'patron', label: 'Patron', category: 'alliance', directed: true, reverse_key: 'client', default_strength: 3, default_volatility: 3 },
  { key: 'client', label: 'Client', category: 'alliance', directed: true, reverse_key: 'patron', default_strength: 3, default_volatility: 3 },
  { key: 'protector', label: 'Protector', category: 'alliance', directed: true, reverse_key: 'ward', default_strength: 4, default_volatility: 2 },
  { key: 'ward', label: 'Ward', category: 'alliance', directed: true, reverse_key: 'protector', default_strength: 4, default_volatility: 2 },

  // Conflict
  { key: 'enemy', label: 'Enemy', category: 'conflict', directed: false, default_strength: 4, default_volatility: 3 },
  { key: 'rival', label: 'Rival', category: 'conflict', directed: false, default_strength: 3, default_volatility: 4 },
  { key: 'nemesis', label: 'Nemesis', category: 'conflict', directed: false, default_strength: 5, default_volatility: 2 },
  { key: 'hunter', label: 'Hunter', category: 'conflict', directed: true, reverse_key: 'prey', default_strength: 4, default_volatility: 3 },
  { key: 'prey', label: 'Prey', category: 'conflict', directed: true, reverse_key: 'hunter', default_strength: 4, default_volatility: 3 },
  { key: 'betrayer', label: 'Betrayer', category: 'conflict', directed: true, reverse_key: 'betrayed', default_strength: 5, default_volatility: 4 },
  { key: 'betrayed', label: 'Betrayed', category: 'conflict', directed: true, reverse_key: 'betrayer', default_strength: 5, default_volatility: 4 },

  // Kinship
  { key: 'parent', label: 'Parent', category: 'kinship', directed: true, reverse_key: 'child', default_strength: 5, default_volatility: 2 },
  { key: 'child', label: 'Child', category: 'kinship', directed: true, reverse_key: 'parent', default_strength: 5, default_volatility: 2 },
  { key: 'sibling', label: 'Sibling', category: 'kinship', directed: false, default_strength: 4, default_volatility: 2 },
  { key: 'spouse', label: 'Spouse', category: 'kinship', directed: false, default_strength: 5, default_volatility: 3 },
  { key: 'creator', label: 'Creator', category: 'kinship', directed: true, reverse_key: 'creation', default_strength: 4, default_volatility: 2 },
  { key: 'creation', label: 'Creation', category: 'kinship', directed: true, reverse_key: 'creator', default_strength: 4, default_volatility: 2 },
  { key: 'ancestor', label: 'Ancestor', category: 'kinship', directed: true, reverse_key: 'descendant', default_strength: 3, default_volatility: 1 },
  { key: 'descendant', label: 'Descendant', category: 'kinship', directed: true, reverse_key: 'ancestor', default_strength: 3, default_volatility: 1 },

  // Organization
  { key: 'leader', label: 'Leader', category: 'organization', directed: true, reverse_key: 'follower', default_strength: 4, default_volatility: 3 },
  { key: 'follower', label: 'Follower', category: 'organization', directed: true, reverse_key: 'leader', default_strength: 3, default_volatility: 3 },
  { key: 'member', label: 'Member Of', category: 'organization', directed: true, reverse_key: null, default_strength: 3, default_volatility: 2 },
  { key: 'boss', label: 'Boss', category: 'organization', directed: true, reverse_key: 'employee', default_strength: 3, default_volatility: 3 },
  { key: 'employee', label: 'Employee', category: 'organization', directed: true, reverse_key: 'boss', default_strength: 3, default_volatility: 3 },
  { key: 'mentor', label: 'Mentor', category: 'organization', directed: true, reverse_key: 'student', default_strength: 4, default_volatility: 3 },
  { key: 'student', label: 'Student', category: 'organization', directed: true, reverse_key: 'mentor', default_strength: 3, default_volatility: 3 },
  { key: 'partner', label: 'Business Partner', category: 'organization', directed: false, default_strength: 3, default_volatility: 3 },

  // Geography
  { key: 'located_in', label: 'Located In', category: 'geography', directed: true, reverse_key: 'contains', default_strength: 3, default_volatility: 1 },
  { key: 'contains', label: 'Contains', category: 'geography', directed: true, reverse_key: 'located_in', default_strength: 3, default_volatility: 1 },
  { key: 'controls', label: 'Controls', category: 'geography', directed: true, reverse_key: 'controlled_by', default_strength: 4, default_volatility: 3 },
  { key: 'controlled_by', label: 'Controlled By', category: 'geography', directed: true, reverse_key: 'controls', default_strength: 4, default_volatility: 3 },
  { key: 'borders', label: 'Borders', category: 'geography', directed: false, default_strength: 3, default_volatility: 1 },

  // Other
  { key: 'knows', label: 'Knows', category: 'other', directed: false, default_strength: 2, default_volatility: 2 },
  { key: 'connected', label: 'Connected To', category: 'other', directed: false, default_strength: 2, default_volatility: 3 },
  { key: 'owes_debt', label: 'Owes Debt To', category: 'other', directed: true, reverse_key: 'owed_by', default_strength: 3, default_volatility: 4 },
  { key: 'owed_by', label: 'Owed By', category: 'other', directed: true, reverse_key: 'owes_debt', default_strength: 3, default_volatility: 4 },
];

export const CATEGORY_COLORS = {
  alliance: { line: '#22c55e', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  conflict: { line: '#ef4444', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  kinship: { line: '#3b82f6', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  organization: { line: '#a855f7', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  geography: { line: '#6b7280', bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/50' },
  other: { line: '#f59e0b', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
};

export const CATEGORY_LABELS = {
  alliance: 'Alliance',
  conflict: 'Conflict',
  kinship: 'Kinship',
  organization: 'Organization',
  geography: 'Geography',
  other: 'Other',
};

export const STATE_LABELS = {
  active: 'Active',
  strained: 'Strained',
  broken: 'Broken',
  suspended: 'Suspended',
  unknown: 'Unknown',
};

export const STATE_MODIFIERS: Record<string, { opacity: number; strokeDasharray?: string }> = {
  active: { opacity: 1.0 },
  strained: { opacity: 0.7 },
  broken: { opacity: 0.4, strokeDasharray: '2,4' },
  suspended: { opacity: 0.5, strokeDasharray: '1,3' },
  unknown: { opacity: 0.3 },
};

// Get line style based on strength, volatility, and state
export function getRelationshipLineStyle(
  strength: number,
  volatility: number,
  state: string = 'active'
): {
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
  animation?: string;
} {
  // Base: Strength affects line thickness (1-5 maps to 1-4px)
  const strokeWidth = Math.max(1, Math.min(4, strength * 0.8));

  // Volatility affects dash pattern
  let strokeDasharray: string | undefined;
  if (volatility >= 5) {
    strokeDasharray = '2,2'; // Dotted (very unstable)
  } else if (volatility >= 4) {
    strokeDasharray = '4,4'; // Dashed
  } else if (volatility >= 3) {
    strokeDasharray = '8,4'; // Long dash
  }
  // volatility 1-2 = solid line

  // Base opacity from strength
  let opacity = 0.5 + strength * 0.1;

  // State modifiers
  const stateModifier = STATE_MODIFIERS[state as keyof typeof STATE_MODIFIERS] || STATE_MODIFIERS.active;
  opacity *= stateModifier.opacity;
  if (stateModifier.strokeDasharray && !strokeDasharray) {
    strokeDasharray = stateModifier.strokeDasharray;
  }

  // High volatility gets subtle animation class
  const animation = volatility >= 4 ? 'animate-pulse-subtle' : undefined;

  return { strokeWidth, strokeDasharray, opacity, animation };
}

// Get strength label
export function getStrengthLabel(strength: number): string {
  switch (strength) {
    case 1:
      return 'Tenuous';
    case 2:
      return 'Weak';
    case 3:
      return 'Moderate';
    case 4:
      return 'Strong';
    case 5:
      return 'Unbreakable';
    default:
      return 'Unknown';
  }
}

// Get volatility label
export function getVolatilityLabel(volatility: number): string {
  switch (volatility) {
    case 1:
      return 'Stable';
    case 2:
      return 'Steady';
    case 3:
      return 'Uncertain';
    case 4:
      return 'Volatile';
    case 5:
      return 'Explosive';
    default:
      return 'Unknown';
  }
}

// For AI context: describe the relationship in natural language
export function describeRelationship(relationship: {
  category: string;
  descriptor?: string;
  strength: number;
  volatility: number;
  state?: string;
}): string {
  const strengthWord = getStrengthLabel(relationship.strength).toLowerCase();
  const volatilityWord = getVolatilityLabel(relationship.volatility).toLowerCase();
  const descriptor = relationship.descriptor || relationship.category;
  const stateNote =
    relationship.state && relationship.state !== 'active' ? ` (currently ${relationship.state})` : '';

  return `${descriptor} (${strengthWord}, ${volatilityWord}${stateNote})`;
}
