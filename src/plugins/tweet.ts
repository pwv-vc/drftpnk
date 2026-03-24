import { IdeaDocument, ValidationResult } from '../idea/types.js'
import { Persona } from '../personas/types.js'
import { LLMResponse } from '../llm/types.js'
import { ContentMeta, ContentTypePlugin, PromptPair } from './types.js'
import { resolveSystemPrompt } from './defaults.js'

export const tweetPlugin: ContentTypePlugin = {
  id: 'tweet',
  name: 'Tweet',
  description: 'Single tweet (max 280 characters)',
  structure: {
    sections: ['Hook', 'Insight', 'Call to Action'],
    wordCountTarget: 280,
    platformRules: ['max 280 characters', 'no markdown', 'conversational', 'no hashtags unless essential'],
  },
  defaultAspectRatio: 'square_hd',

  validate(idea: IdeaDocument): ValidationResult {
    const errors: string[] = []
    if (!idea.topic) errors.push('Missing topic')
    if (!idea.theme) errors.push('Missing theme')
    return { valid: errors.length === 0, errors }
  },

  defaultOutlinePrompt(idea: IdeaDocument, persona: Persona): PromptPair {
    return {
      system: resolveSystemPrompt(persona),
      user: `Generate 3 tweet options on this topic. Each must be under 280 characters. Make them punchy and distinct.

Topic: ${idea.topic}
Theme: ${idea.theme}
Key Ideas: ${idea.keyIdeas.join(', ')}

Return ONLY valid JSON: {"title": "Tweet Options", "subtitle": "", "body": "<3 numbered tweet options, one per line>"}`,
    }
  },

  defaultContentPrompt(idea: IdeaDocument, persona: Persona, outline?: string): PromptPair {
    return {
      system: resolveSystemPrompt(persona),
      user: `Write the single best tweet (max 280 characters) as ${persona.name}. No hashtags unless essential.

Topic: ${idea.topic}
Outline / options:
${outline ?? ''}

Return ONLY valid JSON: {"title": "", "subtitle": "", "body": "<tweet text only>"}`,
    }
  },

  formatOutline(response: LLMResponse): string {
    return response.body ?? ''
  },

  formatContent(response: LLMResponse, _meta: ContentMeta): string {
    return (response.body ?? '').trim()
  },
}
