import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['**/react/**/*.spec.{ts,tsx}', 'jsdom'],
      ['**/react-router/**/*.spec.{ts,tsx}', 'jsdom'],
    ],
    include: ['**/?(*.)+(spec|test).[jt]s?(x)'],
    exclude: [
      '**/node_modules/**',
      '**/examples/**',
      '**/*.js',
      '**/*.d.ts',
    ],
    coverage: {
      include: [
        'packages/*/src/**/*.{ts,tsx}',
      ],
      exclude: [
        'packages/**/*.spec.{ts,tsx}',
        'packages/type-test/**/*.ts',
        'packages/{core,react-router,devtool}/src/index.ts',
      ],
    },
    setupFiles: [join(__dirname, 'vitest.setup.ts')],
  },
  resolve: {
    alias: [
      {
        find: /^@sigi\/([^/]+)(.*)$/,
        replacement: join(__dirname, '..', 'packages/$1/src$2'),
      },
      {
        find: './hmr',
        replacement: join(__dirname, '..', 'packages/core/src/hmr-vitest.js'),
      },
    ],
  },
})