module.exports = {
  preset: 'ts-jest',
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/?(*.)+(spec|test).ts?(x)', '**/?(*.)+(spec|test).ts?(x)', 
  ],
  moduleNameMapper: {
    '@sigi/([^/]+)(.*)$': '<rootDir>/packages/$1/src$2',
  }
}
