import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { ensureDir, writeFile, pathExists, readFile, copy } from 'fs-extra'
import { join, dirname } from 'path'
import { MCPIntegrationService } from '../../core/services/MCPIntegrationService'
import { CodebaseAnalyzer } from '../../core/services/CodebaseAnalyzer'
import { IntelligentRulesGenerator } from '../../core/services/RulesGenerator'
import { getLogger } from '../../utils/logger'
import { getTazzDir, getProjectTazzDir } from '../../utils/paths'
import { TazzError } from '../../core/types'

export class MakeCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('make')
      .description('🏗️  Make/setup Tazz with intelligent codebase analysis and MCP integration')
      .action(async () => {
        await this.execute()
      })
  }

  async execute(): Promise<void> {
    console.log('')
    console.log(chalk.bold.cyan('🌀 Starting Tazz Initialization'))
    console.log(chalk.gray('Setting up intelligent development environment...'))
    console.log('')

    try {
      // Check if already initialized
      if (await this.checkExistingInstallation()) {
        console.log(chalk.yellow('⚠️  Tazz is already initialized in this project'))
        return
      }

      const projectPath = process.cwd()
      
      // Phase 1: Infrastructure Setup
      await this.setupInfrastructure(projectPath)

      // Phase 2: MCP Integration
      const mcpService = await this.setupMCPIntegration(projectPath)

      // Phase 3: Codebase Analysis
      const analysis = await this.analyzeCodebase(projectPath, mcpService)

      // Phase 4: Generate Rules and Hooks
      if (analysis) {
        await this.generateIntelligentRules(projectPath, analysis)
        await this.generateHookScripts(projectPath, analysis)
      }

      // Phase 5: Setup Testing Strategy
      if (analysis) {
        await this.setupTestingStrategy(projectPath, analysis)
      }

      // Phase 6: Create Configuration
      await this.createConfiguration(projectPath, {
        mcpService,
        analysis
      })

      // Phase 7: Update .gitignore
      await this.updateGitignore(projectPath)

      console.log('')
      console.log(chalk.green('✅ Tazz initialization completed successfully!'))
      console.log('')
      console.log(chalk.bold('Next steps:'))
      console.log(chalk.gray('  • Run'), chalk.cyan('tazz start <ticket-id>'), chalk.gray('to create a new session'))
      console.log(chalk.gray('  • Run'), chalk.cyan('tazz -d'), chalk.gray('to open detached console mode'))
      console.log(chalk.gray('  • Run'), chalk.cyan('tazz list'), chalk.gray('to see all sessions'))
      console.log('')

    } catch (error) {
      this.logger.error('Initialization failed', error)
      console.log('')
      console.log(chalk.red('❌ Tazz initialization failed'))
      
      if (error instanceof TazzError) {
        console.log(chalk.red(`   ${error.message}`))
      } else {
        console.log(chalk.red('   An unexpected error occurred'))
        console.log(chalk.gray('   Check logs for details: ~/.tazz/logs/tazz.log'))
      }
      
      process.exit(1)
    }
  }

  private async checkExistingInstallation(): Promise<boolean> {
    const projectPath = process.cwd()
    // Check for local .tazz or .claude directories (user collaboration files)
    const hasTazz = await pathExists(join(projectPath, '.tazz'))
    const hasClaude = await pathExists(join(projectPath, '.claude'))
    return hasTazz || hasClaude
  }

  private async setupInfrastructure(projectPath: string): Promise<void> {
    const spinner = ora('Setting up Tazz infrastructure').start()

    try {
      // Create centralized Tazz directory structure
      const globalTazzDir = getTazzDir()
      const projectTazzDir = getProjectTazzDir(projectPath)
      
      const directories = [
        // Global directories
        join(globalTazzDir, 'logs'),
        join(globalTazzDir, 'sessions'),
        join(globalTazzDir, 'config'),
        join(globalTazzDir, 'projects'),
        // Project-specific directories in centralized location
        projectTazzDir,
        join(projectTazzDir, 'rules'),
        join(projectTazzDir, 'hooks'),
        join(projectTazzDir, 'analysis'),
        join(projectTazzDir, 'templates'),
        // Minimal local directories for user collaboration
        join(projectPath, '.tazz'),
        join(projectPath, '.claude')
      ]

      await Promise.all(
        directories.map(dir => ensureDir(dir))
      )

      // Create initial project config files
      const projectName = (() => {
        try {
          return require(join(projectPath, 'package.json')).name || 'unknown'
        } catch {
          return 'unknown'
        }
      })()

      const initialFiles = {
        // Centralized files
        [join(projectTazzDir, 'sessions.json')]: JSON.stringify({ sessions: [] }, null, 2),
        [join(projectTazzDir, 'config.json')]: JSON.stringify({
          version: '1.0.0',
          initialized: new Date().toISOString(),
          project: {
            name: projectName,
            path: projectPath,
            type: 'library'
          },
          features: {
            mcpIntegration: false,
            codebaseAnalysis: true,
            intelligentRules: true,
            hooksIntegration: true
          },
          settings: {
            maxConcurrentSessions: 10,
            defaultBranch: 'main',
            tmuxPrefix: 'tazz_',
            agentTimeout: 300000,
            logLevel: 'info',
            autoCommit: false,
            qualityGates: {
              enabled: false,
              coverage: 80
            }
          },
          connectedServices: {
            mcp: [],
            git: true,
            tmux: true
          }
        }, null, 2),
        // Local file for user collaboration
        [join(projectPath, '.tazz', 'tazz-todo.md')]: this.createInitialTodoTemplate()
      }

      await Promise.all(
        Object.entries(initialFiles).map(([file, content]) =>
          writeFile(file, content)
        )
      )

      // Copy complete .claude configuration from tazz-cli template
      await this.copyClaudeTemplate(projectPath)

      spinner.succeed('Infrastructure setup complete')
    } catch (error) {
      spinner.fail('Infrastructure setup failed')
      throw error
    }
  }

  private createInitialTodoTemplate(): string {
    return `# Tazz Development Tasks

## Session Tasks

TaskName: Feature Implementation
SessionName: feat-impl
Description: Implement the main functionality for this feature. This context will be passed to the Claude instance in the tmux session.

TaskName: Write Tests
SessionName: write-tests
Description: Create comprehensive tests for the implemented functionality. Focus on unit tests and integration tests.

TaskName: Update Documentation
SessionName: update-docs
Description: Update relevant documentation including README, API docs, and inline comments.

TaskName: Code Review Preparation
SessionName: code-review
Description: Prepare code for review, run linting, fix any issues, and ensure quality standards are met.

## In Progress

TaskName: Current Implementation Task
SessionName: current-work
Description: Description of what is currently being implemented or debugged.

## Quality Checklist (Legacy Format)
- [ ] Code follows project patterns
- [ ] Tests pass locally
- [ ] Coverage meets threshold
- [ ] Code reviewed
- [ ] Documentation updated

## Session Notes
Add notes about current session, decisions made, next steps...

## Quick Commands
\`\`\`bash
# Start all tasks (creates separate tmux sessions)
tazz run

# Join specific task session
tazz join feat-impl

# List all active sessions
tazz list

# Complete a session and clean up
tazz done feat-impl

# Complete all sessions
tazz done --all
\`\`\`
`
  }

  private async copyClaudeTemplate(projectPath: string): Promise<void> {
    try {
      // Get the path to the Tazz CLI's template directory
      const tazzCliDir = dirname(__dirname)
      const templateDir = join(tazzCliDir, 'templates', 'claude-template')
      
      // Copy the entire Claude template to the project
      const projectClaudeDir = join(projectPath, '.claude')
      
      if (await pathExists(templateDir)) {
        await copy(templateDir, projectClaudeDir, { overwrite: true })
        
        // Update the settings.json to point to the correct project-specific paths
        await this.updateClaudeSettings(projectPath, projectClaudeDir)
        
        this.logger.info('Claude configuration copied from template', { templateDir, projectClaudeDir })
      } else {
        this.logger.warn('Claude template not found', { templateDir })
        throw new Error(`Claude template not found at ${templateDir}`)
      }
    } catch (error) {
      this.logger.error('Failed to copy Claude template', { error: error.message })
      throw error
    }
  }

  private async updateClaudeSettings(projectPath: string, projectClaudeDir: string): Promise<void> {
    const projectTazzDir = getProjectTazzDir(projectPath)
    const settingsPath = join(projectClaudeDir, 'settings.json')
    
    if (await pathExists(settingsPath)) {
      const settings = JSON.parse(await readFile(settingsPath, 'utf-8'))
      
      // Update git repository path to current project
      if (settings.mcpServers?.git) {
        settings.mcpServers.git.args = [
          "mcp-server-git",
          "--repository", 
          projectPath
        ]
      }
      
      // Update hook script paths to centralized location
      if (settings.hooks) {
        Object.keys(settings.hooks).forEach(hookName => {
          if (settings.hooks[hookName].script) {
            const scriptName = settings.hooks[hookName].script.split('/').pop()
            settings.hooks[hookName].script = join(projectTazzDir, 'hooks', scriptName)
          }
        })
      }
      
      await writeFile(settingsPath, JSON.stringify(settings, null, 2))
    }
  }

  private async setupMCPIntegration(projectPath: string): Promise<MCPIntegrationService | null> {
    const spinner = ora('Detecting and configuring MCP servers').start()

    try {
      const mcpService = new MCPIntegrationService(this.logger)
      const mcpConfig = await mcpService.detectAndSetupMCPs()
      
      // Setup project-specific configuration
      await mcpService.setupProjectSpecific(projectPath)

      const connectedServers = mcpService.getConnectedServers()
      
      spinner.succeed(`MCP integration complete (${connectedServers.length} servers connected)`)
      
      if (connectedServers.length > 0) {
        console.log(chalk.gray('    Connected servers:'), chalk.cyan(connectedServers.join(', ')))
      }

      return mcpService
    } catch (error) {
      spinner.warn('MCP integration failed, continuing without MCP features')
      this.logger.warn('MCP integration failed', { error: error.message })
      return null
    }
  }

  private async analyzeCodebase(projectPath: string, mcpService: MCPIntegrationService | null): Promise<any> {
    const spinner = ora('Analyzing codebase structure and patterns').start()

    try {
      const analyzer = new CodebaseAnalyzer(
        mcpService || new MCPIntegrationService(this.logger),
        this.logger,
        projectPath
      )
      
      const analysis = await analyzer.analyzeProject()
      
      spinner.succeed('Codebase analysis complete')
      console.log(chalk.gray('    Project type:'), chalk.cyan(analysis.structure.type))
      console.log(chalk.gray('    Language:'), chalk.cyan(analysis.technologies.language))
      if (analysis.technologies.framework) {
        console.log(chalk.gray('    Framework:'), chalk.cyan(analysis.technologies.framework))
      }
      console.log(chalk.gray('    Has tests:'), analysis.testingStrategy.hasTests ? chalk.green('Yes') : chalk.yellow('No'))

      return analysis
    } catch (error) {
      spinner.fail('Codebase analysis failed')
      throw error
    }
  }

  private async generateIntelligentRules(projectPath: string, analysis: any): Promise<void> {
    const spinner = ora('Generating intelligent rules and patterns').start()

    try {
      const rulesGenerator = new IntelligentRulesGenerator(this.logger, projectPath)
      await rulesGenerator.generateProjectRules(analysis)
      
      spinner.succeed('Rules generation complete')
      console.log(chalk.gray('    Generated rules for:'), chalk.cyan(analysis.technologies.language))
    } catch (error) {
      spinner.fail('Rules generation failed')
      throw error
    }
  }

  private async generateHookScripts(projectPath: string, analysis: any): Promise<void> {
    const spinner = ora('Setting up Claude Code hooks integration').start()

    try {
      const rulesGenerator = new IntelligentRulesGenerator(this.logger, projectPath)
      await rulesGenerator.generateHookScripts(analysis)
      
      // Create sub-agent configurations (Claude config already copied in infrastructure setup)
      await this.createSubAgentConfigs(projectPath, analysis)
      
      spinner.succeed('Hook scripts generated')
      console.log(chalk.gray('    Created Claude Code integration hooks'))
    } catch (error) {
      spinner.fail('Hook generation failed')
      throw error
    }
  }

  private async createClaudeHooksConfig(projectPath: string): Promise<void> {
    const projectTazzDir = getProjectTazzDir(projectPath)
    
    // Get the path to the Tazz CLI's template directory
    // Since we're in dist/index.js, go up one level to find templates
    const tazzCliDir = dirname(__dirname)
    const templateDir = join(tazzCliDir, 'templates', 'claude-template')
    
    // Copy the entire Claude template to the project
    const projectClaudeDir = join(projectPath, '.claude')
    
    if (await pathExists(templateDir)) {
      await copy(templateDir, projectClaudeDir, { overwrite: true })
      
      // Update the settings.json to point to the correct project-specific paths
      const settingsPath = join(projectClaudeDir, 'settings.json')
      if (await pathExists(settingsPath)) {
        const settings = JSON.parse(await readFile(settingsPath, 'utf-8'))
        
        // Update git repository path to current project
        if (settings.mcpServers?.git) {
          settings.mcpServers.git.args = [
            "mcp-server-git",
            "--repository", 
            projectPath
          ]
        }
        
        // Update hook script paths to centralized location
        if (settings.hooks) {
          Object.keys(settings.hooks).forEach(hookName => {
            if (settings.hooks[hookName].script) {
              const scriptName = settings.hooks[hookName].script.split('/').pop()
              settings.hooks[hookName].script = join(projectTazzDir, 'hooks', scriptName)
            }
          })
        }
        
        // Update sub-agent paths to centralized location
        if (settings.subAgents) {
          Object.keys(settings.subAgents).forEach(agentName => {
            const agent = settings.subAgents[agentName]
            if (agent.rules) {
              const rulesFile = agent.rules.split('/').pop()
              agent.rules = join(projectTazzDir, 'rules', rulesFile)
            }
            if (agent.templates) {
              agent.templates = join(projectTazzDir, 'templates/')
            }
            if (agent.analysis) {
              agent.analysis = join(projectTazzDir, 'analysis.json')
            }
          })
        }
        
        await writeFile(settingsPath, JSON.stringify(settings, null, 2))
      }
      
      this.logger.info('Claude configuration copied from template', { templateDir, projectClaudeDir })
    } else {
      this.logger.warn('Claude template not found', { templateDir })
      throw new Error(`Claude template not found at ${templateDir}`)
    }
  }

  private async createSubAgentConfigs(projectPath: string, analysis: any): Promise<void> {
    const projectTazzDir = getProjectTazzDir(projectPath)
    const subAgentsDir = join(projectTazzDir, 'subagents')
    await ensureDir(subAgentsDir)

    // Create detailed configuration for each sub-agent
    const subAgentConfigs = {
      'testing-agent.json': {
        name: "Testing Specialist",
        role: "Test automation and quality assurance expert",
        expertise: [
          "Unit testing patterns",
          "Integration test strategies", 
          "E2E automation with Playwright",
          "Test coverage optimization",
          "Performance testing",
          "CI/CD test pipeline integration"
        ],
        tools: {
          primary: ["Write", "Edit", "Bash"],
          mcp: ["playwright", "github", "sonarcloud"],
          testing: ["jest", "vitest", "cypress", "playwright"]
        },
        workflows: {
          "create-unit-tests": {
            steps: ["Analyze code", "Generate test structure", "Implement assertions", "Verify coverage"],
            templates: join(projectTazzDir, 'templates/unit-test.template')
          },
          "setup-e2e-tests": {
            steps: ["Design user flows", "Create page objects", "Implement scenarios", "Configure CI"],
            templates: join(projectTazzDir, 'templates/integration-test.template')
          }
        },
        language: analysis.technologies.language,
        framework: analysis.technologies.framework,
        testingStrategy: analysis.testingStrategy
      },

      'architecture-agent.json': {
        name: "Architecture Analyst", 
        role: "System design and code structure expert",
        expertise: [
          "Design pattern analysis",
          "Code architecture assessment",
          "Technical debt identification",
          "Performance optimization",
          "Security analysis",
          "Refactoring strategies"
        ],
        tools: {
          primary: ["Read", "Glob", "Grep"],
          mcp: ["sonarcloud", "context7", "github"],
          analysis: ["ast-parser", "complexity-analyzer"]
        },
        workflows: {
          "analyze-architecture": {
            steps: ["Code structure mapping", "Pattern identification", "Dependency analysis", "Quality metrics"],
            analysis: join(projectTazzDir, 'analysis.json')
          },
          "refactor-recommendations": {
            steps: ["Technical debt assessment", "Performance bottlenecks", "Security vulnerabilities", "Improvement plan"],
            rules: join(projectTazzDir, 'rules/code-style.json')
          }
        },
        projectType: analysis.projectType,
        technologies: analysis.technologies,
        structure: analysis.structure
      },

      'devops-agent.json': {
        name: "DevOps Engineer",
        role: "CI/CD and infrastructure automation specialist", 
        expertise: [
          "CI/CD pipeline optimization",
          "Docker containerization",
          "Build automation",
          "Quality gate enforcement",
          "Deployment strategies",
          "Infrastructure as code"
        ],
        tools: {
          primary: ["Bash", "Write", "Edit"],
          mcp: ["github", "sonarcloud"],
          devops: ["docker", "kubernetes", "terraform"]
        },
        workflows: {
          "setup-ci-pipeline": {
            steps: ["Analyze build process", "Configure workflows", "Setup quality gates", "Deploy automation"],
            rules: join(projectTazzDir, 'rules/git-workflow.json')
          },
          "containerize-application": {
            steps: ["Create Dockerfile", "Optimize layers", "Configure compose", "Setup healthchecks"]
          }
        },
        technologies: analysis.technologies,
        buildTools: analysis.buildTools
      }
    }

    // Write sub-agent configuration files
    await Promise.all(
      Object.entries(subAgentConfigs).map(([filename, config]) =>
        writeFile(join(subAgentsDir, filename), JSON.stringify(config, null, 2))
      )
    )

    this.logger.info('Sub-agent configurations created', { subAgentsDir })
  }

  private async setupTestingStrategy(projectPath: string, analysis: any): Promise<void> {
    const spinner = ora('Setting up testing strategy').start()

    try {
      // Create test templates based on analysis in centralized location
      const projectTazzDir = getProjectTazzDir(projectPath)
      const templatesDir = join(projectTazzDir, 'templates')
      
      const testTemplates = {
        'unit-test.template': this.createUnitTestTemplate(analysis),
        'integration-test.template': analysis.structure.hasAPI ? this.createIntegrationTestTemplate(analysis) : null,
        'e2e-test.template': analysis.structure.hasFrontend ? this.createE2ETestTemplate(analysis) : null
      }

      await Promise.all(
        Object.entries(testTemplates)
          .filter(([, content]) => content !== null)
          .map(([filename, content]) =>
            writeFile(join(templatesDir, filename), content!)
          )
      )

      spinner.succeed('Testing strategy configured')
    } catch (error) {
      spinner.fail('Testing strategy setup failed')
      throw error
    }
  }

  private createUnitTestTemplate(analysis: any): string {
    const language = analysis.technologies.language
    const framework = analysis.testingStrategy.framework

    if (language === 'typescript' || language === 'javascript') {
      return `import { describe, it, expect } from '${framework || 'vitest'}'
import { {{COMPONENT_NAME}} } from '../src/{{COMPONENT_PATH}}'

describe('{{COMPONENT_NAME}}', () => {
  it('should {{TEST_DESCRIPTION}}', () => {
    // Arrange
    const input = {{TEST_INPUT}}

    // Act
    const result = {{COMPONENT_NAME}}(input)

    // Assert
    expect(result).{{ASSERTION}}
  })
})`
    }

    return `// Unit test template for {{COMPONENT_NAME}}
// Add your test cases here`
  }

  private createIntegrationTestTemplate(analysis: any): string {
    return `// Integration test template for API endpoints
import request from 'supertest'
import app from '../src/app'

describe('{{API_ENDPOINT}}', () => {
  beforeEach(async () => {
    // Setup test database
  })

  it('should {{ENDPOINT_BEHAVIOR}}', async () => {
    const response = await request(app)
      .{{HTTP_METHOD}}('{{ENDPOINT_PATH}}')
      .send({{REQUEST_BODY}})
      .expect({{EXPECTED_STATUS}})

    expect(response.body).toMatchObject({{EXPECTED_RESPONSE}})
  })
})`
  }

  private createE2ETestTemplate(analysis: any): string {
    const hasPlaywright = analysis.testingStrategy.e2e?.framework === 'playwright'

    if (hasPlaywright) {
      return `import { test, expect } from '@playwright/test'

test.describe('{{FEATURE_NAME}}', () => {
  test('should {{TEST_DESCRIPTION}}', async ({ page }) => {
    await page.goto('${analysis.structure.baseURL || 'http://localhost:3000'}')
    
    // Test user workflow
    await page.click('{{SELECTOR}}')
    await page.fill('input[name="{{INPUT_NAME}}"]', '{{TEST_VALUE}}')
    
    await expect(page.locator('{{RESULT_SELECTOR}}')).toHaveText('{{EXPECTED_TEXT}}')
  })
})`
    }

    return `// E2E test template
describe('{{FEATURE_NAME}}', () => {
  it('should complete user workflow', () => {
    // Add E2E test steps
  })
})`
  }

  private async createConfiguration(projectPath: string, context: {
    mcpService: MCPIntegrationService | null
    analysis: any
  }): Promise<void> {
    const config = {
      version: '1.0.0',
      initialized: new Date().toISOString(),
      project: {
        name: this.getProjectName(projectPath),
        path: projectPath,
        type: context.analysis?.structure.type || 'unknown'
      },
      features: {
        mcpIntegration: context.mcpService !== null,
        codebaseAnalysis: context.analysis !== null,
        intelligentRules: context.analysis !== null,
        hooksIntegration: context.analysis !== null
      },
      settings: {
        maxConcurrentSessions: 10,
        defaultBranch: 'main',
        tmuxPrefix: 'tazz_',
        agentTimeout: 300000,
        logLevel: 'info',
        autoCommit: false,
        qualityGates: {
          enabled: context.analysis?.quality.hasQualityGates || false,
          coverage: context.analysis?.quality.coverageThreshold || 80
        }
      },
      connectedServices: {
        mcp: context.mcpService?.getConnectedServers() || [],
        git: true,
        tmux: true
      }
    }

    // Store configuration only in centralized location (already done in setupInfrastructure)
    const projectTazzDir = getProjectTazzDir(projectPath)
    await writeFile(
      join(projectTazzDir, 'config.json'),
      JSON.stringify(config, null, 2)
    )
  }

  private getProjectName(projectPath: string): string {
    try {
      const packageJson = require(join(projectPath, 'package.json'))
      return packageJson.name
    } catch {
      return require('path').basename(projectPath)
    }
  }

  private async updateGitignore(projectPath: string): Promise<void> {
    const gitignorePath = join(projectPath, '.gitignore')
    const tazzEntries = [
      '',
      '# Tazz CLI',
      '.tazz/',
      '.claude/',
      ''
    ].join('\n')

    try {
      if (await pathExists(gitignorePath)) {
        const existing = await readFile(gitignorePath, 'utf-8')
        if (!existing.includes('.tazz/')) {
          await writeFile(gitignorePath, existing + tazzEntries)
        }
      } else {
        await writeFile(gitignorePath, tazzEntries)
      }
    } catch (error) {
      this.logger.warn('Could not update .gitignore', { error: error.message })
    }
  }
}