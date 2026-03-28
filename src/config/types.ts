export interface LLMConfig {
  provider: "openai" | "anthropic";
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
}

export interface LLMOverride {
  provider?: "openai" | "anthropic";
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OutlineConfig {
  auto_save: boolean;
  naming_convention: string;
  require_outline_for_post: boolean;
}

export interface ImageConfig {
  model: string;
  apiKey?: string;
}

export interface ImageOverride {
  model?: string;
  aspect_ratio?: string;
}

export interface DrftpnkConfig {
  default_persona: string;
  default_content_type: string;
  output_dir: string;
  outline: OutlineConfig;
  llm: LLMConfig;
  llm_by_content_type?: Record<string, LLMOverride>;
  image?: ImageConfig;
  image_by_content_type?: Record<string, ImageOverride>;
}
