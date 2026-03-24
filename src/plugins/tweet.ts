import { IdeaDocument, ValidationResult } from '../idea/types.js'
import { Persona } from '../personas/types.js'
import { LLMResponse } from '../llm/types.js'
import { ContentMeta, ContentTypePlugin } from './types.js'

export const tweetPlugin: ContentTypePlugin = {
  id: 'tweet',
  name: 'Tweet',
  description: 'Single tweet (max 280 characters)',
  structure: {
    sections: ['Hook', 'Insight', 'Call to Action'],
    wordCountTarget: 280,
    platformRules: ['max 280 characters', 'no markdown', 'conversational', 'no hashtags unless essential'],
  },

  validate(idea: IdeaDocument): ValidationResult {
    const errors: string[] = []
    if (!idea.topic) errors.push('Missing topic')
    if (!idea.theme) errors.push('Missing theme')
    return { valid: errors.length === 0, errors }
  },

  defaultOutlinePrompt(idea: IdeaDocument, persona: Persona): string {
    return `You are writing as ${persona.name}.

${persona.system_prompt}

Topic: ${idea.topic}
Theme: ${idea.theme}
Key Ideas: ${idea.keyIdeas.join(', ')}

Generate 3 tweet options on this topic. Each must be under 280 characters. Make them punchy and distinct.

Return ONLY valid JSON: {"title": "Tweet Options", "subtitle": "", "body": "<3 numbered tweet options, one per line>"}`
  },

  defaultContentPrompt(idea: IdeaDocument, persona: Persona, outline?: string): string {
    return `You are writing as ${persona.name}.

${persona.system_prompt}

${persona.do_not ? `Do NOT:\n- ${persona.do_not.join('\n- ')}` : ''}

Topic: ${idea.topic}
Outline / options:
${outline ?? ''}

Write the single best tweet (max 280 characters). No hashtags unless essential.

Return ONLY valid JSON: {"title": "", "subtitle": "", "body": "<tweet text only>"}`
  },

  formatOutline(response: LLMResponse): string {
    return response.body ?? ''
  },

  formatContent(response: LLMResponse, _meta: ContentMeta): string {
    return (response.body ?? '').trim()
  },
}
