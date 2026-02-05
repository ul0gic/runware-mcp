/**
 * Unit tests for the server database-integration module.
 *
 * Tests setupDatabase and teardownDatabase with both
 * enabled and disabled database configurations, including
 * the initialization failure path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Tests with database ENABLED (success path)
// ============================================================================

describe('Database integration (database enabled, success)', () => {
  beforeEach(() => {
    vi.resetModules();

    vi.doMock('../../../src/shared/config.js', () => ({
      config: {
        RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
        REQUEST_TIMEOUT_MS: 60000,
        POLL_MAX_ATTEMPTS: 150,
        MAX_FILE_SIZE_MB: 50,
        ALLOWED_FILE_ROOTS: [],
        ENABLE_DATABASE: true,
        LOG_LEVEL: 'error',
        NODE_ENV: 'test',
        RATE_LIMIT_MAX_TOKENS: 10,
        RATE_LIMIT_REFILL_RATE: 1,
        DATABASE_PATH: ':memory:',
        WATCH_FOLDERS: [],
        WATCH_DEBOUNCE_MS: 500,
      },
      API_BASE_URL: 'https://api.runware.ai/v1',
      isDatabaseEnabled: (): boolean => true,
      isDevelopment: (): boolean => false,
      isProduction: (): boolean => false,
      isTest: (): boolean => true,
      shouldLog: (): boolean => false,
    }));
  });

  afterEach(async () => {
    try {
      const { closeDatabase } = await import('../../../src/database/index.js');
      closeDatabase();
    } catch {
      // ignore
    }
    vi.restoreAllMocks();
  });

  it('setupDatabase initializes the database and writes to stderr', async () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const { setupDatabase } = await import('../../../src/server/database-integration.js');
    setupDatabase();

    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database initialized at'),
    );
  });

  it('teardownDatabase closes the database and writes to stderr', async () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const { setupDatabase, teardownDatabase } = await import('../../../src/server/database-integration.js');
    setupDatabase();

    // Clear the setup log messages
    stderrSpy.mockClear();

    teardownDatabase();

    expect(stderrSpy).toHaveBeenCalledWith('[runware-mcp] Database connection closed\n');
  });

  it('teardownDatabase is a no-op after database is already closed', async () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const { setupDatabase, teardownDatabase } = await import('../../../src/server/database-integration.js');
    setupDatabase();
    stderrSpy.mockClear();

    teardownDatabase();
    stderrSpy.mockClear();

    // Second call should not write to stderr (database already closed)
    teardownDatabase();
    expect(stderrSpy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Tests with database ENABLED (failure path)
// ============================================================================

describe('Database integration (database enabled, initialization failure)', () => {
  beforeEach(() => {
    vi.resetModules();

    vi.doMock('../../../src/shared/config.js', () => ({
      config: {
        RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
        REQUEST_TIMEOUT_MS: 60000,
        POLL_MAX_ATTEMPTS: 150,
        MAX_FILE_SIZE_MB: 50,
        ALLOWED_FILE_ROOTS: [],
        ENABLE_DATABASE: true,
        LOG_LEVEL: 'error',
        NODE_ENV: 'test',
        RATE_LIMIT_MAX_TOKENS: 10,
        RATE_LIMIT_REFILL_RATE: 1,
        DATABASE_PATH: '/nonexistent/path/that/will/fail/test.db',
        WATCH_FOLDERS: [],
        WATCH_DEBOUNCE_MS: 500,
      },
      API_BASE_URL: 'https://api.runware.ai/v1',
      isDatabaseEnabled: (): boolean => true,
      isDevelopment: (): boolean => false,
      isProduction: (): boolean => false,
      isTest: (): boolean => true,
      shouldLog: (): boolean => false,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('setupDatabase catches initialization errors and logs them', async () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const { setupDatabase } = await import('../../../src/server/database-integration.js');

    // Should NOT throw (non-fatal)
    expect(() => { setupDatabase(); }).not.toThrow();

    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database initialization failed:'),
    );
  });
});

// ============================================================================
// Tests with database DISABLED
// ============================================================================

describe('Database integration (database disabled)', () => {
  beforeEach(() => {
    vi.resetModules();

    vi.doMock('../../../src/shared/config.js', () => ({
      config: {
        RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
        REQUEST_TIMEOUT_MS: 60000,
        POLL_MAX_ATTEMPTS: 150,
        MAX_FILE_SIZE_MB: 50,
        ALLOWED_FILE_ROOTS: [],
        ENABLE_DATABASE: false,
        LOG_LEVEL: 'error',
        NODE_ENV: 'test',
        RATE_LIMIT_MAX_TOKENS: 10,
        RATE_LIMIT_REFILL_RATE: 1,
        DATABASE_PATH: ':memory:',
        WATCH_FOLDERS: [],
        WATCH_DEBOUNCE_MS: 500,
      },
      API_BASE_URL: 'https://api.runware.ai/v1',
      isDatabaseEnabled: (): boolean => false,
      isDevelopment: (): boolean => false,
      isProduction: (): boolean => false,
      isTest: (): boolean => true,
      shouldLog: (): boolean => false,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('setupDatabase is a no-op when disabled', async () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const { setupDatabase } = await import('../../../src/server/database-integration.js');
    setupDatabase();

    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it('teardownDatabase is a no-op when disabled', async () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    const { teardownDatabase } = await import('../../../src/server/database-integration.js');
    teardownDatabase();

    expect(stderrSpy).not.toHaveBeenCalled();
  });
});
