import { LLMUsage } from "../llm/types.js";

export interface ImagePromptResult {
  prompt: string;
  negativePrompt?: string;
  altText: string;
  usage?: LLMUsage;
}

export interface ImageGenResult {
  url: string;
  fileName: string;
  width: number;
  height: number;
  contentType: string;
  falFileSize?: number;
  elapsedMs: number;
}
