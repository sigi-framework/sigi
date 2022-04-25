const { join } = require('path')

module.exports = {
  rootDir: join(__dirname, '..'),
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc-node/jest',
      // configuration
      {
        target: 'es2020',
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        react: {
          runtime: 'automatic',
        },
      },
    ],
  },
  testEnvironment: 'jsdom',
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
