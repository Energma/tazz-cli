import { writeFile, ensureFile, ensureDir } from 'fs-extra'
import { join } from 'path'
import { ProjectAnalysis, TazzError } from '../types'
import { Logger } from '../../utils/logger'
import { getProjectTazzDir } from '../../utils/paths'

export class RulesGenerationError extends TazzError {
  readonly code = 'RULES_GENERATION_ERROR'
  readonly severity = 'medium'
}

export interface TazzRules {
  codeStyle: CodeStyleRules
  testing: TestingRules
  gitWorkflow: GitWorkflowRules
  qualityGates: QualityGateRules
  agentBehavior: AgentBehaviorRules
}

export interface CodeStyleRules {
  language: string
  formatter?: string
  linter?: string
  rules: Record<string, string>
  examples: Record<string, string>
  patterns: string[]
}

export interface TestingRules {
  framework: string
  testLocation: string
  namingConvention: string
  coverage: {
    minimum: number
    enforce: boolean
  }
  patterns: {
    unit: string[]
    integration: string[]
    e2e: string[]
  }
  templates: {
    unit?: string
    integration?: string
    e2e?: string
  }
}

export interface GitWorkflowRules {
  branchNaming: string
  commitMessage: {
    format: string
    examples: string[]
  }
  pullRequest: {
    template: string
    requirements: string[]
  }
}

export interface QualityGateRules {
  coverage: {
    minimum: number
    failOnDecrease: boolean
  }
  linting: {
    required: boolean
    autoFix: boolean
  }
  testing: {
    required: boolean
    types: string[]
  }
  security: {
    scanRequired: boolean
    tools: string[]
  }
}

export interface AgentBehaviorRules {
  codeGeneration: {
    followPatterns: boolean
    useExistingStyles: boolean
    includeTests: boolean
  }
  fileModification: {
    backupFirst: boolean
    formatAfter: boolean
    runLinter: boolean
  }
  documentation: {
    updateReadme: boolean
    includeComments: boolean
    generateChangelog: boolean
  }
}

export class IntelligentRulesGenerator {
  private logger: Logger
  private projectPath: string

  constructor(logger: Logger, projectPath: string = process.cwd()) {
    this.logger = logger
    this.projectPath = projectPath
  }

  /**
   * Generate complete set of project rules based on analysis
   */
  async generateProjectRules(analysis: ProjectAnalysis): Promise<TazzRules> {
    this.logger.info('Generating intelligent project rules', {
      projectType: analysis.structure.type,
      language: analysis.technologies.language
    })

    try {
      const rules: TazzRules = {
        codeStyle: await this.generateCodeStyleRules(analysis),
        testing: await this.generateTestingRules(analysis),
        gitWorkflow: await this.generateGitRules(analysis),
        qualityGates: await this.generateQualityGates(analysis),
        agentBehavior: await this.generateAgentRules(analysis)
      }

      // Write rules to .tazz/rules/
      await this.writeRulesToFiles(rules)
      
      this.logger.info('Project rules generated successfully')
      return rules
    } catch (error) {
      this.logger.error('Failed to generate project rules', error)
      throw new RulesGenerationError('Rules generation failed', {
        projectPath: this.projectPath
      }, error)
    }
  }

  /**
   * Generate code style rules based on detected patterns
   */
  private async generateCodeStyleRules(analysis: ProjectAnalysis): Promise<CodeStyleRules> {
    const language = analysis.technologies.language
    const framework = analysis.technologies.framework
    const patterns = analysis.patterns

    const rules = new Map<string, string>()
    const examples = new Map<string, string>()

    // Language-specific rules
    switch (language) {
      case 'typescript':
        rules.set('types', 'Use explicit types for function parameters and return values')
        rules.set('imports', 'Prefer absolute imports from src/ directory')
        rules.set('interfaces', 'Use interfaces for object shapes, types for unions/primitives')
        examples.set('function', 'function processData(input: string): ProcessedData { ... }')
        examples.set('import', "import { utils } from '@/utils'")
        break
        
      case 'javascript':
        rules.set('functions', 'Use const for function declarations when possible')
        rules.set('destructuring', 'Use destructuring for object properties')
        examples.set('function', 'const processData = (input) => { ... }')
        break
        
      case 'python':
        rules.set('naming', 'Use snake_case for variables and functions')
        rules.set('docstrings', 'Include docstrings for all public functions')
        examples.set('function', 'def process_data(input_str: str) -> ProcessedData:')
        break
    }

    // Framework-specific rules
    if (framework === 'react') {
      rules.set('components', 'Use functional components with hooks')
      rules.set('props', 'Destructure props in component signature')
      examples.set('component', 'const MyComponent: React.FC<Props> = ({ title, children }) => ...')
    }

    // Pattern-based rules
    if (patterns.common.includes('async-await')) {
      rules.set('async', 'Use async/await instead of .then() chains')
      examples.set('async', 'const data = await fetchData() instead of fetchData().then()')
    }

    if (patterns.common.includes('error-handling')) {
      rules.set('errors', 'Wrap async operations in try-catch with proper error types')
      examples.set('error', 'try { await riskyOperation() } catch (error: OperationError) { ... }')
    }

    return {
      language,
      formatter: this.detectFormatter(analysis),
      linter: this.detectLinter(analysis),
      rules: Object.fromEntries(rules),
      examples: Object.fromEntries(examples),
      patterns: patterns.common
    }
  }

  private detectFormatter(analysis: ProjectAnalysis): string | undefined {
    if (analysis.quality.formatting) {
      if (analysis.technologies.language === 'python') return 'black'
      return 'prettier'
    }
    return undefined
  }

  private detectLinter(analysis: ProjectAnalysis): string | undefined {
    if (analysis.quality.linting) {
      switch (analysis.technologies.language) {
        case 'typescript':
        case 'javascript':
          return 'eslint'
        case 'python':
          return 'pylint'
        default:
          return 'generic'
      }
    }
    return undefined
  }

  /**
   * Generate testing rules based on existing setup
   */
  private async generateTestingRules(analysis: ProjectAnalysis): Promise<TestingRules> {
    const testingStrategy = analysis.testingStrategy
    const framework = testingStrategy.framework || this.inferTestingFramework(analysis)

    return {
      framework,
      testLocation: testingStrategy.testDirectories[0] || 'tests/',
      namingConvention: this.detectTestNaming(analysis),
      coverage: {
        minimum: testingStrategy.coverage?.threshold || 80,
        enforce: testingStrategy.coverage?.configured || false
      },
      patterns: {
        unit: await this.generateUnitTestPatterns(analysis),
        integration: await this.generateIntegrationTestPatterns(analysis),
        e2e: await this.generateE2ETestPatterns(analysis)
      },
      templates: await this.generateTestTemplates(analysis)
    }
  }

  private inferTestingFramework(analysis: ProjectAnalysis): string {
    const language = analysis.technologies.language
    
    switch (language) {
      case 'typescript':
      case 'javascript':
        return 'vitest' // Modern default
      case 'python':
        return 'pytest'
      case 'go':
        return 'go test'
      case 'rust':
        return 'cargo test'
      default:
        return 'generic'
    }
  }

  private detectTestNaming(analysis: ProjectAnalysis): string {
    const hasSpecFiles = analysis.testingStrategy.testDirectories.some(dir => 
      dir.includes('spec')
    )
    
    return hasSpecFiles ? '*.spec.*' : '*.test.*'
  }

  private async generateUnitTestPatterns(analysis: ProjectAnalysis): Promise<string[]> {
    const patterns = [
      'Test individual functions in isolation',
      'Mock external dependencies',
      'Use descriptive test names that explain the scenario'
    ]

    if (analysis.technologies.framework === 'react') {
      patterns.push('Test component behavior, not implementation details')
      patterns.push('Use React Testing Library for component tests')
    }

    return patterns
  }

  private async generateIntegrationTestPatterns(analysis: ProjectAnalysis): Promise<string[]> {
    const patterns = [
      'Test interactions between modules',
      'Use real dependencies where possible'
    ]

    if (analysis.structure.hasAPI) {
      patterns.push('Test API endpoints with real database')
      patterns.push('Validate request/response schemas')
    }

    return patterns
  }

  private async generateE2ETestPatterns(analysis: ProjectAnalysis): Promise<string[]> {
    const patterns = []

    if (analysis.structure.hasFrontend) {
      patterns.push('Test complete user workflows')
      patterns.push('Use page object pattern for maintainability')
      patterns.push('Test critical user paths first')
    }

    return patterns
  }

  private async generateTestTemplates(analysis: ProjectAnalysis): Promise<Partial<TestingRules['templates']>> {
    const templates: Partial<TestingRules['templates']> = {}

    // Generate unit test template
    templates.unit = await this.createUnitTestTemplate(analysis)

    // Generate integration test template if API detected
    if (analysis.structure.hasAPI) {
      templates.integration = await this.createIntegrationTestTemplate(analysis)
    }

    // Generate E2E test template if frontend detected  
    if (analysis.structure.hasFrontend) {
      templates.e2e = await this.createE2ETestTemplate(analysis)
    }

    return templates
  }

  private async createUnitTestTemplate(analysis: ProjectAnalysis): Promise<string> {
    const language = analysis.technologies.language
    const framework = analysis.testingStrategy.framework || this.inferTestingFramework(analysis)

    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.createJSUnitTestTemplate(framework, analysis)
      case 'python':
        return this.createPythonUnitTestTemplate()
      default:
        return this.createGenericUnitTestTemplate()
    }
  }

  private createJSUnitTestTemplate(framework: string, analysis: ProjectAnalysis): string {
    const isReact = analysis.technologies.framework === 'react'
    
    let template = `import { describe, it, expect, beforeEach } from '${framework}'`
    
    if (isReact) {
      template += `\nimport { render, screen } from '@testing-library/react'`
    }
    
    template += `\nimport { {{COMPONENT_NAME}} } from '../src/{{COMPONENT_PATH}}'

describe('{{COMPONENT_NAME}}', () => {
  beforeEach(() => {
    // Setup test data and mocks
  })

  it('should {{TEST_DESCRIPTION}}', async () => {
    // Arrange
    const input = {{TEST_INPUT}}

    // Act  
    const result = {{COMPONENT_NAME}}(input)

    // Assert
    expect(result).{{ASSERTION}}
  })

  it('should handle error cases', () => {
    // Test error scenarios
  })
})`

    return template
  }

  private createPythonUnitTestTemplate(): string {
    return `import pytest
from unittest.mock import Mock, patch
from src.{{MODULE_NAME}} import {{FUNCTION_NAME}}

class Test{{FUNCTION_NAME}}:
    def setup_method(self):
        \"\"\"Setup test data before each test.\"\"\"
        pass

    def test_{{FUNCTION_NAME}}_success(self):
        \"\"\"Test {{FUNCTION_NAME}} with valid input.\"\"\"
        # Arrange
        input_data = {{TEST_INPUT}}
        
        # Act
        result = {{FUNCTION_NAME}}(input_data)
        
        # Assert
        assert result == {{EXPECTED_OUTPUT}}

    def test_{{FUNCTION_NAME}}_error(self):
        \"\"\"Test {{FUNCTION_NAME}} error handling.\"\"\"
        with pytest.raises({{EXCEPTION_TYPE}}):
            {{FUNCTION_NAME}}(invalid_input)
`
  }

  private createGenericUnitTestTemplate(): string {
    return `// Unit test template for {{COMPONENT_NAME}}
// Generated by Tazz CLI

describe('{{COMPONENT_NAME}}', () => {
  // Add your test cases here
})`
  }

  private async createIntegrationTestTemplate(analysis: ProjectAnalysis): Promise<string> {
    return `// Integration test template for API endpoints
import request from 'supertest'
import app from '../src/app'

describe('{{API_ENDPOINT}}', () => {
  beforeEach(async () => {
    // Setup test database
  })

  afterEach(async () => {
    // Cleanup test data
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

  private async createE2ETestTemplate(analysis: ProjectAnalysis): Promise<string> {
    const hasPlaywright = analysis.testingStrategy.e2e?.framework === 'playwright'
    
    if (hasPlaywright) {
      return `import { test, expect } from '@playwright/test'

test.describe('{{FEATURE_NAME}}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${analysis.structure.baseURL || 'http://localhost:3000'}')
  })

  test('should {{TEST_DESCRIPTION}}', async ({ page }) => {
    // Navigate and interact with page
    await page.click('{{SELECTOR}}')
    await page.fill('input[name="{{INPUT_NAME}}"]', '{{TEST_VALUE}}')
    
    // Assert expected results
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

  /**
   * Generate Git workflow rules
   */
  private async generateGitRules(analysis: ProjectAnalysis): Promise<GitWorkflowRules> {
    return {
      branchNaming: this.detectBranchNamingConvention(analysis),
      commitMessage: {
        format: 'type(scope): description',
        examples: [
          'feat(auth): add OAuth integration',
          'fix(api): resolve timeout issues',
          'docs(readme): update installation guide'
        ]
      },
      pullRequest: {
        template: await this.generatePRTemplate(analysis),
        requirements: [
          'All tests must pass',
          'Code coverage must not decrease',
          'PR description must be filled',
          'At least one approval required'
        ]
      }
    }
  }

  private detectBranchNamingConvention(analysis: ProjectAnalysis): string {
    // Could analyze existing branches via git MCP
    return 'feature/JIRA-123-description'
  }

  private async generatePRTemplate(analysis: ProjectAnalysis): string {
    return `## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally`
  }

  /**
   * Generate quality gate rules
   */
  private async generateQualityGates(analysis: ProjectAnalysis): Promise<QualityGateRules> {
    return {
      coverage: {
        minimum: analysis.quality.coverageThreshold || 80,
        failOnDecrease: analysis.quality.hasQualityGates
      },
      linting: {
        required: analysis.quality.linting,
        autoFix: true
      },
      testing: {
        required: analysis.testingStrategy.hasTests,
        types: this.getRequiredTestTypes(analysis)
      },
      security: {
        scanRequired: analysis.quality.hasQualityGates,
        tools: this.getSecurityTools(analysis)
      }
    }
  }

  private getRequiredTestTypes(analysis: ProjectAnalysis): string[] {
    const types = ['unit']
    
    if (analysis.structure.hasAPI) types.push('integration')
    if (analysis.structure.hasFrontend) types.push('e2e')
    
    return types
  }

  private getSecurityTools(analysis: ProjectAnalysis): string[] {
    const tools: string[] = []
    
    if (analysis.technologies.language === 'javascript' || analysis.technologies.language === 'typescript') {
      tools.push('npm audit')
    }
    
    if (analysis.quality.hasQualityGates) {
      tools.push('sonarcloud')
    }
    
    return tools
  }

  /**
   * Generate agent behavior rules
   */
  private async generateAgentRules(analysis: ProjectAnalysis): Promise<AgentBehaviorRules> {
    return {
      codeGeneration: {
        followPatterns: true,
        useExistingStyles: true,
        includeTests: analysis.testingStrategy.hasTests
      },
      fileModification: {
        backupFirst: true,
        formatAfter: analysis.quality.formatting,
        runLinter: analysis.quality.linting
      },
      documentation: {
        updateReadme: true,
        includeComments: analysis.technologies.language === 'python', // Python emphasizes docstrings
        generateChangelog: analysis.quality.hasQualityGates
      }
    }
  }

  /**
   * Write all rules to separate files
   */
  private async writeRulesToFiles(rules: TazzRules): Promise<void> {
    const projectTazzDir = getProjectTazzDir(this.projectPath)
    const rulesDir = join(projectTazzDir, 'rules')
    await ensureDir(rulesDir)

    // Write each rule category to its own file
    await Promise.all([
      this.writeRuleFile(join(rulesDir, 'code-style.json'), rules.codeStyle),
      this.writeRuleFile(join(rulesDir, 'testing.json'), rules.testing),
      this.writeRuleFile(join(rulesDir, 'git-workflow.json'), rules.gitWorkflow),
      this.writeRuleFile(join(rulesDir, 'quality-gates.json'), rules.qualityGates),
      this.writeRuleFile(join(rulesDir, 'agent-behavior.json'), rules.agentBehavior),
    ])

    // Write combined rules file
    await this.writeRuleFile(join(rulesDir, 'all-rules.json'), rules)

    this.logger.info('Rules files written', { rulesDir })
  }

  private async writeRuleFile(path: string, content: any): Promise<void> {
    await ensureFile(path)
    await writeFile(path, JSON.stringify(content, null, 2))
  }

  /**
   * Generate hook scripts for Claude Code integration
   */
  async generateHookScripts(analysis: ProjectAnalysis): Promise<void> {
    this.logger.info('Generating Claude Code hook scripts')

    const projectTazzDir = getProjectTazzDir(this.projectPath)
    const hooksDir = join(projectTazzDir, 'hooks')
    await ensureDir(hooksDir)

    // Generate different types of hooks
    await Promise.all([
      this.generateSessionStartHook(hooksDir, analysis),
      this.generatePreToolHook(hooksDir, analysis),
      this.generatePostToolHook(hooksDir, analysis),
      this.generateQualityGateHook(hooksDir, analysis),
      this.generateJiraIntegrationHook(hooksDir, analysis)
    ])

    this.logger.info('Hook scripts generated', { hooksDir })
  }

  private async generateSessionStartHook(hooksDir: string, analysis: ProjectAnalysis): Promise<void> {
    const script = `#!/bin/bash
# Auto-generated session start hook for ${analysis.structure.type} project

SESSION_ID="$1"
TASK_DESCRIPTION="$2"

echo "🌀 Starting Tazz session: $SESSION_ID"

# Set session environment
export TAZZ_SESSION_ID="$SESSION_ID"
export TAZZ_ACTIVE="true"
export TAZZ_PROJECT_TYPE="${analysis.structure.type}"
export TAZZ_LANGUAGE="${analysis.technologies.language}"

# Initialize session context
tazz context set --session "$SESSION_ID" --task "$TASK_DESCRIPTION"

# Load project rules
tazz rules load --session "$SESSION_ID"

# Setup development environment
${this.getEnvSetupCommands(analysis)}

echo "✅ Session $SESSION_ID ready"
`

    await this.writeExecutableScript(join(hooksDir, 'session-start.sh'), script)
  }

  private async generatePreToolHook(hooksDir: string, analysis: ProjectAnalysis): Promise<void> {
    const script = `#!/bin/bash
# Pre-tool execution hook

TOOL_NAME="$1"
TOOL_PARAMS="$2"

if [[ "$TAZZ_ACTIVE" == "true" ]]; then
    CURRENT_SESSION=$(tazz current-session)
    
    if [[ -n "$CURRENT_SESSION" ]]; then
        # Log tool usage
        tazz log tool-use --session "$CURRENT_SESSION" --tool "$TOOL_NAME"
        
        # Validate against project rules
        tazz validate --session "$CURRENT_SESSION" --tool "$TOOL_NAME" --params "$TOOL_PARAMS"
        
        # Pre-execution setup
        case "$TOOL_NAME" in
            "Edit"|"Write")
                tazz backup --session "$CURRENT_SESSION"
                ;;
            "Bash")
                tazz safety-check --session "$CURRENT_SESSION" --command "$TOOL_PARAMS"
                ;;
        esac
    fi
fi
`

    await this.writeExecutableScript(join(hooksDir, 'pre-tool.sh'), script)
  }

  private async generatePostToolHook(hooksDir: string, analysis: ProjectAnalysis): Promise<void> {
    const formatCommand = analysis.quality.formatting ? this.getFormatCommand(analysis) : 'echo "No formatting configured"'
    const lintCommand = analysis.quality.linting ? this.getLintCommand(analysis) : 'echo "No linting configured"'

    const script = `#!/bin/bash
# Post-tool execution hook

TOOL_NAME="$1"
TOOL_RESULT="$2"

if [[ "$TAZZ_ACTIVE" == "true" ]]; then
    CURRENT_SESSION=$(tazz current-session)
    
    if [[ -n "$CURRENT_SESSION" ]]; then
        case "$TOOL_NAME" in
            "Edit"|"Write")
                # Format code
                ${formatCommand}
                
                # Run linting
                ${lintCommand}
                ;;
            "Bash")
                tazz log command-result --session "$CURRENT_SESSION" --result "$TOOL_RESULT"
                ;;
        esac
        
        # Update task progress
        tazz task update --session "$CURRENT_SESSION"
        
        # Auto-commit if configured
        if tazz config get auto-commit --session "$CURRENT_SESSION"; then
            tazz commit --session "$CURRENT_SESSION" --auto
        fi
    fi
fi
`

    await this.writeExecutableScript(join(hooksDir, 'post-tool.sh'), script)
  }

  private async generateQualityGateHook(hooksDir: string, analysis: ProjectAnalysis): Promise<void> {
    const testCommand = this.getTestCommand(analysis)
    const coverageCommand = this.getCoverageCommand(analysis)

    const script = `#!/bin/bash
# Quality gate hook

SESSION_ID="$1"

echo "🔍 Running quality gates for session $SESSION_ID"

# Run tests
if ! ${testCommand}; then
    tazz task mark-blocked --session "$SESSION_ID" --reason "Tests failing"
    exit 1
fi

# Check coverage
COVERAGE=$(${coverageCommand})
MIN_COVERAGE=${analysis.quality.coverageThreshold || 80}

if (( $(echo "$COVERAGE < $MIN_COVERAGE" | bc -l) )); then
    tazz task mark-blocked --session "$SESSION_ID" --reason "Coverage below $MIN_COVERAGE%"
    exit 1
fi

echo "✅ Quality gates passed for session $SESSION_ID"
`

    await this.writeExecutableScript(join(hooksDir, 'quality-gate.sh'), script)
  }

  private async generateJiraIntegrationHook(hooksDir: string, analysis: ProjectAnalysis): Promise<void> {
    const script = `#!/bin/bash
# Jira integration hook

SESSION_ID="$1"
TASK_TYPE="$2"

if [[ "$SESSION_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "🎫 Fetching Jira ticket: $SESSION_ID"
    
    # Use Atlassian MCP to fetch ticket details
    TICKET_INFO=$(tazz mcp call atlassian jira_get_issue --issue-key "$SESSION_ID")
    
    # Extract task information
    TITLE=$(echo "$TICKET_INFO" | jq -r '.fields.summary')
    DESCRIPTION=$(echo "$TICKET_INFO" | jq -r '.fields.description')
    PRIORITY=$(echo "$TICKET_INFO" | jq -r '.fields.priority.name')
    
    # Update session context
    tazz context set --session "$SESSION_ID" \\
        --title "$TITLE" \\
        --description "$DESCRIPTION" \\
        --priority "$PRIORITY"
        
    # Set branch naming convention  
    BRANCH_NAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g')
    tazz git set-branch --session "$SESSION_ID" --name "feature/$SESSION_ID-$BRANCH_NAME"
    
    echo "✅ Jira integration complete for $SESSION_ID"
fi
`

    await this.writeExecutableScript(join(hooksDir, 'jira-integration.sh'), script)
  }

  private getEnvSetupCommands(analysis: ProjectAnalysis): string {
    const commands: string[] = []

    if (analysis.technologies.language === 'javascript' || analysis.technologies.language === 'typescript') {
      commands.push('# Ensure dependencies are installed')
      commands.push('if [[ ! -d "node_modules" ]]; then npm install; fi')
    }

    if (analysis.technologies.language === 'python') {
      commands.push('# Activate virtual environment if exists')
      commands.push('if [[ -d "venv" ]]; then source venv/bin/activate; fi')
    }

    return commands.join('\n')
  }

  private getFormatCommand(analysis: ProjectAnalysis): string {
    if (analysis.technologies.language === 'python') {
      return 'black . || echo "Formatting skipped"'
    }
    return 'npx prettier --write . || echo "Formatting skipped"'
  }

  private getLintCommand(analysis: ProjectAnalysis): string {
    switch (analysis.technologies.language) {
      case 'typescript':
      case 'javascript':
        return 'npx eslint --fix . || echo "Linting skipped"'
      case 'python':
        return 'pylint . || echo "Linting skipped"'
      default:
        return 'echo "No linting configured"'
    }
  }

  private getTestCommand(analysis: ProjectAnalysis): string {
    const framework = analysis.testingStrategy.framework

    switch (framework) {
      case 'jest':
        return 'npm test'
      case 'vitest':
        return 'npx vitest run'
      case 'pytest':
        return 'python -m pytest'
      case 'go test':
        return 'go test ./...'
      case 'cargo test':
        return 'cargo test'
      default:
        return 'echo "No test command configured"'
    }
  }

  private getCoverageCommand(analysis: ProjectAnalysis): string {
    const framework = analysis.testingStrategy.framework

    switch (framework) {
      case 'jest':
        return 'npm test -- --coverage --silent | grep "All files" | awk \'{print $10}\' | sed \'s/%//\''
      case 'vitest':
        return 'npx vitest run --coverage --silent | grep "All files" | awk \'{print $4}\' | sed \'s/%//\''
      case 'pytest':
        return 'python -m pytest --cov=. --cov-report=term-missing | grep TOTAL | awk \'{print $4}\' | sed \'s/%//\''
      default:
        return 'echo "0"'
    }
  }

  private async writeExecutableScript(path: string, content: string): Promise<void> {
    await ensureFile(path)
    await writeFile(path, content)
    
    // Make script executable
    const fs = await import('fs')
    await fs.promises.chmod(path, 0o755)
  }
}