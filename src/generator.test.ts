import { describe, it, expect } from 'vitest'
import { buildOutlinePrompt, buildContentPrompt, resolveModelConfig } from './generator.js'
import { IdeaDocument } from './idea/types.js'
import { Persona } from './personas/types.js'
import { DrftpnkConfig } from './config/types.js'
import { blogPostPlugin } from './plugins/blog-post.js'
import { tweetPlugin } from './plugins/tweet.js'

const idea: IdeaDocument = {
  topic: 'Why AI teams need taste',
  theme: 'Building taste like a record collection',
  goals: ['Explain why taste matters', 'Connect to venture judgment'],
  keyIdeas: ['Taste is pattern recognition', 'Teams with taste compound'],
  audience: 'Founders and investors',
  wordCountTarget: 900,
}

const personaWithPrompts: Persona = {
  id: 'test-persona',
  name: 'Test Person',
  description: 'A test writer',
  style: {
    voice: ['reflective', 'confident'],
    domains: ['venture', 'AI'],
    signature_devices: ['extended metaphor'],
    tone_rules: ['be accessible'],
  },
  system_prompt: 'You are Test Person, a writer.',
  do_not: ['use buzzwords', 'use passive voice'],
  prompts: {
    'blog-post': {
      outline: 'Outline for {{persona_name}} on {{topic}} with theme {{theme}}. Goals: {{goals}}. Do not: {{do_not}}.',
      content: 'Content for {{persona_name}} ({{persona_id}}) - {{persona_description}}. Outline: {{outline}}.',
    },
  },
}

const personaWithoutPrompts: Persona = {
  id: 'bare-persona',
  name: 'Bare Person',
  description: 'No custom prompts',
  style: {
    voice: ['direct'],
    domains: ['tech'],
    signature_devices: ['analogy'],
    tone_rules: ['be clear'],
  },
  system_prompt: 'You are Bare Person.',
}

describe('buildOutlinePrompt', () => {
  it('uses persona custom outline template when available', () => {
    const prompt = buildOutlinePrompt(idea, personaWithPrompts, blogPostPlugin)
    expect(prompt).toContain('Outline for Test Person')
  })

  it('resolves {{persona_name}} in custom template', () => {
    const prompt = buildOutlinePrompt(idea, personaWithPrompts, blogPostPlugin)
    expect(prompt).toContain('Test Person')
    expect(prompt).not.toContain('{{persona_name}}')
  })

  it('resolves {{topic}} in custom template', () => {
    const prompt = buildOutlinePrompt(idea, personaWithPrompts, blogPostPlugin)
    expect(prompt).toContain('Why AI teams need taste')
  })

  it('resolves {{theme}} in custom template', () => {
    const prompt = buildOutlinePrompt(idea, personaWithPrompts, blogPostPlugin)
    expect(prompt).toContain('Building taste like a record collection')
  })

  it('resolves {{goals}} as joined list', () => {
    const prompt = buildOutlinePrompt(idea, personaWithPrompts, blogPostPlugin)
    expect(prompt).toContain('Explain why taste matters')
    expect(prompt).toContain('Connect to venture judgment')
  })

  it('resolves {{do_not}} from persona.do_not array', () => {
    const prompt = buildOutlinePrompt(idea, personaWithPrompts, blogPostPlugin)
    expect(prompt).toContain('use buzzwords')
    expect(prompt).toContain('use passive voice')
  })

  it('leaves unknown variables unreplaced', () => {
    const persona = {
      ...personaWithPrompts,
      prompts: { 'blog-post': { outline: 'Hello {{unknown_var}}' } },
    }
    const prompt = buildOutlinePrompt(idea, persona, blogPostPlugin)
    expect(prompt).toContain('{{unknown_var}}')
  })

  it('falls back to plugin default when persona has no custom prompt', () => {
    const prompt = buildOutlinePrompt(idea, personaWithoutPrompts, blogPostPlugin)
    expect(prompt).toContain('You are writing as Bare Person')
  })

  it('falls back to plugin default when persona has no prompts at all', () => {
    const prompt = buildOutlinePrompt(idea, personaWithoutPrompts, blogPostPlugin)
    expect(prompt).toContain(idea.topic)
  })
})

describe('buildContentPrompt', () => {
  it('uses persona custom content template when available', () => {
    const prompt = buildContentPrompt(idea, personaWithPrompts, blogPostPlugin, 'My outline text')
    expect(prompt).toContain('Content for Test Person')
  })

  it('resolves {{persona_id}} in custom template', () => {
    const prompt = buildContentPrompt(idea, personaWithPrompts, blogPostPlugin)
    expect(prompt).toContain('test-persona')
    expect(prompt).not.toContain('{{persona_id}}')
  })

  it('resolves {{persona_description}} in custom template', () => {
    const prompt = buildContentPrompt(idea, personaWithPrompts, blogPostPlugin)
    expect(prompt).toContain('A test writer')
    expect(prompt).not.toContain('{{persona_description}}')
  })

  it('resolves {{outline}} with provided outline text', () => {
    const prompt = buildContentPrompt(idea, personaWithPrompts, blogPostPlugin, 'My outline text')
    expect(prompt).toContain('My outline text')
    expect(prompt).not.toContain('{{outline}}')
  })

  it('resolves {{outline}} to empty string when no outline provided', () => {
    const prompt = buildContentPrompt(idea, personaWithPrompts, blogPostPlugin)
    expect(prompt).not.toContain('{{outline}}')
  })

  it('falls back to plugin default when persona has no custom content prompt', () => {
    const prompt = buildContentPrompt(idea, personaWithoutPrompts, blogPostPlugin, 'outline text')
    expect(prompt).toContain('You are writing as Bare Person')
  })
})

const baseConfig: DrftpnkConfig = {
  default_persona: 'test-persona',
  default_content_type: 'blog-post',
  output_dir: '.',
  outline: { auto_save: true, naming_convention: 'idea.{type}.outline.md', require_outline_for_post: false },
  llm: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, maxTokens: 4000 },
}

describe('resolveModelConfig', () => {
  it('returns global config defaults when no overrides exist', () => {
    const result = resolveModelConfig(baseConfig, personaWithoutPrompts, blogPostPlugin)
    expect(result.model).toBe('gpt-4o')
    expect(result.temperature).toBe(0.7)
    expect(result.maxTokens).toBe(4000)
    expect(result.provider).toBe('openai')
  })

  it('applies global per-content-type model override', () => {
    const config: DrftpnkConfig = {
      ...baseConfig,
      llm_by_content_type: { tweet: { model: 'gpt-4o-mini' } },
    }
    const result = resolveModelConfig(config, personaWithoutPrompts, tweetPlugin)
    expect(result.model).toBe('gpt-4o-mini')
  })

  it('does not apply content-type override for a different plugin', () => {
    const config: DrftpnkConfig = {
      ...baseConfig,
      llm_by_content_type: { tweet: { model: 'gpt-4o-mini' } },
    }
    const result = resolveModelConfig(config, personaWithoutPrompts, blogPostPlugin)
    expect(result.model).toBe('gpt-4o')
  })

  it('applies persona-level model override', () => {
    const persona = { ...personaWithoutPrompts, llm: { model: 'gpt-4-turbo' } }
    const result = resolveModelConfig(baseConfig, persona, blogPostPlugin)
    expect(result.model).toBe('gpt-4-turbo')
  })

  it('persona override wins over global content-type override', () => {
    const config: DrftpnkConfig = {
      ...baseConfig,
      llm_by_content_type: { 'blog-post': { model: 'gpt-4o-mini' } },
    }
    const persona = { ...personaWithoutPrompts, llm: { model: 'gpt-4-turbo' } }
    const result = resolveModelConfig(config, persona, blogPostPlugin)
    expect(result.model).toBe('gpt-4-turbo')
  })

  it('applies persona per-content-type override', () => {
    const persona = {
      ...personaWithoutPrompts,
      llm_by_content_type: { tweet: { model: 'gpt-4o-mini', temperature: 0.9 } },
    }
    const result = resolveModelConfig(baseConfig, persona, tweetPlugin)
    expect(result.model).toBe('gpt-4o-mini')
    expect(result.temperature).toBe(0.9)
  })

  it('persona per-content-type wins over persona default', () => {
    const persona = {
      ...personaWithoutPrompts,
      llm: { model: 'gpt-4-turbo' },
      llm_by_content_type: { tweet: { model: 'gpt-4o-mini' } },
    }
    const result = resolveModelConfig(baseConfig, persona, tweetPlugin)
    expect(result.model).toBe('gpt-4o-mini')
  })

  it('persona per-content-type wins over all other overrides', () => {
    const config: DrftpnkConfig = {
      ...baseConfig,
      llm_by_content_type: { tweet: { model: 'gpt-3.5-turbo' } },
    }
    const persona = {
      ...personaWithoutPrompts,
      llm: { model: 'gpt-4-turbo' },
      llm_by_content_type: { tweet: { model: 'gpt-4o-mini' } },
    }
    const result = resolveModelConfig(config, persona, tweetPlugin)
    expect(result.model).toBe('gpt-4o-mini')
  })

  it('merges temperature from content-type override with model from persona', () => {
    const config: DrftpnkConfig = {
      ...baseConfig,
      llm_by_content_type: { tweet: { temperature: 0.5 } },
    }
    const persona = { ...personaWithoutPrompts, llm: { model: 'gpt-4-turbo' } }
    const result = resolveModelConfig(config, persona, tweetPlugin)
    expect(result.model).toBe('gpt-4-turbo')
    expect(result.temperature).toBe(0.5)
  })

  it('falls back to global defaults for unset fields in partial overrides', () => {
    const persona = { ...personaWithoutPrompts, llm: { model: 'gpt-4o-mini' } }
    const result = resolveModelConfig(baseConfig, persona, blogPostPlugin)
    expect(result.model).toBe('gpt-4o-mini')
    expect(result.temperature).toBe(0.7)
    expect(result.maxTokens).toBe(4000)
    expect(result.provider).toBe('openai')
  })

  it('persona can override provider', () => {
    const persona = { ...personaWithoutPrompts, llm: { provider: 'anthropic' as const } }
    const result = resolveModelConfig(baseConfig, persona, blogPostPlugin)
    expect(result.provider).toBe('anthropic')
  })
})
