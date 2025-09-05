import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      exclude: [
        'bin/**',
        'tests/**',
        'src/cli/ui/tornado.ts', // Animation code
        'src/utils/logger.ts' // Logging utilities
      ]
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    globals: true,
    environment: 'node'
  },
  build: {
    outDir: 'bin',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/types': path.resolve(__dirname, './src/core/types'),
      '@/services': path.resolve(__dirname, './src/core/services'),
      '@/utils': path.resolve(__dirname, './src/utils')
    }
  }
})