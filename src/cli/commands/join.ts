import { Command } from 'commander'
import chalk from 'chalk'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getLogger } from '../../utils/logger'

const execAsync = promisify(exec)

export class JoinCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('join')
      .alias('attach')
      .description('🔗 Join an existing Tazz process')
      .argument('<process-id>', 'Process ID to join (e.g., instance_task-1)')
      .action(async (processId: string) => {
        await this.execute(processId)
      })
  }

  async execute(processId: string): Promise<void> {
    console.log('')
    
    try {
      // Build tmux session name - process ID is already the full identifier
      const tmuxSessionName = `tazz_${processId}`
      
      console.log(chalk.cyan(`🔗 Joining Tazz process: ${processId}`))

      // Check if session exists
      try {
        await execAsync(`tmux has-session -t ${tmuxSessionName}`)
      } catch (error) {
        console.log(chalk.red(`❌ Tazz process not found: ${processId}`))
        
        // List available sessions
        await this.listAvailableSessions()
        process.exit(1)
      }

      // Join tmux session
      await this.joinTmuxSession(tmuxSessionName)

    } catch (error) {
      console.log(chalk.red(`❌ Failed to join session: ${(error as Error).message}`))
      this.logger.error('Join failed', error as Error)
      process.exit(1)
    }
  }

  private async joinTmuxSession(sessionName: string): Promise<void> {
    try {
      // Check if we're already in a tmux session
      if (process.env.TMUX) {
        console.log(chalk.yellow('⚠️  Already inside a tmux session'))
        console.log(chalk.gray('   Switch to session:'), chalk.cyan(`tmux switch-client -t ${sessionName}`))
        return
      }
      
      // Import spawn to replace current process
      const { spawn } = require('child_process')
      
      console.log(chalk.green(`✅ Joining Tazz process: ${sessionName}`))
      
      // Spawn tmux attach and replace current process
      const tmux = spawn('tmux', ['attach-session', '-t', sessionName], {
        stdio: 'inherit',
        detached: false
      })
      
      // Exit current process when tmux session ends
      tmux.on('exit', (code) => {
        process.exit(code || 0)
      })
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not join tmux session'))
      console.log(chalk.gray('   Try manually:'), chalk.cyan(`tmux attach-session -t ${sessionName}`))
    }
  }

  private async listAvailableSessions(): Promise<void> {
    try {
      const { stdout } = await execAsync('tmux list-sessions | grep tazz')
      console.log('')
      console.log(chalk.yellow('Available Tazz processes:'))
      console.log(chalk.gray(stdout))
    } catch {
      console.log(chalk.gray('No active Tazz processes found'))
    }
  }
}