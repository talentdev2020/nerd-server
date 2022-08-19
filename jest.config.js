const tsPreset = require('ts-jest/jest-preset');

module.exports = {
  ...tsPreset,
  clearMocks: true,
  collectCoverage: true,
  coverageReporters: ['json', 'text'],
  reporters: ['default', 'jest-junit'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1',
  },
  testEnvironment: 'node',
  testTimeout: 30000,
};
