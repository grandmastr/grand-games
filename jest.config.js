module.exports = {
  // The root of your source code, typically /src
  roots: ['<rootDir>/src'],
  
  // Jest transformations -- this adds support for TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Test spec file resolution pattern
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  
  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Mock all files with .css extension
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Timeout for tests
  testTimeout: 10000,
};
