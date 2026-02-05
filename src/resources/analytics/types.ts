/**
 * Types for the analytics resource.
 *
 * Defines the shape of analytics data returned for different
 * time periods (day, week, month, all).
 */

/**
 * Valid analytics time periods.
 */
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'all';

/**
 * Usage breakdown for a specific task type.
 */
export interface TaskTypeUsage {
  readonly taskType: string;
  readonly count: number;
  readonly cost: number;
}

/**
 * Usage breakdown for a specific provider.
 */
export interface ProviderUsage {
  readonly provider: string;
  readonly count: number;
  readonly cost: number;
}

/**
 * Top model usage entry.
 */
export interface TopModelEntry {
  readonly model: string;
  readonly count: number;
}

/**
 * Complete analytics data for a given time period.
 */
export interface AnalyticsData {
  readonly period: AnalyticsPeriod;
  readonly totalGenerations: number;
  readonly totalCost: number;
  readonly byTaskType: readonly TaskTypeUsage[];
  readonly byProvider: readonly ProviderUsage[];
  readonly topModels: readonly TopModelEntry[];
}
