const { join } = require('path')

module.exports = {
  preset: 'ts-jest',
  rootDir: join(__dirname, '..'),
  testEnvironment: 'node',
  moduleNameMapper: {
    '@sigi/([^/]+)(.*)$': '<rootDir>/packages/$1/src$2',
  },
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
}
