import { execa } from 'execa'
import { join, resolve } from 'path'
import { existsSync, ensureDir, remove } from 'fs-extra'
import { Logger } from '../../utils/logger'
import { GitError } from '../types'

export interface WorktreeInfo {
  id: string
  branchName: string
  worktreePath: string
  basePath: string
  gitDir: string
}

export class GitWorktreeManager {
  private logger: Logger
  private worktreesDir = 'gitworktree-projects'

  constructor(logger: Logger) {
    this.logger = logger
  }

  /**
   * Creates a git worktree in the gitworktree-projects directory
   */
  async createWorktree(sessionId: string, branchName?: string): Promise<WorktreeInfo> {
    this.logger.info('Creating git worktree', { sessionId, branchName })

    try {
      // Ensure we're in a git repository
      await this.verifyGitRepository()

      // Get current git repository info
      const gitDir = await this.getGitDirectory()
      const basePath = process.cwd()
      
      // Generate branch name if not provided
      const actualBranchName = branchName || this.generateBranchName(sessionId)
      
      // Ensure worktrees directory exists
      const worktreesBasePath = join(basePath, this.worktreesDir)
      await ensureDir(worktreesBasePath)
      
      // Create worktree path
      const worktreePath = join(worktreesBasePath, sessionId)
      
      // Check if worktree already exists
      if (existsSync(worktreePath)) {
        throw new GitError(`Worktree already exists: ${worktreePath}`, { sessionId, worktreePath })
      }

      // Check if branch exists
      const branchExists = await this.branchExists(actualBranchName)
      
      if (branchExists) {
        // Create worktree from existing branch
        await execa('git', ['worktree', 'add', worktreePath, actualBranchName])
      } else {
        // Create worktree with new branch
        await execa('git', ['worktree', 'add', worktreePath, '-b', actualBranchName])
      }

      const worktreeInfo: WorktreeInfo = {
        id: sessionId,
        branchName: actualBranchName,
        worktreePath: resolve(worktreePath),
        basePath,
        gitDir
      }

      this.logger.info('Git worktree created successfully', worktreeInfo)
      return worktreeInfo

    } catch (error) {
      this.logger.error('Failed to create git worktree', error, { sessionId, branchName })
      throw new GitError(`Failed to create git worktree: ${error.message}`, { sessionId, branchName }, error)
    }
  }

  /**
   * Removes a git worktree and cleans up the directory
   */
  async removeWorktree(sessionId: string): Promise<void> {
    this.logger.info('Removing git worktree', { sessionId })

    try {
      const worktreePath = join(process.cwd(), this.worktreesDir, sessionId)
      
      if (!existsSync(worktreePath)) {
        this.logger.warn('Worktree directory not found, skipping removal', { worktreePath })
        return
      }

      // Remove the worktree from git
      try {
        await execa('git', ['worktree', 'remove', worktreePath, '--force'])
        this.logger.info('Git worktree removed from git registry', { worktreePath })
      } catch (gitError) {
        // If git worktree remove fails, try to force remove and prune
        this.logger.warn('Failed to remove worktree via git, attempting manual cleanup', { error: gitError.message })
        
        try {
          // Remove directory manually
          await remove(worktreePath)
          // Prune worktree references
          await execa('git', ['worktree', 'prune'])
        } catch (manualError) {
          this.logger.error('Manual worktree cleanup failed', manualError, { worktreePath })
        }
      }

      // Ensure directory is removed
      if (existsSync(worktreePath)) {
        await remove(worktreePath)
      }

      this.logger.info('Git worktree removed successfully', { sessionId, worktreePath })

    } catch (error) {
      this.logger.error('Failed to remove git worktree', error, { sessionId })
      throw new GitError(`Failed to remove git worktree: ${error.message}`, { sessionId }, error)
    }
  }

  /**
   * Lists all active worktrees
   */
  async listWorktrees(): Promise<WorktreeInfo[]> {
    try {
      const result = await execa('git', ['worktree', 'list', '--porcelain'])
      const worktrees: WorktreeInfo[] = []
      
      const lines = result.stdout.split('\n')
      let currentWorktree: Partial<WorktreeInfo> = {}
      
      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          if (currentWorktree.worktreePath) {
            this.addWorktreeIfTazz(worktrees, currentWorktree as WorktreeInfo)
          }
          currentWorktree = { worktreePath: line.substring(9) }
        } else if (line.startsWith('branch ')) {
          currentWorktree.branchName = line.substring(7)
        }
      }
      
      // Add the last worktree
      if (currentWorktree.worktreePath) {
        this.addWorktreeIfTazz(worktrees, currentWorktree as WorktreeInfo)
      }
      
      return worktrees

    } catch (error) {
      this.logger.error('Failed to list worktrees', error)
      throw new GitError(`Failed to list worktrees: ${error.message}`, {}, error)
    }
  }

  /**
   * Gets the worktrees directory path relative to current directory
   */
  getWorktreesDirectory(): string {
    return join(process.cwd(), this.worktreesDir)
  }

  /**
   * Ensures the gitworktree-projects directory exists and is in .gitignore
   */
  async ensureWorktreeSetup(): Promise<void> {
    const basePath = process.cwd()
    const worktreesPath = join(basePath, this.worktreesDir)
    const gitignorePath = join(basePath, '.gitignore')

    // Ensure worktrees directory exists
    await ensureDir(worktreesPath)

    // Add to .gitignore if not already present
    try {
      const { readFile, writeFile } = await import('fs-extra')
      
      let gitignoreContent = ''
      if (existsSync(gitignorePath)) {
        gitignoreContent = await readFile(gitignorePath, 'utf8')
      }

      if (!gitignoreContent.includes(this.worktreesDir)) {
        const newContent = gitignoreContent ? 
          `${gitignoreContent}\n\n# Tazz CLI git worktrees\n${this.worktreesDir}/\n` :
          `# Tazz CLI git worktrees\n${this.worktreesDir}/\n`
        
        await writeFile(gitignorePath, newContent)
        this.logger.info('Added gitworktree-projects to .gitignore')
      }

    } catch (error) {
      this.logger.warn('Failed to update .gitignore', { error: error.message })
    }
  }

  private async verifyGitRepository(): Promise<void> {
    try {
      await execa('git', ['rev-parse', '--git-dir'])
    } catch (error) {
      throw new GitError('Not in a git repository', {}, error)
    }
  }

  private async getGitDirectory(): Promise<string> {
    try {
      const result = await execa('git', ['rev-parse', '--git-dir'])
      return resolve(result.stdout.trim())
    } catch (error) {
      throw new GitError('Failed to get git directory', {}, error)
    }
  }

  private generateBranchName(sessionId: string): string {
    // If it looks like a JIRA ticket, use that pattern
    if (/^[A-Z]+-\d+$/.test(sessionId)) {
      return `feature/${sessionId}`
    }
    
    // Otherwise, sanitize the session ID for branch name
    const sanitized = sessionId.toLowerCase().replace(/[^a-z0-9]/g, '-')
    return `feature/${sanitized}`
  }

  private async branchExists(branchName: string): Promise<boolean> {
    try {
      await execa('git', ['show-ref', '--verify', `refs/heads/${branchName}`])
      return true
    } catch {
      return false
    }
  }

  private addWorktreeIfTazz(worktrees: WorktreeInfo[], worktree: WorktreeInfo): void {
    // Only include worktrees in our gitworktree-projects directory
    if (worktree.worktreePath && worktree.worktreePath.includes(this.worktreesDir)) {
      const sessionId = worktree.worktreePath.split('/').pop() || ''
      worktrees.push({
        ...worktree,
        id: sessionId,
        basePath: process.cwd(),
        gitDir: ''
      })
    }
  }
}