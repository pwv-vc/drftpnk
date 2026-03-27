# Image Generator — fal.ai Integration

## Overview

Add a `drftpnk image <idea-file>` command that:
1. Uses the existing LLM (OpenAI) to generate an image prompt from the idea/outline/post
2. Calls fal.ai to generate the image using `fal.subscribe()` (sync-style, no server needed)
3. Downloads and saves the image as `{ideaBasename}.{contentType}.{slug}.png`

Personas define visual art style. Each content-type plugin declares its default aspect ratio. Config supports per-content-type model/ratio overrides.

---

## fal.ai Client Strategy

Use **`fal.subscribe()`** — not webhooks. Webhooks require a running server to receive callbacks, which doesn't fit a CLI. `fal.subscribe()` handles the queue internally and returns the result when done, with an `onQueueUpdate` callback for spinner updates.

```typescript
import { fal } from '@fal-ai/client'

const result = await fal.subscribe('fal-ai/nano-banana-2', {
  input: { prompt, image_size: aspectRatio },
  onQueueUpdate: (update) => { /* update spinner */ }
})
// result.data.images[0].url → download → save PNG
```

API key: `FAL_KEY` env var → `config.image.apiKey` → error.

---

## New Files

### `src/image/types.ts`
```typescript
export interface ImageConfig {
  model: string           // default: 'fal-ai/nano-banana-2'
  apiKey?: string         // FAL_KEY env var
}

export interface ImageOverride {
  model?: string
  aspect_ratio?: string   // overrides plugin default
}

export interface ImagePromptResult {
  prompt: string
  negativePrompt?: string
  altText: string
  usage?: LLMUsage
}

export interface ImageGenResult {
  url: string
  width: number
  height: number
  contentType: string
  filePath: string
}
```

### `src/image/prompt.ts`
Generates the image prompt via LLM. Standalone function — does NOT go through the plugin system.

```typescript
export async function generateImagePrompt(
  idea: IdeaDocument,
  persona: Persona,
  plugin: ContentTypePlugin,
  config: DrftpnkConfig,
  context?: string,          // outline or post body text (optional)
  debug?: DebugLogger
): Promise<ImagePromptResult>
```

**System prompt** assembles:
- Persona image style: `art_style`, `color_palette`, `mood`, `negative_prompt`
- Instruction: "You are an art director. Generate a vivid image prompt..."
- JSON output format: `{ "prompt": "...", "negative_prompt": "...", "alt_text": "..." }`

**User prompt** includes: topic, theme, goals summary, content type name, and optionally the first 500 chars of context (outline/post).

Persona can override via `personas/{id}/image.md` prompt file (loaded in `loadPersona()`).

LLM call reuses `createLLMProvider()` from `src/llm/factory.ts` with the existing text LLM config.

### `src/image/fal.ts`
fal.ai client wrapper.

```typescript
export function resolveFalApiKey(config: DrftpnkConfig): string
// FAL_KEY env → config.image?.apiKey → throw

export function resolveImageConfig(
  config: DrftpnkConfig,
  plugin: ContentTypePlugin,
  overrides?: { model?: string; aspectRatio?: string }
): { model: string; aspectRatio: string }
// Merges: config.image → config.image_by_content_type[plugin.id] → CLI overrides
// aspectRatio falls back to plugin.defaultAspectRatio → 'landscape_4_3'

export async function generateImage(
  prompt: string,
  negativePrompt: string | undefined,
  model: string,
  aspectRatio: string,
  onProgress?: (status: string) => void
): Promise<{ url: string; width: number; height: number; contentType: string }>
// Calls fal.subscribe(), returns image metadata
```

### `src/commands/image.ts`
```
drftpnk image <idea-file> [options]
  -t, --type <type>          content type (default: from config)
  -p, --persona <id>         persona override
  -s, --slug <slug>          image filename slug (default: "image")
  --model <model>            fal.ai model override
  --aspect-ratio <ratio>     aspect ratio override (e.g. square_hd, landscape_16_9)
  --force                    overwrite existing image
  --debug                    debug output
```

**Flow:**
1. Parse idea file → `IdeaDocument`
2. Load persona + plugin
3. Auto-detect context: look for `{ideaBase}.{type}.md` (post) then `{ideaBase}.{type}.outline.md` (outline) — read first found
4. Call `generateImagePrompt()` → show spinner "Generating image prompt..."
5. Resolve image config (model + aspect ratio)
6. Compute output path: `{ideaDir}/{ideaBase}.{type}.{slug}.png`
7. Check if file exists → warn + require `--force`
8. Call `generateImage()` → show spinner "Generating image (model)..."
9. Download image from URL → write binary to output path
10. Print summary: file path, size, dimensions, model used

---

## Modified Files

### `src/config/types.ts`
Add to `DrftpnkConfig`:
```typescript
image?: ImageConfig
image_by_content_type?: Record<string, ImageOverride>
```

### `src/config/loader.ts`
Add default image config:
```typescript
image: {
  model: 'fal-ai/nano-banana-2'
}
```
Add `FAL_KEY` env var resolution in a new `resolveImageApiKey()` helper (mirrors `resolveApiKey()`).

### `src/personas/types.ts`
Add `PersonaImageStyle` interface and field to `Persona`:
```typescript
export interface PersonaImageStyle {
  art_style: string[]       // e.g. ["editorial illustration", "muted tones"]
  color_palette?: string[]  // e.g. ["deep navy", "warm amber"]
  mood?: string[]           // e.g. ["contemplative", "grounded"]
  negative_prompt?: string  // e.g. "no text, no logos, no people"
}

// In Persona:
image_style?: PersonaImageStyle
```

### `src/personas/index.ts`
In `loadPersona()`: check for `personas/{id}/image.md` and load it as `persona.prompts['image']` (the user prompt template for image prompt generation).

### `src/plugins/types.ts`
Add to `ContentTypePlugin`:
```typescript
defaultAspectRatio: string   // fal.ai image_size enum value
```

### `src/plugins/blog-post.ts`
```typescript
defaultAspectRatio: 'landscape_16_9'
```

### `src/plugins/tweet.ts`
```typescript
defaultAspectRatio: 'square_hd'
```

### `src/plugins/linkedin.ts`
```typescript
defaultAspectRatio: 'portrait_4_3'
```

### `src/commands/index.ts`
Export `registerImageCommand`.

### `src/cli.ts`
Register image command: `registerImageCommand(program)`.

### `example.nev`
Add `FAL_KEY=` line.

---

## Output File Naming

Pattern: `{ideaDir}/{ideaBase}.{contentType}.{slug}.png`

Examples:
- `ideas/idea.blog-post.image.png` (default slug)
- `ideas/idea.blog-post.hero.png` (--slug hero)
- `ideas/idea.tweet.card.png` (--slug card)
- `ideas/idea.linkedin.image.png`

Multiple images per content piece supported by varying `--slug`.

---

## Aspect Ratio Defaults by Content Type

| Content Type | Default Aspect Ratio | Notes |
|---|---|---|
| `blog-post` | `landscape_16_9` | Hero/banner image |
| `tweet` | `square_hd` | Twitter card |
| `linkedin` | `portrait_4_3` | LinkedIn post image |

fal.ai enum values: `square_hd`, `square`, `portrait_4_3`, `portrait_16_9`, `landscape_4_3`, `landscape_16_9`

---

## Persona Image Style Example

In `personas/david-thyresson.json`:
```json
{
  "image_style": {
    "art_style": ["editorial illustration", "flat design", "muted tones"],
    "color_palette": ["deep navy", "warm amber", "off-white"],
    "mood": ["contemplative", "grounded", "intellectually curious"],
    "negative_prompt": "no text, no logos, no people, no photorealism, no bright neon colors"
  }
}
```

---

## Config Example

In `~/.drftpnk/config.json` or `.drftpnk/config.json`:
```json
{
  "image": {
    "model": "fal-ai/nano-banana-2"
  },
  "image_by_content_type": {
    "tweet": {
      "model": "fal-ai/nano-banana-2",
      "aspect_ratio": "square_hd"
    },
    "linkedin": {
      "aspect_ratio": "portrait_4_3"
    }
  }
}
```

---

## Dependency

Add to `package.json`:
```
pnpm add @fal-ai/client
```

---

## Verification

1. `pnpm build` — no TypeScript errors
2. `FAL_KEY=xxx drftpnk image ideas/idea.md --type blog-post --debug` — generates `ideas/idea.blog-post.image.png`
3. `drftpnk image ideas/idea.md --type tweet --slug card` — generates `ideas/idea.tweet.card.png` with square_hd ratio
4. `drftpnk image ideas/idea.md --force` — overwrites existing image
5. `drftpnk image ideas/idea.md` (no FAL_KEY) — clear error message
6. `pnpm test` — existing tests still pass
