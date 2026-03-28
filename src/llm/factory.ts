import { LLMConfig, LLMProvider } from "./types.js";
import { OpenAIProvider } from "./providers/openai.js";

export function createLLMProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    default:
      throw new Error(`Unsupported LLM provider: "${config.provider}". Supported: openai`);
  }
}
