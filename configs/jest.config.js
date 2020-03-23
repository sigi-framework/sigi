const { join } = require('path')

module.exports = {
  preset: 'ts-jest',
  rootDir: join(__dirname, '..'),
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '@sigi/([^/]+)(.*)$': '<rootDir>/packages/$1/src$2',
  },
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
}
