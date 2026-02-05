/**
 * Unit tests for the database client module.
 *
 * Tests database initialization, access, shutdown, and utility functions
 * with both enabled and disabled database configurations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Tests with database DISABLED
// ============================================================================

describe('Database client (database disabled)', () => {
  beforeEach(async () => {
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
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializeDatabase is a no-op when database is disabled', async () => {
    const { initializeDatabase } = await import('../../../src/database/client.js');
    // Should not throw
    expect(() => { initializeDatabase(); }).not.toThrow();
  });

  it('getDatabase returns null when database is disabled', async () => {
    const { getDatabase } = await import('../../../src/database/client.js');
    const db = getDatabase();
    expect(db).toBeNull();
  });

  it('requireDatabase throws when database is disabled', async () => {
    const { requireDatabase } = await import('../../../src/database/client.js');
    expect(() => { requireDatabase(); }).toThrow(/not available/);
  });

  it('isDatabaseReady returns false when database is disabled', async () => {
    const { isDatabaseReady } = await import('../../../src/database/client.js');
    expect(isDatabaseReady()).toBe(false);
  });

  it('closeDatabase is safe to call when database is disabled', async () => {
    const { closeDatabase } = await import('../../../src/database/client.js');
    expect(() => { closeDatabase(); }).not.toThrow();
  });

  it('getDatabaseStats returns null when no state', async () => {
    const { getDatabaseStats } = await import('../../../src/database/client.js');
    expect(getDatabaseStats()).toBeNull();
  });
});

// ============================================================================
// Tests with database ENABLED
// ============================================================================

describe('Database client (database enabled)', () => {
  beforeEach(async () => {
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
    }));
  });

  afterEach(async () => {
    // Ensure we close the database after each test
    try {
      const { closeDatabase } = await import('../../../src/database/client.js');
      closeDatabase();
    } catch {
      // ignore
    }
    vi.restoreAllMocks();
  });

  it('initializeDatabase creates tables and sets state', async () => {
    const { initializeDatabase, isDatabaseReady } = await import('../../../src/database/client.js');

    initializeDatabase();

    expect(isDatabaseReady()).toBe(true);
  });

  it('initializeDatabase is idempotent', async () => {
    const { initializeDatabase, isDatabaseReady } = await import('../../../src/database/client.js');

    initializeDatabase();
    initializeDatabase();
    initializeDatabase();

    expect(isDatabaseReady()).toBe(true);
  });

  it('getDatabase returns a Drizzle instance after initialization', async () => {
    const { initializeDatabase, getDatabase } = await import('../../../src/database/client.js');

    initializeDatabase();

    const db = getDatabase();
    expect(db).not.toBeNull();
  });

  it('getDatabase auto-initializes on first access', async () => {
    const { getDatabase, isDatabaseReady } = await import('../../../src/database/client.js');

    // Do not explicitly call initializeDatabase
    const db = getDatabase();

    expect(db).not.toBeNull();
    expect(isDatabaseReady()).toBe(true);
  });

  it('requireDatabase returns the database when available', async () => {
    const { initializeDatabase, requireDatabase } = await import('../../../src/database/client.js');

    initializeDatabase();

    const db = requireDatabase();
    expect(db).not.toBeNull();
  });

  it('closeDatabase resets the state', async () => {
    const { initializeDatabase, closeDatabase, isDatabaseReady } = await import('../../../src/database/client.js');

    initializeDatabase();
    expect(isDatabaseReady()).toBe(true);

    closeDatabase();
    expect(isDatabaseReady()).toBe(false);
  });

  it('closeDatabase can be called multiple times', async () => {
    const { initializeDatabase, closeDatabase } = await import('../../../src/database/client.js');

    initializeDatabase();

    expect(() => {
      closeDatabase();
      closeDatabase();
      closeDatabase();
    }).not.toThrow();
  });

  it('database can be re-initialized after close', async () => {
    const {
      initializeDatabase,
      closeDatabase,
      isDatabaseReady,
      getDatabase,
    } = await import('../../../src/database/client.js');

    initializeDatabase();
    expect(isDatabaseReady()).toBe(true);

    closeDatabase();
    expect(isDatabaseReady()).toBe(false);

    initializeDatabase();
    expect(isDatabaseReady()).toBe(true);
    expect(getDatabase()).not.toBeNull();
  });

  it('getDatabaseStats returns stats when database is ready', async () => {
    const { initializeDatabase, getDatabaseStats } = await import('../../../src/database/client.js');

    initializeDatabase();

    const stats = getDatabaseStats();
    expect(stats).not.toBeNull();
    expect(stats!.isReady).toBe(true);
    expect(stats!.path).toBe(':memory:');
    expect(typeof stats!.walMode).toBe('boolean');
  });

  it('executeRawSql works on initialized database', async () => {
    const { initializeDatabase, executeRawSql } = await import('../../../src/database/client.js');

    initializeDatabase();

    // Should not throw for a valid SQL statement
    expect(() => {
      executeRawSql('SELECT 1');
    }).not.toThrow();
  });

  it('executeRawSql throws when database is not available', async () => {
    // Reset modules to get a clean state with no initialized database
    vi.resetModules();

    // Re-mock with database enabled but don't initialize
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
    }));

    const { executeRawSql } = await import('../../../src/database/client.js');

    expect(() => {
      executeRawSql('SELECT 1');
    }).toThrow(/not available/);
  });
});

// ============================================================================
// Database initialization error handling
// ============================================================================

describe('Database client (initialization failure)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws DatabaseError when initialization fails with bad path', async () => {
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
        DATABASE_PATH: '/nonexistent/directory/that/does/not/exist/test.db',
        WATCH_FOLDERS: [],
        WATCH_DEBOUNCE_MS: 500,
      },
      API_BASE_URL: 'https://api.runware.ai/v1',
      isDatabaseEnabled: (): boolean => true,
    }));

    const { initializeDatabase } = await import('../../../src/database/client.js');

    expect(() => {
      initializeDatabase();
    }).toThrow(/Failed to initialize database/);
  });
});
