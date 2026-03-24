import { statSync } from 'fs'
import { Command } from 'commander'
import ora from 'ora'
import pc from 'picocolors'
import { parseIdeaFile } from '../idea/parser.js'
import { loadConfig } from '../config/loader.js'
import { loadPersona } from '../personas/index.js'
import { pluginRegistry } from '../plugins/index.js'
import { generate, buildOutlinePrompt, resolveModelConfig } from '../generator.js'
import { formatOutput } from '../output/formatter.js'
import { getOutputPath, writeOutput } from '../output/writer.js'
import { promptAndPreview } from '../output/preview.js'
import { printSummary } from '../output/summary.js'
import { createDebugger } from '../debug.js'

export function registerOutlineCommand(program: Command): void {
  program
    .command('outline <idea-file>')
    .description('Generate an outline from an idea file')
    .option('-t, --type <type>', 'content type (blog-post, tweet, linkedin)')
    .option('-p, --persona <id>', 'persona to use')
    .option('--force', 'overwrite existing outline file')
    .option('--stdout', 'print to stdout only, do not save')
    .option('--debug', 'show debug info during generation')
    .action(async (ideaFile: string, opts) => {
      try {
        const debug = createDebugger(!!opts.debug)

        const config = loadConfig()
        const contentType = opts.type ?? config.default_content_type
        const personaId = opts.persona ?? config.default_persona

        debug('idea file:', ideaFile)

        const idea = parseIdeaFile(ideaFile)
        debug('parsed:', `"${idea.topic}" · ${idea.goals.length} goals · ${idea.keyIdeas.length} key ideas`)

        const persona = loadPersona(personaId)
        debug('persona:', `${persona.id} (${persona.name})`)

        const plugin = pluginRegistry.get(contentType)
        debug('plugin:', `${plugin.id} (${plugin.name})`)

        const validation = plugin.validate(idea)
        if (!validation.valid) {
          console.error(pc.red('Validation failed:'))
          for (const err of validation.errors) {
            console.error(pc.red(`  - ${err}`))
          }
          process.exit(1)
        }
        debug('validation:', 'passed')

        const resolvedLlm = resolveModelConfig(config, persona, plugin)
        debug('model:', `${resolvedLlm.model} · temp ${resolvedLlm.temperature} · max ${resolvedLlm.maxTokens} tokens`)

        if (opts.debug) {
          const prompt = buildOutlinePrompt(idea, persona, plugin)
          debug('prompt:', `${prompt.length.toLocaleString('en-US')} chars`)
        }

        const spinner = ora({
          text: pc.dim(`Generating ${plugin.name} outline as ${persona.name} [${resolvedLlm.model}]...`),
          color: 'white',
        })

        if (!opts.stdout) spinner.start()

        debug('generating...')

        const response = await generate(idea, persona, plugin, config, 'outline', undefined, (chunk) => {
          if (opts.stdout) {
            process.stdout.write(chunk)
          }
        })

        if (!opts.stdout) spinner.stop()

        const meta = {
          author: persona.name,
          date: new Date().toISOString().split('T')[0],
          theme: idea.theme,
          persona,
        }

        const formatted = formatOutput(plugin, response, meta, 'outline')

        if (opts.stdout) {
          process.stdout.write('\n')
          return
        }

        const outputPath = getOutputPath(ideaFile, plugin.id, 'outline')
        debug('writing:', outputPath)

        const saved = writeOutput(outputPath, formatted, { force: opts.force })

        if (saved) {
          const sizeBytes = statSync(outputPath).size
          printSummary({ files: [{ path: outputPath, sizeBytes }], usage: response.usage })
          await promptAndPreview(outputPath, formatted)
        }
      } catch (err) {
        console.error(pc.red(String(err instanceof Error ? err.message : err)))
        process.exit(1)
      }
    })
}
