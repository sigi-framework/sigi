import { join } from 'node:path'

import { createDefaultEsmPreset } from 'ts-jest'

/**
 * @type { import('@jest/types').Config.InitialOptions}
 */
const config = {
  ...createDefaultEsmPreset(),
  rootDir: join(__dirname, '..'),
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  skipFilter: true,
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/**/*.spec.{ts,tsx}',
    '!packages/type-test/**/*.ts',
    '!packages/{core,react-router,devtool}/src/index.ts',
  ],
  moduleNameMapper: {
    '@sigi/([^/]+)(.*)$': '<rootDir>/packages/$1/src$2',
    './hmr': '<rootDir>/packages/core/src/hmr-jest.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/examples/', '\\.js$', '\\.d\\.ts$'],
}

// @ts-expect-error
globalThis.IS_REACT_ACT_ENVIRONMENT = true

export default config
