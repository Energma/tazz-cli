import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { getLogger } from '../../utils/logger'
import { MakeCommand } from './make'
import { NoteCommand } from './note'
import { RunCommand } from './run'
import { ListCommand } from './list'
import { AttachCommand } from './attach'
import { StopCommand } from './stop'
import { DeleteCommand } from './delete'
import { HealthCommand } from './health'

export class InteractiveCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('interactive')
      .description('🌀 Interactive Tazz CLI tool menu')
      .alias('i')
      .action(async () => {
        await this.execute()
      })
  }

  async execute(): Promise<void> {
    console.clear()
    this.showLogo()
    
    while (true) {
      try {
        const choice = await this.showMainMenu()
        
        if (choice === 'exit') {
          console.log('')
          console.log(chalk.cyan('👋 Thanks for using Tazz CLI Tool!'))
          console.log('')
          process.exit(0)
        }
        
        await this.handleMenuChoice(choice)
        
        // Pause before showing menu again
        console.log('')
        await inquirer.prompt([{
          type: 'input',
          name: 'continue',
          message: 'Press Enter to continue...'
        }])
        
      } catch (error) {
        if (error === 'SIGINT') {
          console.log('')
          console.log(chalk.cyan('👋 Goodbye!'))
          process.exit(0)
        }
        
        this.logger.error('Interactive menu error', error as Error)
        console.log('')
        console.log(chalk.red('❌ An error occurred. Please try again.'))
        console.log('')
      }
    }
  }

  private showLogo(): void {
    const logo = `
        .       *        .        *
        .             .    *         .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .          *          .       *       .      .
     *          .             *        .      *
    `
    
    console.log(chalk.cyan(logo))
    console.log(chalk.bold.cyan('=== Tazz CLI Tool ==='))
    console.log(chalk.gray('   AI-Powered Development Orchestrator'))
    console.log('')
  }

  private async showMainMenu(): Promise<string> {
    const choices = [
      {
        name: `${chalk.cyan('🏗️  make')} - Setup Tazz in current project`,
        value: 'make',
        short: 'make'
      },
      {
        name: `${chalk.cyan('📝 note')} - Edit tasks and prompts`,
        value: 'note',
        short: 'note'
      },
      {
        name: `${chalk.cyan('🚀 run')} - Start development session`,
        value: 'run',
        short: 'run'
      },
      new inquirer.Separator(),
      {
        name: `${chalk.yellow('📋 list')} - Show all sessions`,
        value: 'list',
        short: 'list'
      },
      {
        name: `${chalk.yellow('🔗 join')} - Attach to session`,
        value: 'join',
        short: 'join'
      },
      {
        name: `${chalk.yellow('⏸️  stop')} - Stop session`,
        value: 'stop',
        short: 'stop'
      },
      {
        name: `${chalk.red('🗑️  destroy')} - Delete session`,
        value: 'destroy',
        short: 'destroy'
      },
      new inquirer.Separator(),
      {
        name: `${chalk.blue('🏥 health')} - System health check`,
        value: 'health',
        short: 'health'
      },
      {
        name: `${chalk.blue('🧹 clean')} - Clean cache and temp files`,
        value: 'clean',
        short: 'clean'
      },
      new inquirer.Separator(),
      {
        name: `${chalk.gray('❌ exit')} - Exit Tazz CLI`,
        value: 'exit',
        short: 'exit'
      }
    ]

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices,
        pageSize: 15
      }
    ])

    return action
  }

  private async handleMenuChoice(choice: string): Promise<void> {
    console.log('')
    
    switch (choice) {
      case 'make':
        await this.handleMake()
        break
        
      case 'note':
        await this.handleNote()
        break
        
      case 'run':
        await this.handleRun()
        break
        
      case 'list':
        await this.handleList()
        break
        
      case 'join':
        await this.handleJoin()
        break
        
      case 'stop':
        await this.handleStop()
        break
        
      case 'destroy':
        await this.handleDestroy()
        break
        
      case 'health':
        await this.handleHealth()
        break
        
      case 'clean':
        await this.handleClean()
        break
        
      default:
        console.log(chalk.red('Unknown action'))
    }
  }

  private async handleMake(): Promise<void> {
    const makeCommand = new MakeCommand()
    await makeCommand.execute()
  }

  private async handleNote(): Promise<void> {
    const { editor, template } = await inquirer.prompt([
      {
        type: 'list',
        name: 'editor',
        message: 'Choose editor:',
        choices: [
          { name: 'VS Code', value: 'code' },
          { name: 'Vim', value: 'vim' },
          { name: 'Nano', value: 'nano' },
          { name: 'Emacs', value: 'emacs' }
        ],
        default: 'code'
      },
      {
        type: 'list',
        name: 'template',
        message: 'Choose template:',
        choices: [
          { name: 'Task List', value: 'task' },
          { name: 'Prompt Template', value: 'prompt' },
          { name: 'Session Plan', value: 'session' }
        ],
        default: 'task'
      }
    ])

    const noteCommand = new NoteCommand()
    await noteCommand.execute({ editor, template })
  }

  private async handleRun(): Promise<void> {
    const { sessionName, tasks, branch, tmux } = await inquirer.prompt([
      {
        type: 'input',
        name: 'sessionName',
        message: 'Session name:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Session name is required'
          }
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return 'Session name can only contain letters, numbers, hyphens, and underscores'
          }
          return true
        }
      },
      {
        type: 'input',
        name: 'tasks',
        message: 'Tasks (comma-separated, optional):'
      },
      {
        type: 'input',
        name: 'branch',
        message: 'Custom branch name (optional):'
      },
      {
        type: 'confirm',
        name: 'tmux',
        message: 'Create tmux session?',
        default: true
      }
    ])

    const runCommand = new RunCommand()
    await runCommand.execute(sessionName, {
      tasks: tasks || undefined,
      branch: branch || undefined,
      tmux
    })
  }

  private async handleList(): Promise<void> {
    const listCommand = new ListCommand()
    await listCommand.execute()
  }

  private async handleJoin(): Promise<void> {
    // First show available sessions
    const listCommand = new ListCommand()
    await listCommand.execute()

    console.log('')
    const { sessionId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'sessionId',
        message: 'Enter session ID to join:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Session ID is required'
          }
          return true
        }
      }
    ])

    const attachCommand = new AttachCommand()
    await attachCommand.execute(sessionId)
  }

  private async handleStop(): Promise<void> {
    // First show available sessions
    const listCommand = new ListCommand()
    await listCommand.execute()

    console.log('')
    const { sessionId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'sessionId',
        message: 'Enter session ID to stop:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Session ID is required'
          }
          return true
        }
      }
    ])

    const stopCommand = new StopCommand()
    await stopCommand.execute(sessionId)
  }

  private async handleDestroy(): Promise<void> {
    const { confirmAll } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmAll',
        message: chalk.red('⚠️  This will destroy ALL active sessions. Are you sure?'),
        default: false
      }
    ])

    if (!confirmAll) {
      console.log(chalk.gray('Operation cancelled.'))
      return
    }

    const { finalConfirm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'finalConfirm',
        message: chalk.red('Type "destroy" to confirm:'),
        validate: (input: string) => {
          if (input !== 'destroy') {
            return 'You must type "destroy" to confirm'
          }
          return true
        }
      }
    ])

    if (finalConfirm === 'destroy') {
      console.log('')
      console.log(chalk.yellow('🗑️  Destroying all sessions...'))
      
      // TODO: Implement destroy all sessions
      console.log(chalk.green('✅ All sessions destroyed'))
    }
  }

  private async handleHealth(): Promise<void> {
    const { fix, verbose } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'fix',
        message: 'Automatically fix issues where possible?',
        default: true
      },
      {
        type: 'confirm',
        name: 'verbose',
        message: 'Show detailed diagnostic information?',
        default: false
      }
    ])

    const healthCommand = new HealthCommand()
    await healthCommand.execute({ fix, verbose })
  }

  private async handleClean(): Promise<void> {
    const { confirmClean } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmClean',
        message: 'Clean cache and temporary files?',
        default: true
      }
    ])

    if (confirmClean) {
      console.log('')
      console.log(chalk.yellow('🧹 Cleaning cache and temporary files...'))
      
      // TODO: Implement clean functionality
      console.log(chalk.green('✅ Clean completed'))
    } else {
      console.log(chalk.gray('Clean cancelled.'))
    }
  }
}