import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SessionStore } from '@/core/storage/SessionStore'
import { SessionStatus } from '@/types'
import { createTestSession, testTempDir } from '../../setup'
import { join } from 'path'

// Mock fs-extra
vi.mock('fs-extra', async () => {
  const actual = await vi.importActual('fs-extra')
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn(),
    pathExists: vi.fn(),
    ensureFile: vi.fn()
  }
})

describe('SessionStore', () => {
  let sessionStore: SessionStore
  
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStore = new SessionStore(testTempDir)
  })

  describe('getAllSessions', () => {
    it('should return empty array when no sessions file exists', async () => {
      const { pathExists } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(false)

      const sessions = await sessionStore.getAllSessions()
      
      expect(sessions).toEqual([])
    })

    it('should return sessions when file exists', async () => {
      const testSessions = [createTestSession(), createTestSession({ id: 'TEST-456' })]
      const mockData = {
        sessions: testSessions,
        lastUpdated: new Date().toISOString()
      }

      const { pathExists, readFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockData))

      const sessions = await sessionStore.getAllSessions()
      
      expect(sessions).toHaveLength(2)
      expect(sessions[0].id).toBe('TEST-123')
      expect(sessions[1].id).toBe('TEST-456')
    })

    it('should handle corrupted sessions file', async () => {
      const { pathExists, readFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue('invalid json')

      await expect(sessionStore.getAllSessions()).rejects.toThrow('Failed to read sessions file')
    })
  })

  describe('getSession', () => {
    it('should return session by ID', async () => {
      const testSession = createTestSession()
      const mockData = {
        sessions: [testSession],
        lastUpdated: new Date().toISOString()
      }

      const { pathExists, readFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockData))

      const session = await sessionStore.getSession('TEST-123')
      
      expect(session).toBeDefined()
      expect(session?.id).toBe('TEST-123')
    })

    it('should return null for non-existent session', async () => {
      const { pathExists, readFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({ sessions: [] }))

      const session = await sessionStore.getSession('NON-EXISTENT')
      
      expect(session).toBeNull()
    })
  })

  describe('saveSession', () => {
    it('should save new session', async () => {
      const testSession = createTestSession()

      const { pathExists, readFile, writeFile, ensureFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(false)
      vi.mocked(ensureFile).mockResolvedValue(undefined)
      vi.mocked(writeFile).mockResolvedValue(undefined)

      await sessionStore.saveSession(testSession)

      expect(ensureFile).toHaveBeenCalled()
      expect(writeFile).toHaveBeenCalledWith(
        join(testTempDir, '.tazz', 'sessions.json'),
        expect.stringContaining('"TEST-123"')
      )
    })

    it('should update existing session', async () => {
      const existingSession = createTestSession()
      const updatedSession = { ...existingSession, status: SessionStatus.STOPPED }
      const mockData = {
        sessions: [existingSession],
        lastUpdated: new Date().toISOString()
      }

      const { pathExists, readFile, writeFile, ensureFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockData))
      vi.mocked(writeFile).mockResolvedValue(undefined)
      vi.mocked(ensureFile).mockResolvedValue(undefined)

      await sessionStore.saveSession(updatedSession)

      expect(writeFile).toHaveBeenCalled()
      const writeCall = vi.mocked(writeFile).mock.calls[0]
      const savedData = JSON.parse(writeCall[1] as string)
      expect(savedData.sessions[0].status).toBe(SessionStatus.STOPPED)
    })

    it('should handle write errors', async () => {
      const testSession = createTestSession()

      const { pathExists, writeFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(false)
      vi.mocked(writeFile).mockRejectedValue(new Error('Write failed'))

      await expect(sessionStore.saveSession(testSession)).rejects.toThrow('Failed to save session')
    })
  })

  describe('removeSession', () => {
    it('should remove session by ID', async () => {
      const sessions = [
        createTestSession({ id: 'TEST-123' }),
        createTestSession({ id: 'TEST-456' })
      ]
      const mockData = {
        sessions,
        lastUpdated: new Date().toISOString()
      }

      const { pathExists, readFile, writeFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockData))
      vi.mocked(writeFile).mockResolvedValue(undefined)

      await sessionStore.removeSession('TEST-123')

      expect(writeFile).toHaveBeenCalled()
      const writeCall = vi.mocked(writeFile).mock.calls[0]
      const savedData = JSON.parse(writeCall[1] as string)
      expect(savedData.sessions).toHaveLength(1)
      expect(savedData.sessions[0].id).toBe('TEST-456')
    })

    it('should handle removal of non-existent session', async () => {
      const { pathExists, readFile, writeFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({ sessions: [] }))
      vi.mocked(writeFile).mockResolvedValue(undefined)

      await sessionStore.removeSession('NON-EXISTENT')
      
      expect(writeFile).toHaveBeenCalled()
    })
  })

  describe('updateSessionStatus', () => {
    it('should update session status', async () => {
      const testSession = createTestSession()
      const mockData = {
        sessions: [testSession],
        lastUpdated: new Date().toISOString()
      }

      const { pathExists, readFile, writeFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockData))
      vi.mocked(writeFile).mockResolvedValue(undefined)

      await sessionStore.updateSessionStatus('TEST-123', SessionStatus.STOPPED)

      expect(writeFile).toHaveBeenCalled()
      const writeCall = vi.mocked(writeFile).mock.calls[0]
      const savedData = JSON.parse(writeCall[1] as string)
      expect(savedData.sessions[0].status).toBe(SessionStatus.STOPPED)
    })

    it('should throw error for non-existent session', async () => {
      const { pathExists, readFile } = await import('fs-extra')
      vi.mocked(pathExists).mockResolvedValue(true)
      vi.mocked(readFile).mockResolvedValue(JSON.stringify({ sessions: [] }))

      await expect(sessionStore.updateSessionStatus('NON-EXISTENT', SessionStatus.STOPPED))
        .rejects.toThrow('Session NON-EXISTENT not found')
    })
  })
})