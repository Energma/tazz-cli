import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { exec } from 'child_process'
import { promisify } from 'util'
import { MCPSessionManager } from '../../core/services/MCPSessionManager'
import { MCPIntegrationService } from '../../core/services/MCPIntegrationService'
import { getLogger } from '../../utils/logger'

const execAsync = promisify(exec)

export class DeleteCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('delete')
      .alias('rm')
      .alias('destroy')
      .description('🗑️  Completely delete a session and its worktree')
      .argument('<session-id>', 'Session ID to delete (e.g., JIRA-123, feature-name)')
      .option('-f, --force', 'Skip confirmation prompt')
      .action(async (sessionId: string, options) => {
        await this.execute(sessionId, options)
      })
  }

  async execute(sessionId: string, options: { force?: boolean } = {}): Promise<void> {
    console.log('')
    console.log(chalk.red(`🗑️  Deleting session: ${sessionId}`))
    
    try {
      // Initialize services
      const mcpService = new MCPIntegrationService(this.logger)
      const sessionManager = new MCPSessionManager(mcpService, this.logger)

      // Check if session exists
      const sessionStore = sessionManager['sessionStore'] || new (await import('../../core/storage/SessionStore')).SessionStore()
      const session = await sessionStore.getSession(sessionId)
      if (!session) {
        console.log(chalk.red(`❌ Session not found: ${sessionId}`))
        await this.listAvailableSessions()
        process.exit(1)
      }

      // Confirmation prompt
      if (!options.force) {
        console.log('')
        console.log(chalk.yellow('⚠️  This will permanently delete:'))
        console.log(chalk.gray(`   • Git worktree: ${session.worktreePath}`))
        console.log(chalk.gray('   • Tmux session'))
        console.log(chalk.gray('   • All session data'))
        console.log('')

        const { confirmed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to delete session ${sessionId}?`,
          default: false
        }])

        if (!confirmed) {
          console.log(chalk.yellow('❌ Deletion cancelled'))
          return
        }
      }

      const spinner = ora('Deleting session and cleaning up all resources').start()

      // Delete the session completely (stops tmux, removes worktree, deletes session data)
      await sessionManager.deleteSession(sessionId)
      
      spinner.succeed('Session deleted successfully')
      console.log(chalk.green(`✅ Session ${sessionId} has been completely removed`))
      console.log(chalk.gray('   All worktree data has been permanently deleted'))

    } catch (error) {
      console.log(chalk.red(`❌ Failed to delete session: ${(error as Error).message}`))
      
      // Provide helpful suggestions
      console.log('')
      console.log(chalk.yellow('💡 Try these commands:'))
      console.log(chalk.gray('   • tazz list - Check if session exists'))
      console.log(chalk.gray('   • tazz clean --worktrees - Clean abandoned worktrees'))
      console.log(chalk.gray('   • git worktree list - Check git worktrees manually'))
      
      this.logger.error('Delete failed', error as Error)
      process.exit(1)
    }
  }

  private async listAvailableSessions(): Promise<void> {
    try {
      const mcpService = new MCPIntegrationService(this.logger)
      const sessionManager = new MCPSessionManager(mcpService, this.logger)
      const sessionStore = sessionManager['sessionStore'] || new (await import('../../core/storage/SessionStore')).SessionStore()
      const sessions = await sessionStore.getAllSessions()
      
      console.log('')
      if (sessions.length > 0) {
        console.log(chalk.yellow('Available sessions:'))
        sessions.forEach(session => {
          console.log(chalk.gray(`   • ${session.id} (${session.status})`))
        })
      } else {
        console.log(chalk.gray('No sessions found'))
      }
    } catch {
      console.log(chalk.gray('Unable to list sessions'))
    }
  }
}