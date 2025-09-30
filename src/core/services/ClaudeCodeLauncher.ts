import { execa } from 'execa'
import { writeFile, pathExists, readFile } from 'fs-extra'
import { join, dirname } from 'path'
import { Logger } from '../../utils/logger'
import { ParsedTask } from './TodoFileParser'
import { SessionInfo } from './TmuxSessionOrchestrator'
import { TazzError } from '../types'

export interface ClaudeLaunchConfig {
  workingDirectory: string
  contextPrompt: string
  sessionSettings?: ClaudeSessionSettings
  environmentVars?: Record<string, string>
}

export interface ClaudeSessionSettings {
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export interface LaunchResult {
  sessionId: string
  claudeProcessId?: number
  status: LaunchStatus
  error?: string
  contextFile?: string
}

export enum LaunchStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  TIMEOUT = 'timeout'
}

export class ClaudeCodeError extends TazzError {
  readonly code = 'CLAUDE_CODE_ERROR'
  readonly severity = 'medium'
}

export class ClaudeCodeLauncher {
  private logger: Logger
  private claudeCommand: string
  private defaultSettings: ClaudeSessionSettings

  constructor(logger: Logger) {
    this.logger = logger
    this.claudeCommand = 'claude-code' // Default command, can be overridden
    this.defaultSettings = {
      model: 'claude-3-sonnet',
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 120000 // 2 minutes
    }
  }

  /**
   * Launch Claude Code in multiple tmux sessions
   */
  async launchInSessions(sessions: SessionInfo[]): Promise<LaunchResult[]> {
    this.logger.info('Launching Claude Code in multiple sessions', {
      sessionCount: sessions.length
    })

    const results: LaunchResult[] = []

    // Check if Claude Code is available
    if (!await this.isClaudeCodeAvailable()) {
      throw new ClaudeCodeError('Claude Code CLI is not available. Please install it first.')
    }

    // Launch Claude Code in each session
    for (const session of sessions) {
      try {
        if (session.status === 'failed') {
          results.push({
            sessionId: session.id,
            status: LaunchStatus.SKIPPED,
            error: 'Session creation failed'
          })
          continue
        }

        const result = await this.launchInSession(session)
        results.push(result)

      } catch (error) {
        this.logger.error('Failed to launch Claude Code in session', error, {
          sessionId: session.id
        })

        results.push({
          sessionId: session.id,
          status: LaunchStatus.FAILED,
          error: error.message
        })
      }
    }

    this.logger.info('Claude Code launch completed', {
      totalSessions: sessions.length,
      successful: results.filter(r => r.status === LaunchStatus.SUCCESS).length,
      failed: results.filter(r => r.status === LaunchStatus.FAILED).length,
      skipped: results.filter(r => r.status === LaunchStatus.SKIPPED).length
    })

    return results
  }

  /**
   * Launch Claude Code in a specific tmux session
   */
  async launchInSession(session: SessionInfo): Promise<LaunchResult> {
    const config = this.buildLaunchConfig(session)
    
    try {
      // Create context file for the session
      const contextFile = await this.createContextFile(session, config)

      // Add delay to allow session to be ready
      await this.delay(2000)

      // Launch Claude Code with context
      await this.startClaudeInTmux(session.tmuxSessionName, config, contextFile)

      this.logger.info('Claude Code launched successfully', {
        sessionId: session.id,
        tmuxSession: session.tmuxSessionName,
        contextFile
      })

      return {
        sessionId: session.id,
        status: LaunchStatus.SUCCESS,
        contextFile
      }

    } catch (error) {
      this.logger.error('Failed to launch Claude Code', error, {
        sessionId: session.id,
        tmuxSession: session.tmuxSessionName
      })

      return {
        sessionId: session.id,
        status: LaunchStatus.FAILED,
        error: error.message
      }
    }
  }

  /**
   * Build launch configuration for a session
   */
  private buildLaunchConfig(session: SessionInfo): ClaudeLaunchConfig {
    const task = session.task
    const contextPrompt = this.buildContextPrompt(task)

    return {
      workingDirectory: session.worktreePath,
      contextPrompt,
      sessionSettings: { ...this.defaultSettings },
      environmentVars: {
        'TAZZ_SESSION_ID': session.id,
        'TAZZ_TASK_NAME': task.name,
        'TAZZ_TASK_PRIORITY': task.priority,
        'TAZZ_WORKTREE_PATH': session.worktreePath
      }
    }
  }

  /**
   * Build comprehensive context prompt for Claude
   */
  private buildContextPrompt(task: ParsedTask): string {
    const lines: string[] = []

    lines.push('# Tazz Development Session Context')
    lines.push('')
    lines.push(`## Current Task: ${task.name}`)
    lines.push(`**Priority**: ${task.priority.toUpperCase()}`)
    lines.push(`**Section**: ${task.section}`)
    lines.push(`**Status**: ${task.status}`)
    lines.push('')

    if (task.description && task.description !== task.name) {
      lines.push('## Description')
      lines.push(task.description)
      lines.push('')
    }

    if (task.context.technicalDetails) {
      lines.push('## Technical Details')
      lines.push(task.context.technicalDetails)
      lines.push('')
    }

    if (task.context.dependencies?.length) {
      lines.push('## Dependencies')
      task.context.dependencies.forEach(dep => {
        lines.push(`- ${dep}`)
      })
      lines.push('')
    }

    if (task.context.acceptanceCriteria?.length) {
      lines.push('## Acceptance Criteria')
      task.context.acceptanceCriteria.forEach(criteria => {
        lines.push(`- ${criteria}`)
      })
      lines.push('')
    }

    if (task.context.notes?.length) {
      lines.push('## Additional Notes')
      task.context.notes.forEach(note => {
        lines.push(`- ${note}`)
      })
      lines.push('')
    }

    if (task.metadata.estimatedTime) {
      lines.push(`## Estimated Time: ${task.metadata.estimatedTime}`)
      lines.push('')
    }

    if (task.metadata.tags?.length) {
      lines.push(`## Tags: ${task.metadata.tags.map(tag => `#${tag}`).join(' ')}`)
      lines.push('')
    }

    lines.push('## Development Guidelines')
    lines.push('- Follow existing code patterns and conventions')
    lines.push('- Write clean, well-documented code')
    lines.push('- Include appropriate tests')
    lines.push('- Consider performance and security implications')
    lines.push('- Update documentation as needed')
    lines.push('')

    lines.push('## Session Commands')
    lines.push('You are working in an isolated git worktree. Key commands:')
    lines.push('- Use standard git commands (add, commit, push, etc.)')
    lines.push('- Run tests and build commands as needed')
    lines.push('- All changes are isolated to this worktree')
    lines.push('')

    lines.push('## Getting Started')
    lines.push('1. Analyze the current codebase and project structure')
    lines.push('2. Review the task requirements thoroughly')
    lines.push('3. Plan your implementation approach')
    lines.push('4. Start with small, incremental changes')
    lines.push('5. Test frequently as you develop')
    lines.push('')

    lines.push('Ready to start working on this task! 🚀')

    return lines.join('\n')
  }

  /**
   * Create a context file for the session
   */
  private async createContextFile(session: SessionInfo, config: ClaudeLaunchConfig): Promise<string> {
    const contextDir = join(session.worktreePath, '.tazz')
    const contextFile = join(contextDir, `context-${session.task.sessionName}.md`)

    try {
      // Ensure directory exists
      const { ensureDir } = await import('fs-extra')
      await ensureDir(contextDir)

      // Write context file
      await writeFile(contextFile, config.contextPrompt)

      this.logger.debug('Context file created', {
        sessionId: session.id,
        contextFile
      })

      return contextFile

    } catch (error) {
      throw new ClaudeCodeError(`Failed to create context file: ${error.message}`, {
        sessionId: session.id,
        contextFile
      }, error)
    }
  }

  /**
   * Start Claude Code within a tmux session
   */
  private async startClaudeInTmux(tmuxSessionName: string, config: ClaudeLaunchConfig, contextFile: string): Promise<void> {
    try {
      // Clear any previous content
      await this.sendTmuxKeys(tmuxSessionName, 'clear')

      // Change to working directory
      await this.sendTmuxKeys(tmuxSessionName, `cd "${config.workingDirectory}"`)

      // Set environment variables
      if (config.environmentVars) {
        for (const [key, value] of Object.entries(config.environmentVars)) {
          await this.sendTmuxKeys(tmuxSessionName, `export ${key}="${value}"`)
        }
      }

      // Display startup message
      await this.sendTmuxKeys(tmuxSessionName, 'echo "🤖 Starting Claude Code..."')
      await this.sendTmuxKeys(tmuxSessionName, `echo "📄 Context: ${contextFile}"`)
      await this.sendTmuxKeys(tmuxSessionName, 'echo ""')

      // Launch Claude Code with initial context
      const claudeCommand = this.buildClaudeCommand(contextFile, config)
      await this.sendTmuxKeys(tmuxSessionName, claudeCommand)

    } catch (error) {
      throw new ClaudeCodeError(`Failed to start Claude Code in tmux: ${error.message}`, {
        tmuxSessionName
      }, error)
    }
  }

  /**
   * Build the Claude Code command
   */
  private buildClaudeCommand(contextFile: string, config: ClaudeLaunchConfig): string {
    const parts = [this.claudeCommand]

    // Add context file as initial input
    if (contextFile) {
      parts.push(`--file "${contextFile}"`)
    }

    // Add working directory
    parts.push(`--cwd "${config.workingDirectory}"`)

    // Add session settings
    if (config.sessionSettings?.model) {
      parts.push(`--model "${config.sessionSettings.model}"`)
    }

    return parts.join(' ')
  }

  /**
   * Send keys to a tmux session
   */
  private async sendTmuxKeys(sessionName: string, command: string): Promise<void> {
    await execa('tmux', ['send-keys', '-t', sessionName, command, 'Enter'])
  }

  /**
   * Check if Claude Code CLI is available
   */
  private async isClaudeCodeAvailable(): Promise<boolean> {
    try {
      await execa(this.claudeCommand, ['--version'])
      return true
    } catch (error) {
      // Try alternative command names
      const alternatives = ['claude', 'claude-cli', 'anthropic-cli']
      
      for (const alt of alternatives) {
        try {
          await execa(alt, ['--version'])
          this.claudeCommand = alt
          this.logger.info(`Using Claude Code command: ${alt}`)
          return true
        } catch {
          continue
        }
      }

      this.logger.warn('Claude Code CLI not found', {
        triedCommands: [this.claudeCommand, ...alternatives]
      })
      return false
    }
  }

  /**
   * Utility function to add delays
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Stop Claude Code in a specific session
   */
  async stopClaudeInSession(sessionId: string): Promise<void> {
    const tmuxSessionName = `tazz_${sessionId}`
    
    try {
      // Send Ctrl+C to interrupt any running Claude process
      await execa('tmux', ['send-keys', '-t', tmuxSessionName, 'C-c'])
      
      // Wait a moment then send exit
      await this.delay(1000)
      await this.sendTmuxKeys(tmuxSessionName, 'exit')

      this.logger.info('Claude Code stopped in session', { sessionId })

    } catch (error) {
      this.logger.warn('Failed to stop Claude Code', { error: error.message, sessionId })
    }
  }

  /**
   * Set Claude Code command (for testing or custom installations)
   */
  setClaudeCommand(command: string): void {
    this.claudeCommand = command
  }

  /**
   * Update default settings
   */
  updateDefaultSettings(settings: Partial<ClaudeSessionSettings>): void {
    this.defaultSettings = { ...this.defaultSettings, ...settings }
  }
}