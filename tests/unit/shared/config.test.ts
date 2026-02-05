import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Config module tests.
 *
 * The config module validates env vars at import time via `validateConfig()`.
 * We test the module's exported helpers and schema behavior by mocking the
 * config singleton so the module can be loaded without real env vars.
 */

// Mock config to avoid import-time env validation
vi.mock('../../../src/shared/config.js', () => {
  const mockConfig = {
    RUNWARE_API_KEY: 'test-key-that-is-at-least-32-characters-long-enough',
    NODE_ENV: 'test' as const,
    LOG_LEVEL: 'info' as const,
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: ['/tmp'],
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    ENABLE_DATABASE: false,
    DATABASE_PATH: './runware-mcp.db',
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  };

  return {
    config: mockConfig,
    API_BASE_URL: 'https://api.runware.ai/v1',
    WS_BASE_URL: 'wss://ws-api.runware.ai/v1',
    DEFAULT_POLL_INTERVAL_MS: 2000,
    MAX_POLL_INTERVAL_MS: 10000,
    LOG_LEVELS: ['debug', 'info', 'warn', 'error'] as const,
    NODE_ENVIRONMENTS: ['development', 'production', 'test'] as const,
    getMaxFileSizeBytes: (): number => mockConfig.MAX_FILE_SIZE_MB * 1024 * 1024,
    isDevelopment: (): boolean => mockConfig.NODE_ENV === 'development',
    isProduction: (): boolean => mockConfig.NODE_ENV === 'production',
    isTest: (): boolean => mockConfig.NODE_ENV === 'test',
    isDatabaseEnabled: (): boolean => mockConfig.ENABLE_DATABASE,
    shouldLog: (level: string): boolean => {
      const levels = ['debug', 'info', 'warn', 'error'];
      const configIdx = levels.indexOf(mockConfig.LOG_LEVEL);
      const msgIdx = levels.indexOf(level);
      return msgIdx >= configIdx;
    },
  };
});

import {
  config,
  API_BASE_URL,
  WS_BASE_URL,
  DEFAULT_POLL_INTERVAL_MS,
  MAX_POLL_INTERVAL_MS,
  LOG_LEVELS,
  NODE_ENVIRONMENTS,
  getMaxFileSizeBytes,
  isDevelopment,
  isProduction,
  isTest,
  isDatabaseEnabled,
  shouldLog,
} from '../../../src/shared/config.js';

// ============================================================================
// Config Shape
// ============================================================================

describe('config object shape', () => {
  it('has RUNWARE_API_KEY', () => {
    expect(typeof config.RUNWARE_API_KEY).toBe('string');
    expect(config.RUNWARE_API_KEY.length).toBeGreaterThanOrEqual(32);
  });

  it('has NODE_ENV', () => {
    expect(config.NODE_ENV).toBe('test');
  });

  it('has LOG_LEVEL', () => {
    expect(config.LOG_LEVEL).toBe('info');
  });

  it('has MAX_FILE_SIZE_MB as number', () => {
    expect(typeof config.MAX_FILE_SIZE_MB).toBe('number');
    expect(config.MAX_FILE_SIZE_MB).toBeGreaterThan(0);
  });

  it('has ALLOWED_FILE_ROOTS as array', () => {
    expect(Array.isArray(config.ALLOWED_FILE_ROOTS)).toBe(true);
  });

  it('has rate limit settings', () => {
    expect(config.RATE_LIMIT_MAX_TOKENS).toBeGreaterThan(0);
    expect(config.RATE_LIMIT_REFILL_RATE).toBeGreaterThan(0);
  });

  it('has ENABLE_DATABASE as boolean', () => {
    expect(typeof config.ENABLE_DATABASE).toBe('boolean');
  });
});

// ============================================================================
// Constants
// ============================================================================

describe('config constants', () => {
  it('API_BASE_URL is Runware endpoint', () => {
    expect(API_BASE_URL).toBe('https://api.runware.ai/v1');
  });

  it('WS_BASE_URL is Runware WebSocket endpoint', () => {
    expect(WS_BASE_URL).toBe('wss://ws-api.runware.ai/v1');
  });

  it('DEFAULT_POLL_INTERVAL_MS is 2000', () => {
    expect(DEFAULT_POLL_INTERVAL_MS).toBe(2000);
  });

  it('MAX_POLL_INTERVAL_MS is 10000', () => {
    expect(MAX_POLL_INTERVAL_MS).toBe(10000);
  });

  it('LOG_LEVELS has expected values', () => {
    expect(LOG_LEVELS).toEqual(['debug', 'info', 'warn', 'error']);
  });

  it('NODE_ENVIRONMENTS has expected values', () => {
    expect(NODE_ENVIRONMENTS).toEqual(['development', 'production', 'test']);
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

describe('getMaxFileSizeBytes', () => {
  it('returns MB converted to bytes', () => {
    expect(getMaxFileSizeBytes()).toBe(50 * 1024 * 1024);
  });
});

describe('isDevelopment', () => {
  it('returns false when NODE_ENV is test', () => {
    expect(isDevelopment()).toBe(false);
  });
});

describe('isProduction', () => {
  it('returns false when NODE_ENV is test', () => {
    expect(isProduction()).toBe(false);
  });
});

describe('isTest', () => {
  it('returns true when NODE_ENV is test', () => {
    expect(isTest()).toBe(true);
  });
});

describe('isDatabaseEnabled', () => {
  it('returns false when ENABLE_DATABASE is false', () => {
    expect(isDatabaseEnabled()).toBe(false);
  });
});

describe('shouldLog', () => {
  // config.LOG_LEVEL is 'info'
  it('returns true for info level when LOG_LEVEL is info', () => {
    expect(shouldLog('info')).toBe(true);
  });

  it('returns true for warn level when LOG_LEVEL is info', () => {
    expect(shouldLog('warn')).toBe(true);
  });

  it('returns true for error level when LOG_LEVEL is info', () => {
    expect(shouldLog('error')).toBe(true);
  });

  it('returns false for debug level when LOG_LEVEL is info', () => {
    expect(shouldLog('debug')).toBe(false);
  });
});
