const { join } = require('path')

/**
 * @type { import('@jest/types').Config.InitialOptions}
 */
const config = {
  rootDir: join(__dirname, '..'),
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/**/*.spec.{ts,tsx}',
    '!packages/type-test/**/*.ts',
    '!packages/{core,react-router,devtool}/src/index.ts',
  ],
  moduleNameMapper: {
    '@sigi/([^/]+)(.*)$': '<rootDir>/packages/$1/src$2',
  },
  testPathIgnorePatterns: ['/node_modules/', '/examples/', '\\.js$', '\\.d\\.ts$'],
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

module.exports = config
