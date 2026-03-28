export interface LLMUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface LLMResponse {
  title: string;
  subtitle: string;
  body: string;
  usage?: LLMUsage;
}

export interface LLMProvider {
  generate(prompt: string, system?: string): Promise<LLMResponse>;
  stream(prompt: string, system?: string, onChunk?: (chunk: string) => void): Promise<LLMResponse>;
  validateConfig(): Promise<boolean>;
}

export interface LLMConfig {
  provider: "openai" | "anthropic";
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}
