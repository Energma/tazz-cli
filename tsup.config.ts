import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node18',
  platform: 'node',
  clean: true,
  dts: false, // Disabled for now to get working build
  sourcemap: true,
  minify: false,
  banner: {
    js: '#!/usr/bin/env node'
  },
  outDir: 'dist',
  tsconfig: './tsconfig.json'
})