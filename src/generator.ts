import { IdeaDocument } from './idea/types.js'
import { Persona } from './personas/types.js'
import { ContentTypePlugin, PromptPair } from './plugins/types.js'
import { LLMProvider, LLMResponse } from './llm/types.js'
import { createLLMProvider } from './llm/factory.js'
import { DrftpnkConfig, LLMConfig, LLMOverride } from './config/types.js'
import { resolveApiKey } from './config/loader.js'

function resolvePrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

function buildVarMap(
  idea: IdeaDocument,
  persona: Persona,
  plugin: ContentTypePlugin,
  outline?: string
): Record<string, string> {
  return {
    topic: idea.topic,
    theme: idea.theme,
    goals: idea.goals.join('\n- '),
    keyIdeas: idea.keyIdeas.join('\n- '),
    possibleTitles: (idea.possibleTitles ?? []).join('\n- '),
    references: (idea.references ?? []).join('\n- '),
    audience: idea.audience ?? '',
    wordCountTarget: String(idea.wordCountTarget ?? plugin.structure.wordCountTarget),
    voice: persona.style.voice.join(', '),
    signature_devices: persona.style.signature_devices.join(', '),
    tone_rules: persona.style.tone_rules.join('\n- '),
    system_prompt: persona.system_prompt,
    do_not: (persona.do_not ?? []).join('\n- '),
    persona_name: persona.name,
    persona_id: persona.id,
    persona_description: persona.description,
    outline: outline ?? '',
    plugin_name: plugin.name,
    plugin_word_count: String(plugin.structure.wordCountTarget),
  }
}

export interface PromptSources {
  system: string
  user: string
}

export function resolveOutlinePromptSources(persona: Persona, plugin: ContentTypePlugin): PromptSources {
  const promptSet = persona.prompts?.[plugin.id]
  return {
    system: promptSet?.outlineSystem
      ? `${persona.id}/${plugin.id}.outline.system.md`
      : `${plugin.id} plugin (default)`,
    user: promptSet?.outline
      ? `${persona.id}/${plugin.id}.outline.md`
      : `${plugin.id} plugin (default)`,
  }
}

export function resolveContentPromptSources(persona: Persona, plugin: ContentTypePlugin): PromptSources {
  const promptSet = persona.prompts?.[plugin.id]
  return {
    system: promptSet?.contentSystem
      ? `${persona.id}/${plugin.id}.content.system.md`
      : `${plugin.id} plugin (default)`,
    user: promptSet?.content
      ? `${persona.id}/${plugin.id}.content.md`
      : `${plugin.id} plugin (default)`,
  }
}

export function buildOutlinePrompt(
  idea: IdeaDocument,
  persona: Persona,
  plugin: ContentTypePlugin
): PromptPair {
  const promptSet = persona.prompts?.[plugin.id]
  const vars = buildVarMap(idea, persona, plugin)
  const { system: defaultSystem, user: defaultUser } = plugin.defaultOutlinePrompt(idea, persona)

  return {
    system: promptSet?.outlineSystem ? resolvePrompt(promptSet.outlineSystem, vars) : defaultSystem,
    user: promptSet?.outline ? resolvePrompt(promptSet.outline, vars) : defaultUser,
  }
}

export function buildContentPrompt(
  idea: IdeaDocument,
  persona: Persona,
  plugin: ContentTypePlugin,
  outline?: string
): PromptPair {
  const promptSet = persona.prompts?.[plugin.id]
  const vars = buildVarMap(idea, persona, plugin, outline)
  const { system: defaultSystem, user: defaultUser } = plugin.defaultContentPrompt(idea, persona, outline)

  return {
    system: promptSet?.contentSystem ? resolvePrompt(promptSet.contentSystem, vars) : defaultSystem,
    user: promptSet?.content ? resolvePrompt(promptSet.content, vars) : defaultUser,
  }
}

/**
 * Resolves the effective LLM config for a given persona + content type.
 *
 * Resolution order (most specific wins):
 *   1. config.llm                              — global default
 *   2. config.llm_by_content_type[plugin.id]   — global per-content-type
 *   3. persona.llm                             — persona default
 *   4. persona.llm_by_content_type[plugin.id]  — persona per-content-type
 */
export function resolveModelConfig(
  config: DrftpnkConfig,
  persona: Persona,
  plugin: ContentTypePlugin
): Omit<LLMConfig, 'apiKey'> {
  const base = config.llm
  const byContentType: LLMOverride = config.llm_by_content_type?.[plugin.id] ?? {}
  const byPersona: LLMOverride = persona.llm ?? {}
  const byPersonaContentType: LLMOverride = persona.llm_by_content_type?.[plugin.id] ?? {}

  return {
    provider: byPersonaContentType.provider ?? byPersona.provider ?? byContentType.provider ?? base.provider,
    model: byPersonaContentType.model ?? byPersona.model ?? byContentType.model ?? base.model,
    temperature: byPersonaContentType.temperature ?? byPersona.temperature ?? byContentType.temperature ?? base.temperature,
    maxTokens: byPersonaContentType.maxTokens ?? byPersona.maxTokens ?? byContentType.maxTokens ?? base.maxTokens,
  }
}

export async function generate(
  idea: IdeaDocument,
  persona: Persona,
  plugin: ContentTypePlugin,
  config: DrftpnkConfig,
  mode: 'outline' | 'content',
  outlineText?: string,
  onChunk?: (chunk: string) => void
): Promise<LLMResponse> {
  const apiKey = resolveApiKey(config)
  const llmConfig: LLMConfig = {
    ...resolveModelConfig(config, persona, plugin),
    apiKey,
  }
  const provider: LLMProvider = createLLMProvider(llmConfig)

  const { system, user } =
    mode === 'outline'
      ? buildOutlinePrompt(idea, persona, plugin)
      : buildContentPrompt(idea, persona, plugin, outlineText)

  return provider.stream(user, system, onChunk)
}
