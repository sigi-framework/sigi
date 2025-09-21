import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  esbuild: {
    // Disable esbuild for TypeScript so we can use proper TypeScript compilation
    include: [],
  },
  plugins: [
    {
      name: 'typescript-metadata',
      transform(code, id) {
        if (id.endsWith('.ts') || id.endsWith('.tsx')) {
          const ts = require('typescript')
          const result = ts.transpile(code, {
            target: ts.ScriptTarget.ES2018,
            module: ts.ModuleKind.ESNext,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            jsx: ts.JsxEmit.ReactJSX,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
          })
          return result
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
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
        find: '@sigi/core',
        replacement: join(__dirname, '..', 'packages/core/src'),
      },
      {
        find: '@sigi/di',
        replacement: join(__dirname, '..', 'packages/di/src'),
      },
      {
        find: '@sigi/react',
        replacement: join(__dirname, '..', 'packages/react/src'),
      },
      {
        find: '@sigi/react-router',
        replacement: join(__dirname, '..', 'packages/react-router/src'),
      },
      {
        find: '@sigi/ssr',
        replacement: join(__dirname, '..', 'packages/ssr/src'),
      },
      {
        find: '@sigi/testing',
        replacement: join(__dirname, '..', 'packages/testing/src'),
      },
      {
        find: '@sigi/ts-plugin',
        replacement: join(__dirname, '..', 'packages/ts-plugin/src'),
      },
      {
        find: '@sigi/types',
        replacement: join(__dirname, '..', 'packages/types/src'),
      },
      {
        find: '@sigi/vue',
        replacement: join(__dirname, '..', 'packages/vue/src'),
      },
      {
        find: './hmr',
        replacement: join(__dirname, '..', 'packages/core/src/hmr-vitest.js'),
      },
    ],
  },
})