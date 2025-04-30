import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configure timezone for consistent date handling in tests
process.env.TZ = 'UTC';

// Mock environment variables
process.env.LOG_DIR = 'test-logs';
process.env.SAP_COMMERCE_URL = 'https://localhost:9002/occ/v2';
process.env.SAP_COMMERCE_SITE = 'electronics';
process.env.SAP_COMMERCE_VALIDATE_SSL = 'false';
process.env.NODE_ENV = 'test';

// Configure Jest to use fake timers
jest.useFakeTimers();

// Mock winston logger
jest.mock('./src/utils/logger.js', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}), { virtual: true });

// Configure longer timeout for async tests
jest.setTimeout(10000);

// Reset all mocks and timers before each test
beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});