import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { pathExists } from 'fs-extra'
import { join, basename } from 'path'
import { getLogger } from '../../utils/logger'
import { TazzAnimation } from '../ui/tornado'
import { DependencyManager } from '../../utils/dependencies'
import { TodoFileParser, ParsedTask, TodoFileMetadata } from '../../core/services/TodoFileParser'
import { TmuxSessionOrchestrator, OrchestrationResult } from '../../core/services/TmuxSessionOrchestrator'
import { ClaudeCodeLauncher, LaunchResult } from '../../core/services/ClaudeCodeLauncher'
import { ValidationError, TazzError } from '../../core/types'

export class RunCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('run')
      .description('🚀 Start multiple development sessions from .tazz/tazz-todo.md')
      .option('-s, --session <name>', 'Override session name (default: auto-generated)')
      .option('--no-claude', 'Skip launching Claude Code in sessions')
      .option('--dry-run', 'Show what would be created without actually doing it')
      .action(async (options) => {
        await this.execute(options)
      })
  }

  async execute(options: {
    session?: string
    claude?: boolean
    dryRun?: boolean
  } = {}): Promise<void> {
    
    // Show animation
    const animation = new TazzAnimation()
    await animation.show()

    console.log('')
    console.log(chalk.bold.cyan('🚀 Starting Tazz Development Sessions'))
    console.log(chalk.gray('Reading tasks from .tazz/tazz-todo.md and creating isolated sessions...'))
    console.log('')

    let orchestrationResult: OrchestrationResult | null = null
    let orchestrator: TmuxSessionOrchestrator | null = null

    // Setup cleanup handler for interruptions
    const cleanup = async (signal?: string) => {
      if (orchestrationResult && orchestrator) {
        console.log('')
        console.log(chalk.yellow(`⚠️  Received ${signal || 'exit'} signal - cleaning up...`))
        try {
          await orchestrator.cleanup(orchestrationResult.mainSessionId)
          console.log(chalk.green('✅ Cleanup completed'))
        } catch (cleanupError) {
          console.log(chalk.red(`❌ Cleanup failed: ${(cleanupError as Error).message}`))
        }
      }
      process.exit(signal === 'SIGTERM' ? 143 : 130)
    }

    // Register cleanup handlers
    process.on('SIGINT', () => cleanup('SIGINT'))
    process.on('SIGTERM', () => cleanup('SIGTERM'))
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception during run command', error)
      cleanup('uncaughtException').then(() => process.exit(1))
    })

    try {
      // Check if project is initialized
      await this.checkProjectInitialized()

      // Ensure dependencies are available
      if (!await DependencyManager.ensureDependencies()) {
        throw new ValidationError('Required dependencies are missing')
      }

      // Initialize services
      const todoParser = new TodoFileParser(this.logger)
      orchestrator = new TmuxSessionOrchestrator(this.logger)
      const claudeLauncher = new ClaudeCodeLauncher(this.logger)

      // Parse todo file
      const spinner = ora('Parsing tazz-todo.md file').start()
      const { tasks, metadata } = await todoParser.parseFile(process.cwd())
      spinner.succeed(`Found ${tasks.length} executable tasks`)

      if (tasks.length === 0) {
        throw new ValidationError('No executable tasks found in .tazz/tazz-todo.md. Run "tazz note" to create tasks.')
      }

      // Display parsed tasks
      this.displayTasksPreview(tasks, metadata)

      if (options.dryRun) {
        console.log(chalk.yellow('🔍 DRY RUN - No sessions will be created'))
        console.log('')
        return
      }

      // Orchestrate sessions
      const sessionSpinner = ora('Creating tmux sessions and git worktrees').start()
      orchestrationResult = await orchestrator.orchestrateSessions(
        tasks,
        metadata,
        options.session
      )
      sessionSpinner.succeed(`Created ${orchestrationResult.summary.successfulSessions}/${orchestrationResult.summary.totalSessions} sessions`)

      // Display orchestration results
      this.displayOrchestrationResults(orchestrationResult)

      // Launch Claude Code in sessions (if not disabled)
      if (options.claude !== false) {
        const claudeSpinner = ora('Launching Claude Code in each session').start()
        
        try {
          const claudeResults = await claudeLauncher.launchInSessions(orchestrationResult.sessions)
          const successfulLaunches = claudeResults.filter(r => r.status === 'success').length
          claudeSpinner.succeed(`Claude Code launched in ${successfulLaunches}/${claudeResults.length} sessions`)
          
          // Display Claude launch results
          this.displayClaudeLaunchResults(claudeResults)

        } catch (error) {
          claudeSpinner.fail('Failed to launch Claude Code')
          console.log(chalk.yellow('⚠️  Sessions were created but Claude Code launch failed'))
          console.log(chalk.gray(`   Error: ${(error as Error).message}`))
          console.log(chalk.gray('   You can manually join sessions and start Claude Code'))
        }
      }

      // Display final summary
      this.displayFinalSummary(orchestrationResult, options)

    } catch (error) {
      this.logger.error('Session orchestration failed', error as Error)
      
      if (error instanceof ValidationError) {
        console.log('')
        console.log(chalk.red('❌ Validation Error'))
        console.log(chalk.red(`   ${error.message}`))
        this.displayValidationSuggestions(error)
      } else if (error instanceof TazzError) {
        console.log('')
        console.log(chalk.red(`❌ ${error.constructor.name}`))
        console.log(chalk.red(`   ${error.message}`))
      } else {
        console.log('')
        console.log(chalk.red('❌ Unexpected error occurred'))
        console.log(chalk.red(`   ${(error as Error).message}`))
      }
      
      console.log('')
      process.exit(1)
    }
  }

  private async checkProjectInitialized(): Promise<void> {
    const tazzDir = join(process.cwd(), '.tazz')
    if (!await pathExists(tazzDir)) {
      throw new ValidationError('Project not initialized. Run "tazz make" first.')
    }
  }

  private displayTasksPreview(tasks: ParsedTask[], metadata: TodoFileMetadata): void {
    console.log(chalk.bold('📋 Parsed Tasks:'))
    
    if (metadata.sessionName) {
      console.log(chalk.gray('   Session:'), chalk.cyan(metadata.sessionName))
    }
    
    console.log(chalk.gray('   File:'), chalk.cyan(metadata.filePath))
    console.log(chalk.gray('   Total Tasks:'), chalk.cyan(tasks.length.toString()))
    console.log('')

    tasks.forEach((task, i) => {
      const priorityColor = task.priority === 'high' ? chalk.red : 
                           task.priority === 'medium' ? chalk.yellow : chalk.gray
      
      console.log(chalk.gray(`   ${i + 1}.`), chalk.cyan(task.name))
      console.log(chalk.gray(`      Priority:`), priorityColor(task.priority.toUpperCase()))
      console.log(chalk.gray(`      Session:`), chalk.yellow(task.sessionName))
      
      if (task.description && task.description !== task.name) {
        const desc = task.description.length > 60 
          ? task.description.substring(0, 60) + '...' 
          : task.description
        console.log(chalk.gray(`      Description: ${desc}`))
      }
      
      if (task.context.dependencies?.length) {
        console.log(chalk.gray(`      Dependencies: ${task.context.dependencies.join(', ')}`))
      }
      console.log('')
    })
  }

  private displayOrchestrationResults(result: OrchestrationResult): void {
    console.log('')
    console.log(chalk.bold('📍 Session Details:'))
    console.log(chalk.gray('   Main Session:'), chalk.cyan(result.mainSessionId))
    console.log(chalk.gray('   Worktree:'), chalk.cyan(result.worktreeInfo.worktreePath))
    console.log(chalk.gray('   Branch:'), chalk.cyan(result.worktreeInfo.branchName))
    console.log('')

    if (result.summary.errors.length > 0) {
      console.log(chalk.yellow('⚠️  Session Creation Issues:'))
      result.summary.errors.forEach(error => {
        console.log(chalk.gray('   •'), chalk.yellow(error))
      })
      console.log('')
    }

    console.log(chalk.bold('🎯 Created Sessions:'))
    result.sessions
      .filter(session => session.status !== 'failed')
      .forEach((session, i) => {
        const statusColor = session.status === 'created' ? chalk.green : 
                           session.status === 'running' ? chalk.cyan : chalk.gray
        
        console.log(chalk.gray(`   ${i + 1}.`), chalk.cyan(session.id))
        console.log(chalk.gray(`      Task:`), session.task.name)
        console.log(chalk.gray(`      Status:`), statusColor(session.status))
        console.log(chalk.gray(`      Tmux:`), chalk.yellow(session.tmuxSessionName))
      })
    console.log('')
  }

  private displayClaudeLaunchResults(results: LaunchResult[]): void {
    const successful = results.filter(r => r.status === 'success')
    const failed = results.filter(r => r.status === 'failed')
    
    if (successful.length > 0) {
      console.log(chalk.bold('🤖 Claude Code Status:'))
      successful.forEach(result => {
        console.log(chalk.gray('   •'), chalk.green(result.sessionId), chalk.gray('- Claude Code running'))
      })
    }

    if (failed.length > 0) {
      console.log('')
      console.log(chalk.yellow('⚠️  Claude Code Launch Issues:'))
      failed.forEach(result => {
        console.log(chalk.gray('   •'), chalk.red(result.sessionId), chalk.gray(`- ${result.error}`))
      })
    }
    console.log('')
  }

  private displayFinalSummary(result: OrchestrationResult, options: any): void {
    console.log(chalk.bold('🔗 Next Steps:'))
    
    const activeSessions = result.sessions.filter(s => s.status !== 'failed')
    
    if (activeSessions.length > 0) {
      console.log(chalk.gray('• Join specific session:'), chalk.cyan(`tazz join ${activeSessions[0].id}`))
      console.log(chalk.gray('• List all sessions:'), chalk.cyan('tazz list'))
      console.log(chalk.gray('• Stop all sessions:'), chalk.cyan(`tazz stop ${result.mainSessionId}`))
      console.log(chalk.gray('• Delete all sessions:'), chalk.cyan(`tazz delete ${result.mainSessionId} --force`))
    }
    
    console.log(chalk.gray('• Edit tasks:'), chalk.cyan('tazz note'))
    console.log('')

    // Display session commands for easy copy-paste
    console.log(chalk.bold('📋 Session Commands:'))
    activeSessions.slice(0, 3).forEach(session => {
      console.log(chalk.gray('   Join:'), chalk.cyan(`tazz join ${session.id}`))
    })
    
    if (activeSessions.length > 3) {
      console.log(chalk.gray(`   ... and ${activeSessions.length - 3} more sessions`))
    }
    console.log('')

    console.log(chalk.green('✅ Development environment ready!'))
    console.log(chalk.gray(`   ${activeSessions.length} sessions created with Claude Code integration`))
    console.log('')
  }

  private displayValidationSuggestions(error: ValidationError): void {
    console.log('')
    console.log(chalk.yellow('💡 Suggestions:'))
    
    if (error.message.includes('not initialized')) {
      console.log(chalk.gray('   • Initialize project:'), chalk.cyan('tazz make'))
    } else if (error.message.includes('dependencies')) {
      console.log(chalk.gray('   • Check system:'), chalk.cyan('tazz health'))
      console.log(chalk.gray('   • Install dependencies:'), chalk.cyan('tazz health --fix'))
    } else if (error.message.includes('tazz-todo.md')) {
      console.log(chalk.gray('   • Create todo file:'), chalk.cyan('tazz note'))
      console.log(chalk.gray('   • Edit existing tasks:'), chalk.cyan('tazz note --editor code'))
    } else if (error.message.includes('No executable tasks')) {
      console.log(chalk.gray('   • Add tasks to todo file:'), chalk.cyan('tazz note'))
      console.log(chalk.gray('   • Check task format in file'))
    }
  }
}