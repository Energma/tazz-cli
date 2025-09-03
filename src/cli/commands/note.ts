import { Command } from 'commander'
import chalk from 'chalk'
import { spawn } from 'child_process'
import { pathExists, readFile, writeFile, ensureFile } from 'fs-extra'
import { join } from 'path'
import { getLogger } from '../../utils/logger'

export class NoteCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('note')
      .description('📝 Open editor to create/edit tasks and prompts')
      .option('-e, --editor <editor>', 'Specify editor (code, vim, nano)', 'code')
      .option('-t, --template <type>', 'Use template (task, prompt, session)', 'task')
      .action(async (options) => {
        await this.execute(options)
      })
  }

  async execute(options: {
    editor?: string
    template?: string
  } = {}): Promise<void> {
    console.log('')
    console.log(chalk.bold.cyan('📝 Tazz Note Editor'))
    console.log(chalk.gray('Creating/editing tasks and prompts...'))
    console.log('')

    const projectPath = process.cwd()
    const notesDir = join(projectPath, '.tazz')
    
    // Ensure .tazz directory exists
    if (!await pathExists(notesDir)) {
      console.log(chalk.yellow('⚠️  Project not initialized with Tazz'))
      console.log(chalk.gray('Run'), chalk.cyan('tazz make'), chalk.gray('first to set up the project'))
      return
    }

    const notesFile = join(notesDir, 'tazz-todo.md')
    
    try {
      // Ensure the notes file exists with template content
      await this.ensureNotesFile(notesFile, options.template || 'task')
      
      // Open in specified editor
      await this.openInEditor(notesFile, options.editor || 'code')
      
      console.log('')
      console.log(chalk.green('✅ Notes file ready for editing'))
      console.log(chalk.gray('File:'), chalk.cyan(notesFile))
      console.log('')
      console.log(chalk.bold('Next steps:'))
      console.log(chalk.gray('• Edit your tasks and prompts'))
      console.log(chalk.gray('• Run'), chalk.cyan('tazz run <session-name>'), chalk.gray('to start working'))
      console.log('')
      
    } catch (error) {
      this.logger.error('Failed to open notes editor', error as Error)
      console.log(chalk.red('❌ Failed to open editor'))
      console.log(chalk.gray('Try specifying a different editor with --editor'))
    }
  }

  private async ensureNotesFile(filePath: string, template: string): Promise<void> {
    await ensureFile(filePath)
    
    // Check if file is empty or doesn't exist
    let content = ''
    try {
      content = await readFile(filePath, 'utf-8')
    } catch {
      // File doesn't exist, will create with template
    }

    if (!content.trim()) {
      const templateContent = this.getTemplate(template)
      await writeFile(filePath, templateContent)
      this.logger.info('Created notes file with template', { template, filePath })
    }
  }

  private getTemplate(templateType: string): string {
    switch (templateType) {
      case 'prompt':
        return `# Tazz Development Prompt

## Context
Describe the current state and what you're working on...

## Goal
What do you want to achieve?

## Tasks
- [ ] Task 1: Specific actionable item
- [ ] Task 2: Another specific task
- [ ] Task 3: Final task

## Constraints
- Technical constraints
- Time constraints  
- Requirements to consider

## Success Criteria
- [ ] How will you know you're done?
- [ ] What should be tested?
- [ ] What documentation is needed?

## Notes
Add any additional context, links, or references...
`

      case 'session':
        return `# Tazz Session Plan

## Session: [SESSION-NAME]
Brief description of this development session...

## Epic/Feature
Link to larger epic or feature this belongs to...

## User Story
As a [user type], I want [functionality] so that [benefit]...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Development Tasks
- [ ] Setup/configuration
- [ ] Core implementation
- [ ] Testing
- [ ] Documentation
- [ ] Code review

## Technical Notes
- Architecture decisions
- Dependencies
- Integration points

## Definition of Done
- [ ] Code complete
- [ ] Tests passing
- [ ] Peer reviewed
- [ ] Documentation updated
`

      default: // 'task'
        return `# Tazz Task Template

## Session Tasks
- [ ] Task 1: Complete implementation
      Session name: task-1
      Description: 
        Implement the main functionality for this feature. This context will be passed to the Claude instance in the tmux session.

- [ ] Task 2: Write tests
      Session name: task-2
      Description: 
        Create comprehensive tests for the implemented functionality. Focus on unit tests and integration tests.

- [ ] Task 3: Update documentation
      Session name: task-3
      Description: 
        Update relevant documentation including README, API docs, and inline comments.

- [ ] Task 4: Code review preparation
      Session name: task-4
      Description: 
        Prepare code for review, run linting, fix any issues, and ensure quality standards are met.

## In Progress
- [ ] Current task being worked on...
      Session name: current-task
      Description: 
        Description of what is currently being implemented or debugged.

## Blocked
- [ ] Task waiting for dependency
      Session name: blocked-task
      Description: 
        Describe what is blocking this task and what needs to be resolved.

## Quality Checklist
- [ ] Code follows project patterns
- [ ] Tests pass locally
- [ ] Coverage meets threshold
- [ ] Code reviewed
- [ ] Documentation updated

## Session Notes
Add notes about current session, decisions made, next steps...

## Quick Commands
\`\`\`bash
# Run all tasks (creates separate tmux sessions)
tazz run instance-name

# Join specific task session
tazz join instance-name task-1

# List all active sessions
tazz list

# Join main instance session
tazz join instance-name
\`\`\`
`
    }
  }

  private async openInEditor(filePath: string, editor: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const editorCommands: Record<string, string[]> = {
        'code': ['code', filePath],
        'vim': ['vim', filePath],
        'nano': ['nano', filePath],
        'emacs': ['emacs', filePath],
        'subl': ['subl', filePath],
        'atom': ['atom', filePath]
      }

      const command = editorCommands[editor] || ['code', filePath]
      
      console.log(chalk.gray(`Opening with: ${command.join(' ')}`))
      
      const process = spawn(command[0], command.slice(1), {
        stdio: 'inherit',
        shell: true
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Editor exited with code ${code}`))
        }
      })

      process.on('error', (error) => {
        reject(error)
      })
    })
  }
}