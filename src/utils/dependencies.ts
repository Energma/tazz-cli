import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import ora from 'ora'
import { getLogger } from './logger'

const execAsync = promisify(exec)
const logger = getLogger()

export interface DependencyInstaller {
  checkCommand: string
  installCommand: string
  name: string
}

export class DependencyManager {
  private static installers: Record<string, DependencyInstaller[]> = {
    linux: [
      {
        checkCommand: 'which apt-get',
        installCommand: 'sudo apt-get update && sudo apt-get install -y tmux git',
        name: 'apt (Ubuntu/Debian)'
      },
      {
        checkCommand: 'which yum',
        installCommand: 'sudo yum install -y tmux git',
        name: 'yum (RHEL/CentOS)'
      },
      {
        checkCommand: 'which dnf',
        installCommand: 'sudo dnf install -y tmux git',
        name: 'dnf (Fedora)'
      },
      {
        checkCommand: 'which pacman',
        installCommand: 'sudo pacman -S --noconfirm tmux git || pacman -S --noconfirm tmux git',
        name: 'pacman (Arch Linux)'
      },
      {
        checkCommand: 'which zypper',
        installCommand: 'sudo zypper install -y tmux git',
        name: 'zypper (openSUSE)'
      }
    ],
    darwin: [
      {
        checkCommand: 'which brew',
        installCommand: 'brew install tmux git',
        name: 'Homebrew'
      },
      {
        checkCommand: 'which port',
        installCommand: 'sudo port install tmux git',
        name: 'MacPorts'
      }
    ],
    win32: [
      {
        checkCommand: 'where choco',
        installCommand: 'choco install tmux git -y',
        name: 'Chocolatey'
      },
      {
        checkCommand: 'where winget',
        installCommand: 'winget install tmux git',
        name: 'WinGet'
      }
    ]
  }

  static async checkDependency(command: string): Promise<boolean> {
    try {
      // Try different version commands
      try {
        await execAsync(`${command} --version`)
        return true
      } catch {
        // Some commands use -V instead
        try {
          await execAsync(`${command} -V`)
          return true
        } catch {
          // Check if command exists
          await execAsync(`which ${command}`)
          return true
        }
      }
    } catch {
      return false
    }
  }

  static async installTmux(): Promise<boolean> {
    const platform = process.platform
    const installers = this.installers[platform] || []

    console.log('')
    console.log(chalk.yellow('🔧 Installing tmux automatically...'))
    
    for (const installer of installers) {
      try {
        // Check if package manager exists
        await execAsync(installer.checkCommand)
        
        const spinner = ora(`Installing tmux using ${installer.name}`).start()
        
        try {
          // Create tmux-only install command
          let tmuxCommand = installer.installCommand.replace('tmux git', 'tmux')
          
          // For Arch Linux, try both sudo and non-sudo
          if (installer.name.includes('pacman')) {
            try {
              await execAsync('sudo pacman -S --noconfirm tmux')
            } catch {
              // Try without sudo in case user has permissions
              await execAsync('pacman -S --noconfirm tmux')
            }
          } else {
            await execAsync(tmuxCommand)
          }
          
          spinner.succeed(`tmux installed successfully using ${installer.name}`)
          
          // Verify installation with a small delay to let system update
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          if (await this.checkDependency('tmux')) {
            console.log(chalk.green('✅ tmux is now available'))
            return true
          } else {
            spinner.warn('Installation completed but tmux still not detected')
            console.log(chalk.gray('   You may need to restart your shell or source your profile'))
          }
          
        } catch (installError) {
          spinner.fail(`Failed to install using ${installer.name}`)
          logger.debug('Installation failed', installError as Error)
          console.log(chalk.gray(`   Error: ${(installError as Error).message}`))
          continue
        }
        
      } catch {
        // Package manager not available, try next one
        continue
      }
    }

    // If auto-installation failed, provide manual instructions
    console.log('')
    console.log(chalk.yellow('⚠️  Automatic installation failed'))
    console.log(chalk.bold('Manual installation options:'))
    
    switch (platform) {
      case 'linux':
        console.log(chalk.gray('  Ubuntu/Debian:'), chalk.cyan('sudo apt-get install tmux'))
        console.log(chalk.gray('  RHEL/CentOS:'), chalk.cyan('sudo yum install tmux'))
        console.log(chalk.gray('  Fedora:'), chalk.cyan('sudo dnf install tmux'))
        console.log(chalk.gray('  Arch Linux:'), chalk.cyan('sudo pacman -S tmux'))
        break
      case 'darwin':
        console.log(chalk.gray('  Homebrew:'), chalk.cyan('brew install tmux'))
        console.log(chalk.gray('  MacPorts:'), chalk.cyan('sudo port install tmux'))
        break
      case 'win32':
        console.log(chalk.gray('  Chocolatey:'), chalk.cyan('choco install tmux'))
        console.log(chalk.gray('  WinGet:'), chalk.cyan('winget install tmux'))
        break
    }
    
    return false
  }

  static async ensureDependencies(): Promise<boolean> {
    const dependencies = [
      { command: 'git', name: 'Git' },
      { command: 'tmux', name: 'tmux' }
    ]

    const missing = []
    
    for (const dep of dependencies) {
      if (!await this.checkDependency(dep.command)) {
        missing.push(dep)
      }
    }

    if (missing.length === 0) {
      return true
    }

    console.log('')
    console.log(chalk.yellow(`🔍 Missing dependencies: ${missing.map(d => d.name).join(', ')}`))
    
    // Try to install tmux if missing
    if (missing.some(d => d.command === 'tmux')) {
      const installed = await this.installTmux()
      if (!installed) {
        return false
      }
    }

    // Check git separately (usually pre-installed)
    if (missing.some(d => d.command === 'git') && !await this.checkDependency('git')) {
      console.log('')
      console.log(chalk.red('❌ Git is required but not installed'))
      console.log(chalk.gray('Please install Git first: https://git-scm.com/downloads'))
      return false
    }

    return true
  }
}