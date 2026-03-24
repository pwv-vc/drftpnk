import { existsSync, writeFileSync } from 'fs'
import { join, dirname, basename } from 'path'
import pc from 'picocolors'

export function getOutputPath(
  ideaFile: string,
  pluginId: string,
  mode: 'outline' | 'content'
): string {
  const dir = dirname(ideaFile)
  const base = basename(ideaFile, '.md')
  const suffix = mode === 'outline' ? `${pluginId}.outline` : pluginId
  return join(dir, `${base}.${suffix}.md`)
}

export interface WriteOptions {
  force?: boolean
  stdout?: boolean
}

export function writeOutput(
  outputPath: string,
  content: string,
  opts: WriteOptions = {}
): boolean {
  if (opts.stdout) {
    process.stdout.write('\n' + content + '\n')
    return true
  }

  if (existsSync(outputPath) && !opts.force) {
    console.error(
      pc.yellow(`\nFile already exists: ${outputPath}`) +
        pc.dim('\nUse --force to overwrite.')
    )
    return false
  }

  writeFileSync(outputPath, content, 'utf-8')
  return true
}
