// Forge Foundation
// Re-export all forge utilities for convenient importing

// Validation
export { validatePreGeneration } from './validation/pre-gen'
export { scanGeneratedContent, extractTextForScanning } from './validation/post-gen'
export { extractProperNouns, guessEntityType } from './validation/scanners'

// Entity management
export {
  createStubEntities,
  saveForgedEntity,
  addHistoryEntry,
  type StubCreationResult,
} from './entity-minter'
