jest.mock('dotenv', () => ({
  config: jest.fn().mockImplementation(() => {
    process.env.MONGODB_URI = 'mockMongoUri';
    process.env.PORT = '3001';
  }),
}));

const configModule = require('../config');

describe('Configuration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Reset modules to clear any cached data
    process.env = { ...originalEnv }; // Reset environment variables to their original state
  });

  afterAll(() => {
    process.env = originalEnv; // Restore original environment variables after tests
  });

  // Test loading of MongoDB URI
  test('loads correct MongoDB URI', () => {
    process.env.MONGODB_URI = 'mockMongoUri';
    jest.resetModules(); // Reset modules after changing the environment variable
    const config = require('../config'); // Reload the module to reflect the new environment variable
    expect(config.mongodb.uri).toBe('mockMongoUri');
  });

  // Test error for missing MongoDB URI
  test('throws error if MONGODB_URI is missing', () => {
    delete process.env.MONGODB_URI;
    expect(() => configModule.__get__('config')).toThrow();
  });

  // Test loading of server port
  test('loads correct server port', () => {
    process.env.PORT = '3001';
    jest.resetModules(); // Reset modules after changing the environment variable
    const config = require('../config'); // Reload the module to reflect the new environment variable
    expect(config.server.port).toBe(3001);
  });

  // Test defaults to port 3001 if PORT not set
  test('defaults to port 3001 if PORT not set', () => {
    delete process.env.PORT;
    jest.resetModules(); // Reset modules after changing the environment variable
    const config = require('../config'); // Reload the module to reflect the new environment variable
    expect(config.server.port).toBe(3001);
  });

  // Test sets rate limiting configuration
  test('sets rate limiting configuration', () => {
    const config = require('../config'); // Directly require the module
    expect(config.rateLimit.windowMs).toBe(60 * 1000);
    expect(config.rateLimit.max).toBe(100);
  });
});
