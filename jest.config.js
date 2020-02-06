module.exports = {
  preset: 'ts-jest',
  rootDir: __dirname,
  testEnvironment: 'node',
  moduleNameMapper: {
    '@sigi/([^/]+)(.*)$': '<rootDir>/packages/$1/src$2',
  },
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
}
