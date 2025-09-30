import { MCPIntegrationService } from './MCPIntegrationService'
import { GitWorktreeManager } from './GitWorktreeManager'
import { SessionStore } from '../storage/SessionStore'
import { Logger } from '../../utils/logger'
import { TazzSession, SessionStatus, AgentInstance, AgentType, AgentStatus, SessionError } from '../types'
import { execa } from 'execa'
import { join } from 'path'
import { ensureDir, writeFile } from 'fs-extra'

export interface SessionContext {
  tasks?: string[]
  customBranch?: string
  enableTmux?: boolean
  enableJiraIntegration?: boolean
}

export class MCPSessionManager {
  private mcpService: MCPIntegrationService
  private sessionStore: SessionStore
  private worktreeManager: GitWorktreeManager
  private logger: Logger

  constructor(mcpService: MCPIntegrationService, logger: Logger) {
    this.mcpService = mcpService
    this.sessionStore = new SessionStore()
    this.worktreeManager = new GitWorktreeManager(logger)
    this.logger = logger
  }

  async createSession(sessionId: string, context: SessionContext = {}): Promise<TazzSession> {
    this.logger.info('Creating new session', { sessionId, context })

    try {
      // Check if session already exists
      const existing = await this.sessionStore.getSession(sessionId)
      if (existing) {
        throw new SessionError(`Session ${sessionId} already exists`, { sessionId })
      }

      // Ensure worktree setup (create directory and update .gitignore)
      await this.worktreeManager.ensureWorktreeSetup()
      
      // Create git worktree using the manager
      const worktreeInfo = await this.worktreeManager.createWorktree(sessionId, context.customBranch)

      // Create session object
      const session: TazzSession = {
        id: sessionId,
        branch: worktreeInfo.branchName,
        worktreePath: worktreeInfo.worktreePath,
        status: SessionStatus.ACTIVE,
        createdAt: new Date(),
        lastActive: new Date(),
        agents: [],
        tasks: this.createTasksFromContext(context),
        metadata: {}
      }

      // Enrich with MCP data if possible
      if (context.enableJiraIntegration && this.isJiraTicket(sessionId)) {
        await this.enrichWithJiraContext(session)
      }

      // Save session
      await this.sessionStore.saveSession(session)

      // Setup session directory
      await this.setupSessionDirectory(session)

      this.logger.info('Session created successfully', { sessionId })
      return session
    } catch (error) {
      this.logger.error('Failed to create session', error, { sessionId })
      throw error
    }
  }

  async attachToSession(sessionId: string): Promise<TazzSession> {
    const session = await this.sessionStore.getSession(sessionId)
    if (!session) {
      throw new SessionError(`Session ${sessionId} not found`, { sessionId })
    }

    // Update last active
    session.lastActive = new Date()
    session.status = SessionStatus.ACTIVE
    await this.sessionStore.saveSession(session)

    return session
  }

  async setupTmuxSession(session: TazzSession): Promise<void> {
    const tmuxSessionName = `tazz_${session.id}`
    
    try {
      // Create tmux session
      await execa('tmux', [
        'new-session',
        '-d',
        '-s', tmuxSessionName,
        '-c', session.worktreePath
      ])

      // Split into panes
      await execa('tmux', ['split-window', '-h', '-t', tmuxSessionName])
      await execa('tmux', ['split-window', '-v', '-t', `${tmuxSessionName}:0.1`])

      // Setup panes
      await execa('tmux', ['send-keys', '-t', `${tmuxSessionName}:0.0`, 'echo "Development Shell"', 'Enter'])
      await execa('tmux', ['send-keys', '-t', `${tmuxSessionName}:0.1`, 'echo "Build/Test Watcher"', 'Enter'])
      await execa('tmux', ['send-keys', '-t', `${tmuxSessionName}:0.2`, 'echo "Agent Console"', 'Enter'])

      this.logger.info('Tmux session created', { sessionId: session.id, tmuxSessionName })
    } catch (error) {
      this.logger.error('Failed to create tmux session', error, { sessionId: session.id })
      throw new SessionError('Failed to create tmux session', { sessionId: session.id }, error)
    }
  }

  async setupAgentEnvironment(session: TazzSession): Promise<void> {
    // Create agent instance placeholder
    const agent: AgentInstance = {
      id: `agent_${session.id}`,
      name: 'Claude Agent',
      type: AgentType.CLAUDE,
      status: AgentStatus.STARTING,
      lastActivity: new Date(),
      capabilities: ['code-generation', 'file-modification', 'testing']
    }

    session.agents.push(agent)
    await this.sessionStore.saveSession(session)
  }

  async enrichWithJiraContext(session: TazzSession): Promise<void> {
    if (!this.mcpService.isAvailable('atlassian')) {
      this.logger.warn('Jira integration requested but Atlassian MCP not available')
      return
    }

    try {
      const ticketInfo = await this.mcpService.callMCP('atlassian', 'jira_get_issue', {
        issueKey: session.id
      })

      session.metadata.jira = {
        title: ticketInfo.fields.summary,
        description: ticketInfo.fields.description,
        priority: ticketInfo.fields.priority.name,
        assignee: ticketInfo.fields.assignee?.displayName,
        status: ticketInfo.fields.status.name,
        type: ticketInfo.fields.issuetype.name,
        storyPoints: ticketInfo.fields.storyPoints
      }

      // Create Jira-based todo
      await this.createJiraBasedTodo(session, ticketInfo)

      this.logger.info('Session enriched with Jira context', { sessionId: session.id })
    } catch (error) {
      this.logger.warn('Failed to enrich session with Jira context', { error: error.message, sessionId: session.id })
    }
  }

  async attachToTmuxSession(sessionId: string): Promise<void> {
    const tmuxSessionName = `tazz_${sessionId}`
    
    try {
      await execa('tmux', ['attach-session', '-t', tmuxSessionName], {
        stdio: 'inherit'
      })
    } catch (error) {
      throw new SessionError(`Failed to attach to tmux session: ${tmuxSessionName}`, { sessionId }, error)
    }
  }

  /**
   * Stops a session and cleans up its worktree
   */
  async stopSession(sessionId: string): Promise<void> {
    this.logger.info('Stopping session', { sessionId })

    try {
      // Get session
      const session = await this.sessionStore.getSession(sessionId)
      if (!session) {
        throw new SessionError(`Session ${sessionId} not found`, { sessionId })
      }

      // Update session status
      session.status = SessionStatus.STOPPED
      session.lastActive = new Date()
      await this.sessionStore.saveSession(session)

      // Stop tmux session if exists
      try {
        const tmuxSessionName = `tazz_${sessionId}`
        await execa('tmux', ['kill-session', '-t', tmuxSessionName])
        this.logger.info('Tmux session stopped', { sessionId, tmuxSessionName })
      } catch (tmuxError) {
        this.logger.warn('Failed to stop tmux session (may not exist)', { error: tmuxError.message, sessionId })
      }

      this.logger.info('Session stopped successfully', { sessionId })

    } catch (error) {
      this.logger.error('Failed to stop session', error, { sessionId })
      throw error
    }
  }

  /**
   * Deletes a session and removes its worktree completely
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.logger.info('Deleting session', { sessionId })

    try {
      // Stop the session first
      await this.stopSession(sessionId)

      // Remove the worktree
      await this.worktreeManager.removeWorktree(sessionId)

      // Remove session from store
      await this.sessionStore.deleteSession(sessionId)

      this.logger.info('Session deleted successfully', { sessionId })

    } catch (error) {
      this.logger.error('Failed to delete session', error, { sessionId })
      throw error
    }
  }

  /**
   * Lists all active worktrees managed by Tazz
   */
  async listManagedWorktrees() {
    return await this.worktreeManager.listWorktrees()
  }

  private createTasksFromContext(context: SessionContext): any[] {
    if (!context.tasks) return []
    
    return context.tasks.map((task, index) => ({
      id: `task_${index + 1}`,
      title: task,
      description: '',
      status: 'todo',
      priority: 1,
      dependencies: []
    }))
  }

  private async setupSessionDirectory(session: TazzSession): Promise<void> {
    const sessionDir = join(session.worktreePath, '.tazz')
    await ensureDir(sessionDir)

    // Create session-specific files
    await writeFile(
      join(sessionDir, 'session.json'),
      JSON.stringify(session, null, 2)
    )

    await writeFile(
      join(sessionDir, 'tazz-todo.md'),
      this.generateSessionTodo(session)
    )
  }

  private generateSessionTodo(session: TazzSession): string {
    let content = `# ${session.id}\n\n`
    
    if (session.metadata.jira) {
      content += `## ${session.metadata.jira.title}\n\n`
      content += `**Priority:** ${session.metadata.jira.priority}\n`
      content += `**Status:** ${session.metadata.jira.status}\n\n`
      
      if (session.metadata.jira.description) {
        content += `### Description\n${session.metadata.jira.description}\n\n`
      }
    }

    content += `## Tasks\n`
    if (session.tasks.length > 0) {
      session.tasks.forEach(task => {
        content += `- [ ] ${task.title}\n`
      })
    } else {
      content += `- [ ] Analyze requirements\n`
      content += `- [ ] Implement solution\n`
      content += `- [ ] Write tests\n`
      content += `- [ ] Review and refine\n`
    }

    return content
  }

  private async createJiraBasedTodo(session: TazzSession, ticketInfo: any): Promise<void> {
    // This would create a more detailed todo based on Jira ticket
    // For now, it's handled in generateSessionTodo
  }

  private isJiraTicket(sessionId: string): boolean {
    return /^[A-Z]+-\d+$/.test(sessionId)
  }
}