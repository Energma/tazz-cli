import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { MCPSessionManager } from '../../core/services/MCPSessionManager'
import { MCPIntegrationService } from '../../core/services/MCPIntegrationService'
import { getLogger } from '../../utils/logger'
import { TazzError, SessionStatus } from '../../core/types'
import { TazzAnimation } from '../ui/tornado'

export class StartCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('start')
      .description('🌀 Create a new development session with git worktree and tmux')
      .argument('<session-id>', 'Session identifier (e.g., JIRA-123, feature-name)')
      .option('-t, --tasks <tasks>', 'Comma-separated list of tasks for this session')
      .option('-b, --branch <branch>', 'Custom branch name (overrides convention)')
      .option('--no-tmux', 'Skip tmux session creation')
      .option('--no-jira', 'Skip Jira ticket integration')
      .action(async (sessionId: string, options) => {
        await this.execute(sessionId, options)
      })
  }

  async execute(sessionId: string, options: {
    tasks?: string
    branch?: string
    tmux?: boolean
    jira?: boolean
  } = {}): Promise<void> {
    
    // Show tornado animation
    const tazz = new TazzAnimation()
    await tazz.show()

    console.log('')
    console.log(chalk.bold.cyan(`🌀 Starting session: ${sessionId}`))
    console.log('')

    const spinner = ora('Initializing session environment').start()

    try {
      // Initialize services
      const mcpService = new MCPIntegrationService(this.logger)
      await mcpService.detectAndSetupMCPs()
      
      const sessionManager = new MCPSessionManager(mcpService, this.logger)

      // Create session with context
      const sessionContext = {
        tasks: options.tasks?.split(',').map(t => t.trim()),
        customBranch: options.branch,
        enableTmux: options.tmux !== false,
        enableJiraIntegration: options.jira !== false
      }

      spinner.text = 'Creating git worktree'
      const session = await sessionManager.createSession(sessionId, sessionContext)

      spinner.text = 'Setting up tmux session'
      if (options.tmux !== false) {
        await sessionManager.setupTmuxSession(session)
      }

      spinner.text = 'Initializing agent environment'
      await sessionManager.setupAgentEnvironment(session)

      // Fetch Jira context if applicable
      if (options.jira !== false && this.isJiraTicket(sessionId)) {
        spinner.text = 'Fetching Jira ticket information'
        await sessionManager.enrichWithJiraContext(session)
      }

      spinner.succeed('Session created successfully')

      // Show session information
      this.displaySessionInfo(session, sessionManager)

      // Start session if tmux is enabled
      if (options.tmux !== false) {
        console.log('')
        console.log(chalk.yellow('🔄 Attaching to tmux session...'))
        await sessionManager.attachToTmuxSession(session.id)
      }

    } catch (error) {
      spinner.fail('Session creation failed')
      this.handleError(error, sessionId)
    }
  }

  private isJiraTicket(sessionId: string): boolean {
    return /^[A-Z]+-\d+$/.test(sessionId)
  }

  private displaySessionInfo(session: any, sessionManager: any): void {
    console.log('')
    console.log(chalk.bold('📋 Session Information:'))
    console.log(chalk.gray('   Session ID:'), chalk.cyan(session.id))
    console.log(chalk.gray('   Branch:'), chalk.cyan(session.branch))
    console.log(chalk.gray('   Worktree:'), chalk.cyan(session.worktreePath))
    console.log(chalk.gray('   Status:'), this.getStatusColor(session.status))

    if (session.metadata?.jira) {
      console.log('')
      console.log(chalk.bold('🎫 Jira Ticket:'))
      console.log(chalk.gray('   Title:'), chalk.cyan(session.metadata.jira.title))
      console.log(chalk.gray('   Priority:'), chalk.yellow(session.metadata.jira.priority))
      console.log(chalk.gray('   Status:'), chalk.yellow(session.metadata.jira.status))
    }

    if (session.tasks && session.tasks.length > 0) {
      console.log('')
      console.log(chalk.bold('📝 Tasks:'))
      session.tasks.forEach((task: any, index: number) => {
        console.log(chalk.gray(`   ${index + 1}.`), chalk.cyan(task.title))
      })
    }

    console.log('')
    console.log(chalk.bold('🔧 Next Steps:'))
    console.log(chalk.gray('   • Use'), chalk.cyan(`tazz join ${session.id}`), chalk.gray('to return to this session'))
    console.log(chalk.gray('   • Use'), chalk.cyan(`tazz stop ${session.id}`), chalk.gray('to pause this session'))
    console.log(chalk.gray('   • Use'), chalk.cyan('tazz list'), chalk.gray('to see all active sessions'))
  }

  private getStatusColor(status: SessionStatus): string {
    switch (status) {
      case SessionStatus.ACTIVE:
        return chalk.green(status)
      case SessionStatus.STOPPED:
        return chalk.yellow(status)
      case SessionStatus.FAILED:
        return chalk.red(status)
      default:
        return chalk.gray(status)
    }
  }

  private handleError(error: unknown, sessionId: string): void {
    this.logger.error('Session start failed', error as Error, { sessionId })
    
    console.log('')
    console.log(chalk.red('❌ Failed to start session'))
    
    if (error instanceof TazzError) {
      console.log(chalk.red(`   ${error.message}`))
      
      // Provide helpful suggestions based on error type
      if (error.code === 'GIT_ERROR') {
        console.log('')
        console.log(chalk.yellow('💡 Suggestions:'))
        console.log(chalk.gray('   • Ensure you are in a git repository'))
        console.log(chalk.gray('   • Check that git is properly configured'))
        console.log(chalk.gray('   • Verify branch naming conventions'))
      }
    } else {
      console.log(chalk.red('   An unexpected error occurred'))
    }
    
    console.log('')
    process.exit(1)
  }
}