/**
 * Database client module for SQLite with Drizzle ORM.
 *
 * Provides a managed database connection that:
 * - Checks if database is enabled via config
 * - Creates and initializes the database on demand
 * - Handles graceful shutdown
 * - Exports null/noop when disabled
 */

import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import { config, isDatabaseEnabled } from '../shared/config.js';
import { DatabaseError } from '../shared/errors.js';

import * as schema from './schema.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Drizzle database instance type with our schema.
 */
export type DrizzleDatabase = BetterSQLite3Database<typeof schema>;

/**
 * Database connection state.
 */
interface DatabaseState {
  readonly sqlite: Database.Database;
  readonly drizzle: DrizzleDatabase;
  readonly isReady: boolean;
}

// ============================================================================
// Module State
// ============================================================================

/**
 * Current database state.
 * null when database is disabled or not initialized.
 */
let databaseState: DatabaseState | null = null;

// ============================================================================
// Schema Creation SQL
// ============================================================================

/**
 * SQL statements to create tables if they don't exist.
 * This is used for initialization since we're not using Drizzle migrations.
 */
const CREATE_TABLES_SQL = `
-- Generations table
CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  task_uuid TEXT NOT NULL,
  prompt TEXT,
  negative_prompt TEXT,
  model TEXT,
  provider TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  output_url TEXT,
  output_uuid TEXT,
  output_format TEXT,
  cost REAL,
  metadata TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  created_at INTEGER NOT NULL
);

-- Generations indexes
CREATE INDEX IF NOT EXISTS idx_generations_task_type ON generations(task_type);
CREATE INDEX IF NOT EXISTS idx_generations_task_uuid ON generations(task_uuid);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at);
CREATE INDEX IF NOT EXISTS idx_generations_model ON generations(model);
CREATE INDEX IF NOT EXISTS idx_generations_provider ON generations(provider);

-- Watched folders table
CREATE TABLE IF NOT EXISTS watched_folders (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  operation TEXT NOT NULL,
  operation_params TEXT,
  output_folder TEXT,
  is_active INTEGER DEFAULT 1,
  last_scan INTEGER,
  created_at INTEGER NOT NULL
);

-- Watched folders indexes
CREATE INDEX IF NOT EXISTS idx_watched_folders_path ON watched_folders(path);
CREATE INDEX IF NOT EXISTS idx_watched_folders_is_active ON watched_folders(is_active);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  task_type TEXT NOT NULL,
  provider TEXT,
  count INTEGER NOT NULL DEFAULT 0,
  total_cost REAL NOT NULL DEFAULT 0,
  avg_cost REAL,
  created_at INTEGER NOT NULL
);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
CREATE INDEX IF NOT EXISTS idx_analytics_task_type ON analytics(task_type);
CREATE INDEX IF NOT EXISTS idx_analytics_provider ON analytics(provider);
CREATE INDEX IF NOT EXISTS idx_analytics_date_task_type ON analytics(date, task_type);
`;

// ============================================================================
// Database Initialization
// ============================================================================

/**
 * Initializes the database connection and creates tables if needed.
 *
 * This function is idempotent - calling it multiple times is safe.
 * If the database is disabled via config, this is a no-op.
 *
 * @throws {DatabaseError} If database initialization fails
 */
export function initializeDatabase(): void {
  // Skip if database is disabled
  if (!isDatabaseEnabled()) {
    return;
  }

  // Skip if already initialized
  if (databaseState !== null) {
    return;
  }

  try {
    // Create SQLite connection
    const sqlite = new Database(config.DATABASE_PATH);

    // Enable WAL mode for better concurrent performance
    sqlite.pragma('journal_mode = WAL');

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    // Create Drizzle instance
    const drizzleDb = drizzle(sqlite, { schema });

    // Create tables if they don't exist
    sqlite.exec(CREATE_TABLES_SQL);

    // Store state
    databaseState = {
      sqlite,
      drizzle: drizzleDb,
      isReady: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to initialize database: ${message}`, {
      operation: 'initialize',
      cause: message,
    });
  }
}

// ============================================================================
// Database Access
// ============================================================================

/**
 * Gets the Drizzle database instance.
 *
 * @returns The Drizzle database instance, or null if database is disabled/not initialized
 */
export function getDatabase(): DrizzleDatabase | null {
  if (!isDatabaseEnabled()) {
    return null;
  }

  if (databaseState === null) {
    // Auto-initialize on first access
    initializeDatabase();
  }

  return databaseState?.drizzle ?? null;
}

/**
 * Gets the Drizzle database instance, throwing if not available.
 *
 * Use this when you need to guarantee the database is available.
 *
 * @throws {DatabaseError} If database is disabled or not initialized
 */
export function requireDatabase(): DrizzleDatabase {
  const db = getDatabase();

  if (db === null) {
    throw new DatabaseError('Database is not available', {
      operation: 'requireDatabase',
      cause: isDatabaseEnabled()
        ? 'Database not initialized'
        : 'Database is disabled via ENABLE_DATABASE config',
    });
  }

  return db;
}

/**
 * Checks if the database is ready for operations.
 *
 * @returns true if database is enabled and initialized
 */
export function isDatabaseReady(): boolean {
  return databaseState?.isReady ?? false;
}

// ============================================================================
// Database Shutdown
// ============================================================================

/**
 * Closes the database connection gracefully.
 *
 * This should be called during server shutdown.
 * After calling this, the database can be re-initialized.
 */
export function closeDatabase(): void {
  if (databaseState === null) {
    return;
  }

  try {
    databaseState.sqlite.close();
  } catch {
    // Ignore close errors - we're shutting down anyway
  }

  databaseState = null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Executes a raw SQL query (for advanced use cases).
 *
 * @param query - The SQL query to execute
 * @throws {DatabaseError} If database is not available
 */
export function executeRawSql(query: string): void {
  const db = requireDatabase();
  db.run(sql.raw(query));
}

/**
 * Gets database statistics for monitoring.
 *
 * @returns Database statistics or null if database is not available
 */
export function getDatabaseStats(): Readonly<{
  path: string;
  isReady: boolean;
  walMode: boolean;
}> | null {
  if (databaseState === null) {
    return null;
  }

  const journalMode = databaseState.sqlite.pragma('journal_mode', {
    simple: true,
  }) as string;

  return {
    path: config.DATABASE_PATH,
    isReady: databaseState.isReady,
    walMode: journalMode === 'wal',
  };
}

// ============================================================================
// Re-exports
// ============================================================================

export * as schema from './schema.js';
