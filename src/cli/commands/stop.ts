import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { MCPSessionManager } from '../../core/services/MCPSessionManager'
import { MCPIntegrationService } from '../../core/services/MCPIntegrationService'
import { getLogger } from '../../utils/logger'

export class StopCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('stop')
      .description('⏸️  Stop a Tazz session (keeps worktree)')
      .argument('<session-id>', 'Session identifier to stop')
      .action(async (sessionId: string) => {
        await this.execute(sessionId)
      })
  }

  async execute(sessionId: string): Promise<void> {
    console.log('')
    console.log(chalk.yellow(`⏸️  Stopping session: ${sessionId}`))

    const spinner = ora('Stopping session and cleaning up resources').start()

    try {
      // Initialize services
      const mcpService = new MCPIntegrationService(this.logger)
      const sessionManager = new MCPSessionManager(mcpService, this.logger)

      // Stop the session (this will stop tmux but keep worktree)
      await sessionManager.stopSession(sessionId)
      
      spinner.succeed('Session stopped successfully')
      console.log(chalk.green(`✅ Session ${sessionId} stopped`))
      console.log(chalk.gray(`   Use 'tazz start ${sessionId}' to resume with existing worktree`))
      console.log(chalk.gray(`   Use 'tazz clean --session ${sessionId}' to completely remove worktree`))

    } catch (error) {
      spinner.fail('Failed to stop session')
      console.log(chalk.red(`❌ Failed to stop session: ${(error as Error).message}`))
      process.exit(1)
    }
  }
}