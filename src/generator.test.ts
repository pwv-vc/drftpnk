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

const personaNoPrompts: Persona = {
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

const personaWithUserPrompts: Persona = {
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

const personaWithSystemPrompts: Persona = {
  ...personaNoPrompts,
  prompts: {
    'blog-post': {
      outlineSystem: 'Custom system for {{persona_name}} outline.',
      contentSystem: 'Custom system for {{persona_name}} content.',
    },
  },
}

const personaWithAllPrompts: Persona = {
  ...personaNoPrompts,
  prompts: {
    'blog-post': {
      outlineSystem: 'Custom outline system for {{persona_name}}.',
      outline: 'Custom outline user for {{topic}}.',
      contentSystem: 'Custom content system for {{persona_name}}.',
      content: 'Custom content user for {{topic}}. Outline: {{outline}}.',
    },
  },
}

// --- buildOutlinePrompt ---

describe('buildOutlinePrompt — return shape', () => {
  it('returns a PromptPair with system and user keys', () => {
    const result = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(result).toHaveProperty('system')
    expect(result).toHaveProperty('user')
  })

  it('system and user are non-empty strings', () => {
    const { system, user } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(typeof system).toBe('string')
    expect(typeof user).toBe('string')
    expect(system.length).toBeGreaterThan(0)
    expect(user.length).toBeGreaterThan(0)
  })
})

describe('buildOutlinePrompt — plugin defaults (no persona prompts)', () => {
  it('system contains persona system_prompt', () => {
    const { system } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(system).toContain('You are Bare Person.')
  })

  it('system contains persona voice', () => {
    const { system } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(system).toContain('direct')
  })

  it('system contains persona tone rules', () => {
    const { system } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(system).toContain('be clear')
  })

  it('user contains topic', () => {
    const { user } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('Why AI teams need taste')
  })

  it('user contains theme', () => {
    const { user } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('Building taste like a record collection')
  })

  it('user contains goals', () => {
    const { user } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('Explain why taste matters')
    expect(user).toContain('Connect to venture judgment')
  })

  it('user contains key ideas', () => {
    const { user } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('Taste is pattern recognition')
  })

  it('user asks for 5 title options', () => {
    const { user } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('5 title options')
  })

  it('user asks for 5-section outline', () => {
    const { user } = buildOutlinePrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('5-section outline')
  })
})

describe('buildOutlinePrompt — persona user override', () => {
  it('user uses persona outline template instead of plugin default', () => {
    const { user } = buildOutlinePrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(user).toContain('Outline for Test Person')
  })

  it('system falls back to plugin default when no outlineSystem provided', () => {
    const { system } = buildOutlinePrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(system).toContain('You are Test Person, a writer.')
  })

  it('resolves {{persona_name}} in user template', () => {
    const { user } = buildOutlinePrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(user).toContain('Test Person')
    expect(user).not.toContain('{{persona_name}}')
  })

  it('resolves {{topic}} in user template', () => {
    const { user } = buildOutlinePrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(user).toContain('Why AI teams need taste')
  })

  it('resolves {{theme}} in user template', () => {
    const { user } = buildOutlinePrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(user).toContain('Building taste like a record collection')
  })

  it('resolves {{goals}} as joined list', () => {
    const { user } = buildOutlinePrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(user).toContain('Explain why taste matters')
    expect(user).toContain('Connect to venture judgment')
  })

  it('resolves {{do_not}} from persona.do_not array', () => {
    const { user } = buildOutlinePrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(user).toContain('use buzzwords')
    expect(user).toContain('use passive voice')
  })

  it('leaves unknown variables unreplaced', () => {
    const persona: Persona = {
      ...personaWithUserPrompts,
      prompts: { 'blog-post': { outline: 'Hello {{unknown_var}}' } },
    }
    const { user } = buildOutlinePrompt(idea, persona, blogPostPlugin)
    expect(user).toContain('{{unknown_var}}')
  })
})

describe('buildOutlinePrompt — persona system override', () => {
  it('system uses persona outlineSystem template', () => {
    const { system } = buildOutlinePrompt(idea, personaWithSystemPrompts, blogPostPlugin)
    expect(system).toContain('Custom system for Bare Person outline.')
  })

  it('user falls back to plugin default when no outline template provided', () => {
    const { user } = buildOutlinePrompt(idea, personaWithSystemPrompts, blogPostPlugin)
    expect(user).toContain('Why AI teams need taste')
    expect(user).toContain('5 title options')
  })

  it('resolves {{persona_name}} in outlineSystem template', () => {
    const { system } = buildOutlinePrompt(idea, personaWithSystemPrompts, blogPostPlugin)
    expect(system).not.toContain('{{persona_name}}')
    expect(system).toContain('Bare Person')
  })
})

describe('buildOutlinePrompt — full persona override (system + user)', () => {
  it('system uses persona outlineSystem', () => {
    const { system } = buildOutlinePrompt(idea, personaWithAllPrompts, blogPostPlugin)
    expect(system).toContain('Custom outline system for Bare Person.')
  })

  it('user uses persona outline', () => {
    const { user } = buildOutlinePrompt(idea, personaWithAllPrompts, blogPostPlugin)
    expect(user).toContain('Custom outline user for Why AI teams need taste.')
  })

  it('plugin default user is not used when persona outline is set', () => {
    const { user } = buildOutlinePrompt(idea, personaWithAllPrompts, blogPostPlugin)
    expect(user).not.toContain('5 title options')
  })

  it('plugin default system is not used when persona outlineSystem is set', () => {
    const { system } = buildOutlinePrompt(idea, personaWithAllPrompts, blogPostPlugin)
    expect(system).not.toContain('You are Bare Person.')
  })
})

// --- buildContentPrompt ---

describe('buildContentPrompt — return shape', () => {
  it('returns a PromptPair with system and user keys', () => {
    const result = buildContentPrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(result).toHaveProperty('system')
    expect(result).toHaveProperty('user')
  })
})

describe('buildContentPrompt — plugin defaults (no persona prompts)', () => {
  it('system contains persona system_prompt', () => {
    const { system } = buildContentPrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(system).toContain('You are Bare Person.')
  })

  it('user contains topic', () => {
    const { user } = buildContentPrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('Why AI teams need taste')
  })

  it('user contains theme', () => {
    const { user } = buildContentPrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('Building taste like a record collection')
  })

  it('user contains key ideas', () => {
    const { user } = buildContentPrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('Taste is pattern recognition')
  })

  it('user contains audience', () => {
    const { user } = buildContentPrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('Founders and investors')
  })

  it('user contains word count target', () => {
    const { user } = buildContentPrompt(idea, personaNoPrompts, blogPostPlugin)
    expect(user).toContain('900')
  })

  it('user includes outline when provided', () => {
    const { user } = buildContentPrompt(idea, personaNoPrompts, blogPostPlugin, 'My outline text')
    expect(user).toContain('My outline text')
  })
})

describe('buildContentPrompt — persona user override', () => {
  it('user uses persona content template', () => {
    const { user } = buildContentPrompt(idea, personaWithUserPrompts, blogPostPlugin, 'My outline text')
    expect(user).toContain('Content for Test Person')
  })

  it('system falls back to plugin default when no contentSystem provided', () => {
    const { system } = buildContentPrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(system).toContain('You are Test Person, a writer.')
  })

  it('resolves {{persona_id}} in content template', () => {
    const { user } = buildContentPrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(user).toContain('test-persona')
    expect(user).not.toContain('{{persona_id}}')
  })

  it('resolves {{persona_description}} in content template', () => {
    const { user } = buildContentPrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(user).toContain('A test writer')
    expect(user).not.toContain('{{persona_description}}')
  })

  it('resolves {{outline}} with provided outline text', () => {
    const { user } = buildContentPrompt(idea, personaWithUserPrompts, blogPostPlugin, 'My outline text')
    expect(user).toContain('My outline text')
    expect(user).not.toContain('{{outline}}')
  })

  it('resolves {{outline}} to empty string when no outline provided', () => {
    const { user } = buildContentPrompt(idea, personaWithUserPrompts, blogPostPlugin)
    expect(user).not.toContain('{{outline}}')
  })
})

describe('buildContentPrompt — persona system override', () => {
  it('system uses persona contentSystem template', () => {
    const { system } = buildContentPrompt(idea, personaWithSystemPrompts, blogPostPlugin)
    expect(system).toContain('Custom system for Bare Person content.')
  })

  it('user falls back to plugin default when no content template provided', () => {
    const { user } = buildContentPrompt(idea, personaWithSystemPrompts, blogPostPlugin)
    expect(user).toContain('Why AI teams need taste')
  })
})

describe('buildContentPrompt — full persona override (system + user)', () => {
  it('system uses persona contentSystem', () => {
    const { system } = buildContentPrompt(idea, personaWithAllPrompts, blogPostPlugin)
    expect(system).toContain('Custom content system for Bare Person.')
  })

  it('user uses persona content template', () => {
    const { user } = buildContentPrompt(idea, personaWithAllPrompts, blogPostPlugin, 'outline text')
    expect(user).toContain('Custom content user for Why AI teams need taste.')
    expect(user).toContain('outline text')
  })

  it('plugin default user is not used when persona content is set', () => {
    const { user } = buildContentPrompt(idea, personaWithAllPrompts, blogPostPlugin)
    expect(user).not.toContain('CORE WRITING PATTERN')
  })
})

// --- resolveModelConfig ---

const baseConfig: DrftpnkConfig = {
  default_persona: 'test-persona',
  default_content_type: 'blog-post',
  output_dir: '.',
  outline: { auto_save: true, naming_convention: 'idea.{type}.outline.md', require_outline_for_post: false },
  llm: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, maxTokens: 4000 },
}

describe('resolveModelConfig', () => {
  it('returns global config defaults when no overrides exist', () => {
    const result = resolveModelConfig(baseConfig, personaNoPrompts, blogPostPlugin)
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
    const result = resolveModelConfig(config, personaNoPrompts, tweetPlugin)
    expect(result.model).toBe('gpt-4o-mini')
  })

  it('does not apply content-type override for a different plugin', () => {
    const config: DrftpnkConfig = {
      ...baseConfig,
      llm_by_content_type: { tweet: { model: 'gpt-4o-mini' } },
    }
    const result = resolveModelConfig(config, personaNoPrompts, blogPostPlugin)
    expect(result.model).toBe('gpt-4o')
  })

  it('applies persona-level model override', () => {
    const persona = { ...personaNoPrompts, llm: { model: 'gpt-4-turbo' } }
    const result = resolveModelConfig(baseConfig, persona, blogPostPlugin)
    expect(result.model).toBe('gpt-4-turbo')
  })

  it('persona override wins over global content-type override', () => {
    const config: DrftpnkConfig = {
      ...baseConfig,
      llm_by_content_type: { 'blog-post': { model: 'gpt-4o-mini' } },
    }
    const persona = { ...personaNoPrompts, llm: { model: 'gpt-4-turbo' } }
    const result = resolveModelConfig(config, persona, blogPostPlugin)
    expect(result.model).toBe('gpt-4-turbo')
  })

  it('applies persona per-content-type override', () => {
    const persona = {
      ...personaNoPrompts,
      llm_by_content_type: { tweet: { model: 'gpt-4o-mini', temperature: 0.9 } },
    }
    const result = resolveModelConfig(baseConfig, persona, tweetPlugin)
    expect(result.model).toBe('gpt-4o-mini')
    expect(result.temperature).toBe(0.9)
  })

  it('persona per-content-type wins over persona default', () => {
    const persona = {
      ...personaNoPrompts,
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
      ...personaNoPrompts,
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
    const persona = { ...personaNoPrompts, llm: { model: 'gpt-4-turbo' } }
    const result = resolveModelConfig(config, persona, tweetPlugin)
    expect(result.model).toBe('gpt-4-turbo')
    expect(result.temperature).toBe(0.5)
  })

  it('falls back to global defaults for unset fields in partial overrides', () => {
    const persona = { ...personaNoPrompts, llm: { model: 'gpt-4o-mini' } }
    const result = resolveModelConfig(baseConfig, persona, blogPostPlugin)
    expect(result.model).toBe('gpt-4o-mini')
    expect(result.temperature).toBe(0.7)
    expect(result.maxTokens).toBe(4000)
    expect(result.provider).toBe('openai')
  })

  it('persona can override provider', () => {
    const persona = { ...personaNoPrompts, llm: { provider: 'anthropic' as const } }
    const result = resolveModelConfig(baseConfig, persona, blogPostPlugin)
    expect(result.provider).toBe('anthropic')
  })
})
