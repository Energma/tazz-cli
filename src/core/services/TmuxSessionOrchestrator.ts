import { execa } from 'execa'
import { join } from 'path'
import { Logger } from '../../utils/logger'
import { GitWorktreeManager, WorktreeInfo } from './GitWorktreeManager'
import { ParsedTask, TodoFileMetadata } from './TodoFileParser'
import { SessionError, TazzError } from '../types'

export interface SessionInfo {
  id: string
  tmuxSessionName: string
  task: ParsedTask
  worktreePath: string
  status: SessionStatus
  pid?: number
  createdAt: Date
  lastActivity: Date
}

export interface OrchestrationResult {
  mainSessionId: string
  worktreeInfo: WorktreeInfo
  sessions: SessionInfo[]
  metadata: TodoFileMetadata
  summary: OrchestrationSummary
}

export interface OrchestrationSummary {
  totalSessions: number
  successfulSessions: number
  failedSessions: number
  skippedSessions: number
  errors: string[]
}

export enum SessionStatus {
  CREATED = 'created',
  RUNNING = 'running',
  FAILED = 'failed',
  STOPPED = 'stopped'
}

export class TmuxSessionOrchestrator {
  private logger: Logger
  private worktreeManager: GitWorktreeManager

  constructor(logger: Logger) {
    this.logger = logger
    this.worktreeManager = new GitWorktreeManager(logger)
  }

  /**
   * Orchestrate multiple tmux sessions for tasks
   */
  async orchestrateSessions(
    tasks: ParsedTask[], 
    metadata: TodoFileMetadata,
    sessionId?: string
  ): Promise<OrchestrationResult> {
    
    // Generate main session ID if not provided
    const mainSessionId = sessionId || this.generateMainSessionId(metadata)
    
    this.logger.info('Starting session orchestration', {
      mainSessionId,
      taskCount: tasks.length,
      metadata
    })

    // Ensure worktree setup
    await this.worktreeManager.ensureWorktreeSetup()

    // Create main git worktree
    const worktreeInfo = await this.worktreeManager.createWorktree(mainSessionId)

    const sessions: SessionInfo[] = []
    const summary: OrchestrationSummary = {
      totalSessions: tasks.length,
      successfulSessions: 0,
      failedSessions: 0,
      skippedSessions: 0,
      errors: []
    }

    // Create sessions for each task
    for (const task of tasks) {
      try {
        const sessionInfo = await this.createTaskSession(task, mainSessionId, worktreeInfo)
        sessions.push(sessionInfo)
        summary.successfulSessions++
        
        this.logger.debug('Task session created successfully', {
          taskId: task.id,
          sessionName: sessionInfo.tmuxSessionName
        })

      } catch (error) {
        summary.failedSessions++
        summary.errors.push(`Task "${task.name}": ${error.message}`)
        
        this.logger.error('Failed to create task session', error, {
          taskId: task.id,
          taskName: task.name
        })

        // Create a failed session entry for tracking
        sessions.push({
          id: `${mainSessionId}_${task.sessionName}`,
          tmuxSessionName: '',
          task,
          worktreePath: worktreeInfo.worktreePath,
          status: SessionStatus.FAILED,
          createdAt: new Date(),
          lastActivity: new Date()
        })
      }
    }

    const result: OrchestrationResult = {
      mainSessionId,
      worktreeInfo,
      sessions,
      metadata,
      summary
    }

    this.logger.info('Session orchestration completed', {
      mainSessionId,
      totalSessions: summary.totalSessions,
      successful: summary.successfulSessions,
      failed: summary.failedSessions
    })

    return result
  }

  /**
   * Create a tmux session for a specific task
   */
  private async createTaskSession(
    task: ParsedTask,
    mainSessionId: string,
    worktreeInfo: WorktreeInfo
  ): Promise<SessionInfo> {

    const sessionId = `${mainSessionId}_${task.sessionName}`
    const tmuxSessionName = `tazz_${sessionId}`

    try {
      // Create tmux session
      await execa('tmux', [
        'new-session',
        '-d',
        '-s', tmuxSessionName,
        '-c', worktreeInfo.worktreePath
      ])

      // Setup session environment
      await this.setupSessionEnvironment(tmuxSessionName, task, sessionId, worktreeInfo)

      const sessionInfo: SessionInfo = {
        id: sessionId,
        tmuxSessionName,
        task,
        worktreePath: worktreeInfo.worktreePath,
        status: SessionStatus.CREATED,
        createdAt: new Date(),
        lastActivity: new Date()
      }

      return sessionInfo

    } catch (error) {
      throw new SessionError(
        `Failed to create tmux session for task "${task.name}": ${error.message}`,
        { taskId: task.id, sessionId, tmuxSessionName },
        error
      )
    }
  }

  /**
   * Setup the environment within a tmux session
   */
  private async setupSessionEnvironment(
    tmuxSessionName: string,
    task: ParsedTask,
    sessionId: string,
    worktreeInfo: WorktreeInfo
  ): Promise<void> {

    try {
      // Clear and setup initial display
      await execa('tmux', ['send-keys', '-t', tmuxSessionName, 'clear', 'Enter'])
      
      // Display session header
      await this.sendTmuxCommand(tmuxSessionName, `echo "🚀 Tazz Session: ${sessionId}"`)
      await this.sendTmuxCommand(tmuxSessionName, `echo "📂 Worktree: ${worktreeInfo.worktreePath}"`)
      await this.sendTmuxCommand(tmuxSessionName, `echo "🌿 Branch: ${worktreeInfo.branchName}"`)
      await this.sendTmuxCommand(tmuxSessionName, `echo "📝 Task: ${task.name}"`)
      await this.sendTmuxCommand(tmuxSessionName, `echo "⚡ Priority: ${task.priority}"`)
      
      if (task.description !== task.name) {
        await this.sendTmuxCommand(tmuxSessionName, `echo "💡 Description: ${task.description}"`)
      }
      
      await this.sendTmuxCommand(tmuxSessionName, 'echo ""')

      // Display task context if available
      if (task.context.technicalDetails) {
        await this.sendTmuxCommand(tmuxSessionName, `echo "🔧 Technical: ${task.context.technicalDetails}"`)
      }

      if (task.context.dependencies?.length) {
        await this.sendTmuxCommand(tmuxSessionName, `echo "🔗 Dependencies: ${task.context.dependencies.join(', ')}"`)
      }

      if (task.context.acceptanceCriteria?.length) {
        await this.sendTmuxCommand(tmuxSessionName, 'echo "✅ Acceptance Criteria:"')
        for (const criteria of task.context.acceptanceCriteria) {
          await this.sendTmuxCommand(tmuxSessionName, `echo "   • ${criteria}"`)
        }
      }

      await this.sendTmuxCommand(tmuxSessionName, 'echo ""')

      // Display session management commands
      await this.sendTmuxCommand(tmuxSessionName, 'echo "🎮 Session Commands:"')
      await this.sendTmuxCommand(tmuxSessionName, `echo "   • Join: tazz join ${sessionId}"`)
      await this.sendTmuxCommand(tmuxSessionName, `echo "   • Stop: tazz stop ${sessionId}"`)
      await this.sendTmuxCommand(tmuxSessionName, 'echo "   • List: tazz list"')
      await this.sendTmuxCommand(tmuxSessionName, 'echo ""')

      // Indicate Claude Code will be launched
      await this.sendTmuxCommand(tmuxSessionName, 'echo "⏳ Waiting for Claude Code initialization..."')
      await this.sendTmuxCommand(tmuxSessionName, 'echo ""')
      
      // Create a marker file to indicate session is ready for Claude Code
      const markerFile = join(worktreeInfo.worktreePath, '.tazz', `session-ready-${task.sessionName}`)
      try {
        const { ensureFile } = await import('fs-extra')
        await ensureFile(markerFile)
      } catch (error) {
        this.logger.debug('Failed to create marker file', { error: error.message, markerFile })
      }

    } catch (error) {
      throw new SessionError(
        `Failed to setup session environment: ${error.message}`,
        { tmuxSessionName, taskId: task.id },
        error
      )
    }
  }

  /**
   * Split tmux session into multiple panes for better organization
   */
  async createSessionPanes(tmuxSessionName: string): Promise<void> {
    try {
      // Create horizontal split (development | build/test)
      await execa('tmux', ['split-window', '-h', '-t', tmuxSessionName])
      
      // Split the right pane vertically (build | test)
      await execa('tmux', ['split-window', '-v', '-t', `${tmuxSessionName}:0.1`])

      // Set pane titles
      await execa('tmux', ['send-keys', '-t', `${tmuxSessionName}:0.0`, 'echo "Development Pane"', 'Enter'])
      await execa('tmux', ['send-keys', '-t', `${tmuxSessionName}:0.1`, 'echo "Build/Watch Pane"', 'Enter'])
      await execa('tmux', ['send-keys', '-t', `${tmuxSessionName}:0.2`, 'echo "Testing Pane"', 'Enter'])

      // Focus on the main development pane
      await execa('tmux', ['select-pane', '-t', `${tmuxSessionName}:0.0`])

    } catch (error) {
      this.logger.warn('Failed to create session panes', { error: error.message, tmuxSessionName })
      // Non-critical error, continue without panes
    }
  }

  /**
   * Get information about active sessions
   */
  async getActiveSessions(): Promise<SessionInfo[]> {
    try {
      const result = await execa('tmux', ['list-sessions', '-F', '#{session_name}'])
      const sessions = result.stdout
        .split('\n')
        .filter(name => name.startsWith('tazz_'))
        .map(name => ({
          id: name.replace('tazz_', ''),
          tmuxSessionName: name,
          task: null as any, // Would need to be populated from session store
          worktreePath: '',
          status: SessionStatus.RUNNING,
          createdAt: new Date(),
          lastActivity: new Date()
        }))

      return sessions

    } catch (error) {
      this.logger.error('Failed to get active sessions', error)
      return []
    }
  }

  /**
   * Stop and cleanup a specific session
   */
  async stopSession(sessionId: string): Promise<void> {
    const tmuxSessionName = `tazz_${sessionId}`
    
    try {
      await execa('tmux', ['kill-session', '-t', tmuxSessionName])
      this.logger.info('Session stopped', { sessionId, tmuxSessionName })

    } catch (error) {
      // Session might not exist, which is fine
      this.logger.debug('Session stop failed (may not exist)', { 
        error: error.message, 
        sessionId, 
        tmuxSessionName 
      })
    }
  }

  /**
   * Stop all sessions for a main session ID
   */
  async stopAllSessions(mainSessionId: string): Promise<void> {
    try {
      const activeSessions = await this.getActiveSessions()
      const relatedSessions = activeSessions.filter(session => 
        session.id.startsWith(mainSessionId)
      )

      await Promise.all(
        relatedSessions.map(session => this.stopSession(session.id))
      )

      this.logger.info('All sessions stopped', {
        mainSessionId,
        stoppedSessions: relatedSessions.length
      })

    } catch (error) {
      this.logger.error('Failed to stop all sessions', error, { mainSessionId })
      throw error
    }
  }

  /**
   * Cleanup sessions and worktree
   */
  async cleanup(mainSessionId: string): Promise<void> {
    try {
      // Stop all tmux sessions
      await this.stopAllSessions(mainSessionId)

      // Remove worktree
      await this.worktreeManager.removeWorktree(mainSessionId)

      this.logger.info('Cleanup completed', { mainSessionId })

    } catch (error) {
      this.logger.error('Cleanup failed', error, { mainSessionId })
      throw new SessionError(
        `Cleanup failed for session ${mainSessionId}: ${error.message}`,
        { mainSessionId },
        error
      )
    }
  }

  private async sendTmuxCommand(sessionName: string, command: string): Promise<void> {
    await execa('tmux', ['send-keys', '-t', sessionName, command, 'Enter'])
  }

  private generateMainSessionId(metadata: TodoFileMetadata): string {
    // Try to extract session name from metadata
    if (metadata.sessionName) {
      return this.sanitizeSessionId(metadata.sessionName)
    }

    // Fallback to timestamp-based ID
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')
    return `session-${timestamp}`
  }

  private sanitizeSessionId(id: string): string {
    return id
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30)
  }
}