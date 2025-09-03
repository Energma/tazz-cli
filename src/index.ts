#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { getLogger } from './utils/logger'
import { MakeCommand } from './cli/commands/make'
import { NoteCommand } from './cli/commands/note'
import { RunCommand } from './cli/commands/run'
import { ListCommand } from './cli/commands/list'
import { JoinCommand } from './cli/commands/join'
import { StopCommand } from './cli/commands/stop'
import { DeleteCommand } from './cli/commands/delete'
import { HealthCommand } from './cli/commands/health'
import { InteractiveCommand } from './cli/commands/interactive'
import { CleanCommand } from './cli/commands/clean'

const logger = getLogger()

// ASCII Art Tazz CLI Logo
const TAZZ_LOGO = `
        .       *        .        *
        .             .    *         .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .          *          .       *       .      .
     *          .             *        .      *
`

async function main() {
  const program = new Command()

  program
    .name('tazz')
    .description('🌀 AI-powered development tool with git worktrees, tmux sessions, and MCP integration')
    .version('1.0.0')
    .configureHelp({
      sortSubcommands: true,
      subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage()
    })

  // Global options
  program
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Suppress non-error output')
    .option('--log-level <level>', 'Set log level (debug, info, warn, error)', 'info')

  // Handle global options
  program.hook('preAction', (thisCommand) => {
    const options = thisCommand.opts()
    
    if (options.verbose) {
      logger.setLevel('debug')
    } else if (options.quiet) {
      logger.setLevel('error')
    } else if (options.logLevel) {
      logger.setLevel(options.logLevel)
    }
  })

  // Add commands
  program.addCommand(new MakeCommand().build())
  program.addCommand(new NoteCommand().build())
  program.addCommand(new RunCommand().build())
  program.addCommand(new ListCommand().build())
  program.addCommand(new JoinCommand().build())
  program.addCommand(new StopCommand().build())
  program.addCommand(new DeleteCommand().build())
  program.addCommand(new HealthCommand().build())
  program.addCommand(new CleanCommand().build())

  // Interactive mode (default when no command specified)
  program
    .command('interactive', { isDefault: false })
    .alias('i')
    .description('🌀 Interactive Tazz CLI tool menu')
    .action(async () => {
      const interactiveCmd = new InteractiveCommand()
      await interactiveCmd.execute()
    })

  // Custom help
  program.on('--help', () => {
    console.log('')
    console.log(chalk.cyan('Examples:'))
    console.log('  $ tazz                         Start interactive menu')
    console.log('  $ tazz make                    Setup Tazz in current project')
    console.log('  $ tazz note                    Edit tasks and prompts')
    console.log('  $ tazz run feature-auth        Start development instance')
    console.log('  $ tazz health                  Check system dependencies')
    console.log('  $ tazz list                    Show all instances')
    console.log('')
    console.log(chalk.yellow('For more information, visit: https://github.com/tazz-dev/tazz-cli'))
  })

  // Error handling
  program.exitOverride()

  // If no arguments provided, start interactive mode
  if (process.argv.length === 2) {
    const interactiveCmd = new InteractiveCommand()
    await interactiveCmd.execute()
    return
  }

  try {
    await program.parseAsync(process.argv)
  } catch (error: any) {
    if (error.code === 'commander.unknownCommand') {
      console.log('')
      console.log(chalk.red('❌ Unknown command. Use --help to see available commands.'))
      console.log('')
      process.exit(1)
    }

    if (error.code === 'commander.help' || error.message === '(outputHelp)') {
      // Help was displayed, exit normally
      process.exit(0)
    }

    // Log unexpected errors
    logger.error('Unexpected error occurred', error)
    console.log('')
    console.log(chalk.red('❌ An unexpected error occurred. Check logs for details.'))
    console.log(chalk.gray(`   Log file: /tmp/tazz-tmp/logs/tazz.log`))
    process.exit(1)
  }
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', reason as Error, {
    promise: promise.toString()
  })
  console.log('')
  console.log(chalk.red('❌ An unexpected error occurred. Check logs for details.'))
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error)
  console.log('')
  console.log(chalk.red('❌ A critical error occurred. Check logs for details.'))
  process.exit(1)
})

// Show Tazz logo on direct execution
if (require.main === module) {
  console.log(chalk.cyan(TAZZ_LOGO))
  console.log(chalk.bold.cyan('=== Tazz CLI Tool ==='))
  console.log(chalk.gray('   AI-Powered Development Orchestrator'))
  console.log('')
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    logger.error('Main execution failed', error)
    process.exit(1)
  })
}

export { main }
export * from './core/types'
export * from './core/services/MCPIntegrationService'
export * from './core/services/CodebaseAnalyzer'
export * from './core/services/RulesGenerator'