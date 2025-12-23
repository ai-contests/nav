/**
 * Jest test setup
 * Configure global test environment
 */

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence specific log levels during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Setup global test helpers
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  // This can be useful for cleaning up test data, timers, etc.
});

// Add custom matchers if needed
expect.extend({
  // Custom matchers can be added here
});

// Environment variables for testing
// process.env.NODE_ENV = 'test'; // Jest sets this automatically
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
