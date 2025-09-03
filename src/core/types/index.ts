// Core type definitions for Tazz CLI
export interface TazzSession {
  id: string
  branch: string
  worktreePath: string
  status: SessionStatus
  createdAt: Date
  lastActive: Date
  agents: AgentInstance[]
  tasks: TaskReference[]
  metadata: SessionMetadata
}

export enum SessionStatus {
  ACTIVE = 'active',
  STOPPED = 'stopped',
  FAILED = 'failed',
  PAUSED = 'paused'
}

export interface SessionMetadata {
  jira?: {
    title: string
    description: string
    priority: string
    assignee?: string
    status: string
    type: string
    storyPoints?: number
  }
  github?: {
    relatedPRs: Array<{
      number: number
      title: string
      status: string
      url: string
    }>
  }
  sonarcloud?: {
    projectKey: string
    qualityGate: string
    coverage: number
    issues: number
  }
  custom?: Record<string, unknown>
}

export interface AgentInstance {
  id: string
  name: string
  type: AgentType
  status: AgentStatus
  pid?: number
  tmuxPane?: string
  lastActivity: Date
  capabilities: string[]
}

export enum AgentType {
  CLAUDE = 'claude',
  MCP = 'mcp',
  CUSTOM = 'custom'
}

export enum AgentStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
  STARTING = 'starting'
}

export interface TaskReference {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: number
  assignedAgent?: string
  dependencies: string[]
  estimatedTime?: number
  actualTime?: number
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// MCP Integration Types
export interface MCPServer {
  name: string
  command: string
  args: string[]
  env: Record<string, string>
  autoApprove: string[]
  disabled: boolean
  timeout: number
  transportType: 'stdio' | 'sse'
}

export interface MCPConfiguration {
  codeAnalysis: {
    git?: MCPServer
    sonarcloud?: MCPServer
    fetch?: MCPServer
  }
  projectManagement: {
    atlassian?: MCPServer
    github?: MCPServer
  }
  testing: {
    playwright?: MCPServer
    sequentialThinking?: MCPServer
  }
  taskManagement: {
    claudeTaskMaster?: MCPServer
  }
}

export interface AgentCommand {
  type: AgentCommandType
  sessionId?: string
  payload: unknown
  timestamp: Date
  requestId: string
}

export enum AgentCommandType {
  START_SESSION = 'start_session',
  ATTACH_SESSION = 'attach_session',
  RUN_TASK = 'run_task',
  UPDATE_TODO = 'update_todo',
  SPAWN_AGENT = 'spawn_agent',
  PARALLEL_RUN = 'parallel_run',
  ANALYZE_CODE = 'analyze_code',
  GENERATE_TESTS = 'generate_tests'
}

export interface CommandResult {
  success: boolean
  data?: unknown
  error?: string
  metadata?: Record<string, unknown>
}

// Project Analysis Types
export interface DependencyAnalysis {
  packageManager: string
  dependencies: Array<{
    name: string
    version: string
    type: 'dependency' | 'devDependency' | 'peerDependency'
  }>
  outdated: string[]
  vulnerabilities?: number
}

export interface ExistingTestingStrategy {
  hasTests: boolean
  framework?: string
  testDirectories: string[]
  coverage?: {
    configured: boolean
    threshold?: number
    tool?: string
  }
  e2e?: {
    configured: boolean
    framework?: string
  }
}

export interface ProjectAnalysis {
  structure: ProjectStructure
  technologies: TechnologyStack
  patterns: CodePatterns
  quality: QualityMetrics
  dependencies: DependencyAnalysis
  testingStrategy: ExistingTestingStrategy
}

export interface ProjectStructure {
  type: ProjectType
  sourceDirectories: string[]
  testDirectories: string[]
  configFiles: string[]
  buildTools: string[]
  hasAPI: boolean
  hasFrontend: boolean
  baseURL?: string
}

export enum ProjectType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
  LIBRARY = 'library',
  MOBILE = 'mobile',
  MONOREPO = 'monorepo'
}

export interface TechnologyStack {
  language: string
  framework?: string
  testing?: string
  buildSystem?: string
  cicd?: string
  database?: string
}

export interface CodePatterns {
  common: string[]
  architectural: string[]
  naming: string[]
  imports: string[]
}

export interface QualityMetrics {
  coverage?: number
  coverageThreshold?: number
  hasQualityGates: boolean
  linting: boolean
  formatting: boolean
  complexity?: number
}

// Configuration Types
export interface TazzConfig {
  maxConcurrentSessions: number
  defaultBranch: string
  tmuxPrefix: string
  agentTimeout: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  plugins: string[]
  agents: Record<string, AgentConfig>
  hooks: HookConfiguration
  mcpServers: MCPConfiguration
}

export interface AgentConfig {
  enabled: boolean
  apiKey?: string
  model?: string
  timeout?: number
  maxRetries?: number
}

export interface HookConfiguration {
  enabled: boolean
  scripts: Record<string, string>
  events: Record<string, HookEvent[]>
}

export interface HookEvent {
  name: string
  matcher: HookMatcher
  script: string
  async: boolean
}

export interface HookMatcher {
  toolName?: string | string[]
  command?: string
  sessionId?: string
  custom?: string
}

// Error Types
export abstract class TazzError extends Error {
  abstract readonly code: string
  abstract readonly severity: 'low' | 'medium' | 'high' | 'critical'
  
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class SessionError extends TazzError {
  readonly code = 'SESSION_ERROR'
  readonly severity = 'high'
}

export class GitError extends TazzError {
  readonly code = 'GIT_ERROR'
  readonly severity = 'medium'
}

export class AgentError extends TazzError {
  readonly code = 'AGENT_ERROR'
  readonly severity = 'high'
}

export class MCPError extends TazzError {
  readonly code = 'MCP_ERROR'
  readonly severity = 'medium'
}

export class ValidationError extends TazzError {
  readonly code = 'VALIDATION_ERROR'
  readonly severity = 'low'
}