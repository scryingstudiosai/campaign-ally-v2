import type { CampaignCodex } from './prompt-builder'

interface CodexValidation {
  isValid: boolean
  warnings: string[]
  suggestions: string[]
}

export function validateAgainstCodex(
  content: Record<string, unknown>,
  codex: CampaignCodex | null
): CodexValidation {
  const warnings: string[] = []
  const suggestions: string[] = []

  if (!codex) {
    return { isValid: true, warnings: [], suggestions: [] }
  }

  // Check naming conventions
  if (codex.naming_conventions?.notes && content.name) {
    const nameCheck = checkNamingConvention(
      String(content.name),
      codex.naming_conventions.notes,
      codex.naming_conventions.examples || []
    )

    if (!nameCheck.matches) {
      warnings.push(
        `Name "${content.name}" may not match your naming conventions: ${codex.naming_conventions.notes}`
      )
      if (nameCheck.suggestion) {
        suggestions.push(nameCheck.suggestion)
      }
    }
  }

  // Check for theme consistency
  if (codex.themes && codex.themes.length > 0) {
    const themeCheck = checkThemeConsistency(content, codex.themes)
    if (themeCheck.warnings.length > 0) {
      warnings.push(...themeCheck.warnings)
    }
  }

  // Check against safety presets
  if (codex.safety_presets && codex.safety_presets.length > 0) {
    const safetyCheck = checkSafetyPresets(content, codex.safety_presets)
    if (safetyCheck.violations.length > 0) {
      warnings.push(
        ...safetyCheck.violations.map((v) => `Content may touch on safety preset: ${v}`)
      )
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions,
  }
}

function checkNamingConvention(
  name: string,
  conventionNotes: string,
  examples: string[]
): { matches: boolean; suggestion?: string } {
  const lowerNotes = conventionNotes.toLowerCase()

  // Simple heuristics - can be expanded
  const isNordic = lowerNotes.includes('nordic') || lowerNotes.includes('norse')
  const isCeltic = lowerNotes.includes('celtic') || lowerNotes.includes('irish')
  const _isAsian =
    lowerNotes.includes('asian') ||
    lowerNotes.includes('japanese') ||
    lowerNotes.includes('chinese')
  const _isMedieval =
    lowerNotes.includes('medieval') || lowerNotes.includes('english')

  // Check if name matches expected pattern (very simple check)
  const nordicEndings = ['son', 'sson', 'dottir', 'heim', 'fjord', 'vik']
  const celticPrefixes = ['mac', 'mc', "o'", 'fitz']

  if (isNordic) {
    const hasNordicStyle =
      nordicEndings.some((e) => name.toLowerCase().endsWith(e)) ||
      /[^aeiou]{2,}/.test(name) // Consonant clusters common in Nordic

    if (!hasNordicStyle) {
      return {
        matches: false,
        suggestion: `Consider Nordic-style names like: ${examples.join(', ') || 'Bjorn, Astrid, Thorvald'}`,
      }
    }
  }

  if (isCeltic) {
    const hasCelticStyle =
      celticPrefixes.some((p) => name.toLowerCase().startsWith(p)) ||
      /[aeiou]{2,}/.test(name) // Vowel combinations common in Celtic

    if (!hasCelticStyle) {
      return {
        matches: false,
        suggestion: `Consider Celtic-style names like: ${examples.join(', ') || 'Brennan, Siobhan, Cormac'}`,
      }
    }
  }

  return { matches: true }
}

function checkThemeConsistency(
  content: Record<string, unknown>,
  themes: string[]
): { warnings: string[] } {
  const warnings: string[] = []
  const contentText = JSON.stringify(content).toLowerCase()

  // Theme-specific checks
  const darkThemes = ['dark', 'gritty', 'horror', 'grimdark']
  const lightThemes = ['heroic', 'high fantasy', 'lighthearted', 'comedy']

  const isDarkCampaign = themes.some((t) =>
    darkThemes.some((d) => t.toLowerCase().includes(d))
  )
  const isLightCampaign = themes.some((t) =>
    lightThemes.some((l) => t.toLowerCase().includes(l))
  )

  // Check for tone mismatches
  const darkWords = ['grim', 'bleak', 'hopeless', 'cruel', 'torture']
  const lightWords = ['whimsical', 'silly', 'comical', 'cheerful']

  if (isLightCampaign && darkWords.some((w) => contentText.includes(w))) {
    warnings.push("Content may be darker than your campaign's lighthearted tone")
  }

  if (isDarkCampaign && lightWords.some((w) => contentText.includes(w))) {
    warnings.push("Content may be lighter than your campaign's dark tone")
  }

  return { warnings }
}

function checkSafetyPresets(
  content: Record<string, unknown>,
  safetyPresets: string[]
): { violations: string[] } {
  const violations: string[] = []
  const contentText = JSON.stringify(content).toLowerCase()

  for (const preset of safetyPresets) {
    const presetLower = preset.toLowerCase()

    // Common safety topics and related keywords
    const topicKeywords: Record<string, string[]> = {
      violence: ['gore', 'torture', 'mutilation', 'graphic'],
      sexual: ['seductive', 'intimate', 'romance'],
      drugs: ['addiction', 'intoxicated', 'substance'],
      slavery: ['slave', 'enslaved', 'bondage', 'servitude'],
      'child harm': ['child', 'orphan', 'young'],
      'real-world politics': ['election', 'political party', 'president'],
      'real-world religion': ['christian', 'muslim', 'jewish', 'buddhist'],
    }

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (presetLower.includes(topic)) {
        const matches = keywords.filter((k) => contentText.includes(k))
        if (matches.length > 0) {
          violations.push(`${topic} (found: ${matches.join(', ')})`)
        }
      }
    }
  }

  return { violations }
}
