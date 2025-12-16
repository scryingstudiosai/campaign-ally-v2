// Post-generation scanning
// Analyzes generated text to find entity mentions and discoveries

import { SupabaseClient } from '@supabase/supabase-js'
import { extractProperNouns, guessEntityType } from './scanners'
import { shouldIgnoreTerm } from './blocklist'
import type { ScanResult, Discovery, EntityType } from '@/types/forge'

export interface ScanOptions {
  /** Name of the entity currently being created (to exclude from discoveries) */
  currentEntityName?: string
}

export async function scanGeneratedContent(
  supabase: SupabaseClient,
  campaignId: string,
  textContent: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const { currentEntityName } = options
  const discoveries: Discovery[] = []
  const existingEntityMentions: ScanResult['existingEntityMentions'] = []

  // Extract potential entity names from text (excluding current entity name)
  const potentialEntities = extractProperNouns(textContent, currentEntityName)

  // Fetch all entities for this campaign to check against
  const { data: allEntities } = await supabase
    .from('entities')
    .select('id, name, entity_type')
    .eq('campaign_id', campaignId)
    .is('deleted_at', null)

  // Create a map for efficient lookup (case-insensitive)
  const entityMap = new Map(
    (allEntities || []).map((e) => [e.name.toLowerCase(), e])
  )

  // Also create an array of known names for partial matching
  const knownNames = (allEntities || []).map((e) => e.name.toLowerCase())

  // Check each potential entity
  for (const potential of potentialEntities) {
    const lowerText = potential.text.toLowerCase()
    const existing = entityMap.get(lowerText)

    if (existing) {
      // Found existing entity - will be shown as blue link
      existingEntityMentions.push({
        id: existing.id,
        name: existing.name,
        type: existing.entity_type as EntityType,
        startIndex: potential.startIndex,
        endIndex: potential.endIndex,
      })
    } else {
      // Check for partial matches (e.g., "Lord Vorn" when "Vorn" exists)
      let isPartialMatch = false
      for (const knownName of knownNames) {
        if (
          lowerText.includes(knownName) ||
          knownName.includes(lowerText)
        ) {
          // Found a partial match - might be a variation of existing entity
          const existingPartial = entityMap.get(knownName)
          if (existingPartial) {
            existingEntityMentions.push({
              id: existingPartial.id,
              name: existingPartial.name,
              type: existingPartial.entity_type as EntityType,
              startIndex: potential.startIndex,
              endIndex: potential.endIndex,
            })
            isPartialMatch = true
            break
          }
        }
      }

      if (!isPartialMatch) {
        // Skip blocklisted terms (D&D mechanics, common words, etc.)
        if (shouldIgnoreTerm(potential.text)) {
          continue
        }

        // New entity discovered - will be shown with gold underline
        discoveries.push({
          id: `discovery-${potential.startIndex}-${Date.now()}`,
          text: potential.text,
          suggestedType: guessEntityType(potential.text, potential.context),
          context: potential.context,
          status: 'pending',
        })
      }
    }
  }

  // Calculate canon score based on how well the content fits existing lore
  const canonScore = calculateCanonScore(
    discoveries.length,
    existingEntityMentions.length
  )

  return {
    discoveries,
    conflicts: [], // Post-gen conflicts can be added later
    canonScore,
    existingEntityMentions,
  }
}

function calculateCanonScore(
  discoveryCount: number,
  existingMentionCount: number
): 'high' | 'medium' | 'low' {
  // High canon score = references existing entities, few new inventions
  // Low canon score = many new inventions, few existing references

  const total = discoveryCount + existingMentionCount

  if (total === 0) return 'high' // No entities mentioned at all

  const existingRatio = existingMentionCount / total

  if (existingRatio >= 0.7 && discoveryCount <= 2) return 'high'
  if (existingRatio >= 0.4 || discoveryCount <= 4) return 'medium'
  return 'low'
}

// Helper to get all text fields from a generated output for scanning
export function extractTextForScanning(output: Record<string, unknown>): string {
  const textFields: string[] = []

  function extractStrings(obj: unknown, depth = 0): void {
    if (depth > 5) return // Prevent infinite recursion

    if (typeof obj === 'string' && obj.length > 10) {
      textFields.push(obj)
    } else if (Array.isArray(obj)) {
      obj.forEach((item) => extractStrings(item, depth + 1))
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach((value) => extractStrings(value, depth + 1))
    }
  }

  extractStrings(output)
  return textFields.join('\n\n')
}
