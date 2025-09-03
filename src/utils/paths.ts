import { join } from 'path'
import { homedir } from 'os'

/**
 * Get the centralized Tazz directory path
 * This is where all Tazz configurations, sessions, and data are stored
 */
export function getTazzDir(): string {
  return '/tmp/tazz-tmp'
}

/**
 * Get the logs directory path
 */
export function getLogsDir(): string {
  return join(getTazzDir(), 'logs')
}

/**
 * Get the sessions directory path
 */
export function getSessionsDir(): string {
  return join(getTazzDir(), 'sessions')
}

/**
 * Get the global config directory path
 */
export function getConfigDir(): string {
  return join(getTazzDir(), 'config')
}

/**
 * Get path for a specific project's tazz data
 */
export function getProjectTazzDir(projectPath: string): string {
  // Create a safe project name from the path
  const projectName = projectPath
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  
  return join(getTazzDir(), 'projects', projectName)
}

/**
 * Get the main tazz log file path
 */
export function getTazzLogPath(): string {
  return join(getLogsDir(), 'tazz.log')
}

/**
 * Get global sessions file path
 */
export function getGlobalSessionsPath(): string {
  return join(getTazzDir(), 'sessions.json')
}