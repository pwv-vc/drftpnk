export interface PersonaStyle {
  voice: string[]
  domains: string[]
  signature_devices: string[]
  tone_rules: string[]
}

export interface PersonaImageStyle {
  art_style: string[]
  color_palette?: string[]
  mood?: string[]
  negative_prompt?: string
}

export interface PersonaPromptSet {
  outlineSystem?: string
  outline?: string
  contentSystem?: string
  content?: string
}

export interface PersonaPrompts {
  [contentTypeId: string]: PersonaPromptSet
}

export interface Persona {
  id: string
  name: string
  description: string
  style: PersonaStyle
  system_prompt: string
  image_style?: PersonaImageStyle
  image_style_prompt?: string
  do_not?: string[]
  prompts?: PersonaPrompts
  source_urls?: string[]
  llm?: import('../config/types.js').LLMOverride
  llm_by_content_type?: Record<string, import('../config/types.js').LLMOverride>
}
