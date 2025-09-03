import winston from 'winston'
import { getTazzLogPath } from './paths'

export interface LogContext {
  sessionId?: string
  agentId?: string
  commandId?: string
  userId?: string
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: LogContext
  pid: number
}

export class Logger {
  private winston: winston.Logger
  private config: LoggerConfig

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: 'info',
      logFile: getTazzLogPath(),
      enableConsole: true,
      enableFile: true,
      ...config
    }

    this.winston = winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: this.createTransports()
    })
  }

  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = []

    if (this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              return `${timestamp} [${level}]: ${message} ${metaStr}`
            })
          )
        })
      )
    }

    if (this.config.enableFile) {
      transports.push(
        new winston.transports.File({
          filename: this.config.logFile,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      )
    }

    return transports
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.winston.error(message, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      ...context,
      pid: process.pid
    })
  }

  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, {
      ...context,
      pid: process.pid
    })
  }

  info(message: string, context?: LogContext): void {
    this.winston.info(message, {
      ...context,
      pid: process.pid
    })
  }

  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, {
      ...context,
      pid: process.pid
    })
  }

  /**
   * Create a child logger with persistent context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config)
    
    // Override the winston logger to include persistent context
    const originalWinston = childLogger.winston
    childLogger.winston = originalWinston.child(context)
    
    return childLogger
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: string): void {
    this.winston.level = level
    this.config.level = level
  }

  /**
   * Get current log level
   */
  getLevel(): string {
    return this.config.level
  }
}

export interface LoggerConfig {
  level?: string
  logFile?: string
  enableConsole?: boolean
  enableFile?: boolean
}

// Default logger instance
let defaultLogger: Logger | null = null

export function getLogger(config?: LoggerConfig): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger(config)
  }
  return defaultLogger
}

export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config)
}