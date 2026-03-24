import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { DrftpnkConfig } from './types.js'

const USER_CONFIG_DIR = join(homedir(), '.drftpnk')
const USER_CONFIG_PATH = join(USER_CONFIG_DIR, 'config.json')
const PROJECT_CONFIG_PATH = join(process.cwd(), '.drftpnk', 'config.json')

export function getDefaultConfig(): DrftpnkConfig {
  return {
    default_persona: 'david-thyresson',
    default_content_type: 'blog-post',
    output_dir: '.',
    outline: {
      auto_save: true,
      naming_convention: 'idea.{type}.outline.md',
      require_outline_for_post: false,
    },
    llm: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4000,
    },
  }
}

function readJsonFile(path: string): Partial<DrftpnkConfig> {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return {}
  }
}

function deepMerge<T extends object>(base: T, override: Partial<T>): T {
  const result = { ...base }
  for (const key of Object.keys(override) as (keyof T)[]) {
    const val = override[key]
    if (val !== undefined && val !== null) {
      if (typeof val === 'object' && !Array.isArray(val) && typeof base[key] === 'object') {
        result[key] = deepMerge(base[key] as object, val as object) as T[keyof T]
      } else {
        result[key] = val as T[keyof T]
      }
    }
  }
  return result
}

export function loadConfig(): DrftpnkConfig {
  let config = getDefaultConfig()

  if (existsSync(USER_CONFIG_PATH)) {
    config = deepMerge(config, readJsonFile(USER_CONFIG_PATH))
  }

  if (existsSync(PROJECT_CONFIG_PATH)) {
    config = deepMerge(config, readJsonFile(PROJECT_CONFIG_PATH))
  }

  return config
}

export function resolveApiKey(config: DrftpnkConfig): string {
  const fromEnv = process.env.OPENAI_API_KEY
  if (fromEnv) return fromEnv
  if (config.llm.apiKey) return config.llm.apiKey
  throw new Error(
    'No API key found. Set OPENAI_API_KEY environment variable or run: drftpnk config init'
  )
}

export function saveUserConfig(config: Partial<DrftpnkConfig>): void {
  if (!existsSync(USER_CONFIG_DIR)) {
    mkdirSync(USER_CONFIG_DIR, { recursive: true })
  }
  const existing = existsSync(USER_CONFIG_PATH) ? readJsonFile(USER_CONFIG_PATH) : {}
  const merged = deepMerge(existing as DrftpnkConfig, config)
  writeFileSync(USER_CONFIG_PATH, JSON.stringify(merged, null, 2))
}

export { USER_CONFIG_DIR, USER_CONFIG_PATH }
