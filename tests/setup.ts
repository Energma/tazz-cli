import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

// Global test setup
let testTempDir: string

beforeAll(async () => {
  // Create a temporary directory for tests
  testTempDir = await mkdtemp(join(tmpdir(), 'tazz-test-'))
  process.env.TAZZ_TEST_MODE = 'true'
  process.env.TAZZ_TEST_DIR = testTempDir
})

afterAll(async () => {
  // Cleanup test directory
  if (testTempDir) {
    await rm(testTempDir, { recursive: true, force: true })
  }
})

beforeEach(() => {
  // Reset any mocks or state before each test
})

afterEach(() => {
  // Clean up after each test
})

// Export utilities for tests
export { testTempDir }

// Mock logger for tests
export const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}

// Mock MCP service for tests
export const createMockMCPService = () => ({
  detectAndSetupMCPs: vi.fn().mockResolvedValue({}),
  isAvailable: vi.fn().mockReturnValue(false),
  callMCP: vi.fn().mockResolvedValue({}),
  getConnectedServers: vi.fn().mockReturnValue([]),
  getConfiguration: vi.fn().mockReturnValue(null),
  setupProjectSpecific: vi.fn().mockResolvedValue(undefined)
})

// Mock session store for tests
export const createMockSessionStore = () => ({
  getAllSessions: vi.fn().mockResolvedValue([]),
  getSession: vi.fn().mockResolvedValue(null),
  saveSession: vi.fn().mockResolvedValue(undefined),
  removeSession: vi.fn().mockResolvedValue(undefined),
  updateSessionStatus: vi.fn().mockResolvedValue(undefined)
})

// Test utilities
export const createTestSession = (overrides = {}) => ({
  id: 'TEST-123',
  branch: 'feature/TEST-123',
  worktreePath: join(testTempDir, 'TEST-123'),
  status: 'active',
  createdAt: new Date(),
  lastActive: new Date(),
  agents: [],
  tasks: [],
  metadata: {},
  ...overrides
})

export const createTestAnalysis = (overrides = {}) => ({
  structure: {
    type: 'frontend',
    sourceDirectories: ['src'],
    testDirectories: ['tests'],
    configFiles: ['package.json', 'tsconfig.json'],
    buildTools: ['vite'],
    hasAPI: false,
    hasFrontend: true
  },
  technologies: {
    language: 'typescript',
    framework: 'react',
    testing: 'vitest',
    buildSystem: 'vite'
  },
  patterns: {
    common: ['async-await', 'error-handling'],
    architectural: ['component-based'],
    naming: ['camelCase'],
    imports: ['absolute-imports']
  },
  quality: {
    hasQualityGates: true,
    linting: true,
    formatting: true,
    coverage: 85
  },
  dependencies: {
    packageManager: 'npm',
    dependencies: [],
    outdated: []
  },
  testingStrategy: {
    hasTests: true,
    framework: 'vitest',
    testDirectories: ['tests'],
    coverage: {
      configured: true,
      threshold: 80,
      tool: 'vitest'
    }
  },
  ...overrides
})