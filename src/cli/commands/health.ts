import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { exec } from 'child_process'
import { promisify } from 'util'
import { pathExists } from 'fs-extra'
import { getLogger } from '../../utils/logger'
import { DependencyManager } from '../../utils/dependencies'

const execAsync = promisify(exec)

export class HealthCommand {
  private logger = getLogger()

  build(): Command {
    return new Command('health')
      .description('🏥 Check Tazz CLI health and system dependencies')
      .option('--fix', 'Automatically fix issues where possible')
      .option('--verbose', 'Show detailed diagnostic information')
      .action(async (options) => {
        await this.execute(options)
      })
  }

  async execute(options: {
    fix?: boolean
    verbose?: boolean
  } = {}): Promise<void> {
    console.log('')
    console.log(chalk.bold.cyan('🏥 Tazz CLI Health Check'))
    console.log(chalk.gray('Checking system dependencies and configuration...'))
    console.log('')

    const healthChecks = [
      { name: 'Node.js', check: () => this.checkNode() },
      { name: 'npm/yarn', check: () => this.checkPackageManager() },
      { name: 'Git', check: () => this.checkGit() },
      { name: 'tmux', check: () => this.checkTmux(options.fix) },
      { name: 'Claude Code', check: () => this.checkClaudeCode() },
      { name: 'Tazz Configuration', check: () => this.checkTazzConfig() },
      { name: 'System Resources', check: () => this.checkSystemResources() },
      { name: 'Network Connectivity', check: () => this.checkNetwork() }
    ]

    const results: Array<{ name: string; status: 'pass' | 'fail' | 'warn'; message: string; details?: string }> = []

    for (const healthCheck of healthChecks) {
      const spinner = ora(`Checking ${healthCheck.name}`).start()
      
      try {
        const result = await healthCheck.check()
        results.push({ name: healthCheck.name, ...result })
        
        if (result.status === 'pass') {
          spinner.succeed(chalk.green(`${healthCheck.name}: ${result.message}`))
        } else if (result.status === 'warn') {
          spinner.warn(chalk.yellow(`${healthCheck.name}: ${result.message}`))
        } else {
          spinner.fail(chalk.red(`${healthCheck.name}: ${result.message}`))
        }
        
        if (options.verbose && result.details) {
          console.log(chalk.gray(`   ${result.details}`))
        }
        
      } catch (error) {
        results.push({
          name: healthCheck.name,
          status: 'fail',
          message: `Check failed: ${(error as Error).message}`
        })
        spinner.fail(chalk.red(`${healthCheck.name}: Check failed`))
      }
    }

    // Summary
    console.log('')
    this.printHealthSummary(results)
    
    // Recommendations
    const failedChecks = results.filter(r => r.status === 'fail')
    const warningChecks = results.filter(r => r.status === 'warn')
    
    if (failedChecks.length > 0 || warningChecks.length > 0) {
      console.log('')
      console.log(chalk.bold('🔧 Recommendations:'))
      
      for (const check of [...failedChecks, ...warningChecks]) {
        console.log('')
        console.log(chalk.bold(`${check.name}:`))
        console.log(chalk.gray(`  Issue: ${check.message}`))
        
        const recommendation = this.getRecommendation(check.name, check.status)
        if (recommendation) {
          console.log(chalk.cyan(`  Fix: ${recommendation}`))
        }
      }
    }

    // Auto-fix option
    if (options.fix && failedChecks.length > 0) {
      console.log('')
      console.log(chalk.yellow('🔨 Attempting to fix issues automatically...'))
      await this.autoFix(failedChecks)
    }

    console.log('')
  }

  private async checkNode(): Promise<{ status: 'pass' | 'fail' | 'warn'; message: string; details?: string }> {
    try {
      const { stdout } = await execAsync('node --version')
      const version = stdout.trim()
      const majorVersion = parseInt(version.replace('v', '').split('.')[0])
      
      if (majorVersion >= 18) {
        return {
          status: 'pass',
          message: `${version} (supported)`,
          details: `Node.js ${version} is compatible with Tazz CLI`
        }
      } else if (majorVersion >= 16) {
        return {
          status: 'warn',
          message: `${version} (outdated but supported)`,
          details: 'Consider upgrading to Node.js 18+ for best performance'
        }
      } else {
        return {
          status: 'fail',
          message: `${version} (unsupported)`,
          details: 'Tazz CLI requires Node.js 16+ (18+ recommended)'
        }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Node.js not found',
        details: 'Install Node.js from https://nodejs.org'
      }
    }
  }

  private async checkPackageManager(): Promise<{ status: 'pass' | 'fail' | 'warn'; message: string; details?: string }> {
    try {
      const { stdout: npmVersion } = await execAsync('npm --version')
      
      try {
        const { stdout: yarnVersion } = await execAsync('yarn --version')
        return {
          status: 'pass',
          message: `npm ${npmVersion.trim()}, yarn ${yarnVersion.trim()}`,
          details: 'Both npm and yarn are available'
        }
      } catch {
        return {
          status: 'pass',
          message: `npm ${npmVersion.trim()}`,
          details: 'npm is available (yarn not installed)'
        }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'No package manager found',
        details: 'Install npm (comes with Node.js) or yarn'
      }
    }
  }

  private async checkGit(): Promise<{ status: 'pass' | 'fail' | 'warn'; message: string; details?: string }> {
    try {
      const { stdout } = await execAsync('git --version')
      const version = stdout.trim().replace('git version ', '')
      
      // Check git configuration
      try {
        const { stdout: userName } = await execAsync('git config user.name')
        const { stdout: userEmail } = await execAsync('git config user.email')
        
        if (userName.trim() && userEmail.trim()) {
          return {
            status: 'pass',
            message: `${version} (configured)`,
            details: `User: ${userName.trim()} <${userEmail.trim()}>`
          }
        } else {
          return {
            status: 'warn',
            message: `${version} (not configured)`,
            details: 'Git user name and email not configured'
          }
        }
      } catch {
        return {
          status: 'warn',
          message: `${version} (not configured)`,
          details: 'Git user name and email not configured'
        }
      }
    } catch (error) {
      return {
        status: 'fail',
        message: 'Git not found',
        details: 'Install Git from https://git-scm.com'
      }
    }
  }

  private async checkTmux(autoFix?: boolean): Promise<{ status: 'pass' | 'fail' | 'warn'; message: string; details?: string }> {
    try {
      const { stdout } = await execAsync('tmux -V')
      const version = stdout.trim()
      
      return {
        status: 'pass',
        message: `${version} (available)`,
        details: 'tmux is installed and available for session management'
      }
    } catch (error) {
      if (autoFix) {
        try {
          const installed = await DependencyManager.installTmux()
          if (installed) {
            return {
              status: 'pass',
              message: 'Installed automatically',
              details: 'tmux was successfully installed'
            }
          }
        } catch (installError) {
          // Fall through to manual installation message
        }
      }
      
      return {
        status: 'fail',
        message: 'tmux not found',
        details: 'tmux is required for session management'
      }
    }
  }

  private async checkClaudeCode(): Promise<{ status: 'pass' | 'fail' | 'warn'; message: string; details?: string }> {
    try {
      // Check if Claude Code CLI is available
      const { stdout } = await execAsync('claude --version')
      const version = stdout.trim()
      
      return {
        status: 'pass',
        message: `${version} (available)`,
        details: 'Claude Code CLI is installed and available'
      }
    } catch (error) {
      // Check if running in Claude Code environment
      if (process.env.CLAUDE_CODE) {
        return {
          status: 'pass',
          message: 'Running in Claude Code',
          details: 'Tazz is running within Claude Code environment'
        }
      }
      
      return {
        status: 'warn',
        message: 'Claude Code not detected',
        details: 'Some features may not be available without Claude Code integration'
      }
    }
  }

  private async checkTazzConfig(): Promise<{ status: 'pass' | 'fail' | 'warn'; message: string; details?: string }> {
    const tazzTmpDir = '/tmp/tazz-tmp'
    const configExists = await pathExists(tazzTmpDir)
    
    if (configExists) {
      return {
        status: 'pass',
        message: 'Configuration directory exists',
        details: `Tazz data directory: ${tazzTmpDir}`
      }
    } else {
      return {
        status: 'warn',
        message: 'Configuration directory missing',
        details: 'Will be created automatically when needed'
      }
    }
  }

  private async checkSystemResources(): Promise<{ status: 'pass' | 'fail' | 'warn'; message: string; details?: string }> {
    try {
      // Check available disk space
      const { stdout } = await execAsync('df -h /tmp')
      const lines = stdout.trim().split('\n')
      const tmpLine = lines[1]
      const parts = tmpLine.split(/\s+/)
      const available = parts[3]
      const usage = parts[4]
      
      const usagePercent = parseInt(usage.replace('%', ''))
      
      if (usagePercent < 80) {
        return {
          status: 'pass',
          message: `Disk space: ${available} available`,
          details: `/tmp usage: ${usage}`
        }
      } else if (usagePercent < 90) {
        return {
          status: 'warn',
          message: `Disk space: ${available} available`,
          details: `/tmp usage: ${usage} (consider cleaning up)`
        }
      } else {
        return {
          status: 'fail',
          message: `Disk space: ${available} available`,
          details: `/tmp usage: ${usage} (critically low space)`
        }
      }
    } catch (error) {
      return {
        status: 'warn',
        message: 'Unable to check disk space',
        details: 'System resource check failed'
      }
    }
  }

  private async checkNetwork(): Promise<{ status: 'pass' | 'fail' | 'warn'; message: string; details?: string }> {
    try {
      // Test basic connectivity
      await execAsync('ping -c 1 -W 5 8.8.8.8')
      
      // Test HTTPS connectivity (for MCP servers, npm, etc.)
      try {
        await execAsync('curl -s --max-time 10 https://registry.npmjs.org')
        return {
          status: 'pass',
          message: 'Internet connectivity available',
          details: 'Can reach npm registry and external services'
        }
      } catch {
        return {
          status: 'warn',
          message: 'Limited connectivity',
          details: 'Basic internet works but HTTPS may be restricted'
        }
      }
    } catch (error) {
      return {
        status: 'warn',
        message: 'No internet connectivity',
        details: 'Some features may not work without internet access'
      }
    }
  }

  private printHealthSummary(results: Array<{ name: string; status: 'pass' | 'fail' | 'warn'; message: string }>): void {
    const passed = results.filter(r => r.status === 'pass').length
    const warnings = results.filter(r => r.status === 'warn').length
    const failed = results.filter(r => r.status === 'fail').length
    
    console.log(chalk.bold('📊 Health Summary:'))
    console.log(chalk.green(`   ✅ Passed: ${passed}`))
    if (warnings > 0) {
      console.log(chalk.yellow(`   ⚠️  Warnings: ${warnings}`))
    }
    if (failed > 0) {
      console.log(chalk.red(`   ❌ Failed: ${failed}`))
    }
    
    if (failed === 0 && warnings === 0) {
      console.log('')
      console.log(chalk.green.bold('🎉 All systems healthy! Tazz CLI is ready to use.'))
    } else if (failed === 0) {
      console.log('')
      console.log(chalk.yellow.bold('⚠️  Minor issues detected but Tazz CLI should work fine.'))
    } else {
      console.log('')
      console.log(chalk.red.bold('❌ Critical issues detected. Some features may not work.'))
    }
  }

  private getRecommendation(checkName: string, status: 'fail' | 'warn'): string | null {
    const recommendations: Record<string, Record<'fail' | 'warn', string>> = {
      'Node.js': {
        fail: 'Install Node.js 18+ from https://nodejs.org',
        warn: 'Upgrade to Node.js 18+ for better performance and latest features'
      },
      'npm/yarn': {
        fail: 'Install Node.js (includes npm) or yarn package manager',
        warn: 'Consider installing yarn for better package management'
      },
      'Git': {
        fail: 'Install Git from https://git-scm.com and configure with: git config --global user.name "Your Name" && git config --global user.email "your@email.com"',
        warn: 'Configure Git with: git config --global user.name "Your Name" && git config --global user.email "your@email.com"'
      },
      'tmux': {
        fail: 'Install tmux using your package manager or run: tazz health --fix',
        warn: 'Update tmux to latest version'
      },
      'Claude Code': {
        fail: 'Install Claude Code from https://claude.ai/code',
        warn: 'Some MCP features may not be available'
      },
      'System Resources': {
        fail: 'Free up disk space in /tmp directory',
        warn: 'Consider cleaning up temporary files'
      },
      'Network Connectivity': {
        fail: 'Check internet connection and firewall settings',
        warn: 'Some online features may not work'
      }
    }
    
    return recommendations[checkName]?.[status] || null
  }

  private async autoFix(failedChecks: Array<{ name: string; status: 'fail'; message: string }>): Promise<void> {
    for (const check of failedChecks) {
      if (check.name === 'tmux') {
        const spinner = ora('Installing tmux').start()
        try {
          const installed = await DependencyManager.installTmux()
          if (installed) {
            spinner.succeed('tmux installed successfully')
            
            // Verify installation worked
            const stillMissing = await this.checkTmux(false)
            if (stillMissing.status === 'pass') {
              console.log(chalk.green('✅ tmux is now available and working'))
            }
          } else {
            spinner.fail('Failed to install tmux automatically')
            console.log(chalk.yellow('💡 Try running: tazz health --fix'))
          }
        } catch (error) {
          spinner.fail('tmux installation failed')
          this.logger.error('Auto-fix failed for tmux', error as Error)
        }
      }
      
      if (check.name === 'Git' && check.message.includes('not configured')) {
        console.log('')
        console.log(chalk.yellow('🔧 Git configuration needed:'))
        console.log(chalk.gray('   Run these commands to configure Git:'))
        console.log(chalk.cyan('   git config --global user.name "Your Name"'))
        console.log(chalk.cyan('   git config --global user.email "your@email.com"'))
      }
      
      // Add more auto-fixes as needed
    }
  }
}