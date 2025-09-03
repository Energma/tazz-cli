import { readFile, pathExists, readdir, stat, writeFile, ensureFile } from 'fs-extra'
import { join, extname, basename } from 'path'
import { glob } from 'glob'
import { MCPIntegrationService } from './MCPIntegrationService'
import { Logger } from '../../utils/logger'
import { getProjectTazzDir } from '../../utils/paths'
import { 
  ProjectAnalysis, 
  ProjectStructure, 
  TechnologyStack, 
  CodePatterns, 
  QualityMetrics, 
  DependencyAnalysis,
  ExistingTestingStrategy,
  ProjectType,
  TazzError
} from '../types'

export class CodebaseAnalysisError extends TazzError {
  readonly code = 'CODEBASE_ANALYSIS_ERROR'
  readonly severity = 'medium'
}

export class CodebaseAnalyzer {
  private logger: Logger
  private mcpService: MCPIntegrationService
  private projectPath: string

  constructor(mcpService: MCPIntegrationService, logger: Logger, projectPath: string = process.cwd()) {
    this.mcpService = mcpService
    this.logger = logger
    this.projectPath = projectPath
  }

  /**
   * Main analysis method - orchestrates all analysis steps
   */
  async analyzeProject(): Promise<ProjectAnalysis> {
    this.logger.info('Starting comprehensive codebase analysis', { projectPath: this.projectPath })

    try {
      const [
        structure,
        technologies,
        patterns,
        quality,
        dependencies,
        testingStrategy
      ] = await Promise.all([
        this.analyzeProjectStructure(),
        this.detectTechnologies(),
        this.extractCodePatterns(),
        this.runQualityAnalysis(),
        this.analyzeDependencies(),
        this.analyzeExistingTests()
      ])

      const analysis: ProjectAnalysis = {
        structure,
        technologies,
        patterns,
        quality,
        dependencies,
        testingStrategy
      }

      // Save analysis to .tazz/analysis.json
      await this.saveAnalysis(analysis)
      
      this.logger.info('Codebase analysis completed', {
        projectType: structure.type,
        language: technologies.language,
        framework: technologies.framework,
        hasTests: testingStrategy.hasTests
      })

      return analysis
    } catch (error) {
      this.logger.error('Codebase analysis failed', error as Error)
      throw new CodebaseAnalysisError('Failed to analyze codebase', {
        projectPath: this.projectPath
      })
    }
  }

  /**
   * Analyze project structure and organization
   */
  private async analyzeProjectStructure(): Promise<ProjectStructure> {
    this.logger.debug('Analyzing project structure')

    // Use git MCP if available for better file listing
    let allFiles: string[] = []
    if (this.mcpService.isAvailable('git')) {
      try {
        const gitFiles = await this.mcpService.callMCP('git', 'list_files', {
          repository: this.projectPath
        })
        allFiles = gitFiles.files || []
      } catch (error) {
        this.logger.warn('Git MCP failed, falling back to filesystem scan')
        allFiles = await this.scanFilesystem()
      }
    } else {
      allFiles = await this.scanFilesystem()
    }

    const structure: ProjectStructure = {
      type: this.detectProjectType(allFiles),
      sourceDirectories: this.findSourceDirectories(allFiles),
      testDirectories: this.findTestDirectories(allFiles),
      configFiles: this.findConfigFiles(allFiles),
      buildTools: this.detectBuildTools(allFiles),
      hasAPI: this.detectAPI(allFiles),
      hasFrontend: this.detectFrontend(allFiles),
      baseURL: await this.detectBaseURL()
    }

    return structure
  }

  /**
   * Scan filesystem when git MCP is not available
   */
  private async scanFilesystem(): Promise<string[]> {
    const patterns = [
      '**/*.{js,ts,jsx,tsx,py,go,rs,java,php,rb}',
      '**/package.json',
      '**/requirements.txt',
      '**/Cargo.toml',
      '**/go.mod',
      '**/*.config.{js,ts,json}',
      '**/test/**/*',
      '**/tests/**/*',
      '**/*.test.*',
      '**/*.spec.*'
    ]

    const files = await glob(patterns, {
      cwd: this.projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
    })

    return files
  }

  /**
   * Detect project type based on files and structure
   */
  private detectProjectType(files: string[]): ProjectType {
    const hasPackageJson = files.some(f => f.includes('package.json'))
    const hasIndexHtml = files.some(f => f.includes('index.html'))
    const hasReactFiles = files.some(f => f.includes('.jsx') || f.includes('.tsx'))
    const hasServerFiles = files.some(f => f.includes('server') || f.includes('api'))
    const hasPyFiles = files.some(f => f.endsWith('.py'))
    const hasGoFiles = files.some(f => f.endsWith('.go'))
    const hasMultiplePackageJsons = files.filter(f => f.includes('package.json')).length > 1

    if (hasMultiplePackageJsons) return ProjectType.MONOREPO
    if (hasReactFiles && hasServerFiles) return ProjectType.FULLSTACK
    if (hasIndexHtml || hasReactFiles) return ProjectType.FRONTEND
    if (hasServerFiles || hasPyFiles || hasGoFiles) return ProjectType.BACKEND
    if (hasPackageJson && !hasIndexHtml) return ProjectType.LIBRARY

    return ProjectType.BACKEND // Default fallback
  }

  /**
   * Find source code directories
   */
  private findSourceDirectories(files: string[]): string[] {
    const commonSrcDirs = ['src', 'lib', 'app', 'components', 'pages', 'routes']
    const foundDirs = new Set<string>()

    files.forEach(file => {
      const parts = file.split('/')
      if (parts.length > 1) {
        const firstDir = parts[0]
        if (commonSrcDirs.includes(firstDir) || firstDir.endsWith('src')) {
          foundDirs.add(firstDir)
        }
      }
    })

    return Array.from(foundDirs)
  }

  /**
   * Find test directories
   */
  private findTestDirectories(files: string[]): string[] {
    const testDirs = new Set<string>()
    
    files.forEach(file => {
      if (file.includes('test') || file.includes('spec') || file.includes('__tests__')) {
        const parts = file.split('/')
        const testDir = parts.find(part => 
          part.includes('test') || part.includes('spec') || part === '__tests__'
        )
        if (testDir) testDirs.add(testDir)
      }
    })

    return Array.from(testDirs)
  }

  /**
   * Find configuration files
   */
  private findConfigFiles(files: string[]): string[] {
    const configPatterns = [
      /.*config\.(js|ts|json)$/,
      /^(babel|webpack|rollup|vite|next)\.config\./,
      /^(tsconfig|jsconfig)\.json$/,
      /^\.eslintrc/,
      /^\.prettierrc/,
      /^docker-compose\./,
      /^Dockerfile$/
    ]

    return files.filter(file => {
      const filename = basename(file)
      return configPatterns.some(pattern => pattern.test(filename))
    })
  }

  /**
   * Detect build tools from files
   */
  private detectBuildTools(files: string[]): string[] {
    const tools = new Set<string>()
    
    if (files.some(f => f.includes('package.json'))) {
      // Check package.json content for scripts
      try {
        const packageJson = require(join(this.projectPath, 'package.json'))
        if (packageJson.scripts) {
          if (packageJson.scripts.build) tools.add('npm/yarn')
          if (packageJson.devDependencies?.webpack) tools.add('webpack')
          if (packageJson.devDependencies?.vite) tools.add('vite')
          if (packageJson.devDependencies?.['@next/core']) tools.add('next.js')
        }
      } catch (error) {
        this.logger.debug('Could not read package.json')
      }
    }

    if (files.some(f => f.includes('Cargo.toml'))) tools.add('cargo')
    if (files.some(f => f.includes('go.mod'))) tools.add('go modules')
    if (files.some(f => f.includes('Makefile'))) tools.add('make')
    if (files.some(f => f.includes('docker-compose'))) tools.add('docker')

    return Array.from(tools)
  }

  /**
   * Detect if project has API endpoints
   */
  private detectAPI(files: string[]): boolean {
    const apiPatterns = [
      /api\//,
      /routes\//,
      /controllers\//,
      /endpoints\//,
      /server\./,
      /app\.py$/,
      /main\.go$/
    ]

    return files.some(file => apiPatterns.some(pattern => pattern.test(file)))
  }

  /**
   * Detect if project has frontend components
   */
  private detectFrontend(files: string[]): boolean {
    return files.some(file => 
      file.includes('index.html') ||
      file.endsWith('.jsx') ||
      file.endsWith('.tsx') ||
      file.endsWith('.vue') ||
      file.includes('components/') ||
      file.includes('pages/')
    )
  }

  /**
   * Detect base URL for development server
   */
  private async detectBaseURL(): Promise<string | undefined> {
    try {
      const packageJsonPath = join(this.projectPath, 'package.json')
      if (await pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
        
        // Check common dev server ports
        if (packageJson.scripts?.dev?.includes('3000')) return 'http://localhost:3000'
        if (packageJson.scripts?.dev?.includes('8080')) return 'http://localhost:8080'
        if (packageJson.scripts?.start?.includes('3000')) return 'http://localhost:3000'
      }
    } catch (error) {
      this.logger.debug('Could not detect base URL')
    }
    
    return undefined
  }

  /**
   * Detect technology stack
   */
  private async detectTechnologies(): Promise<TechnologyStack> {
    this.logger.debug('Detecting technology stack')

    const technologies: TechnologyStack = {
      language: await this.detectPrimaryLanguage(),
      framework: await this.detectFramework(),
      testing: await this.detectTestingFramework(),
      buildSystem: await this.detectBuildSystem(),
      cicd: await this.detectCICDPlatform(),
      database: await this.detectDatabase()
    }

    return technologies
  }

  /**
   * Detect primary programming language
   */
  private async detectPrimaryLanguage(): Promise<string> {
    const files = await this.scanFilesystem()
    const extensions: Record<string, number> = {}

    files.forEach(file => {
      const ext = extname(file)
      extensions[ext] = (extensions[ext] || 0) + 1
    })

    // Map extensions to languages
    const langMap: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.php': 'php',
      '.rb': 'ruby'
    }

    const mostCommonExt = Object.entries(extensions)
      .sort(([,a], [,b]) => b - a)[0]?.[0]

    return langMap[mostCommonExt] || 'unknown'
  }

  /**
   * Detect web framework
   */
  private async detectFramework(): Promise<string | undefined> {
    try {
      const packageJsonPath = join(this.projectPath, 'package.json')
      if (await pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

        if (deps.react) return 'react'
        if (deps.vue) return 'vue'
        if (deps.angular || deps['@angular/core']) return 'angular'
        if (deps.express) return 'express'
        if (deps.fastify) return 'fastify'
        if (deps.next) return 'next.js'
        if (deps.nuxt) return 'nuxt.js'
      }

      // Check Python frameworks
      const requirementsPath = join(this.projectPath, 'requirements.txt')
      if (await pathExists(requirementsPath)) {
        const requirements = await readFile(requirementsPath, 'utf-8')
        if (requirements.includes('django')) return 'django'
        if (requirements.includes('flask')) return 'flask'
        if (requirements.includes('fastapi')) return 'fastapi'
      }
    } catch (error) {
      this.logger.debug('Could not detect framework')
    }

    return undefined
  }

  /**
   * Detect testing framework
   */
  private async detectTestingFramework(): Promise<string | undefined> {
    try {
      const packageJsonPath = join(this.projectPath, 'package.json')
      if (await pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

        if (deps.jest) return 'jest'
        if (deps.vitest) return 'vitest'
        if (deps.mocha) return 'mocha'
        if (deps.cypress) return 'cypress'
        if (deps.playwright || deps['@playwright/test']) return 'playwright'
        if (deps['@testing-library/react']) return 'react-testing-library'
      }
    } catch (error) {
      this.logger.debug('Could not detect testing framework')
    }

    return undefined
  }

  /**
   * Detect build system
   */
  private async detectBuildSystem(): Promise<string | undefined> {
    const files = await this.scanFilesystem()
    
    if (files.some(f => f.includes('vite.config'))) return 'vite'
    if (files.some(f => f.includes('webpack.config'))) return 'webpack'
    if (files.some(f => f.includes('rollup.config'))) return 'rollup'
    if (files.some(f => f.includes('next.config'))) return 'next.js'
    if (files.some(f => f.includes('Cargo.toml'))) return 'cargo'
    if (files.some(f => f.includes('go.mod'))) return 'go build'

    return undefined
  }

  /**
   * Detect CI/CD platform
   */
  private async detectCICDPlatform(): Promise<string | undefined> {
    const files = await this.scanFilesystem()
    
    if (files.some(f => f.includes('.github/workflows'))) return 'github-actions'
    if (files.some(f => f.includes('.gitlab-ci.yml'))) return 'gitlab-ci'
    if (files.some(f => f.includes('azure-pipelines.yml'))) return 'azure-pipelines'
    if (files.some(f => f.includes('Jenkinsfile'))) return 'jenkins'

    return undefined
  }

  /**
   * Detect database technology
   */
  private async detectDatabase(): Promise<string | undefined> {
    try {
      const packageJsonPath = join(this.projectPath, 'package.json')
      if (await pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

        if (deps.mongodb || deps.mongoose) return 'mongodb'
        if (deps.pg || deps.postgres) return 'postgresql'
        if (deps.mysql || deps.mysql2) return 'mysql'
        if (deps.sqlite3 || deps['better-sqlite3']) return 'sqlite'
        if (deps.redis) return 'redis'
      }
    } catch (error) {
      this.logger.debug('Could not detect database')
    }

    return undefined
  }

  /**
   * Extract common code patterns
   */
  private async extractCodePatterns(): Promise<CodePatterns> {
    this.logger.debug('Extracting code patterns')

    // This would be much more sophisticated in practice
    // For now, we'll do basic pattern detection
    const patterns: CodePatterns = {
      common: await this.detectCommonPatterns(),
      architectural: await this.detectArchitecturalPatterns(),
      naming: await this.detectNamingPatterns(),
      imports: await this.detectImportPatterns()
    }

    return patterns
  }

  private async detectCommonPatterns(): Promise<string[]> {
    // Basic implementation - would be much more sophisticated
    const patterns: string[] = []
    
    try {
      const files = await this.scanFilesystem()
      const codeFiles = files.filter(f => /\.(js|ts|jsx|tsx)$/.test(f))
      
      // Sample some files to detect patterns
      for (const file of codeFiles.slice(0, 10)) {
        try {
          const content = await readFile(join(this.projectPath, file), 'utf-8')
          
          if (content.includes('export {') && content.includes('} from')) {
            patterns.push('barrel-exports')
          }
          if (content.includes('try {') && content.includes('catch')) {
            patterns.push('error-handling')
          }
          if (content.includes('async ') && content.includes('await ')) {
            patterns.push('async-await')
          }
        } catch (error) {
          continue
        }
      }
    } catch (error) {
      this.logger.debug('Could not analyze code patterns')
    }

    return [...new Set(patterns)] // Remove duplicates
  }

  private async detectArchitecturalPatterns(): Promise<string[]> {
    const patterns: string[] = []
    const files = await this.scanFilesystem()

    if (files.some(f => f.includes('components/'))) patterns.push('component-based')
    if (files.some(f => f.includes('services/'))) patterns.push('service-layer')
    if (files.some(f => f.includes('utils/') || f.includes('helpers/'))) patterns.push('utility-functions')
    if (files.some(f => f.includes('types/') || f.includes('interfaces/'))) patterns.push('type-definitions')

    return patterns
  }

  private async detectNamingPatterns(): Promise<string[]> {
    const patterns: string[] = []
    const files = await this.scanFilesystem()

    const hasKebabCase = files.some(f => /[a-z]+-[a-z]+/.test(basename(f)))
    const hasCamelCase = files.some(f => /[a-z][A-Z]/.test(basename(f)))
    const hasPascalCase = files.some(f => /^[A-Z][a-z]/.test(basename(f)))

    if (hasKebabCase) patterns.push('kebab-case')
    if (hasCamelCase) patterns.push('camelCase')
    if (hasPascalCase) patterns.push('PascalCase')

    return patterns
  }

  private async detectImportPatterns(): Promise<string[]> {
    // Would analyze actual import statements in code
    return ['relative-imports', 'absolute-imports']
  }

  /**
   * Run quality analysis using available tools
   */
  private async runQualityAnalysis(): Promise<QualityMetrics> {
    this.logger.debug('Running quality analysis')

    let metrics: QualityMetrics = {
      hasQualityGates: false,
      linting: false,
      formatting: false
    }

    // Use SonarCloud MCP if available
    if (this.mcpService.isAvailable('sonarcloud')) {
      try {
        const sonarResults = await this.mcpService.callMCP('sonarcloud', 'get_project_analysis', {
          projectKey: await this.detectProjectKey()
        })
        
        metrics = {
          ...metrics,
          coverage: sonarResults.coverage,
          complexity: sonarResults.complexity,
          hasQualityGates: true
        }
      } catch (error) {
        this.logger.debug('SonarCloud analysis failed, using basic analysis')
      }
    }

    // Fallback to basic analysis
    const basicAnalysis = await this.basicQualityAnalysis()
    return { ...basicAnalysis, ...metrics }
  }

  private async basicQualityAnalysis(): Promise<QualityMetrics> {
    const files = await this.scanFilesystem()
    
    return {
      hasQualityGates: files.some(f => f.includes('.eslintrc') || f.includes('sonar')),
      linting: files.some(f => f.includes('.eslintrc')),
      formatting: files.some(f => f.includes('.prettierrc'))
    }
  }

  private async detectProjectKey(): Promise<string> {
    // Would detect from sonar-project.properties or similar
    return basename(this.projectPath)
  }

  /**
   * Analyze dependencies
   */
  private async analyzeDependencies(): Promise<DependencyAnalysis> {
    this.logger.debug('Analyzing dependencies')

    try {
      const packageJsonPath = join(this.projectPath, 'package.json')
      if (await pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
        
        const dependencies = [
          ...Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
            name, version: version as string, type: 'dependency' as const
          })),
          ...Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
            name, version: version as string, type: 'devDependency' as const
          })),
          ...Object.entries(packageJson.peerDependencies || {}).map(([name, version]) => ({
            name, version: version as string, type: 'peerDependency' as const
          }))
        ]

        return {
          packageManager: await this.detectPackageManager(),
          dependencies,
          outdated: [] // Would need npm outdated or similar
        }
      }
    } catch (error) {
      this.logger.debug('Could not analyze dependencies')
    }

    return {
      packageManager: 'unknown',
      dependencies: [],
      outdated: []
    }
  }

  private async detectPackageManager(): Promise<string> {
    const files = await this.scanFilesystem()
    
    if (files.some(f => f.includes('yarn.lock'))) return 'yarn'
    if (files.some(f => f.includes('pnpm-lock.yaml'))) return 'pnpm'
    if (files.some(f => f.includes('package-lock.json'))) return 'npm'
    
    return 'npm' // Default
  }

  /**
   * Analyze existing test setup
   */
  private async analyzeExistingTests(): Promise<ExistingTestingStrategy> {
    this.logger.debug('Analyzing existing test setup')

    const files = await this.scanFilesystem()
    const testFiles = files.filter(f => 
      f.includes('test') || f.includes('spec') || f.includes('__tests__')
    )

    const hasTests = testFiles.length > 0
    const framework = await this.detectTestingFramework()
    const testDirectories = this.findTestDirectories(files)

    return {
      hasTests,
      framework,
      testDirectories,
      coverage: await this.analyzeCoverageSetup(),
      e2e: await this.analyzeE2ESetup()
    }
  }

  private async analyzeCoverageSetup(): Promise<{ configured: boolean; threshold?: number; tool?: string }> {
    try {
      const packageJsonPath = join(this.projectPath, 'package.json')
      if (await pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
        
        if (packageJson.jest?.collectCoverage) {
          return {
            configured: true,
            threshold: packageJson.jest.coverageThreshold?.global?.lines,
            tool: 'jest'
          }
        }
      }
    } catch (error) {
      this.logger.debug('Could not analyze coverage setup')
    }

    return { configured: false }
  }

  private async analyzeE2ESetup(): Promise<{ configured: boolean; framework?: string }> {
    const framework = await this.detectTestingFramework()
    const hasE2E = ['cypress', 'playwright'].includes(framework || '')

    return {
      configured: hasE2E,
      framework: hasE2E ? framework : undefined
    }
  }

  /**
   * Save analysis results
   */
  private async saveAnalysis(analysis: ProjectAnalysis): Promise<void> {
    const projectTazzDir = getProjectTazzDir(this.projectPath)
    const analysisPath = join(projectTazzDir, 'analysis.json')
    
    await ensureFile(analysisPath)
    await writeFile(analysisPath, JSON.stringify(analysis, null, 2))
    
    this.logger.debug('Analysis saved', { path: analysisPath })
  }
}