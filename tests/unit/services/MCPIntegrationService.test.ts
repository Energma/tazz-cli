import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MCPIntegrationService } from '@/core/services/MCPIntegrationService'
import { mockLogger } from '../../setup'
import { readFile } from 'fs-extra'

// Mock fs-extra
vi.mock('fs-extra', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  ensureFile: vi.fn()
}))

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn()
}))

// Mock homedir
vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/test')
}))

describe('MCPIntegrationService', () => {
  let mcpService: MCPIntegrationService
  const mockReadFile = vi.mocked(readFile)

  beforeEach(() => {
    vi.clearAllMocks()
    mcpService = new MCPIntegrationService(mockLogger as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('detectAndSetupMCPs', () => {
    it('should detect and setup MCP servers from Claude config', async () => {
      const mockConfig = {
        mcpServers: {
          git: {
            command: 'uvx',
            args: ['mcp-server-git'],
            env: {},
            autoApprove: [],
            disabled: false,
            timeout: 60,
            transportType: 'stdio'
          },
          github: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_PERSONAL_ACCESS_TOKEN: 'token' },
            autoApprove: ['create_pull_request'],
            disabled: false,
            timeout: 60,
            transportType: 'stdio'
          },
          disabled_server: {
            command: 'test',
            args: [],
            env: {},
            autoApprove: [],
            disabled: true,
            timeout: 60,
            transportType: 'stdio'
          }
        }
      }

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockConfig))

      const config = await mcpService.detectAndSetupMCPs()

      expect(config).toBeDefined()
      expect(config.codeAnalysis?.git).toBeDefined()
      expect(config.projectManagement?.github).toBeDefined()
      expect(mockReadFile).toHaveBeenCalled()
    })

    it('should handle missing Claude config gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'))

      await expect(mcpService.detectAndSetupMCPs()).rejects.toThrow('MCP setup failed')
    })

    it('should filter out disabled servers', async () => {
      const mockConfig = {
        mcpServers: {
          git: {
            command: 'uvx',
            args: ['mcp-server-git'],
            disabled: false
          },
          disabled_server: {
            command: 'test',
            args: [],
            disabled: true
          }
        }
      }

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockConfig))

      const config = await mcpService.detectAndSetupMCPs()

      expect(config.codeAnalysis?.git).toBeDefined()
      // Should not include disabled server
      expect(Object.keys(config).every(category => 
        !Object.values(config[category]).some((server: any) => server?.command === 'test')
      )).toBe(true)
    })
  })

  describe('isAvailable', () => {
    it('should return false for non-existent server', () => {
      expect(mcpService.isAvailable('non-existent')).toBe(false)
    })
  })

  describe('getConnectedServers', () => {
    it('should return empty array when no servers connected', () => {
      expect(mcpService.getConnectedServers()).toEqual([])
    })
  })

  describe('callMCP', () => {
    it('should throw error for unavailable server', async () => {
      await expect(mcpService.callMCP('unavailable', 'test_method'))
        .rejects.toThrow('MCP server unavailable not available')
    })
  })

  describe('getConfiguration', () => {
    it('should return null when not configured', () => {
      expect(mcpService.getConfiguration()).toBeNull()
    })
  })
})