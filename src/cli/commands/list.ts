import { Command } from 'commander'
import chalk from 'chalk'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getLogger } from '../../utils/logger'

const execAsync = promisify(exec)

export class ListCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('list')
      .alias('ls')
      .description('📋 List all active Tazz processes')
      .option('-v, --verbose', 'Show detailed session information')
      .action(async (options) => {
        await this.execute(options)
      })
  }

  async execute(options: {
    verbose?: boolean
  } = {}): Promise<void> {
    console.log('')
    console.log(chalk.bold.cyan('📋 Active Tazz Processes'))
    console.log('')

    try {
      // Get tmux sessions
      const sessions = await this.getTmuxSessions()
      
      if (sessions.length === 0) {
        console.log(chalk.yellow('📭 No active processes found'))
        console.log('')
        console.log(chalk.gray('Start new processes with:'), chalk.cyan('tazz run <instance-name>'))
        console.log('')
        return
      }

      // Group sessions by instance
      const grouped = this.groupSessionsByInstance(sessions)
      
      Object.entries(grouped).forEach(([project, projectSessions]) => {
        console.log(chalk.bold.green(`🚀 Instance: ${project}`))
        console.log('')
        
        if (projectSessions.tasks.length > 0) {
          console.log(chalk.bold('  📋 Task Processes:'))
          projectSessions.tasks.forEach((session, i) => {
            console.log(`    ${i + 1}. ${chalk.cyan(session.fullProcessId || session.taskName)} ${chalk.gray(`(${session.taskName})`)}`)
            if (options.verbose && session.created) {
              console.log(`       ${chalk.gray('Created:')} ${session.created}`)
            }
            console.log(`       ${chalk.gray('Join with:')} ${chalk.cyan(`tazz join ${session.fullProcessId || session.taskName}`)}`)
          })
          console.log('')
        }
        
        if (projectSessions.main.length > 0) {
          console.log(chalk.bold('  🔧 Main Sessions:'))
          projectSessions.main.forEach((session, i) => {
            console.log(`    ${i + 1}. ${chalk.cyan(session.fullProcessId || session.project)}`)
            if (options.verbose && session.created) {
              console.log(`       ${chalk.gray('Created:')} ${session.created}`)
            }
            console.log(`       ${chalk.gray('Join with:')} ${chalk.cyan(`tazz join ${session.fullProcessId || session.project}`)}`)
          })
          console.log('')
        }
      })

      // Show quick actions
      this.showQuickActions(sessions)

    } catch (error) {
      this.logger.error('Failed to list sessions', error as Error)
      console.log(chalk.red('❌ Failed to list sessions'))
      console.log(chalk.red(`   ${(error as Error).message}`))
      process.exit(1)
    }
  }

  private async getTmuxSessions(): Promise<Array<{sessionId: string, created: string, project?: string, taskName?: string}>> {
    try {
      // Get all tmux sessions that start with 'tazz_'
      const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}:#{session_created}" 2>/dev/null || true')
      
      if (!stdout.trim()) {
        return []
      }
      
      const sessions = stdout.trim().split('\n')
        .filter(line => line.includes('tazz_'))
        .map(line => {
          const [sessionId, created] = line.split(':')
          const createdDate = new Date(parseInt(created) * 1000).toLocaleString()
          
          // Parse session ID to extract instance and task info
          // New format: tazz_instance_taskname
          const match = sessionId.match(/^tazz_(.+)$/)
          if (match) {
            const fullId = match[1]
            // Try to split by last underscore to separate instance from task
            const lastUnderscoreIndex = fullId.lastIndexOf('_')
            if (lastUnderscoreIndex > 0) {
              const instance = fullId.substring(0, lastUnderscoreIndex)
              const taskName = fullId.substring(lastUnderscoreIndex + 1)
              return {
                sessionId,
                created: createdDate,
                project: instance,
                taskName: taskName,
                fullProcessId: fullId
              }
            } else {
              // Single session without task
              return {
                sessionId,
                created: createdDate,
                project: fullId,
                fullProcessId: fullId
              }
            }
          }
          
          return {
            sessionId,
            created: createdDate
          }
        })
      
      return sessions
    } catch (error) {
      // If tmux command fails, return empty array
      return []
    }
  }

  private groupSessionsByInstance(sessions: Array<{sessionId: string, created: string, project?: string, taskName?: string}>): Record<string, {tasks: any[], main: any[]}> {
    const grouped: Record<string, {tasks: any[], main: any[]}> = {}
    
    sessions.forEach(session => {
      const project = session.project || 'unknown'
      
      if (!grouped[project]) {
        grouped[project] = { tasks: [], main: [] }
      }
      
      if (session.taskName) {
        grouped[project].tasks.push(session)
      } else {
        grouped[project].main.push(session)
      }
    })
    
    return grouped
  }

  private showQuickActions(sessions: any[]): void {
    console.log(chalk.bold('🚀 Quick Actions:'))
    console.log('')
    
    if (sessions.length > 0) {
      // Find first task process to show as example
      const taskSession = sessions.find(s => s.taskName)
      if (taskSession) {
        console.log(chalk.gray('  Join task process:'), chalk.cyan(`tazz join ${taskSession.fullProcessId}`))
      }
      
      // Find first main session
      const mainSession = sessions.find(s => !s.taskName)
      if (mainSession && mainSession.project) {
        console.log(chalk.gray('  Join main session:'), chalk.cyan(`tazz join ${mainSession.fullProcessId || mainSession.project}`))
      }
      
      console.log(chalk.gray('  Delete a process:'), chalk.cyan(`tazz delete <process-id>`))
    }
    
    console.log(chalk.gray('  Create new processes:'), chalk.cyan('tazz run <instance-name>'))
    console.log('')
  }
}