import chalk from 'chalk'

export class TazzAnimation {
  private frames: string[] = [
    // Frame 1 - Formation
    `
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
     *          .             *        .      *`,
    
    // Frame 2 - Spinning
    `
        ✨      🌟      ✨
        .             .    ⭐        .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .      🔥  T A Z Z  🔥   *       .      .
     *          .             *        .      *`,
    
    // Frame 3 - Intensifying
    `
        ⚡✨    🌟💫    ⚡✨
        .     🔥      .    ⭐🚀      .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .    ⚡🔥 A G E N T 🔥⚡ *       .      .
     *    🚀    .      🌟     *        .    ⭐`,

    // Frame 4 - Final
    `
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
     *          .             *        .      *`
  ]

  async show(): Promise<void> {
    // Clear screen
    process.stdout.write('\x1b[2J\x1b[0f')

    for (let i = 0; i < this.frames.length; i++) {
      // Move cursor to top
      process.stdout.write('\x1b[H')
      
      // Display frame with color
      const coloredFrame = chalk.cyan(this.frames[i])
      console.log(coloredFrame)
      
      // Add title
      if (i === 1) {
        console.log(chalk.bold.cyan('    === Tazz CLI Tool ==='))
        console.log(chalk.gray('   AI-Powered Task Orchestrator'))
      }
      
      // Wait between frames
      await this.sleep(600)
    }

    // Final clear and setup for next content
    await this.sleep(500)
    process.stdout.write('\x1b[2J\x1b[0f')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Show a simple spinning tazz animation for shorter animations
   */
  async showSpinner(message: string = 'Processing'): Promise<() => void> {
    const spinnerFrames = ['🔥', '⚡', '💫', '⭐']
    let frameIndex = 0
    let isSpinning = true

    const spinner = setInterval(() => {
      if (!isSpinning) return
      
      process.stdout.write('\r')
      process.stdout.write(`${spinnerFrames[frameIndex]} ${chalk.cyan(message)}...`)
      
      frameIndex = (frameIndex + 1) % spinnerFrames.length
    }, 150)

    // Return stop function
    return () => {
      isSpinning = false
      clearInterval(spinner)
      process.stdout.write('\r' + ' '.repeat(50) + '\r') // Clear line
    }
  }

  /**
   * Show a brief tazz burst for quick actions
   */
  async showBurst(): Promise<void> {
    const burstFrames = [
      '🔥',
      '⚡',
      '🔥⚡',
      '⚡🔥🔥',
      '🔥⚡⚡⚡',
      '⚡⚡⚡',
      '⚡⚡',
      '⚡'
    ]

    for (const frame of burstFrames) {
      process.stdout.write('\r' + chalk.cyan(frame))
      await this.sleep(80)
    }
    
    process.stdout.write('\r' + ' '.repeat(20) + '\r')
  }
}