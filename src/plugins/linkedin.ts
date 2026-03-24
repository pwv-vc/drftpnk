import { IdeaDocument, ValidationResult } from '../idea/types.js'
import { Persona } from '../personas/types.js'
import { LLMResponse } from '../llm/types.js'
import { ContentMeta, ContentTypePlugin } from './types.js'

export const linkedinPlugin: ContentTypePlugin = {
  id: 'linkedin',
  name: 'LinkedIn Post',
  description: 'LinkedIn post (300-500 words)',
  structure: {
    sections: ['Hook', 'Main Points', 'Closing'],
    wordCountTarget: 400,
    platformRules: [
      'no markdown headers',
      'use line breaks for readability',
      '300-500 words',
      'end with a question or insight',
    ],
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
Goals: ${idea.goals.join(', ')}

Generate a LinkedIn post outline. Include a hook, 3 main points, and a closing question or call to action.

Return ONLY valid JSON: {"title": "<post hook/title>", "subtitle": "", "body": "<outline in markdown>"}`
  },

  defaultContentPrompt(idea: IdeaDocument, persona: Persona, outline?: string): string {
    return `You are writing as ${persona.name}.

${persona.system_prompt}

${persona.do_not ? `Do NOT:\n- ${persona.do_not.join('\n- ')}` : ''}

Topic: ${idea.topic}
Theme: ${idea.theme}
Outline:
${outline ?? ''}

Write a LinkedIn post (300-500 words). Use short paragraphs and line breaks. Open with a strong hook. End with a question or insight.

Return ONLY valid JSON: {"title": "<hook line>", "subtitle": "", "body": "<post text, no markdown headers>"}`
  },

  formatOutline(response: LLMResponse): string {
    const parts: string[] = []
    if (response.title) parts.push(`**${response.title}**`)
    if (response.body) parts.push(response.body)
    return parts.join('\n\n')
  },

  formatContent(response: LLMResponse, _meta: ContentMeta): string {
    return (response.body ?? '').trim()
  },
}
