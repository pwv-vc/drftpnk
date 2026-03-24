import { LLMResponse } from '../llm/types.js'
import { ContentTypePlugin, ContentMeta } from '../plugins/types.js'

export function formatOutput(
  plugin: ContentTypePlugin,
  response: LLMResponse,
  meta: ContentMeta,
  mode: 'outline' | 'content'
): string {
  if (mode === 'outline') {
    return plugin.formatOutline(response)
  }
  return plugin.formatContent(response, meta)
}
