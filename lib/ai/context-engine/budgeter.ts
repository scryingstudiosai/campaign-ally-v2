import { ContextProfile, LayerResult, ContextLayer } from './types';

/**
 * Estimates tokens in text (rough approximation: 1 token ≈ 4 chars)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Truncates text to fit within a token budget
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const currentTokens = estimateTokens(text);
  if (currentTokens <= maxTokens) return text;

  // Truncate by character count (4 chars per token)
  const maxChars = maxTokens * 4;
  return text.slice(0, maxChars - 3) + '...';
}

/**
 * Allocates token budget across layers based on profile weights
 */
export function allocateBudget(
  layers: LayerResult[],
  profile: ContextProfile
): LayerResult[] {
  const totalBudget = profile.tokenBudget;
  const weights = profile.weights;
  const priorityOrder = profile.priorityOrder;

  // Calculate total weight for normalization
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + (w || 0), 0);

  // First pass: allocate based on weights
  const allocated: LayerResult[] = [];
  let usedTokens = 0;

  // Process in priority order
  for (const layerName of priorityOrder) {
    const layer = layers.find((l) => l.layer === layerName);
    if (!layer || !layer.content) continue;

    const weight = weights[layerName] || 0;
    const layerBudget = Math.floor((weight / totalWeight) * totalBudget);

    // Truncate if needed
    const truncatedContent = truncateToTokens(layer.content, layerBudget);
    const actualTokens = estimateTokens(truncatedContent);

    // Check if we have room
    if (usedTokens + actualTokens > totalBudget) {
      // Try to fit what we can
      const remainingBudget = totalBudget - usedTokens;
      if (remainingBudget > 50) {
        // Only add if meaningful
        const finalContent = truncateToTokens(layer.content, remainingBudget);
        allocated.push({
          ...layer,
          content: finalContent,
          tokens: estimateTokens(finalContent),
        });
      }
      break;
    }

    allocated.push({
      ...layer,
      content: truncatedContent,
      tokens: actualTokens,
    });
    usedTokens += actualTokens;
  }

  return allocated;
}

/**
 * Summarizes token usage
 */
export function summarizeUsage(layers: LayerResult[], budget: number) {
  const byLayer: Partial<Record<ContextLayer, number>> = {};
  let total = 0;

  for (const layer of layers) {
    byLayer[layer.layer] = layer.tokens;
    total += layer.tokens;
  }

  return {
    total,
    budget,
    byLayer,
    remaining: budget - total,
    utilizationPercent: Math.round((total / budget) * 100),
  };
}
