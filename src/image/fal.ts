import { fal } from '@fal-ai/client'
import { basename, extname } from 'path'
import { DrftpnkConfig } from '../config/types.js'
import { ContentTypePlugin } from '../plugins/types.js'
import { resolveImageApiKey } from '../config/loader.js'
import { ImageGenResult } from './types.js'

export function resolveImageConfig(
  config: DrftpnkConfig,
  plugin: ContentTypePlugin,
  overrides?: { model?: string; aspectRatio?: string }
): { model: string; aspectRatio: string } {
  const base = config.image ?? { model: 'fal-ai/nano-banana-2' }
  const byType = config.image_by_content_type?.[plugin.id] ?? {}

  const model = overrides?.model ?? byType.model ?? base.model
  const aspectRatio = overrides?.aspectRatio ?? byType.aspect_ratio ?? plugin.defaultAspectRatio

  return { model, aspectRatio }
}

function extractFalFileName(url: string): string {
  const raw = basename(url)
  const ext = extname(raw)
  return ext ? raw.slice(0, -ext.length) : raw
}

export async function generateImage(
  prompt: string,
  negativePrompt: string | undefined,
  model: string,
  aspectRatio: string,
  config: DrftpnkConfig,
  onProgress?: (status: string) => void
): Promise<ImageGenResult> {
  const apiKey = resolveImageApiKey(config)

  fal.config({ credentials: apiKey })

  const input: Record<string, unknown> = {
    prompt,
    image_size: aspectRatio,
  }

  if (negativePrompt) {
    input.negative_prompt = negativePrompt
  }

  const startMs = Date.now()

  const result = await fal.subscribe(model, {
    input,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_QUEUE') {
        onProgress?.(`In queue (position ${(update as { position?: number }).position ?? '?'})`)
      } else if (update.status === 'IN_PROGRESS') {
        onProgress?.('Generating...')
      }
    },
  })

  const elapsedMs = Date.now() - startMs

  const data = result.data as {
    images?: Array<{
      url: string
      width?: number
      height?: number
      content_type?: string
      file_size?: number
    }>
  }

  const image = data.images?.[0]
  if (!image?.url) {
    throw new Error('fal.ai returned no image in the response')
  }

  const fileName = extractFalFileName(image.url)

  return {
    url: image.url,
    fileName,
    width: image.width ?? 0,
    height: image.height ?? 0,
    contentType: image.content_type ?? 'image/png',
    falFileSize: image.file_size,
    elapsedMs,
  }
}
