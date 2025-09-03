import { Command } from 'commander'
import chalk from 'chalk'
import { SessionStore } from '../../core/storage/SessionStore'
import { SessionStatus } from '../../core/types'
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

    try {
      const sessionStore = new SessionStore()
      await sessionStore.updateSessionStatus(sessionId, SessionStatus.STOPPED)
      
      console.log(chalk.green(`✅ Session ${sessionId} stopped`))
      console.log(chalk.gray(`   Use 'tazz join ${sessionId}' to resume`))

    } catch (error) {
      console.log(chalk.red(`❌ Failed to stop session: ${(error as Error).message}`))
      process.exit(1)
    }
  }
}