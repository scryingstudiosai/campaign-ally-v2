'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validatePreGeneration } from '@/lib/forge/validation/pre-gen'
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
  const { campaignId, forgeType, generateFn, getTextContent, getEntityName } = options
  const supabase = createClient()

  const [state, setState] = useState<ForgeState<TInput, TOutput>>({
    status: 'idle',
    input: null,
    output: null,
    preValidation: null,
    scanResult: null,
    error: null,
  })

  // Step 1: Validate before generating
  const handleGenerate = useCallback(
    async (input: TInput): Promise<GenerateResult> => {
      setState((prev) => ({ ...prev, status: 'validating', input, error: null }))

      try {
        // Pre-generation validation
        const preValidation = await validatePreGeneration(
          supabase,
          campaignId,
          forgeType,
          input
        )

        if (!preValidation.canProceed) {
          // Has blocking errors - stop and show them
          setState((prev) => ({
            ...prev,
            status: 'idle',
            preValidation,
          }))
          return { success: false, reason: 'validation_failed' }
        }

        // Validation passed (or only warnings) - proceed to generate
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
      }
    },
    [campaignId, forgeType, generateFn, getTextContent, getEntityName, supabase]
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
        const stubsToCreate = decisions.discoveries.filter(
          (d) => d.status === 'create_stub'
        )
        const createdStubs = await createStubEntities(
          supabase,
          campaignId,
          stubsToCreate,
          forgeType
        )

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
    if (state.input) {
      setState((prev) => ({ ...prev, status: 'generating' }))
      // Re-run generation skipping validation
      const output = await generateFn(state.input)
      setState((prev) => ({ ...prev, status: 'scanning', output }))

      const textContent = getTextContent(output)
      const currentEntityName = getEntityName ? getEntityName(output) : undefined
      const scanResult = await scanGeneratedContent(
        supabase,
        campaignId,
        textContent,
        { currentEntityName }
      )

      setState((prev) => ({ ...prev, status: 'review', scanResult }))
    }
  }, [state.input, generateFn, getTextContent, getEntityName, supabase, campaignId])

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
