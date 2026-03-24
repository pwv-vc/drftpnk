import { Command } from 'commander'
import pc from 'picocolors'
import { pluginRegistry } from '../plugins/index.js'

export function registerContentTypesCommand(program: Command): void {
  const ctCmd = program
    .command('content-types')
    .description('List and inspect content type plugins')

  ctCmd
    .command('list')
    .description('List all available content types')
    .action(() => {
      const plugins = pluginRegistry.list()
      console.log(pc.bold('\nAvailable content types:\n'))
      for (const plugin of plugins) {
        console.log(
          `  ${pc.white(plugin.id.padEnd(14))} ${pc.dim(plugin.name.padEnd(16))} ${plugin.description}`
        )
      }
      console.log()
    })

  ctCmd
    .command('show <type>')
    .description('Show details for a content type')
    .action((type: string) => {
      try {
        const plugin = pluginRegistry.get(type)
        console.log(pc.bold(`\n${plugin.name} (${plugin.id})\n`))
        console.log(`Description: ${plugin.description}`)
        console.log(`\nSections:`)
        for (const section of plugin.structure.sections) {
          console.log(`  - ${section}`)
        }
        console.log(`\nWord count target: ${plugin.structure.wordCountTarget}`)
        if (plugin.structure.platformRules?.length) {
          console.log(`\nPlatform rules:`)
          for (const rule of plugin.structure.platformRules) {
            console.log(`  - ${rule}`)
          }
        }
        console.log()
      } catch (err) {
        console.error(pc.red(String(err instanceof Error ? err.message : err)))
        process.exit(1)
      }
    })
}
