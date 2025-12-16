// Pre-generation validation
// Checks for conflicts before AI generation begins

import { SupabaseClient } from '@supabase/supabase-js'
import type {
  ForgeType,
  PreValidationResult,
  Conflict,
  BaseForgeInput,
} from '@/types/forge'
import { validateAgainstCodex } from '../codex-validator'
import type { CampaignCodex } from '../prompt-builder'

interface NPCInput extends BaseForgeInput {
  role?: string
  faction?: string
}

export interface PreValidationOptions {
  stubId?: string // Skip duplicate check for this entity (when fleshing out a stub)
}

export async function validatePreGeneration(
  supabase: SupabaseClient,
  campaignId: string,
  forgeType: ForgeType,
  input: BaseForgeInput,
  options?: PreValidationOptions
): Promise<PreValidationResult> {
  const conflicts: Conflict[] = []
  const warnings: string[] = []

  // 1. DUPLICATE NAME CHECK
  // Skip if we're fleshing out a stub (the entity already exists)
  if (input.name && !options?.stubId) {
    const { data: existingByName } = await supabase
      .from('entities')
      .select('id, name, entity_type, status, attributes')
      .eq('campaign_id', campaignId)
      .ilike('name', input.name)
      .is('deleted_at', null)
      .limit(5)

    if (existingByName && existingByName.length > 0) {
      const exactMatch = existingByName.find(
        (e) => e.name.toLowerCase() === input.name?.toLowerCase()
      )

      // Skip if the found entity IS the stub we're fleshing out
      if (exactMatch && exactMatch.id !== options?.stubId) {
        // Check if deceased
        const isDeceased = exactMatch.status === 'deceased'

        conflicts.push({
          id: `dup-${exactMatch.id}`,
          type: isDeceased ? 'deceased_entity' : 'duplicate_name',
          description: isDeceased
            ? `"${exactMatch.name}" exists but is marked as deceased. Create a successor or retcon?`
            : `An entity named "${exactMatch.name}" already exists.`,
          severity: 'warning', // Warning, not blocking
          existingEntityId: exactMatch.id,
          existingEntityName: exactMatch.name,
          suggestions: isDeceased
            ? ['Create successor', 'Retcon death', 'Use different name']
            : ['Edit existing', 'Create anyway', 'Use different name'],
          resolution: 'pending',
        })
      } else if (existingByName.length > 0 && !existingByName.some(e => e.id === options?.stubId)) {
        // Similar names found (excluding the stub itself)
        const otherEntities = existingByName.filter(e => e.id !== options?.stubId)
        if (otherEntities.length > 0) {
          warnings.push(
            `Similar names exist: ${otherEntities.map((e) => e.name).join(', ')}`
          )
        }
      }
    }
  }

  // 2. LOCATION EXISTS CHECK
  if (input.location) {
    const { data: locationEntity } = await supabase
      .from('entities')
      .select('id, name')
      .eq('campaign_id', campaignId)
      .eq('entity_type', 'location')
      .ilike('name', input.location)
      .is('deleted_at', null)
      .maybeSingle()

    if (!locationEntity) {
      conflicts.push({
        id: `loc-missing-${input.location}`,
        type: 'location_missing',
        description: `Location "${input.location}" doesn't exist in your world.`,
        severity: 'warning',
        suggestions: ['Create location', 'Choose existing', 'Proceed anyway'],
        resolution: 'pending',
      })
    }
  }

  // 3. ROLE CONFLICT CHECK (for NPCs with leadership roles)
  const npcInput = input as NPCInput
  if (npcInput.role && npcInput.faction && forgeType === 'npc') {
    const leadershipRoles = [
      'leader',
      'guild master',
      'guildmaster',
      'chief',
      'king',
      'queen',
      'lord',
      'lady',
      'captain',
      'commander',
      'high priest',
      'high priestess',
      'archon',
      'elder',
      'chairman',
      'chairwoman',
      'president',
      'director',
    ]
    const isLeadershipRole = leadershipRoles.some((r) =>
      npcInput.role?.toLowerCase().includes(r)
    )

    if (isLeadershipRole) {
      // Search for existing leaders in this faction
      const { data: existingMembers } = await supabase
        .from('entities')
        .select('id, name, attributes')
        .eq('campaign_id', campaignId)
        .eq('entity_type', 'npc')
        .is('deleted_at', null)

      const currentLeader = existingMembers?.find((e) => {
        const attrs = e.attributes as Record<string, unknown> | null
        const entityRole = (attrs?.role as string)?.toLowerCase() || ''
        const entityFaction = (attrs?.faction as string)?.toLowerCase() || ''

        // Check if same faction and has leadership role
        if (!entityFaction.includes(npcInput.faction!.toLowerCase())) return false
        return leadershipRoles.some((r) => entityRole.includes(r))
      })

      if (currentLeader) {
        conflicts.push({
          id: `role-${currentLeader.id}`,
          type: 'role_conflict',
          description: `${currentLeader.name} is already a leader of ${npcInput.faction}.`,
          severity: 'warning',
          existingEntityId: currentLeader.id,
          existingEntityName: currentLeader.name,
          suggestions: [
            'Replace existing leader',
            'Make co-leaders',
            'Create rival faction',
            'Change role',
          ],
          resolution: 'pending',
        })
      }
    }
  }

  // 4. CODEX CONFLICT CHECK
  const { data: codexData, error: codexError } = await supabase
    .from('codex')
    .select('*')
    .eq('campaign_id', campaignId)
    .single()

  if (codexError) {
    console.log('Codex fetch:', codexError.code === 'PGRST116' ? 'No codex found' : codexError.message)
  }

  if (codexData) {
    const codex = codexData as Record<string, unknown>

    // Check naming conventions
    const namingConventions = codex.naming_conventions as Record<string, unknown> | undefined
    if (namingConventions && input.name) {
      const notes = namingConventions.notes as string | undefined
      if (notes) {
        warnings.push(`Codex naming note: ${notes}`)
      }
    }

    // Check established factions
    const factions = codex.factions as Array<{ name: string }> | undefined
    if (factions && npcInput.faction) {
      const knownFaction = factions.find(
        (f) => f.name.toLowerCase() === npcInput.faction?.toLowerCase()
      )
      if (!knownFaction) {
        warnings.push(
          `Faction "${npcInput.faction}" is not in the codex. Consider adding it.`
        )
      }
    }
  }

  // 5. CODEX CONTENT VALIDATION
  if (codexData) {
    const codex = codexData as CampaignCodex
    const codexValidation = validateAgainstCodex(input as Record<string, unknown>, codex)
    if (!codexValidation.isValid) {
      for (const warning of codexValidation.warnings) {
        warnings.push(warning)
      }
      for (const suggestion of codexValidation.suggestions) {
        warnings.push(`Suggestion: ${suggestion}`)
      }
    }
  }

  // Determine if we can proceed
  const hasBlockingErrors = conflicts.some((c) => c.severity === 'error')

  return {
    canProceed: !hasBlockingErrors,
    conflicts,
    warnings,
  }
}
