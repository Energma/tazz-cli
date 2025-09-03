#!/usr/bin/env node

const esbuild = require('esbuild')

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/index.js',
  sourcemap: true,
  // Don't add shebang in CJS module - it breaks
  external: [
    // Don't bundle these
    'fs-extra',
    'simple-git',
    'execa',
    'commander',
    'chalk',
    'ora',
    'inquirer',
    'glob',
    'winston'
  ]
}).then(() => {
  console.log('✅ Build successful!')
  console.log('📄 Output: dist/index.js')
}).catch(() => process.exit(1))