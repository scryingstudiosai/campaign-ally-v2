import { buildForgePrompt } from './prompt-builder'
import type { ForgeType } from '@/types/forge'
import { SupabaseClient } from '@supabase/supabase-js'

interface GenerationResult<T> {
  success: boolean
  data?: T
  error?: string
  rawResponse?: string
}

export async function generateForgeContent<T>(
  supabase: SupabaseClient,
  campaignId: string,
  forgeType: ForgeType,
  userInput: Record<string, unknown>,
  apiEndpoint: string = '/api/generate'
): Promise<GenerationResult<T>> {
  try {
    // Build the prompt with full context
    const { systemPrompt, userPrompt } = await buildForgePrompt(
      supabase,
      campaignId,
      forgeType,
      userInput
    )

    // Call the AI generation endpoint
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
        forgeType,
        campaignId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`)
    }

    const result = await response.json()

    // Parse the AI response
    let parsedData: T
    try {
      // Handle if the response is already parsed or needs parsing
      parsedData =
        typeof result.content === 'string'
          ? JSON.parse(result.content)
          : result.content
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.content)
      return {
        success: false,
        error: 'Failed to parse AI response',
        rawResponse: result.content,
      }
    }

    return {
      success: true,
      data: parsedData,
    }
  } catch (error) {
    console.error('Generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
