/**
 * Database types inferred from Drizzle schema.
 *
 * These types are used throughout the application for type-safe
 * database operations.
 */

import type { analytics, generations, watchedFolders } from './schema.js';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// ============================================================================
// Generation Types
// ============================================================================

/**
 * A generation record as stored in the database.
 */
export type Generation = InferSelectModel<typeof generations>;

/**
 * Data required to insert a new generation record.
 */
export type NewGeneration = InferInsertModel<typeof generations>;

/**
 * Fields that can be updated on a generation record.
 */
export interface GenerationUpdate {
  readonly status?: 'pending' | 'processing' | 'completed' | 'failed';
  readonly errorMessage?: string;
  readonly outputUrl?: string;
  readonly outputUuid?: string;
  readonly cost?: number;
}

/**
 * Valid status values for generations.
 */
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// Watched Folder Types
// ============================================================================

/**
 * A watched folder record as stored in the database.
 */
export type WatchedFolder = InferSelectModel<typeof watchedFolders>;

/**
 * Data required to insert a new watched folder record.
 */
export type NewWatchedFolder = InferInsertModel<typeof watchedFolders>;

/**
 * Fields that can be updated on a watched folder record.
 */
export interface WatchedFolderUpdate {
  readonly operation?: string;
  readonly operationParams?: string;
  readonly outputFolder?: string;
  readonly isActive?: boolean;
  readonly lastScan?: Date;
}

/**
 * Valid operations for watched folders.
 */
export type WatchedFolderOperation =
  | 'upscale'
  | 'removeBackground'
  | 'caption'
  | 'vectorize'
  | 'controlnetPreprocess';

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * An analytics record as stored in the database.
 */
export type Analytics = InferSelectModel<typeof analytics>;

/**
 * Data required to insert a new analytics record.
 */
export type NewAnalytics = InferInsertModel<typeof analytics>;

// ============================================================================
// Analytics Summary Types
// ============================================================================

/**
 * Summary of analytics for a given period.
 */
export interface AnalyticsSummary {
  /**
   * Start date of the period (YYYY-MM-DD).
   */
  readonly startDate: string;

  /**
   * End date of the period (YYYY-MM-DD).
   */
  readonly endDate: string;

  /**
   * Total number of generations in the period.
   */
  readonly totalGenerations: number;

  /**
   * Total cost across all generations.
   */
  readonly totalCost: number;

  /**
   * Average cost per generation.
   */
  readonly averageCost: number;

  /**
   * Breakdown by task type.
   */
  readonly byTaskType: readonly TaskTypeSummary[];

  /**
   * Breakdown by provider.
   */
  readonly byProvider: readonly ProviderSummary[];
}

/**
 * Summary for a specific task type.
 */
export interface TaskTypeSummary {
  readonly taskType: string;
  readonly count: number;
  readonly totalCost: number;
  readonly averageCost: number;
}

/**
 * Summary for a specific provider.
 */
export interface ProviderSummary {
  readonly provider: string;
  readonly count: number;
  readonly totalCost: number;
  readonly averageCost: number;
}

/**
 * Top model usage information.
 */
export interface TopModel {
  readonly model: string;
  readonly provider: string | null;
  readonly count: number;
  readonly totalCost: number;
}

/**
 * Provider usage breakdown.
 */
export interface ProviderUsage {
  readonly provider: string;
  readonly count: number;
  readonly totalCost: number;
  readonly percentage: number;
}

// ============================================================================
// Query Options
// ============================================================================

/**
 * Options for paginated queries.
 */
export interface PaginationOptions {
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Options for date range queries.
 */
export interface DateRangeOptions {
  readonly startDate: Date;
  readonly endDate: Date;
}

/**
 * Options for searching generations.
 */
export interface GenerationSearchOptions extends PaginationOptions {
  readonly query?: string;
  readonly taskType?: string;
  readonly status?: GenerationStatus;
  readonly model?: string;
  readonly provider?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
}
