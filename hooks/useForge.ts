'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validatePreGeneration, type PreValidationOptions } from '@/lib/forge/validation/pre-gen'
import { scanGeneratedContent, ScanOptions } from '@/lib/forge/validation/post-gen'
import { saveForgedEntity, createStubEntities } from '@/lib/forge/entity-minter'
import type {
  ForgeType,
  ForgeState,
  Discovery,
  Conflict,
  BaseForgeInput,
} from '@/types/forge'

interface UseForgeOptions<TInput extends BaseForgeInput, TOutput> {
  campaignId: string
  forgeType: ForgeType
  generateFn: (input: TInput) => Promise<TOutput>
  getTextContent: (output: TOutput) => string // Extracts text for scanning
  getEntityName?: (output: TOutput) => string // Extracts entity name to exclude from discoveries
  stubId?: string // When fleshing out a stub, skip duplicate name check for this entity
}

interface GenerateResult {
  success: boolean
  reason?: 'validation_failed' | 'error'
}

interface CommitResult {
  success: boolean
  entity?: unknown
  stubs?: Array<{ discoveryId: string; entityId: string; name: string }>
  error?: string
}

export function useForge<TInput extends BaseForgeInput, TOutput>(
  options: UseForgeOptions<TInput, TOutput>
) {
  const { campaignId, forgeType, generateFn, getTextContent, getEntityName, stubId } = options
  const supabase = createClient()

  const [state, setState] = useState<ForgeState<TInput, TOutput>>({
    status: 'idle',
    input: null,
    output: null,
    preValidation: null,
    scanResult: null,
    error: null,
  })

  // Guard to prevent multiple simultaneous generations
  const [isGenerating, setIsGenerating] = useState(false)

  // Step 1: Validate before generating
  const handleGenerate = useCallback(
    async (input: TInput): Promise<GenerateResult> => {
      // Prevent multiple clicks
      if (isGenerating) {
        console.log('Generation already in progress, ignoring')
        return { success: false, reason: 'error' }
      }

      setIsGenerating(true)
      setState((prev) => ({ ...prev, status: 'validating', input, error: null }))

      try {
        // Pre-generation validation
        const preValidation = await validatePreGeneration(
          supabase,
          campaignId,
          forgeType,
          input,
          { stubId }
        )

        // Check if there are any issues to show the user
        const hasIssues = preValidation.conflicts.length > 0 || preValidation.warnings.length > 0

        if (!preValidation.canProceed || hasIssues) {
          // Has blocking errors OR warnings to review - stop and show them
          setState((prev) => ({
            ...prev,
            status: 'idle',
            preValidation,
          }))
          // Reset the guard so "Generate Anyway" can be clicked
          setIsGenerating(false)
          return { success: false, reason: 'validation_failed' }
        }

        // No issues - proceed to generate
        setState((prev) => ({ ...prev, status: 'generating', preValidation }))

        const output = await generateFn(input)

        setState((prev) => ({ ...prev, status: 'scanning', output }))

        // Post-generation scanning
        const textContent = getTextContent(output)
        const currentEntityName = getEntityName ? getEntityName(output) : undefined
        const scanResult = await scanGeneratedContent(
          supabase,
          campaignId,
          textContent,
          { currentEntityName }
        )

        setState((prev) => ({
          ...prev,
          status: 'review',
          scanResult,
        }))

        return { success: true }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Generation failed',
        }))
        return { success: false, reason: 'error' }
      } finally {
        setIsGenerating(false)
      }
    },
    [campaignId, forgeType, generateFn, getTextContent, getEntityName, supabase, isGenerating, stubId]
  )

  // Step 2: User reviews and commits
  const handleCommit = useCallback(
    async (decisions: {
      discoveries: Discovery[] // With updated status (create_stub, link_existing, ignore)
      conflicts: Conflict[] // With updated resolution
      metadata?: {
        ownerId?: string
        locationId?: string
        factionId?: string
      }
    }): Promise<CommitResult> => {
      setState((prev) => ({ ...prev, status: 'saving' }))

      try {
        // Create stub entities for approved discoveries
        console.log('[useForge] handleCommit called')
        console.log('[useForge] All discoveries:', decisions.discoveries)
        console.log('[useForge] Discovery statuses:', decisions.discoveries.map(d => ({ id: d.id, text: d.text, status: d.status })))

        const stubsToCreate = decisions.discoveries.filter(
          (d) => d.status === 'create_stub'
        )
        console.log('[useForge] Stubs to create (status=create_stub):', stubsToCreate)

        const createdStubs = await createStubEntities(
          supabase,
          campaignId,
          stubsToCreate,
          forgeType
        )
        console.log('[useForge] Created stubs result:', createdStubs)

        // Extract metadata from input if not provided explicitly
        const inputData = state.input as Record<string, unknown> | null
        const metadata = decisions.metadata || {
          ownerId: inputData?.ownerId as string | undefined,
          locationId: inputData?.locationId as string | undefined,
          factionId: inputData?.factionId as string | undefined,
        }

        // Save the main entity
        const savedEntity = await saveForgedEntity(
          supabase,
          campaignId,
          forgeType,
          state.output as Record<string, unknown> | null,
          {
            discoveries: decisions.discoveries,
            conflicts: decisions.conflicts,
            createdStubs,
            metadata,
          }
        )

        setState((prev) => ({ ...prev, status: 'saved' }))

        return { success: true, entity: savedEntity, stubs: createdStubs }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Save failed'
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }))
        return { success: false, error: errorMessage }
      }
    },
    [campaignId, forgeType, state.input, state.output, supabase]
  )

  // Reset to start over
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      input: null,
      output: null,
      preValidation: null,
      scanResult: null,
      error: null,
    })
  }, [])

  // Override validation and proceed anyway
  const proceedAnyway = useCallback(async () => {
    // Prevent multiple clicks
    if (isGenerating) {
      console.log('Generation already in progress, ignoring')
      return
    }

    console.log('proceedAnyway called with input:', state.input)

    if (state.input) {
      setIsGenerating(true)
      try {
        setState((prev) => ({ ...prev, status: 'generating' }))

        console.log('Starting generation...')
        const output = await generateFn(state.input)
        console.log('Generation complete, output:', output)

        setState((prev) => ({ ...prev, status: 'scanning', output }))

        const textContent = getTextContent(output)
        const currentEntityName = getEntityName ? getEntityName(output) : undefined
        console.log('Scanning content for entity:', currentEntityName)

        const scanResult = await scanGeneratedContent(
          supabase,
          campaignId,
          textContent,
          { currentEntityName }
        )
        console.log('Scan complete:', scanResult)

        setState((prev) => ({ ...prev, status: 'review', scanResult }))
      } catch (error) {
        console.error('proceedAnyway error:', error)
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Generation failed',
        }))
      } finally {
        setIsGenerating(false)
      }
    }
  }, [state.input, generateFn, getTextContent, getEntityName, supabase, campaignId, isGenerating])

  // Update a specific discovery's status
  const updateDiscovery = useCallback(
    (discoveryId: string, updates: Partial<Discovery>) => {
      setState((prev) => {
        if (!prev.scanResult) return prev
        return {
          ...prev,
          scanResult: {
            ...prev.scanResult,
            discoveries: prev.scanResult.discoveries.map((d) =>
              d.id === discoveryId ? { ...d, ...updates } : d
            ),
          },
        }
      })
    },
    []
  )

  // Update a specific conflict's resolution
  const updateConflict = useCallback(
    (conflictId: string, resolution: Conflict['resolution']) => {
      setState((prev) => {
        if (!prev.preValidation) return prev
        return {
          ...prev,
          preValidation: {
            ...prev.preValidation,
            conflicts: prev.preValidation.conflicts.map((c) =>
              c.id === conflictId ? { ...c, resolution } : c
            ),
          },
        }
      })
    },
    []
  )

  return {
    ...state,
    handleGenerate,
    handleCommit,
    proceedAnyway,
    reset,
    updateDiscovery,
    updateConflict,
  }
}
