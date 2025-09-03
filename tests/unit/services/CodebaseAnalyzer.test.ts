import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CodebaseAnalyzer } from '@/core/services/CodebaseAnalyzer'
import { mockLogger, createMockMCPService, testTempDir } from '../../setup'
import { writeFile, ensureDir } from 'fs-extra'

// Mock fs-extra
vi.mock('fs-extra', async () => {
  const actual = await vi.importActual('fs-extra')
  return {
    ...actual,
    writeFile: vi.fn(),
    readFile: vi.fn(),
    pathExists: vi.fn()
  }
})

// Mock glob
vi.mock('glob', () => ({
  glob: vi.fn()
}))

describe('CodebaseAnalyzer', () => {
  let analyzer: CodebaseAnalyzer
  let mockMCPService: ReturnType<typeof createMockMCPService>

  beforeEach(() => {
    vi.clearAllMocks()
    mockMCPService = createMockMCPService()
    analyzer = new CodebaseAnalyzer(mockMCPService as any, mockLogger as any, testTempDir)
  })

  describe('analyzeProject', () => {
    it('should analyze project structure successfully', async () => {
      // Mock glob to return some files
      const mockGlob = await import('glob')
      vi.mocked(mockGlob.glob).mockResolvedValue([
        'src/index.ts',
        'src/components/Button.tsx',
        'tests/Button.test.tsx',
        'package.json',
        'tsconfig.json'
      ])

      // Mock package.json content
      const mockFsExtra = await import('fs-extra')
      vi.mocked(mockFsExtra.readFile).mockImplementation(async (path: any) => {
        if (path.includes('package.json')) {
          return JSON.stringify({
            name: 'test-project',
            dependencies: {
              react: '^18.0.0',
              typescript: '^5.0.0'
            },
            devDependencies: {
              vitest: '^1.0.0',
              '@testing-library/react': '^14.0.0'
            },
            scripts: {
              dev: 'vite',
              test: 'vitest'
            }
          })
        }
        throw new Error('File not found')
      })

      vi.mocked(mockFsExtra.pathExists).mockResolvedValue(true)

      const analysis = await analyzer.analyzeProject()

      expect(analysis).toBeDefined()
      expect(analysis.structure.type).toBeDefined()
      expect(analysis.technologies.language).toBe('typescript')
      expect(analysis.technologies.framework).toBe('react')
      expect(analysis.technologies.testing).toBe('vitest')
      expect(analysis.testingStrategy.hasTests).toBe(true)
    })

    it('should handle MCP git service when available', async () => {
      mockMCPService.isAvailable.mockImplementation((service) => service === 'git')
      mockMCPService.callMCP.mockResolvedValue({
        files: ['src/index.ts', 'package.json']
      })

      const mockGlob = await import('glob')
      vi.mocked(mockGlob.glob).mockResolvedValue([])

      const analysis = await analyzer.analyzeProject()
      
      expect(mockMCPService.callMCP).toHaveBeenCalledWith('git', 'list_files', {
        repository: testTempDir
      })
      expect(analysis).toBeDefined()
    })

    it('should fallback gracefully when MCP fails', async () => {
      mockMCPService.isAvailable.mockReturnValue(true)
      mockMCPService.callMCP.mockRejectedValue(new Error('MCP failed'))

      const mockGlob = await import('glob')
      vi.mocked(mockGlob.glob).mockResolvedValue(['src/index.js'])

      const analysis = await analyzer.analyzeProject()
      
      expect(analysis).toBeDefined()
      // Should fallback to filesystem scan
      expect(mockGlob.glob).toHaveBeenCalled()
    })

    it('should detect project types correctly', async () => {
      const mockGlob = await import('glob')
      
      // Test frontend detection
      vi.mocked(mockGlob.glob).mockResolvedValue([
        'src/components/App.tsx',
        'src/index.html',
        'package.json'
      ])

      const analysis = await analyzer.analyzeProject()
      expect(analysis.structure.type).toBe('frontend')
    })

    it('should detect technology stack from package.json', async () => {
      const mockFsExtra = await import('fs-extra')
      vi.mocked(mockFsExtra.pathExists).mockResolvedValue(true)
      vi.mocked(mockFsExtra.readFile).mockResolvedValue(JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          express: '^4.18.0'
        },
        devDependencies: {
          jest: '^29.0.0',
          typescript: '^5.0.0'
        }
      }))

      const mockGlob = await import('glob')
      vi.mocked(mockGlob.glob).mockResolvedValue(['src/index.tsx'])

      const analysis = await analyzer.analyzeProject()
      
      expect(analysis.technologies.language).toBe('typescript')
      expect(analysis.technologies.framework).toBe('react')
      expect(analysis.technologies.testing).toBe('jest')
    })
  })

  describe('error handling', () => {
    it('should handle filesystem errors gracefully', async () => {
      const mockGlob = await import('glob')
      vi.mocked(mockGlob.glob).mockRejectedValue(new Error('Filesystem error'))

      await expect(analyzer.analyzeProject()).rejects.toThrow('Failed to analyze codebase')
    })

    it('should handle invalid package.json gracefully', async () => {
      const mockFsExtra = await import('fs-extra')
      vi.mocked(mockFsExtra.readFile).mockResolvedValue('invalid json')
      vi.mocked(mockFsExtra.pathExists).mockResolvedValue(true)

      const mockGlob = await import('glob')
      vi.mocked(mockGlob.glob).mockResolvedValue(['src/index.js'])

      const analysis = await analyzer.analyzeProject()
      
      // Should still complete analysis despite invalid package.json
      expect(analysis).toBeDefined()
    })
  })
})