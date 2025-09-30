import { readFile, writeFile, pathExists, ensureFile } from 'fs-extra'
import { join } from 'path'
import { TazzSession, SessionError } from '../types'

export interface SessionData {
  sessions: TazzSession[]
  lastUpdated: string
}

export class SessionStore {
  private sessionsPath: string

  constructor(projectPath: string = process.cwd()) {
    this.sessionsPath = join(projectPath, '.tazz', 'sessions.json')
  }

  async getAllSessions(): Promise<TazzSession[]> {
    try {
      if (!await pathExists(this.sessionsPath)) {
        return []
      }

      const data = await readFile(this.sessionsPath, 'utf-8')
      const sessionData: SessionData = JSON.parse(data)
      
      return sessionData.sessions || []
    } catch (error) {
      throw new SessionError('Failed to read sessions file', {
        path: this.sessionsPath
      }, error)
    }
  }

  async getSession(sessionId: string): Promise<TazzSession | null> {
    const sessions = await this.getAllSessions()
    return sessions.find(s => s.id === sessionId) || null
  }

  async saveSession(session: TazzSession): Promise<void> {
    try {
      const sessions = await this.getAllSessions()
      const existingIndex = sessions.findIndex(s => s.id === session.id)

      if (existingIndex >= 0) {
        sessions[existingIndex] = session
      } else {
        sessions.push(session)
      }

      const sessionData: SessionData = {
        sessions,
        lastUpdated: new Date().toISOString()
      }

      await ensureFile(this.sessionsPath)
      await writeFile(this.sessionsPath, JSON.stringify(sessionData, null, 2))
    } catch (error) {
      throw new SessionError('Failed to save session', {
        sessionId: session.id,
        path: this.sessionsPath
      }, error)
    }
  }

  async removeSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions()
      const filteredSessions = sessions.filter(s => s.id !== sessionId)

      const sessionData: SessionData = {
        sessions: filteredSessions,
        lastUpdated: new Date().toISOString()
      }

      await writeFile(this.sessionsPath, JSON.stringify(sessionData, null, 2))
    } catch (error) {
      throw new SessionError('Failed to remove session', {
        sessionId,
        path: this.sessionsPath
      }, error)
    }
  }

  /**
   * Alias for removeSession to match the naming convention used in MCPSessionManager
   */
  async deleteSession(sessionId: string): Promise<void> {
    return this.removeSession(sessionId)
  }

  async updateSessionStatus(sessionId: string, status: any): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new SessionError(`Session ${sessionId} not found`)
    }

    session.status = status
    session.lastActive = new Date()
    
    await this.saveSession(session)
  }
}