import { readFile, writeFile as fsWriteFile, ensureFile } from 'fs-extra'
import { join } from 'path'
import { homedir } from 'os'
import { execa } from 'execa'
import { z } from 'zod'
import { Logger } from '../../utils/logger'
import { MCPServer, MCPConfiguration, MCPError, CommandResult } from '../types'

// Zod schemas for validation
const MCPServerSchema = z.object({
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string()).optional().default({}),
  autoApprove: z.array(z.string()).optional().default([]),
  disabled: z.boolean().optional().default(false),
  timeout: z.number().optional().default(60),
  transportType: z.enum(['stdio', 'sse']).optional().default('stdio')
})

const ClaudeConfigSchema = z.object({
  mcpServers: z.record(MCPServerSchema).optional().default({}),
  globalShortcuts: z.object({
    toggle: z.string().optional()
  }).optional(),
  statusLine: z.object({
    enabled: z.boolean().optional(),
    position: z.enum(['left', 'right']).optional()
  }).optional()
})

export class MCPIntegrationService {
  private logger: Logger
  private mcpConfig: MCPConfiguration | null = null
  private connectedServers: Map<string, MCPServer> = new Map()

  constructor(logger: Logger) {
    this.logger = logger
  }

  /**
   * Detect and load MCP configuration from Claude Code settings
   */
  async detectAndSetupMCPs(): Promise<MCPConfiguration> {
    this.logger.info('Detecting MCP servers from Claude Code configuration')

    try {
      const claudeConfig = await this.readClaudeConfig()
      const relevantMCPs = this.filterRelevantMCPs(claudeConfig.mcpServers)
      
      this.mcpConfig = this.categorizeServers(relevantMCPs)
      
      // Test connections to available servers
      await this.testConnections()
      
      this.logger.info('MCP configuration loaded successfully', {
        serversFound: Object.keys(relevantMCPs).length,
        serversActive: this.connectedServers.size
      })

      return this.mcpConfig
    } catch (error) {
      this.logger.error('Failed to setup MCP integration', error)
      throw new MCPError('MCP setup failed', { error: error.message }, error)
    }
  }

  /**
   * Read Claude Code configuration from multiple possible locations
   */
  private async readClaudeConfig(): Promise<any> {
    const possiblePaths = [
      join(homedir(), '.claude', 'settings.json'),
      join(process.cwd(), '.claude', 'settings.json'),
      join(homedir(), '.config', 'claude', 'settings.json')
    ]

    for (const configPath of possiblePaths) {
      try {
        const configContent = await readFile(configPath, 'utf-8')
        const rawConfig = JSON.parse(configContent)
        return ClaudeConfigSchema.parse(rawConfig)
      } catch (error) {
        this.logger.debug(`Claude config not found at ${configPath}`)
        continue
      }
    }

    throw new MCPError('No Claude Code configuration found', {
      searchPaths: possiblePaths
    })
  }

  /**
   * Filter MCP servers that are relevant to Tazz functionality
   */
  private filterRelevantMCPs(mcpServers: Record<string, MCPServer>): Record<string, MCPServer> {
    const tazzRelevantServers = [
      'git',
      'github', 
      'atlassian',
      'sonarcloud',
      'playwright',
      'sequential-thinking',
      'claude-task-master',
      'fetch',
      'figma',
      'context7'
    ]

    const filtered = Object.fromEntries(
      Object.entries(mcpServers)
        .filter(([name]) => tazzRelevantServers.includes(name))
        .filter(([, config]) => !config.disabled)
    )

    this.logger.debug('Filtered relevant MCP servers', {
      total: Object.keys(mcpServers).length,
      relevant: Object.keys(filtered).length,
      servers: Object.keys(filtered)
    })

    return filtered
  }

  /**
   * Categorize servers by their functionality for Tazz
   */
  private categorizeServers(servers: Record<string, MCPServer>): MCPConfiguration {
    return {
      codeAnalysis: {
        git: servers.git,
        sonarcloud: servers.sonarcloud,
        fetch: servers.fetch
      },
      projectManagement: {
        atlassian: servers.atlassian,
        github: servers.github
      },
      testing: {
        playwright: servers.playwright,
        sequentialThinking: servers['sequential-thinking']
      },
      taskManagement: {
        claudeTaskMaster: servers['claude-task-master']
      }
    }
  }

  /**
   * Test connections to all available MCP servers
   */
  private async testConnections(): Promise<void> {
    if (!this.mcpConfig) return

    const allServers = this.getAllServers()
    const connectionPromises = Object.entries(allServers).map(
      async ([name, server]) => {
        try {
          await this.testServerConnection(name, server)
          this.connectedServers.set(name, server)
          this.logger.debug(`MCP server ${name} connected successfully`)
        } catch (error) {
          this.logger.warn(`Failed to connect to MCP server ${name}`, { error: error.message })
        }
      }
    )

    await Promise.all(connectionPromises)
  }

  /**
   * Test connection to a specific MCP server
   */
  private async testServerConnection(name: string, server: MCPServer): Promise<void> {
    try {
      const { stdout } = await execa(server.command, server.args, {
        env: { ...process.env, ...server.env },
        timeout: server.timeout * 1000,
        input: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'tazz-cli',
              version: '1.0.0'
            }
          }
        })
      })

      const response = JSON.parse(stdout)
      if (response.error) {
        throw new Error(`Server error: ${response.error.message}`)
      }
    } catch (error) {
      throw new MCPError(`Failed to connect to ${name}`, {
        server: name,
        command: server.command,
        args: server.args
      }, error)
    }
  }

  /**
   * Call an MCP server with a specific method and parameters
   */
  async callMCP(serverName: string, method: string, params: any = {}): Promise<any> {
    const server = this.connectedServers.get(serverName)
    if (!server) {
      throw new MCPError(`MCP server ${serverName} not available`, {
        availableServers: Array.from(this.connectedServers.keys())
      })
    }

    try {
      const requestId = Date.now()
      const request = {
        jsonrpc: '2.0',
        id: requestId,
        method,
        params
      }

      this.logger.debug(`Calling MCP server ${serverName}`, { method, params })

      const { stdout } = await execa(server.command, server.args, {
        env: { ...process.env, ...server.env },
        timeout: server.timeout * 1000,
        input: JSON.stringify(request)
      })

      const response = JSON.parse(stdout)
      
      if (response.error) {
        throw new MCPError(`MCP call failed: ${response.error.message}`, {
          server: serverName,
          method,
          error: response.error
        })
      }

      this.logger.debug(`MCP call successful`, { server: serverName, method })
      return response.result
    } catch (error) {
      this.logger.error(`MCP call failed`, error, { server: serverName, method })
      throw new MCPError(`Failed to call ${serverName}.${method}`, {
        server: serverName,
        method,
        params
      }, error)
    }
  }

  /**
   * Check if a specific MCP server is available and connected
   */
  isAvailable(serverName: string): boolean {
    return this.connectedServers.has(serverName)
  }

  /**
   * Get all connected servers
   */
  getConnectedServers(): string[] {
    return Array.from(this.connectedServers.keys())
  }

  /**
   * Get MCP configuration
   */
  getConfiguration(): MCPConfiguration | null {
    return this.mcpConfig
  }

  /**
   * Helper to get all servers from categorized configuration
   */
  private getAllServers(): Record<string, MCPServer> {
    if (!this.mcpConfig) return {}

    const allServers: Record<string, MCPServer> = {}

    // Flatten all server categories
    Object.values(this.mcpConfig).forEach(category => {
      Object.entries(category).forEach(([key, server]) => {
        if (server) {
          allServers[key] = server
        }
      })
    })

    return allServers
  }

  /**
   * Setup project-specific MCP configuration
   */
  async setupProjectSpecific(projectPath: string): Promise<void> {
    // MCP configuration is now handled through .claude/settings.json
    // This method is kept for compatibility but doesn't create separate mcp.json
    try {
      const defaultBranch = await this.detectDefaultBranch(projectPath)
      this.logger.info('Project-specific MCP configuration prepared', { 
        projectPath,
        connectedServers: Array.from(this.connectedServers.keys()),
        defaultBranch
      })
    } catch (error) {
      this.logger.error('Failed to setup project MCP configuration', error)
      throw new MCPError('Failed to setup project-specific MCP configuration', {
        projectPath
      }, error)
    }
  }

  /**
   * Detect default branch for git repository
   */
  private async detectDefaultBranch(projectPath: string): Promise<string> {
    try {
      if (this.isAvailable('git')) {
        const result = await this.callMCP('git', 'get_default_branch', {
          repository: projectPath
        })
        return result.branch || 'main'
      }
      
      // Fallback to git command
      const { stdout } = await execa('git', ['symbolic-ref', 'refs/remotes/origin/HEAD'], {
        cwd: projectPath
      })
      return stdout.replace('refs/remotes/origin/', '')
    } catch {
      return 'main' // Default fallback
    }
  }

  /**
   * Helper to write files (for testing purposes)
   */
  private async writeFile(path: string, content: string): Promise<void> {
    await ensureFile(path)
    await fsWriteFile(path, content, 'utf-8')
  }
}