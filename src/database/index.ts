/**
 * Database module for the Runware MCP server.
 *
 * Provides optional SQLite persistence for:
 * - Generation history and tracking
 * - Watched folder configurations
 * - Usage analytics and cost tracking
 *
 * The database is entirely optional. When disabled (ENABLE_DATABASE=false),
 * all operations become no-ops or return empty results.
 */

// ============================================================================
// Client Exports
// ============================================================================

export {
  closeDatabase,
  executeRawSql,
  getDatabase,
  getDatabaseStats,
  initializeDatabase,
  isDatabaseReady,
  requireDatabase,
  schema,
  type DrizzleDatabase,
} from './client.js';

// ============================================================================
// Schema Exports
// ============================================================================

export { analytics, generations, watchedFolders } from './schema.js';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  Analytics,
  AnalyticsSummary,
  DateRangeOptions,
  Generation,
  GenerationSearchOptions,
  GenerationStatus,
  GenerationUpdate,
  NewAnalytics,
  NewGeneration,
  NewWatchedFolder,
  PaginationOptions,
  ProviderSummary,
  ProviderUsage,
  TaskTypeSummary,
  TopModel,
  WatchedFolder,
  WatchedFolderOperation,
  WatchedFolderUpdate,
} from './types.js';

// ============================================================================
// Operation Exports
// ============================================================================

// Generation operations
export {
  deleteGeneration,
  getGeneration,
  getGenerationByTaskUUID,
  getGenerationsByDateRange,
  getGenerationsByType,
  getRecentGenerations,
  saveGeneration,
  searchGenerations,
  updateGeneration,
  updateGenerationStatus,
} from './operations.js';

// Watched folder operations
export {
  addWatchedFolder,
  getWatchedFolder,
  getWatchedFolderByPath,
  getWatchedFolders,
  removeWatchedFolder,
  updateLastScan,
  updateWatchedFolder,
} from './operations.js';

// Analytics operations
export {
  getAnalyticsByDate,
  getAnalyticsRange,
  getAnalyticsSummary,
  getTopModels,
  getTotalSpend,
  getUsageByProvider,
  recordAnalytics,
} from './operations.js';
