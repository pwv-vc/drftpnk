import { IdeaDocument, ValidationResult } from '../idea/types.js'
import { Persona } from '../personas/types.js'
import { LLMResponse } from '../llm/types.js'

export interface PluginStructure {
  sections: string[]
  wordCountTarget: number
  platformRules?: string[]
}

export interface ContentMeta {
  author: string
  date: string
  theme: string
  persona: Persona
}

export interface PromptPair {
  system: string
  user: string
}

export interface ContentTypePlugin {
  id: string
  name: string
  description: string
  structure: PluginStructure
  defaultAspectRatio: string
  validate(idea: IdeaDocument): ValidationResult
  defaultOutlinePrompt(idea: IdeaDocument, persona: Persona): PromptPair
  defaultContentPrompt(idea: IdeaDocument, persona: Persona, outline?: string): PromptPair
  formatOutline(response: LLMResponse): string
  formatContent(response: LLMResponse, meta: ContentMeta): string
}
