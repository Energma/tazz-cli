import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { remove, pathExists, readdir, stat } from 'fs-extra'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getLogger } from '../../utils/logger'
import { getTazzDir } from '../../utils/paths'

const execAsync = promisify(exec)

export class CleanCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('clean')
      .description('🧹 Clean cache, temporary files, and worktrees')
      .option('--deep', 'Deep clean including logs and configuration')
      .option('--dry-run', 'Show what would be cleaned without actually cleaning')
      .option('--session <session-id>', 'Clean specific session and its worktree')
      .option('--worktrees', 'Clean all abandoned worktrees')
      .action(async (options) => {
        await this.execute(options)
      })
  }

  async execute(options: {
    deep?: boolean
    dryRun?: boolean
    session?: string
    worktrees?: boolean
  } = {}): Promise<void> {
    console.log('')
    console.log(chalk.bold.cyan('🧹 Tazz CLI Cleanup'))
    console.log(chalk.gray('Cleaning cache and temporary files...'))
    console.log('')

    if (options.dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN - showing what would be cleaned'))
      console.log('')
    }

    const cleanupTasks = [
      {
        name: 'Temporary worktrees',
        action: () => this.cleanTempWorktrees(options.dryRun)
      },
      {
        name: 'Orphaned tmux sessions',
        action: () => this.cleanOrphanedTmuxSessions(options.dryRun)
      },
      {
        name: 'Old session data',
        action: () => this.cleanOldSessionData(options.dryRun)
      },
      {
        name: 'Cache files',
        action: () => this.cleanCacheFiles(options.dryRun)
      }
    ]

    if (options.deep) {
      cleanupTasks.push(
        {
          name: 'Log files',
          action: () => this.cleanLogFiles(options.dryRun)
        },
        {
          name: 'Configuration backup',
          action: () => this.cleanConfigBackups(options.dryRun)
        }
      )
    }

    let totalCleaned = 0
    let totalSize = 0

    for (const task of cleanupTasks) {
      const spinner = ora(`Cleaning ${task.name}`).start()
      
      try {
        const result = await task.action()
        totalCleaned += result.count
        totalSize += result.size
        
        if (result.count > 0) {
          const sizeStr = this.formatSize(result.size)
          spinner.succeed(`${task.name}: ${result.count} items (${sizeStr})`)
        } else {
          spinner.succeed(`${task.name}: already clean`)
        }
      } catch (error) {
        spinner.fail(`${task.name}: ${(error as Error).message}`)
        this.logger.error('Cleanup task failed', error as Error, { task: task.name })
      }
    }

    // Summary
    console.log('')
    console.log(chalk.bold('🧹 Cleanup Summary:'))
    console.log(chalk.green(`   Items cleaned: ${totalCleaned}`))
    console.log(chalk.green(`   Space freed: ${this.formatSize(totalSize)}`))
    
    if (options.dryRun) {
      console.log('')
      console.log(chalk.yellow('Run without --dry-run to actually perform the cleanup'))
    } else if (totalCleaned > 0) {
      console.log('')
      console.log(chalk.green('✅ Cleanup completed successfully!'))
    }
    console.log('')
  }

  private async cleanTempWorktrees(dryRun?: boolean): Promise<{ count: number; size: number }> {
    const tazzDir = getTazzDir()
    const tempDir = join(tazzDir, 'temp')
    
    if (!await pathExists(tempDir)) {
      return { count: 0, size: 0 }
    }

    const items = await readdir(tempDir)
    let count = 0
    let size = 0

    for (const item of items) {
      const itemPath = join(tempDir, item)
      try {
        const stats = await stat(itemPath)
        size += stats.size
        
        if (!dryRun) {
          await remove(itemPath)
        }
        count++
      } catch (error) {
        // Item may have been already removed
        this.logger.debug('Failed to clean temp item', error as Error, { item: itemPath })
      }
    }

    return { count, size }
  }

  private async cleanOrphanedTmuxSessions(dryRun?: boolean): Promise<{ count: number; size: number }> {
    try {
      const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}" 2>/dev/null || true')
      const sessions = stdout.trim().split('\n').filter(s => s.startsWith('tazz_'))
      
      // TODO: Check which sessions are actually orphaned
      // For now, just count them
      const orphanedSessions = sessions.filter(s => s.includes('orphaned')) // Placeholder logic
      
      let count = 0
      for (const session of orphanedSessions) {
        if (!dryRun) {
          try {
            await execAsync(`tmux kill-session -t ${session}`)
            count++
          } catch (error) {
            // Session may have already been killed
          }
        } else {
          count++
        }
      }

      return { count, size: count * 1024 } // Estimate 1KB per session
    } catch (error) {
      // tmux not available or no sessions
      return { count: 0, size: 0 }
    }
  }

  private async cleanOldSessionData(dryRun?: boolean): Promise<{ count: number; size: number }> {
    const tazzDir = getTazzDir()
    const projectsDir = join(tazzDir, 'projects')
    
    if (!await pathExists(projectsDir)) {
      return { count: 0, size: 0 }
    }

    const projects = await readdir(projectsDir)
    let count = 0
    let size = 0

    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

    for (const project of projects) {
      const projectPath = join(projectsDir, project)
      const sessionsFile = join(projectPath, 'sessions.json')
      
      if (await pathExists(sessionsFile)) {
        try {
          const stats = await stat(sessionsFile)
          
          // Clean sessions older than a week
          if (stats.mtime.getTime() < oneWeekAgo) {
            size += stats.size
            
            if (!dryRun) {
              await remove(projectPath)
            }
            count++
          }
        } catch (error) {
          this.logger.debug('Failed to check session data', error as Error, { project })
        }
      }
    }

    return { count, size }
  }

  private async cleanCacheFiles(dryRun?: boolean): Promise<{ count: number; size: number }> {
    const tazzDir = getTazzDir()
    const cacheDir = join(tazzDir, 'cache')
    
    if (!await pathExists(cacheDir)) {
      return { count: 0, size: 0 }
    }

    const items = await readdir(cacheDir)
    let count = 0
    let size = 0

    for (const item of items) {
      const itemPath = join(cacheDir, item)
      try {
        const stats = await stat(itemPath)
        size += stats.size
        
        if (!dryRun) {
          await remove(itemPath)
        }
        count++
      } catch (error) {
        this.logger.debug('Failed to clean cache item', error as Error, { item: itemPath })
      }
    }

    return { count, size }
  }

  private async cleanLogFiles(dryRun?: boolean): Promise<{ count: number; size: number }> {
    const tazzDir = getTazzDir()
    const logsDir = join(tazzDir, 'logs')
    
    if (!await pathExists(logsDir)) {
      return { count: 0, size: 0 }
    }

    const logFiles = await readdir(logsDir)
    let count = 0
    let size = 0

    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)

    for (const logFile of logFiles) {
      const logPath = join(logsDir, logFile)
      try {
        const stats = await stat(logPath)
        
        // Keep recent logs, clean old ones
        if (stats.mtime.getTime() < oneMonthAgo) {
          size += stats.size
          
          if (!dryRun) {
            await remove(logPath)
          }
          count++
        }
      } catch (error) {
        this.logger.debug('Failed to clean log file', error as Error, { logFile })
      }
    }

    return { count, size }
  }

  private async cleanConfigBackups(dryRun?: boolean): Promise<{ count: number; size: number }> {
    const tazzDir = getTazzDir()
    const backupDir = join(tazzDir, 'backups')
    
    if (!await pathExists(backupDir)) {
      return { count: 0, size: 0 }
    }

    const backupFiles = await readdir(backupDir)
    let count = 0
    let size = 0

    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000)

    for (const backupFile of backupFiles) {
      const backupPath = join(backupDir, backupFile)
      try {
        const stats = await stat(backupPath)
        
        // Keep recent backups, clean old ones
        if (stats.mtime.getTime() < twoWeeksAgo) {
          size += stats.size
          
          if (!dryRun) {
            await remove(backupPath)
          }
          count++
        }
      } catch (error) {
        this.logger.debug('Failed to clean backup file', error as Error, { backupFile })
      }
    }

    return { count, size }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }
}