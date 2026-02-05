/**
 * Database lifecycle integration for the MCP server.
 *
 * Connects the optional SQLite database to the server's startup
 * and shutdown lifecycle. Database initialization failures are
 * non-fatal -- the server continues without persistence.
 */

import process from 'node:process';

import { closeDatabase, initializeDatabase, isDatabaseReady } from '../database/index.js';
import { config, isDatabaseEnabled } from '../shared/config.js';

// ============================================================================
// Setup
// ============================================================================

/**
 * Initializes the database if persistence is enabled.
 *
 * This is called during server startup. Failures are logged but
 * do not prevent the server from starting -- database persistence
 * is an optional enhancement.
 */
export function setupDatabase(): void {
  if (!isDatabaseEnabled()) {
    return;
  }

  try {
    initializeDatabase();
    process.stderr.write(
      `[runware-mcp] Database initialized at ${config.DATABASE_PATH}\n`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `[runware-mcp] Database initialization failed: ${message}\n`,
    );
    // Non-fatal: server continues without database
  }
}

// ============================================================================
// Teardown
// ============================================================================

/**
 * Closes the database connection gracefully.
 *
 * Called during server shutdown. Safe to call even if the database
 * was never initialized or has already been closed.
 */
export function teardownDatabase(): void {
  if (isDatabaseReady()) {
    closeDatabase();
    process.stderr.write('[runware-mcp] Database connection closed\n');
  }
}
