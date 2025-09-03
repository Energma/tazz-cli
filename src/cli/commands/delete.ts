import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getLogger } from '../../utils/logger'

const execAsync = promisify(exec)

export class DeleteCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('delete')
      .alias('rm')
      .alias('destroy')
      .description('🗑️  Delete a Tazz process')
      .argument('<process-id>', 'Process ID to delete (e.g., instance_task-1)')
      .option('-f, --force', 'Skip confirmation prompt')
      .action(async (processId: string, options) => {
        await this.execute(processId, options)
      })
  }

  async execute(processId: string, options: { force?: boolean } = {}): Promise<void> {
    console.log('')
    
    try {
      // Build tmux session name
      const tmuxSessionName = `tazz_${processId}`
      
      // Check if session exists
      try {
        await execAsync(`tmux has-session -t ${tmuxSessionName}`)
      } catch (error) {
        console.log(chalk.red(`❌ Tazz process not found: ${processId}`))
        
        // List available sessions
        await this.listAvailableProcesses()
        process.exit(1)
      }

      // Confirmation prompt
      if (!options.force) {
        const { confirmed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to delete Tazz process ${processId}? This will kill the tmux session.`,
          default: false
        }])

        if (!confirmed) {
          console.log(chalk.yellow('❌ Deletion cancelled'))
          return
        }
      }

      console.log(chalk.yellow(`🗑️  Deleting Tazz process: ${processId}`))

      // Kill tmux session
      await execAsync(`tmux kill-session -t ${tmuxSessionName}`)
      
      console.log(chalk.green(`✅ Tazz process ${processId} deleted`))

    } catch (error) {
      console.log(chalk.red(`❌ Failed to delete process: ${(error as Error).message}`))
      this.logger.error('Delete failed', error as Error)
      process.exit(1)
    }
  }

  private async listAvailableProcesses(): Promise<void> {
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