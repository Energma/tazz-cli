import chalk from 'chalk'
import { TazzAnimation } from '../ui/tornado'
import { getLogger } from '../../utils/logger'

export class DetachedCommand {
  private logger = getLogger()

  async execute(): Promise<void> {
    // Show the full tornado animation
    const tazz = new TazzAnimation()
    await tazz.show()

    // Display detached console
    console.log(chalk.bold.cyan('🌪️  T A Z Z   C O N S O L E'))
    console.log(chalk.gray('    Detached Mode'))
    console.log('')
    
    this.displayMenu()
  }

  private displayMenu(): void {
    console.log(chalk.bold('Available commands:'))
    console.log('')
    console.log(chalk.cyan('  [1]'), 'List Sessions')
    console.log(chalk.cyan('  [2]'), 'Start New Session') 
    console.log(chalk.cyan('  [3]'), 'Attach to Session')
    console.log(chalk.cyan('  [4]'), 'Run Agent Tasks')
    console.log(chalk.cyan('  [q]'), 'Quit')
    console.log('')
    console.log(chalk.yellow('⚠️  Interactive detached mode is not yet implemented'))
    console.log(chalk.gray('   Use regular commands like:'))
    console.log(chalk.gray('   • tazz list'))
    console.log(chalk.gray('   • tazz start <session-id>'))
    console.log(chalk.gray('   • tazz join <session-id>'))
    console.log('')
  }
}