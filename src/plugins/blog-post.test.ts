import { describe, it, expect } from 'vitest'
import { blogPostPlugin } from './blog-post.js'
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

describe('blogPostPlugin.validate', () => {
  it('returns valid for a complete idea', () => {
    expect(blogPostPlugin.validate(validIdea)).toEqual({ valid: true, errors: [] })
  })

  it('errors on missing topic', () => {
    const result = blogPostPlugin.validate({ ...validIdea, topic: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing topic')
  })

  it('errors on missing theme', () => {
    const result = blogPostPlugin.validate({ ...validIdea, theme: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing theme')
  })

  it('errors on empty goals', () => {
    const result = blogPostPlugin.validate({ ...validIdea, goals: [] })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing goals')
  })

  it('errors on empty keyIdeas', () => {
    const result = blogPostPlugin.validate({ ...validIdea, keyIdeas: [] })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Missing key ideas')
  })
})

describe('blogPostPlugin.formatOutline', () => {
  it('formats with title, subtitle, and body', () => {
    const response: LLMResponse = { title: 'My Title', subtitle: 'My Subtitle', body: 'Body text' }
    const result = blogPostPlugin.formatOutline(response)
    expect(result).toContain('# My Title')
    expect(result).toContain('*My Subtitle*')
    expect(result).toContain('Body text')
  })

  it('omits title line when title is empty', () => {
    const response: LLMResponse = { title: '', subtitle: '', body: 'Body text' }
    const result = blogPostPlugin.formatOutline(response)
    expect(result).not.toContain('# ')
  })

  it('omits subtitle when empty', () => {
    const response: LLMResponse = { title: 'Title', subtitle: '', body: 'Body' }
    const result = blogPostPlugin.formatOutline(response)
    expect(result).not.toContain('**')
    expect(result).not.toMatch(/\*[^*]/)
  })
})

describe('blogPostPlugin.formatContent', () => {
  it('starts with YAML frontmatter', () => {
    const response: LLMResponse = { title: 'Taste Compounds', subtitle: 'A subtitle', body: 'The body.' }
    const result = blogPostPlugin.formatContent(response, meta)
    expect(result).toMatch(/^---\n/)
  })

  it('includes title in frontmatter', () => {
    const response: LLMResponse = { title: 'Taste Compounds', subtitle: '', body: '' }
    const result = blogPostPlugin.formatContent(response, meta)
    expect(result).toContain('title: Taste Compounds')
  })

  it('includes author in frontmatter', () => {
    const response: LLMResponse = { title: 'T', subtitle: '', body: '' }
    const result = blogPostPlugin.formatContent(response, meta)
    expect(result).toContain('author: Test Person')
  })

  it('includes date in frontmatter', () => {
    const response: LLMResponse = { title: 'T', subtitle: '', body: '' }
    const result = blogPostPlugin.formatContent(response, meta)
    expect(result).toContain('date: 2026-03-24')
  })

  it('includes theme in frontmatter', () => {
    const response: LLMResponse = { title: 'T', subtitle: '', body: '' }
    const result = blogPostPlugin.formatContent(response, meta)
    expect(result).toContain('theme: Building taste like a record collection')
  })

  it('closes frontmatter with ---', () => {
    const response: LLMResponse = { title: 'T', subtitle: '', body: '' }
    const result = blogPostPlugin.formatContent(response, meta)
    const lines = result.split('\n')
    const closingDash = lines.slice(1).findIndex((l) => l === '---')
    expect(closingDash).toBeGreaterThan(-1)
  })

  it('falls back to theme when title is empty', () => {
    const response: LLMResponse = { title: '', subtitle: '', body: '' }
    const result = blogPostPlugin.formatContent(response, meta)
    expect(result).toContain('title: Building taste like a record collection')
  })

  it('includes body content after frontmatter', () => {
    const response: LLMResponse = { title: 'T', subtitle: '', body: 'The actual post content.' }
    const result = blogPostPlugin.formatContent(response, meta)
    expect(result).toContain('The actual post content.')
  })
})
