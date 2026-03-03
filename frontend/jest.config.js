// @AI-HINT: Jest configuration file for the frontend testing environment.
// This configuration sets up the testing environment with proper presets, 
// module name mappings, and test environment for a Next.js application.

module.exports = {
  // Use the jsdom environment for browser-like testing
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup file that runs before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapper for resolving imports
  moduleNameMapper: {
    // Handle module aliases
    '^@/components/(.*)$': '<rootDir>/app/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1',
    
    // Handle CSS and other static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!app/**/page.tsx', // Exclude page files from coverage
    '!app/**/layout.tsx', // Exclude layout files from coverage
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Transform files with babel or ts-jest as needed
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  // Exclude Playwright E2E tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
  ],
};