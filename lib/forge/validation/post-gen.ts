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

// Helper function to get significant words (3+ chars, not common words)
function getSignificantWords(text: string): Set<string> {
  const commonWords = ['the', 'of', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'from']
  return new Set(
    text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length >= 3 && !commonWords.includes(word))
  )
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

  // DEBUG: Log scanner inputs
  console.log('=== SCANNER DEBUG ===')
  console.log('currentEntityName:', currentEntityName)
  console.log('textContent length:', textContent.length)
  console.log('textContent preview:', textContent.substring(0, 200))

  // Extract potential entity names from text (excluding current entity name)
  const potentialEntities = extractProperNouns(textContent, currentEntityName)

  // DEBUG: Log extracted entities
  console.log('potentialEntities found:', potentialEntities.map(e => e.text))

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
        const isBlocklisted = shouldIgnoreTerm(potential.text)
        console.log(`Blocklist check: "${potential.text}" -> ${isBlocklisted ? 'BLOCKED' : 'ALLOWED'}`)
        if (isBlocklisted) {
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

  // Filter out self-references using word overlap matching
  const entityWords = currentEntityName ? getSignificantWords(currentEntityName) : new Set<string>()
  console.log('entityWords for self-reference check:', Array.from(entityWords))

  const filteredDiscoveries = discoveries.filter(d => {
    if (!currentEntityName || entityWords.size === 0) return true

    const discoveryWords = getSignificantWords(d.text)

    // Check if any significant words overlap
    const hasOverlap = Array.from(discoveryWords).some(word => entityWords.has(word))

    if (hasOverlap) {
      console.log(`Excluding self-reference (word overlap): "${d.text}" matches "${currentEntityName}"`)
      return false
    }
    return true
  })

  // Apply additional filtering for generic patterns
  const qualityFiltered = filterGenericDiscoveries(filteredDiscoveries)
  console.log(`Filtered ${filteredDiscoveries.length - qualityFiltered.length} generic discoveries`)

  // Apply quantity limits per type
  const limitedDiscoveries = limitDiscoveriesByType(qualityFiltered)
  console.log(`Limited to ${limitedDiscoveries.length} discoveries (from ${qualityFiltered.length})`)

  // Calculate canon score based on how well the content fits existing lore
  const canonScore = calculateCanonScore(
    limitedDiscoveries.length,
    existingEntityMentions.length
  )

  // DEBUG: Final results
  console.log('=== SCANNER RESULTS ===')
  console.log('discoveries before filtering:', discoveries.length)
  console.log('discoveries after self-filter:', filteredDiscoveries.length)
  console.log('discoveries after quality filter:', qualityFiltered.length)
  console.log('discoveries after limits:', limitedDiscoveries.length)
  console.log('final discoveries:', limitedDiscoveries.map(d => ({ text: d.text, type: d.suggestedType })))
  console.log('existingEntityMentions:', existingEntityMentions.map(e => e.name))
  console.log('canonScore:', canonScore)

  return {
    discoveries: limitedDiscoveries,
    conflicts: [], // Post-gen conflicts can be added later
    canonScore,
    existingEntityMentions,
  }
}

/**
 * Filter out generic/low-quality discoveries
 */
function filterGenericDiscoveries(discoveries: Discovery[]): Discovery[] {
  // Patterns that indicate generic/non-specific terms
  const genericPatterns = [
    /^the\s+(leader|enemy|guard|merchant|soldier|commander|captain)/i,
    /^(a|an)\s+\w+$/i, // "a wizard", "an elf" - too generic
    /^the\s+\w+$/i, // "the dungeon", "the forest" - needs more specificity
    /^(some|many|few|several)\s+/i, // "some guards", "many soldiers"
  ]

  return discoveries.filter(d => {
    const text = d.text.trim()

    // Filter out very short names (likely generic)
    if (text.length < 4) {
      console.log(`Filtering short discovery: "${text}"`)
      return false
    }

    // Filter out generic patterns
    if (genericPatterns.some(pattern => pattern.test(text))) {
      console.log(`Filtering generic pattern: "${text}"`)
      return false
    }

    // Filter out single common words
    const singleWordGeneric = [
      'guards', 'soldiers', 'mercenaries', 'bandits', 'villagers',
      'townsfolk', 'citizens', 'people', 'council', 'party',
    ]
    if (singleWordGeneric.includes(text.toLowerCase())) {
      console.log(`Filtering generic word: "${text}"`)
      return false
    }

    return true
  })
}

/**
 * Limit discoveries by type to prevent overwhelming the user
 */
function limitDiscoveriesByType(discoveries: Discovery[]): Discovery[] {
  const limits: Record<string, number> = {
    npc: 7,
    location: 4,
    faction: 3,
    item: 3,
    creature: 3,
    quest: 2,
    encounter: 2,
    other: 3,
  }

  const result: Discovery[] = []
  const counts: Record<string, number> = {}

  // Sort by text length (longer = more specific = higher priority)
  const sorted = [...discoveries].sort((a, b) => b.text.length - a.text.length)

  for (const d of sorted) {
    const type = d.suggestedType || 'other'
    counts[type] = (counts[type] || 0) + 1

    const limit = limits[type] || 5
    if (counts[type] <= limit) {
      result.push(d)
    } else {
      console.log(`Limiting ${type}: skipping "${d.text}" (${counts[type]} > ${limit})`)
    }
  }

  // Total cap of 15 discoveries
  if (result.length > 15) {
    console.log(`Applying total cap: ${result.length} -> 15`)
    return result.slice(0, 15)
  }

  return result
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
