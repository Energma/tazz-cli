import { Command } from 'commander'
import chalk from 'chalk'
import { readFile, writeFile, pathExists } from 'fs-extra'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import inquirer from 'inquirer'
import { getLogger } from '../../utils/logger'
import { SessionStore } from '../../core/storage/SessionStore'
import { TmuxSessionOrchestrator } from '../../core/services/TmuxSessionOrchestrator'
import { GitWorktreeManager } from '../../core/services/GitWorktreeManager'
import { TodoFileParser } from '../../core/services/TodoFileParser'
import { TazzError, ValidationError } from '../../core/types'

const execAsync = promisify(exec)

interface CompletionSummary {
  completedTasks: number
  cleanedSessions: number
  removedWorktrees: number
  updatedTodoFile: boolean
  errors: string[]
}

export class DoneCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('done')
      .description('🎯 Mark session/task as complete and clean up resources')
      .argument('[session-id]', 'Session ID to complete (optional - will prompt if not provided)')
      .option('-a, --all', 'Mark all active sessions as complete')
      .option('--keep-worktree', 'Keep git worktree after completion')
      .option('--keep-sessions', 'Keep tmux sessions running')
      .option('--no-todo-update', 'Skip updating todo file')
      .option('-f, --force', 'Force completion without prompts')
      .option('--debug', 'Show detailed debugging information')
      .action(async (sessionId?: string, options = {}) => {
        await this.execute(sessionId, options)
      })
  }

  async execute(sessionId?: string, options: {
    all?: boolean
    keepWorktree?: boolean
    keepSessions?: boolean
    todoUpdate?: boolean
    force?: boolean
    debug?: boolean
  } = {}): Promise<void> {
    console.log('')
    console.log(chalk.bold.cyan('🎯 Tazz Session Completion'))
    console.log('')

    try {
      const sessionStore = new SessionStore()
      const orchestrator = new TmuxSessionOrchestrator(this.logger)
      const worktreeManager = new GitWorktreeManager(this.logger)

      // Get active sessions (works without project initialization)
      const activeSessions = await this.getActiveSessions()
      
      // Check if project is initialized (but allow cleanup of orphaned sessions)
      const isProjectInitialized = await this.isProjectInitialized()
      if (!isProjectInitialized && activeSessions.length > 0) {
        console.log(chalk.yellow('⚠️  Project not initialized, but found orphaned Tazz sessions.'))
        console.log(chalk.gray('   Will clean up orphaned sessions only.'))
        console.log('')
      } else if (!isProjectInitialized) {
        throw new ValidationError('Project not initialized. Run "tazz make" first.')
      }
      
      if (options.debug) {
        console.log(chalk.yellow('🔍 Debug: Active sessions found:'))
        activeSessions.forEach(session => {
          console.log(`   • ${session.fullId || session.sessionName} (sessionName: ${session.sessionName}, taskName: ${session.taskName})`)
        })
        console.log('')
      }
      
      if (activeSessions.length === 0) {
        console.log(chalk.yellow('📭 No active Tazz sessions found'))
        console.log(chalk.gray('Start a new session with:'), chalk.cyan('tazz run'))
        console.log('')
        return
      }

      let sessionsToComplete: string[] = []

      // Determine which sessions to complete
      if (options.all) {
        if (!options.force) {
          const { confirmAll } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirmAll',
            message: `Complete all ${activeSessions.length} active sessions?`,
            default: false
          }])
          
          if (!confirmAll) {
            console.log(chalk.gray('Operation cancelled'))
            return
          }
        }
        
        // Get unique main session names to avoid duplicates
        const uniqueSessionNames = [...new Set(activeSessions.map(s => s.sessionName))]
        sessionsToComplete = uniqueSessionNames
        
      } else if (sessionId) {
        // Validate provided session ID
        const session = activeSessions.find(s => 
          s.sessionName === sessionId || s.fullId === sessionId
        )
        
        if (!session) {
          console.log(chalk.red(`❌ Session not found: ${sessionId}`))
          await this.displayAvailableSessions(activeSessions)
          return
        }
        
        sessionsToComplete = [session.sessionName]
        
      } else {
        // Interactive selection
        const { selectedSessions } = await inquirer.prompt([{
          type: 'checkbox',
          name: 'selectedSessions',
          message: 'Select sessions to complete:',
          choices: activeSessions.map(session => ({
            name: `${session.sessionName} ${chalk.gray(`(${session.taskName || 'main'})`)}`,
            value: session.sessionName,
            checked: false
          }))
        }])
        
        if (selectedSessions.length === 0) {
          console.log(chalk.gray('No sessions selected'))
          return
        }
        
        sessionsToComplete = selectedSessions
      }

      // Show completion plan
      console.log(chalk.bold('📋 Completion Plan:'))
      sessionsToComplete.forEach((session, i) => {
        console.log(chalk.gray(`   ${i + 1}.`), chalk.cyan(session))
      })
      console.log('')

      if (!options.keepSessions) {
        console.log(chalk.gray('• Will clean up tmux sessions'))
      }
      
      if (!options.keepWorktree) {
        console.log(chalk.gray('• Will remove git worktrees'))
      }
      
      if (options.todoUpdate !== false) {
        console.log(chalk.gray('• Will update todo file to mark tasks complete'))
      }
      console.log('')

      // Confirm before proceeding
      if (!options.force) {
        const { confirmCompletion } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirmCompletion',
          message: 'Proceed with completion?',
          default: true
        }])
        
        if (!confirmCompletion) {
          console.log(chalk.gray('Operation cancelled'))
          return
        }
      }

      // Execute completion
      const summary = await this.completeSessions(
        sessionsToComplete,
        activeSessions,
        orchestrator,
        worktreeManager,
        options
      )

      // Display results
      this.displayCompletionSummary(summary)

      // Verify cleanup (show remaining sessions)
      if (options.debug) {
        console.log(chalk.yellow('🔍 Debug: Verifying cleanup...'))
        const remainingSessions = await this.getActiveSessions()
        if (remainingSessions.length > 0) {
          console.log(chalk.yellow(`   Still found ${remainingSessions.length} active sessions:`))
          remainingSessions.forEach(session => {
            console.log(chalk.gray(`     • ${session.fullId || session.sessionName}`))
          })
        } else {
          console.log(chalk.green('   ✅ All sessions cleaned up successfully'))
        }
        console.log('')
      }

    } catch (error) {
      this.logger.error('Session completion failed', error as Error)
      
      if (error instanceof ValidationError) {
        console.log(chalk.red(`❌ ${error.message}`))
      } else if (error instanceof TazzError) {
        console.log(chalk.red(`❌ ${error.constructor.name}: ${error.message}`))
      } else {
        console.log(chalk.red(`❌ Unexpected error: ${(error as Error).message}`))
      }
      
      process.exit(1)
    }
  }

  private async completeSessions(
    sessionsToComplete: string[],
    activeSessions: any[],
    orchestrator: TmuxSessionOrchestrator,
    worktreeManager: GitWorktreeManager,
    options: any
  ): Promise<CompletionSummary> {
    const summary: CompletionSummary = {
      completedTasks: 0,
      cleanedSessions: 0,
      removedWorktrees: 0,
      updatedTodoFile: false,
      errors: []
    }

    const worktreesToRemove = new Set<string>()

    // Process each session
    for (const sessionName of sessionsToComplete) {
      try {
        console.log(chalk.cyan(`🔄 Completing session: ${sessionName}`))

        // Find all related sessions (main + task sessions)
        const relatedSessions = activeSessions.filter(s => 
          s.sessionName === sessionName || 
          s.fullId === sessionName ||
          (s.fullId && s.fullId.startsWith(sessionName + '_')) ||
          (s.sessionName && sessionName.startsWith(s.sessionName))
        )

        console.log(chalk.gray(`   Found ${relatedSessions.length} related sessions`))
        
        if (options.debug) {
          relatedSessions.forEach(session => {
            console.log(chalk.yellow(`     → ${session.fullId || session.sessionName}`))
          })
        }

        // Stop tmux sessions
        if (!options.keepSessions) {
          for (const session of relatedSessions) {
            try {
              const sessionId = session.fullId || session.sessionName
              console.log(chalk.gray(`   Stopping tmux session: tazz_${sessionId}`))
              
              await orchestrator.stopSession(sessionId)
              summary.cleanedSessions++
            } catch (error) {
              const errorMsg = `Failed to stop tmux session ${session.fullId || session.sessionName}: ${(error as Error).message}`
              console.log(chalk.yellow(`   ⚠️  ${errorMsg}`))
              summary.errors.push(errorMsg)
            }
          }
        }

        // Collect worktrees to remove
        if (!options.keepWorktree) {
          relatedSessions.forEach(session => {
            if (session.worktree) {
              worktreesToRemove.add(session.worktree)
            }
          })
        }

        summary.completedTasks++

      } catch (error) {
        summary.errors.push(`Failed to complete session ${sessionName}: ${(error as Error).message}`)
      }
    }

    // Remove unique worktrees
    if (!options.keepWorktree) {
      for (const worktreePath of worktreesToRemove) {
        try {
          const sessionId = worktreePath.split('/').pop() || 'unknown'
          await worktreeManager.removeWorktree(sessionId)
          summary.removedWorktrees++
        } catch (error) {
          summary.errors.push(`Failed to remove worktree ${worktreePath}: ${(error as Error).message}`)
        }
      }
    }

    // Update todo file (only if project is initialized)
    if (options.todoUpdate !== false && await this.isProjectInitialized()) {
      try {
        await this.updateTodoFileCompletion(sessionsToComplete)
        summary.updatedTodoFile = true
      } catch (error) {
        summary.errors.push(`Failed to update todo file: ${(error as Error).message}`)
      }
    }

    return summary
  }

  private async updateTodoFileCompletion(completedSessions: string[]): Promise<void> {
    const todoPath = join(process.cwd(), '.tazz', 'tazz-todo.md')
    
    if (!await pathExists(todoPath)) {
      return // No todo file to update
    }

    const content = await readFile(todoPath, 'utf-8')
    let updatedContent = content

    // Update completed sessions in both formats
    for (const sessionName of completedSessions) {
      // New format: TaskName: -> mark following SessionName line
      const taskNameRegex = new RegExp(`^(\\s*TaskName:\\s*.+)$`, 'gm')
      updatedContent = updatedContent.replace(taskNameRegex, (match, taskLine) => {
        // Look for SessionName after TaskName
        const lines = updatedContent.split('\n')
        const taskIndex = lines.findIndex(line => line.includes(taskLine))
        
        if (taskIndex >= 0) {
          for (let i = taskIndex + 1; i < lines.length && i < taskIndex + 5; i++) {
            if (lines[i].match(new RegExp(`^SessionName:\\s*${sessionName}\\s*$`, 'i'))) {
              // Mark as completed by adding a completion marker
              return `${taskLine} ✅ COMPLETED`
            }
          }
        }
        return match
      })

      // Legacy format: checkbox tasks
      const checkboxRegex = new RegExp(
        `^(\\s*-\\s*\\[)\\s*(\\]\\s*.+Session name:\\s*${sessionName})`,
        'gm'
      )
      updatedContent = updatedContent.replace(checkboxRegex, '$1x$2')
    }

    // Add completion timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const completionNote = `\n<!-- Completed by Tazz CLI on ${timestamp} -->\n`
    
    if (!updatedContent.includes(completionNote)) {
      updatedContent += completionNote
    }

    await writeFile(todoPath, updatedContent)
  }

  private async getActiveSessions(): Promise<Array<{
    sessionName: string
    taskName?: string
    fullId?: string
    worktree?: string
  }>> {
    try {
      const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}" 2>/dev/null || true')
      
      if (!stdout.trim()) {
        return []
      }
      
      return stdout.trim().split('\n')
        .filter(name => name.includes('tazz_'))
        .map(sessionName => {
          const match = sessionName.match(/^tazz_(.+)$/)
          if (match) {
            const fullId = match[1]
            const lastUnderscoreIndex = fullId.lastIndexOf('_')
            
            if (lastUnderscoreIndex > 0) {
              const instance = fullId.substring(0, lastUnderscoreIndex)
              const taskName = fullId.substring(lastUnderscoreIndex + 1)
              return {
                sessionName: instance,
                taskName,
                fullId,
                worktree: `gitworktree-projects/${fullId}`
              }
            } else {
              return {
                sessionName: fullId,
                fullId,
                worktree: `gitworktree-projects/${fullId}`
              }
            }
          }
          
          return { sessionName, fullId: sessionName }
        })
    } catch (error) {
      return []
    }
  }

  private async displayAvailableSessions(sessions: any[]): Promise<void> {
    if (sessions.length === 0) return

    console.log('')
    console.log(chalk.yellow('Available sessions:'))
    sessions.forEach(session => {
      console.log(chalk.gray('  •'), chalk.cyan(session.fullId || session.sessionName), 
        session.taskName ? chalk.gray(`(${session.taskName})`) : '')
    })
    console.log('')
  }

  private displayCompletionSummary(summary: CompletionSummary): void {
    console.log('')
    console.log(chalk.bold.green('✅ Completion Summary'))
    console.log('')

    if (summary.completedTasks > 0) {
      console.log(chalk.green(`   ${summary.completedTasks} sessions completed`))
    }
    
    if (summary.cleanedSessions > 0) {
      console.log(chalk.green(`   ${summary.cleanedSessions} tmux sessions cleaned`))
    }
    
    if (summary.removedWorktrees > 0) {
      console.log(chalk.green(`   ${summary.removedWorktrees} worktrees removed`))
    }
    
    if (summary.updatedTodoFile) {
      console.log(chalk.green('   Todo file updated with completion status'))
    }

    if (summary.errors.length > 0) {
      console.log('')
      console.log(chalk.yellow('⚠️  Issues encountered:'))
      summary.errors.forEach(error => {
        console.log(chalk.gray('   •'), chalk.yellow(error))
      })
    }

    console.log('')
    console.log(chalk.bold('🚀 Next steps:'))
    console.log(chalk.gray('   • Run'), chalk.cyan('tazz list'), chalk.gray('to see remaining sessions'))
    console.log(chalk.gray('   • Run'), chalk.cyan('tazz note'), chalk.gray('to add new tasks'))
    console.log(chalk.gray('   • Run'), chalk.cyan('tazz run'), chalk.gray('to start new development sessions'))
    console.log('')
  }

  private async isProjectInitialized(): Promise<boolean> {
    const tazzDir = join(process.cwd(), '.tazz')
    return await pathExists(tazzDir)
  }

  private async checkProjectInitialized(): Promise<void> {
    if (!await this.isProjectInitialized()) {
      throw new ValidationError('Project not initialized. Run "tazz make" first.')
    }
  }
}