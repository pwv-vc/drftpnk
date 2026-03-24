import { IdeaDocument } from '../idea/types.js'
import { Persona } from '../personas/types.js'
import { ContentTypePlugin } from '../plugins/types.js'
import { DrftpnkConfig, LLMConfig } from '../config/types.js'
import { resolveApiKey } from '../config/loader.js'
import { resolveModelConfig } from '../generator.js'
import { createLLMProvider } from '../llm/factory.js'
import { Debugger } from '../debug.js'
import { ImagePromptResult } from './types.js'

function buildImageSystemPrompt(persona: Persona): string {
  const parts: string[] = [
    `You are an art director generating image prompts for AI image generation models.`,
    `Your prompts should be vivid, specific, and visually descriptive.`,
    `Focus on composition, lighting, mood, and visual style.`,
    `Return ONLY valid JSON — no markdown, no explanation.`,
  ]

  if (persona.image_style_prompt) {
    parts.push(`Visual style:\n${persona.image_style_prompt}`)
  } else {
    const style = persona.image_style
    if (style) {
      if (style.art_style.length) {
        parts.push(`Art style: ${style.art_style.join(', ')}`)
      }
      if (style.color_palette?.length) {
        parts.push(`Color palette: ${style.color_palette.join(', ')}`)
      }
      if (style.mood?.length) {
        parts.push(`Mood: ${style.mood.join(', ')}`)
      }
    }
  }

  return parts.join('\n')
}

function buildImageUserPrompt(
  idea: IdeaDocument,
  persona: Persona,
  plugin: ContentTypePlugin,
  context?: string
): string {
  const lines: string[] = [
    `Generate an image prompt for a ${plugin.name} about the following topic.`,
    `Use the content below to inform the visual metaphors, mood, and composition of the image.`,
    ``,
    `Topic: ${idea.topic}`,
    `Theme: ${idea.theme}`,
    `Goals: ${idea.goals.join('; ')}`,
  ]

  if (context) {
    const excerpt = context.slice(0, 3000).trim()
    lines.push(``, `Content (use this to inspire the image):`, excerpt)
  }

  const negativeBase = persona.image_style?.negative_prompt ?? 'no text, no logos, no watermarks'

  lines.push(
    ``,
    `Return ONLY valid JSON:`,
    `{"title": "<alt text describing the image in one sentence>", "subtitle": "${negativeBase}", "body": "<detailed image generation prompt, 2-4 sentences, describing scene, style, lighting, mood, and composition>"}`
  )

  return lines.join('\n')
}

export async function generateImagePrompt(
  idea: IdeaDocument,
  persona: Persona,
  plugin: ContentTypePlugin,
  config: DrftpnkConfig,
  context?: string,
  debug?: Debugger
): Promise<ImagePromptResult> {
  const apiKey = resolveApiKey(config)
  const resolvedLlm = resolveModelConfig(config, persona, plugin)
  const llmConfig: LLMConfig = { ...resolvedLlm, apiKey }
  const provider = createLLMProvider(llmConfig)

  const personaImagePromptOverride = persona.prompts?.['image']?.content

  const system = buildImageSystemPrompt(persona)
  const user = personaImagePromptOverride
    ? personaImagePromptOverride
        .replace(/\{\{topic\}\}/g, idea.topic)
        .replace(/\{\{theme\}\}/g, idea.theme)
        .replace(/\{\{goals\}\}/g, idea.goals.join('; '))
        .replace(/\{\{plugin_name\}\}/g, plugin.name)
        .replace(/\{\{context\}\}/g, context?.slice(0, 3000) ?? '')
    : buildImageUserPrompt(idea, persona, plugin, context)

  debug?.('image prompt system:', `${system.length} chars`)
  debug?.('image prompt user:', `${user.length} chars`)
  debug?.('image style source:', persona.image_style_prompt ? `${persona.id}/image-style.md` : persona.image_style ? 'json (image_style)' : 'none')
  debug?.('image prompt source:', personaImagePromptOverride ? `${persona.id}/image.md` : 'default')

  const response = await provider.generate(user, system)

  return {
    prompt: response.body,
    negativePrompt: response.subtitle || undefined,
    altText: response.title,
    usage: response.usage,
  }
}
