const { join } = require('path')

module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc-node/jest',
      {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    ],
  },
  rootDir: join(__dirname, '..'),
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
