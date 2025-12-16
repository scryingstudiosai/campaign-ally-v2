// Forge Foundation
// Re-export all forge utilities for convenient importing

// Types
export * from '@/types/forge'

// Hooks
export { useForge } from '@/hooks/useForge'

// Validation
export { validatePreGeneration } from './validation/pre-gen'
export { scanGeneratedContent, extractTextForScanning } from './validation/post-gen'
export { extractProperNouns, guessEntityType } from './validation/scanners'
export { validateAgainstCodex } from './codex-validator'

// Generation
export { buildForgePrompt, type CampaignCodex } from './prompt-builder'
export { generateForgeContent } from './ai-generator'

// Entity management
export {
  createStubEntities,
  saveForgedEntity,
  addHistoryEntry,
  type StubCreationResult,
} from './entity-minter'

// Components
export { ForgeShell } from '@/components/forge/ForgeShell'
export { CommitPanel } from '@/components/forge/CommitPanel'
export { InteractiveText } from '@/components/forge/InteractiveText'
export { PreValidationAlert } from '@/components/forge/PreValidationAlert'
export { EmptyForgeState } from '@/components/forge/EmptyForgeState'
