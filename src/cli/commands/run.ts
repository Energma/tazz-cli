import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { pathExists, readFile } from 'fs-extra'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getLogger } from '../../utils/logger'
import { getTazzDir, getProjectTazzDir } from '../../utils/paths'
import { TazzAnimation } from '../ui/tornado'
import { DependencyManager } from '../../utils/dependencies'

const execAsync = promisify(exec)

export class RunCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('run')
      .description('🚀 Start a development session with git worktree and tmux')
      .argument('<instance-name>', 'Instance name (e.g., feature-auth, JIRA-123)')
      .action(async (sessionName: string) => {
        await this.execute(sessionName)
      })
  }

  async execute(sessionName: string): Promise<void> {
    
    // Show animation
    const animation = new TazzAnimation()
    await animation.show()

    console.log('')
    console.log(chalk.bold.cyan(`🚀 Starting session: ${sessionName}`))
    console.log('')

    try {
      // Check if project is initialized
      await this.checkProjectInitialized()

      // Ensure dependencies are available
      if (!await DependencyManager.ensureDependencies()) {
        throw new Error('Required dependencies are missing')
      }

      // Load tasks from notes if available
      const tasks = await this.loadTasks()
      if (tasks.length > 0) {
        console.log(chalk.bold('📋 Session Tasks:'))
        tasks.forEach((task, i) => {
          console.log(chalk.gray(`   ${i + 1}.`), chalk.cyan(task.name))
          if (task.description) {
            console.log(chalk.gray(`      ${task.description.substring(0, 80)}...`))
          }
        })
        console.log('')
      }

      // Create git worktree
      const worktreePath = await this.createWorktree(sessionName)
      
      // Create separate Tazz processes for each task
      if (tasks.length > 0) {
        await this.createTazzProcessesForTasks(sessionName, worktreePath, tasks)
      } else {
        // Fallback: create single session
        await this.createTmuxSession(sessionName, worktreePath, 'Main development session')
      }

      // Save session info
      await this.saveSessionInfo(sessionName, {
        worktreePath,
        tasks,
        branch: `feature/${sessionName}`,
        createdAt: new Date().toISOString()
      })

      console.log('')
      console.log(chalk.green('✅ Sessions started successfully!'))
      console.log('')
      console.log(chalk.bold('📍 Session Details:'))
      console.log(chalk.gray('   Instance:'), chalk.cyan(sessionName))
      console.log(chalk.gray('   Worktree:'), chalk.cyan(worktreePath))
      
      if (tasks.length > 0) {
        console.log(chalk.gray('   Tazz Processes:'))
        tasks.forEach((task, i) => {
          const taskSessionName = task.sessionName || `task${i + 1}`
          const fullSessionId = `${sessionName}_${taskSessionName}`
          console.log(chalk.gray(`     ${i + 1}.`), chalk.cyan(fullSessionId), chalk.gray(`(${task.name})`))
        })
      } else {
        console.log(chalk.gray('   Tmux Session:'), chalk.cyan(`tazz_${sessionName}`))
      }
      
      console.log('')
      console.log(chalk.bold('🔗 Next Steps:'))
      if (tasks.length > 0) {
        console.log(chalk.gray(`• ${tasks.length} separate Tazz processes created (detached)`))
        const firstTaskSessionName = tasks[0]?.sessionName || 'task1'
        const firstFullSessionId = `${sessionName}_${firstTaskSessionName}`
        console.log(chalk.gray('• Join specific process:'), chalk.cyan(`tazz join ${firstFullSessionId}`))
        console.log(chalk.gray('• List all processes:'), chalk.cyan('tazz list'))
        console.log(chalk.gray('• Delete a process:'), chalk.cyan(`tazz delete ${firstFullSessionId}`))
      } else {
        console.log(chalk.gray('• Session created (detached)'))
        console.log(chalk.gray('• Join session:'), chalk.cyan(`tazz join ${sessionName}`))
        console.log(chalk.gray('• List all sessions:'), chalk.cyan('tazz list'))
      }
      console.log(chalk.gray('• Edit tasks:'), chalk.cyan('tazz note'))
      console.log('')

    } catch (error) {
      this.logger.error('Session creation failed', error as Error, { sessionName })
      console.log('')
      console.log(chalk.red('❌ Failed to start session'))
      console.log(chalk.red(`   ${(error as Error).message}`))
      
      // Provide helpful suggestions
      if ((error as Error).message.includes('dependencies')) {
        console.log('')
        console.log(chalk.yellow('💡 Suggestions:'))
        console.log(chalk.gray('   • Install dependencies:'), chalk.cyan('tazz health --fix'))
        console.log(chalk.gray('   • Check system status:'), chalk.cyan('tazz health'))
      }
      console.log('')
      process.exit(1)
    }
  }

  private async checkProjectInitialized(): Promise<void> {
    const tazzDir = join(process.cwd(), '.tazz')
    if (!await pathExists(tazzDir)) {
      throw new Error('Project not initialized. Run "tazz make" first.')
    }
  }

  private async loadTasks(): Promise<Array<{name: string, description: string, sessionName?: string}>> {

    // Try to load from notes file
    try {
      const notesPath = join(process.cwd(), '.tazz', 'tazz-todo.md')
      if (await pathExists(notesPath)) {
        const content = await readFile(notesPath, 'utf-8')
        const tasks: Array<{name: string, description: string, sessionName?: string}> = []
        
        // Parse tasks with descriptions and session names
        const lines = content.split('\n')
        let i = 0
        while (i < lines.length) {
          const taskMatch = lines[i].match(/^- \[ \] (.+)/)
          if (taskMatch) {
            const taskName = taskMatch[1]
            let description = ''
            let sessionName = ''
            
            // Look for session name and description in next lines
            i++
            while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^- \[ \]/)) {
              const line = lines[i].trim()
              
              // Check for session name
              const sessionMatch = line.match(/Session name:\s*(.+)/)
              if (sessionMatch) {
                sessionName = sessionMatch[1].trim()
              }
              
              // Check for description
              if (line === 'Description:') {
                i++
                // Collect description lines until we hit empty line, next task, or session name
                while (i < lines.length && lines[i].trim() !== '' && 
                       !lines[i].match(/^- \[ \]/) && 
                       !lines[i].includes('Session name:')) {
                  description += lines[i].trim() + ' '
                  i++
                }
                i-- // Back up one since we'll increment at end of loop
              }
              i++
            }
            i-- // Back up one since we'll increment at end of outer loop
            
            tasks.push({
              name: taskName,
              description: description.trim() || `Work on: ${taskName}`,
              sessionName: sessionName || taskName.toLowerCase().replace(/[^a-z0-9]/g, '-')
            })
          }
          i++
        }
        
        return tasks.slice(0, 5) // Limit to first 5 tasks
      }
    } catch (error) {
      this.logger.debug('Could not load tasks from notes', error as Error)
    }

    return []
  }

  private async createWorktree(sessionName: string): Promise<string> {
    const spinner = ora('Creating git worktree').start()
    
    try {
      const branchName = `feature/${sessionName}`
      const worktreePath = join('..', sessionName)

      // Create worktree
      await execAsync(`git worktree add ${worktreePath} -b ${branchName}`)
      
      spinner.succeed('Git worktree created')
      return join(process.cwd(), worktreePath)
      
    } catch (error) {
      spinner.fail('Failed to create worktree')
      throw new Error(`Git worktree creation failed: ${(error as Error).message}`)
    }
  }

  private async createTazzProcessesForTasks(sessionName: string, worktreePath: string, tasks: Array<{name: string, description: string, sessionName?: string}>): Promise<void> {
    const spinner = ora(`Creating ${tasks.length} separate Tazz processes`).start()
    
    try {
      // Create individual Tazz process for each task
      const processPromises = tasks.map(async (task, index) => {
        const taskSessionName = task.sessionName || `task${index + 1}`
        const fullSessionId = `${sessionName}_${taskSessionName}`
        
        // Create tmux session for this specific task
        const tmuxSessionId = `tazz_${fullSessionId}`
        await execAsync(`tmux new-session -d -s ${tmuxSessionId} -c "${worktreePath}"`)
        
        // Setup the session with task context
        await this.setupTaskSession(tmuxSessionId, task, fullSessionId)
        
        return {
          taskName: taskSessionName,
          sessionId: fullSessionId,
          tmuxSession: tmuxSessionId,
          task: task
        }
      })
      
      const createdProcesses = await Promise.all(processPromises)
      
      spinner.succeed(`Created ${tasks.length} Tazz processes`)
      return createdProcesses
      
    } catch (error) {
      spinner.fail('Failed to create Tazz processes')
      throw new Error(`Tazz processes creation failed: ${(error as Error).message}`)
    }
  }

  private async setupTaskSession(tmuxSessionId: string, task: {name: string, description: string}, sessionId: string): Promise<void> {
    // Setup session with task context
    await execAsync(`tmux send-keys -t ${tmuxSessionId} 'clear' Enter`)
    await execAsync(`tmux send-keys -t ${tmuxSessionId} 'echo "🚀 Tazz Process: ${sessionId}"' Enter`)
    await execAsync(`tmux send-keys -t ${tmuxSessionId} 'echo "📂 Working directory: $(pwd)"' Enter`)
    await execAsync(`tmux send-keys -t ${tmuxSessionId} 'echo "📝 Task: ${task.name}"' Enter`)
    
    if (task.description) {
      await execAsync(`tmux send-keys -t ${tmuxSessionId} 'echo "💡 Context: ${task.description}"' Enter`)
    }
    
    await execAsync(`tmux send-keys -t ${tmuxSessionId} 'echo ""' Enter`)
    await execAsync(`tmux send-keys -t ${tmuxSessionId} 'echo "This is an independent Tazz process."' Enter`)
    await execAsync(`tmux send-keys -t ${tmuxSessionId} 'echo "Use: tazz join ${sessionId} to attach"' Enter`)
    await execAsync(`tmux send-keys -t ${tmuxSessionId} 'echo "Use: tazz list to see all processes"' Enter`)
    await execAsync(`tmux send-keys -t ${tmuxSessionId} 'echo ""' Enter`)
  }

  private async createTmuxSession(sessionName: string, worktreePath: string, description?: string): Promise<void> {
    const spinner = ora('Creating tmux session').start()
    
    try {
      // tmux should be available now (checked by DependencyManager)
      const sessionId = `tazz_${sessionName}`
      
      // Create detached tmux session
      await execAsync(`tmux new-session -d -s ${sessionId} -c "${worktreePath}"`)
      
      // Setup panes
      await execAsync(`tmux send-keys -t ${sessionId} 'clear' Enter`)
      await execAsync(`tmux send-keys -t ${sessionId} 'echo "🚀 Tazz Session: ${sessionName}"' Enter`)
      await execAsync(`tmux send-keys -t ${sessionId} 'echo "📂 Working directory: $(pwd)"' Enter`)
      
      if (description) {
        await execAsync(`tmux send-keys -t ${sessionId} 'echo "💡 Context: ${description}"' Enter`)
      }
      
      await execAsync(`tmux send-keys -t ${sessionId} 'echo "📝 Edit tasks: tazz note"' Enter`)
      await execAsync(`tmux send-keys -t ${sessionId} 'echo ""' Enter`)
      
      spinner.succeed('Tmux session created')
      
    } catch (error) {
      spinner.fail('Failed to create tmux session')
      throw new Error(`Tmux session creation failed: ${(error as Error).message}`)
    }
  }

  private async attachTmuxSession(sessionName: string): Promise<void> {
    try {
      const sessionId = `tazz_${sessionName}`
      
      // Check if we're already in a tmux session
      if (process.env.TMUX) {
        console.log(chalk.yellow('⚠️  Already inside a tmux session'))
        console.log(chalk.gray('   Switch to session:'), chalk.cyan(`tmux switch-client -t ${sessionId}`))
        return
      }
      
      // Import spawn to replace current process
      const { spawn } = require('child_process')
      
      // Spawn tmux attach and replace current process
      const tmux = spawn('tmux', ['attach-session', '-t', sessionId], {
        stdio: 'inherit',
        detached: false
      })
      
      // Exit current process when tmux session ends
      tmux.on('exit', (code) => {
        process.exit(code || 0)
      })
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not attach to tmux session'))
      console.log(chalk.gray('   Attach manually:'), chalk.cyan(`tmux attach-session -t tazz_${sessionName}`))
    }
  }

  private async saveSessionInfo(sessionName: string, info: any): Promise<void> {
    try {
      const projectTazzDir = getProjectTazzDir(process.cwd())
      const sessionsPath = join(projectTazzDir, 'sessions.json')
      
      let sessions: any = { sessions: [] }
      try {
        const content = await readFile(sessionsPath, 'utf-8')
        sessions = JSON.parse(content)
      } catch {
        // File doesn't exist, start fresh
      }

      // Add or update session
      const existingIndex = sessions.sessions.findIndex((s: any) => s.id === sessionName)
      const sessionData = {
        id: sessionName,
        ...info,
        status: 'active',
        lastActive: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        sessions.sessions[existingIndex] = sessionData
      } else {
        sessions.sessions.push(sessionData)
      }

      sessions.lastUpdated = new Date().toISOString()

      // We would normally write this, but keeping it simple for now
      this.logger.info('Session info saved', { sessionName, info })
      
    } catch (error) {
      this.logger.warn('Could not save session info', error as Error)
    }
  }
}