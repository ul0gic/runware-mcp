/**
 * Database operations for all tables.
 *
 * Provides CRUD operations for:
 * - Generations: Track all media generations
 * - Watched Folders: Folder watch configurations
 * - Analytics: Usage statistics and cost tracking
 *
 * All operations are safe to call when database is disabled -
 * they will return appropriate defaults or no-op.
 */

import { randomUUID } from 'node:crypto';

import { and, desc, eq, gte, like, lte, sql } from 'drizzle-orm';

import { isDatabaseEnabled } from '../shared/config.js';
import { DatabaseError } from '../shared/errors.js';

import { getDatabase } from './client.js';
import { analytics, generations, watchedFolders } from './schema.js';

import type {
  Analytics,
  AnalyticsSummary,
  DateRangeOptions,
  Generation,
  GenerationSearchOptions,
  GenerationStatus,
  GenerationUpdate,
  NewGeneration,
  NewWatchedFolder,
  PaginationOptions,
  ProviderSummary,
  ProviderUsage,
  TaskTypeSummary,
  TopModel,
  WatchedFolder,
  WatchedFolderUpdate,
} from './types.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a Date to YYYY-MM-DD string.
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Gets today's date in YYYY-MM-DD format.
 */
function getToday(): string {
  return formatDate(new Date());
}

/**
 * Generates a new UUID.
 */
function generateId(): string {
  return randomUUID();
}

/**
 * Gets the current timestamp as a Date.
 */
function now(): Date {
  return new Date();
}

// ============================================================================
// Generation Operations
// ============================================================================

/**
 * Saves a new generation record to the database.
 *
 * @param generation - The generation data to save
 * @returns The saved generation with generated ID, or null if database is disabled
 */
export function saveGeneration(
  generation: Omit<NewGeneration, 'id' | 'createdAt'>,
): Generation | null {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const db = getDatabase();
  if (db === null) {
    return null;
  }

  const id = generateId();
  const createdAt = now();

  const newGeneration: NewGeneration = {
    ...generation,
    id,
    createdAt,
  };

  try {
    db.insert(generations).values(newGeneration).run();

    return {
      ...newGeneration,
      createdAt,
    } as Generation;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to save generation: ${message}`, {
      operation: 'saveGeneration',
      cause: message,
    });
  }
}

/**
 * Gets a single generation by ID.
 *
 * @param id - The generation ID
 * @returns The generation or null if not found
 */
export function getGeneration(id: string): Generation | null {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const db = getDatabase();
  if (db === null) {
    return null;
  }

  try {
    const result = db.select().from(generations).where(eq(generations.id, id)).get();
    return result ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get generation: ${message}`, {
      operation: 'getGeneration',
      cause: message,
    });
  }
}

/**
 * Gets a generation by its Runware task UUID.
 *
 * @param taskUUID - The Runware task UUID
 * @returns The generation or null if not found
 */
export function getGenerationByTaskUUID(taskUUID: string): Generation | null {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const db = getDatabase();
  if (db === null) {
    return null;
  }

  try {
    const result = db
      .select()
      .from(generations)
      .where(eq(generations.taskUUID, taskUUID))
      .get();
    return result ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get generation by task UUID: ${message}`, {
      operation: 'getGenerationByTaskUUID',
      cause: message,
    });
  }
}

/**
 * Gets recent generations with pagination.
 *
 * @param options - Pagination options
 * @returns Array of generations, newest first
 */
export function getRecentGenerations(options: PaginationOptions = {}): readonly Generation[] {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDatabase();
  if (db === null) {
    return [];
  }

  const { limit = 50, offset = 0 } = options;

  try {
    return db
      .select()
      .from(generations)
      .orderBy(desc(generations.createdAt))
      .limit(limit)
      .offset(offset)
      .all();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get recent generations: ${message}`, {
      operation: 'getRecentGenerations',
      cause: message,
    });
  }
}

/**
 * Gets generations filtered by task type.
 *
 * @param taskType - The task type to filter by
 * @param options - Pagination options
 * @returns Array of matching generations
 */
export function getGenerationsByType(
  taskType: string,
  options: PaginationOptions = {},
): readonly Generation[] {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDatabase();
  if (db === null) {
    return [];
  }

  const { limit = 50, offset = 0 } = options;

  try {
    return db
      .select()
      .from(generations)
      .where(eq(generations.taskType, taskType))
      .orderBy(desc(generations.createdAt))
      .limit(limit)
      .offset(offset)
      .all();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get generations by type: ${message}`, {
      operation: 'getGenerationsByType',
      cause: message,
    });
  }
}

/**
 * Gets generations within a date range.
 *
 * @param options - Date range and pagination options
 * @returns Array of matching generations
 */
export function getGenerationsByDateRange(
  dateRange: DateRangeOptions,
  pagination: PaginationOptions = {},
): readonly Generation[] {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDatabase();
  if (db === null) {
    return [];
  }

  const { startDate, endDate } = dateRange;
  const { limit = 100, offset = 0 } = pagination;

  try {
    return db
      .select()
      .from(generations)
      .where(and(gte(generations.createdAt, startDate), lte(generations.createdAt, endDate)))
      .orderBy(desc(generations.createdAt))
      .limit(limit)
      .offset(offset)
      .all();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get generations by date range: ${message}`, {
      operation: 'getGenerationsByDateRange',
      cause: message,
    });
  }
}

/**
 * Searches generations by prompt text.
 *
 * @param options - Search options including query and filters
 * @returns Array of matching generations
 */
export function searchGenerations(options: GenerationSearchOptions): readonly Generation[] {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDatabase();
  if (db === null) {
    return [];
  }

  const { query, taskType, status, model, provider, startDate, endDate, limit = 50, offset = 0 } = options;

  try {
    const conditions = [];

    if (query !== undefined && query.length > 0) {
      conditions.push(like(generations.prompt, `%${query}%`));
    }

    if (taskType !== undefined) {
      conditions.push(eq(generations.taskType, taskType));
    }

    if (status !== undefined) {
      conditions.push(eq(generations.status, status));
    }

    if (model !== undefined) {
      conditions.push(eq(generations.model, model));
    }

    if (provider !== undefined) {
      conditions.push(eq(generations.provider, provider));
    }

    if (startDate !== undefined) {
      conditions.push(gte(generations.createdAt, startDate));
    }

    if (endDate !== undefined) {
      conditions.push(lte(generations.createdAt, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(generations)
      .where(whereClause)
      .orderBy(desc(generations.createdAt))
      .limit(limit)
      .offset(offset)
      .all();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to search generations: ${message}`, {
      operation: 'searchGenerations',
      cause: message,
    });
  }
}

/**
 * Updates a generation's status and optionally error message.
 *
 * @param id - The generation ID
 * @param update - The fields to update
 * @returns true if updated, false if not found
 */
export function updateGeneration(id: string, update: GenerationUpdate): boolean {
  if (!isDatabaseEnabled()) {
    return false;
  }

  const db = getDatabase();
  if (db === null) {
    return false;
  }

  try {
    const result = db.update(generations).set(update).where(eq(generations.id, id)).run();
    return result.changes > 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to update generation: ${message}`, {
      operation: 'updateGeneration',
      cause: message,
    });
  }
}

/**
 * Updates a generation's status.
 *
 * @param id - The generation ID
 * @param status - The new status
 * @param errorMessage - Optional error message (for failed status)
 * @returns true if updated, false if not found
 */
export function updateGenerationStatus(
  id: string,
  status: GenerationStatus,
  errorMessage?: string,
): boolean {
  return updateGeneration(id, { status, errorMessage });
}

/**
 * Deletes a generation by ID.
 *
 * @param id - The generation ID
 * @returns true if deleted, false if not found
 */
export function deleteGeneration(id: string): boolean {
  if (!isDatabaseEnabled()) {
    return false;
  }

  const db = getDatabase();
  if (db === null) {
    return false;
  }

  try {
    const result = db.delete(generations).where(eq(generations.id, id)).run();
    return result.changes > 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to delete generation: ${message}`, {
      operation: 'deleteGeneration',
      cause: message,
    });
  }
}

// ============================================================================
// Watched Folder Operations
// ============================================================================

/**
 * Adds a new watched folder configuration.
 *
 * @param folder - The folder configuration
 * @returns The saved folder with generated ID, or null if database is disabled
 */
export function addWatchedFolder(
  folder: Omit<NewWatchedFolder, 'id' | 'createdAt'>,
): WatchedFolder | null {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const db = getDatabase();
  if (db === null) {
    return null;
  }

  const id = generateId();
  const createdAt = now();

  const newFolder: NewWatchedFolder = {
    ...folder,
    id,
    createdAt,
  };

  try {
    db.insert(watchedFolders).values(newFolder).run();

    return {
      ...newFolder,
      createdAt,
    } as WatchedFolder;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to add watched folder: ${message}`, {
      operation: 'addWatchedFolder',
      cause: message,
    });
  }
}

/**
 * Gets all active watched folders.
 *
 * @returns Array of active watched folders
 */
export function getWatchedFolders(): readonly WatchedFolder[] {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDatabase();
  if (db === null) {
    return [];
  }

  try {
    return db.select().from(watchedFolders).where(eq(watchedFolders.isActive, true)).all();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get watched folders: ${message}`, {
      operation: 'getWatchedFolders',
      cause: message,
    });
  }
}

/**
 * Gets a single watched folder by ID.
 *
 * @param id - The folder ID
 * @returns The folder or null if not found
 */
export function getWatchedFolder(id: string): WatchedFolder | null {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const db = getDatabase();
  if (db === null) {
    return null;
  }

  try {
    const result = db.select().from(watchedFolders).where(eq(watchedFolders.id, id)).get();
    return result ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get watched folder: ${message}`, {
      operation: 'getWatchedFolder',
      cause: message,
    });
  }
}

/**
 * Gets a watched folder by its path.
 *
 * @param path - The folder path
 * @returns The folder or null if not found
 */
export function getWatchedFolderByPath(path: string): WatchedFolder | null {
  if (!isDatabaseEnabled()) {
    return null;
  }

  const db = getDatabase();
  if (db === null) {
    return null;
  }

  try {
    const result = db.select().from(watchedFolders).where(eq(watchedFolders.path, path)).get();
    return result ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get watched folder by path: ${message}`, {
      operation: 'getWatchedFolderByPath',
      cause: message,
    });
  }
}

/**
 * Updates a watched folder's configuration.
 *
 * @param id - The folder ID
 * @param update - The fields to update
 * @returns true if updated, false if not found
 */
export function updateWatchedFolder(id: string, update: WatchedFolderUpdate): boolean {
  if (!isDatabaseEnabled()) {
    return false;
  }

  const db = getDatabase();
  if (db === null) {
    return false;
  }

  try {
    const result = db.update(watchedFolders).set(update).where(eq(watchedFolders.id, id)).run();
    return result.changes > 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to update watched folder: ${message}`, {
      operation: 'updateWatchedFolder',
      cause: message,
    });
  }
}

/**
 * Deactivates a watched folder (soft delete).
 *
 * @param id - The folder ID
 * @returns true if deactivated, false if not found
 */
export function removeWatchedFolder(id: string): boolean {
  return updateWatchedFolder(id, { isActive: false });
}

/**
 * Updates the last scan timestamp for a watched folder.
 *
 * @param id - The folder ID
 * @returns true if updated, false if not found
 */
export function updateLastScan(id: string): boolean {
  return updateWatchedFolder(id, { lastScan: now() });
}

// ============================================================================
// Analytics Operations
// ============================================================================

/**
 * Records a generation for analytics.
 *
 * This updates the daily aggregate counters for the given task type and provider.
 *
 * @param taskType - The task type
 * @param provider - The provider (optional)
 * @param cost - The cost of the generation
 */
export function recordAnalytics(taskType: string, provider: string | null, cost: number): void {
  if (!isDatabaseEnabled()) {
    return;
  }

  const db = getDatabase();
  if (db === null) {
    return;
  }

  const date = getToday();

  try {
    // Try to find existing record for this date/type/provider combination
    const existing = db
      .select()
      .from(analytics)
      .where(
        and(
          eq(analytics.date, date),
          eq(analytics.taskType, taskType),
          provider === null ? sql`${analytics.provider} IS NULL` : eq(analytics.provider, provider),
        ),
      )
      .get();

    if (existing === undefined) {
      // Insert new record
      db.insert(analytics)
        .values({
          id: generateId(),
          date,
          taskType,
          provider,
          count: 1,
          totalCost: cost,
          avgCost: cost,
          createdAt: now(),
        })
        .run();
    } else {
      // Update existing record
      const newCount = existing.count + 1;
      const newTotalCost = existing.totalCost + cost;
      const newAvgCost = newTotalCost / newCount;

      db.update(analytics)
        .set({
          count: newCount,
          totalCost: newTotalCost,
          avgCost: newAvgCost,
        })
        .where(eq(analytics.id, existing.id))
        .run();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to record analytics: ${message}`, {
      operation: 'recordAnalytics',
      cause: message,
    });
  }
}

/**
 * Gets analytics for a specific date.
 *
 * @param date - The date in YYYY-MM-DD format
 * @returns Array of analytics records for that date
 */
export function getAnalyticsByDate(date: string): readonly Analytics[] {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDatabase();
  if (db === null) {
    return [];
  }

  try {
    return db.select().from(analytics).where(eq(analytics.date, date)).all();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get analytics by date: ${message}`, {
      operation: 'getAnalyticsByDate',
      cause: message,
    });
  }
}

/**
 * Gets analytics for a date range.
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of analytics records
 */
export function getAnalyticsRange(startDate: string, endDate: string): readonly Analytics[] {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDatabase();
  if (db === null) {
    return [];
  }

  try {
    return db
      .select()
      .from(analytics)
      .where(and(gte(analytics.date, startDate), lte(analytics.date, endDate)))
      .orderBy(desc(analytics.date))
      .all();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get analytics range: ${message}`, {
      operation: 'getAnalyticsRange',
      cause: message,
    });
  }
}

/**
 * Helper to aggregate records into a map by key.
 */
function aggregateByKey(
  map: Map<string, { count: number; totalCost: number }>,
  key: string,
  count: number,
  cost: number,
): void {
  const existing = map.get(key);
  if (existing === undefined) {
    map.set(key, { count, totalCost: cost });
  } else {
    existing.count += count;
    existing.totalCost += cost;
  }
}

/**
 * Converts a map of aggregated data to task type summaries.
 */
function mapToTaskTypeSummaries(
  map: Map<string, { count: number; totalCost: number }>,
): TaskTypeSummary[] {
  return [...map.entries()].map(([taskType, data]) => ({
    taskType,
    count: data.count,
    totalCost: data.totalCost,
    averageCost: data.count > 0 ? data.totalCost / data.count : 0,
  }));
}

/**
 * Converts a map of aggregated data to provider summaries.
 */
function mapToProviderSummaries(
  map: Map<string, { count: number; totalCost: number }>,
): ProviderSummary[] {
  return [...map.entries()].map(([provider, data]) => ({
    provider,
    count: data.count,
    totalCost: data.totalCost,
    averageCost: data.count > 0 ? data.totalCost / data.count : 0,
  }));
}

/**
 * Creates the default empty summary for a date range.
 */
function createDefaultSummary(startDateStr: string, endDateStr: string): AnalyticsSummary {
  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalGenerations: 0,
    totalCost: 0,
    averageCost: 0,
    byTaskType: [],
    byProvider: [],
  };
}

/**
 * Gets a summary of analytics for the last N days.
 *
 * @param days - Number of days to include
 * @returns Analytics summary
 */
export function getAnalyticsSummary(days: number): AnalyticsSummary {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  if (!isDatabaseEnabled()) {
    return createDefaultSummary(startDateStr, endDateStr);
  }

  const db = getDatabase();
  if (db === null) {
    return createDefaultSummary(startDateStr, endDateStr);
  }

  try {
    const records = getAnalyticsRange(startDateStr, endDateStr);

    const taskTypeMap = new Map<string, { count: number; totalCost: number }>();
    const providerMap = new Map<string, { count: number; totalCost: number }>();

    let totalGenerations = 0;
    let totalCost = 0;

    for (const record of records) {
      totalGenerations += record.count;
      totalCost += record.totalCost;

      aggregateByKey(taskTypeMap, record.taskType, record.count, record.totalCost);
      aggregateByKey(providerMap, record.provider ?? 'unknown', record.count, record.totalCost);
    }

    const byTaskType = mapToTaskTypeSummaries(taskTypeMap);
    const byProvider = mapToProviderSummaries(providerMap);

    return {
      startDate: startDateStr,
      endDate: endDateStr,
      totalGenerations,
      totalCost,
      averageCost: totalGenerations > 0 ? totalCost / totalGenerations : 0,
      byTaskType: byTaskType.toSorted((a, b) => b.count - a.count),
      byProvider: byProvider.toSorted((a, b) => b.count - a.count),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get analytics summary: ${message}`, {
      operation: 'getAnalyticsSummary',
      cause: message,
    });
  }
}

/**
 * Gets the total spend across all time.
 *
 * @returns Total cost
 */
export function getTotalSpend(): number {
  if (!isDatabaseEnabled()) {
    return 0;
  }

  const db = getDatabase();
  if (db === null) {
    return 0;
  }

  try {
    const result = db
      .select({
        total: sql<number>`COALESCE(SUM(${analytics.totalCost}), 0)`,
      })
      .from(analytics)
      .get();

    return result?.total ?? 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get total spend: ${message}`, {
      operation: 'getTotalSpend',
      cause: message,
    });
  }
}

/**
 * Gets the most used models.
 *
 * @param limit - Maximum number of models to return
 * @returns Array of top models with usage counts
 */
export function getTopModels(limit = 10): readonly TopModel[] {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDatabase();
  if (db === null) {
    return [];
  }

  try {
    const result = db
      .select({
        model: generations.model,
        provider: generations.provider,
        count: sql<number>`COUNT(*)`,
        totalCost: sql<number>`COALESCE(SUM(${generations.cost}), 0)`,
      })
      .from(generations)
      .where(sql`${generations.model} IS NOT NULL`)
      .groupBy(generations.model, generations.provider)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit)
      .all();

    return result.map((row) => ({
      model: row.model ?? 'unknown',
      provider: row.provider,
      count: row.count,
      totalCost: row.totalCost,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get top models: ${message}`, {
      operation: 'getTopModels',
      cause: message,
    });
  }
}

/**
 * Gets usage breakdown by provider.
 *
 * @returns Array of provider usage with percentages
 */
export function getUsageByProvider(): readonly ProviderUsage[] {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDatabase();
  if (db === null) {
    return [];
  }

  try {
    // Get total count first
    const totalResult = db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(generations)
      .get();

    const totalCount = totalResult?.total ?? 0;

    if (totalCount === 0) {
      return [];
    }

    const result = db
      .select({
        provider: generations.provider,
        count: sql<number>`COUNT(*)`,
        totalCost: sql<number>`COALESCE(SUM(${generations.cost}), 0)`,
      })
      .from(generations)
      .groupBy(generations.provider)
      .orderBy(sql`COUNT(*) DESC`)
      .all();

    return result.map((row) => ({
      provider: row.provider ?? 'unknown',
      count: row.count,
      totalCost: row.totalCost,
      percentage: (row.count / totalCount) * 100,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Failed to get usage by provider: ${message}`, {
      operation: 'getUsageByProvider',
      cause: message,
    });
  }
}
