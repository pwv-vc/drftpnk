import { describe, it, expect } from 'vitest'
import { tweetPlugin } from './tweet.js'
import { IdeaDocument } from '../idea/types.js'
import { Persona } from '../personas/types.js'
import { LLMResponse } from '../llm/types.js'
import { ContentMeta } from './types.js'

const validIdea: IdeaDocument = {
  topic: 'Why AI teams need taste',
  theme: 'Building taste like a record collection',
  goals: ['Explain why taste matters'],
  keyIdeas: ['Taste is pattern recognition'],
}

const persona: Persona = {
  id: 'test-persona',
  name: 'Test Person',
  description: 'A test persona',
  style: { voice: [], domains: [], signature_devices: [], tone_rules: [] },
  system_prompt: 'You are Test Person.',
}

const meta: ContentMeta = {
  author: 'Test Person',
  date: '2026-03-24',
  theme: 'Building taste like a record collection',
  persona,
}

describe('tweetPlugin.validate', () => {
  it('returns valid for a complete idea', () => {
    expect(tweetPlugin.validate(validIdea)).toEqual({ valid: true, errors: [] })
  })

  it('errors on missing topic', () => {
    const result = tweetPlugin.validate({ ...validIdea, topic: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing topic')
  })

  it('errors on missing theme', () => {
    const result = tweetPlugin.validate({ ...validIdea, theme: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing theme')
  })
})

describe('tweetPlugin.formatOutline', () => {
  it('returns body as-is', () => {
    const response: LLMResponse = { title: 'Tweet Options', subtitle: '', body: '1. Tweet one\n2. Tweet two' }
    expect(tweetPlugin.formatOutline(response)).toBe('1. Tweet one\n2. Tweet two')
  })

  it('returns empty string when body is empty', () => {
    const response: LLMResponse = { title: '', subtitle: '', body: '' }
    expect(tweetPlugin.formatOutline(response)).toBe('')
  })
})

describe('tweetPlugin.formatContent', () => {
  it('returns trimmed body with no frontmatter', () => {
    const response: LLMResponse = { title: '', subtitle: '', body: '  Taste is pattern recognition.  ' }
    const result = tweetPlugin.formatContent(response, meta)
    expect(result).toBe('Taste is pattern recognition.')
    expect(result).not.toContain('---')
  })

  it('does not include title or author', () => {
    const response: LLMResponse = { title: 'ignored', subtitle: '', body: 'The tweet.' }
    const result = tweetPlugin.formatContent(response, meta)
    expect(result).toBe('The tweet.')
  })
})
