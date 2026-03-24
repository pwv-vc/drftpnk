interface ModelPricing {
  inputPerMillion: number
  outputPerMillion: number
}

const PRICING: Record<string, ModelPricing> = {
  'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10.0 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4o-2024-11-20': { inputPerMillion: 2.5, outputPerMillion: 10.0 },
  'gpt-4o-2024-08-06': { inputPerMillion: 2.5, outputPerMillion: 10.0 },
  'gpt-4o-mini-2024-07-18': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4-turbo': { inputPerMillion: 10.0, outputPerMillion: 30.0 },
  'gpt-4-turbo-preview': { inputPerMillion: 10.0, outputPerMillion: 30.0 },
  'gpt-4': { inputPerMillion: 30.0, outputPerMillion: 60.0 },
  'gpt-3.5-turbo': { inputPerMillion: 0.5, outputPerMillion: 1.5 },
  'o1': { inputPerMillion: 15.0, outputPerMillion: 60.0 },
  'o1-mini': { inputPerMillion: 3.0, outputPerMillion: 12.0 },
  'o3-mini': { inputPerMillion: 1.1, outputPerMillion: 4.4 },
}

export interface CostBreakdown {
  inputCost: number
  outputCost: number
  totalCost: number
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): CostBreakdown {
  const pricing = PRICING[model] ?? PRICING['gpt-4o']
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion
  return { inputCost, outputCost, totalCost: inputCost + outputCost }
}
