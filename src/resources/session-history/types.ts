/**
 * Types for the session history resource.
 *
 * Defines the shape of session history entries that aggregate
 * all generation events across images, videos, and audio.
 */

/**
 * A single event in the session history timeline.
 */
export interface SessionHistoryEntry {
  readonly id: string;
  readonly taskType: string;
  readonly prompt?: string;
  readonly model?: string;
  readonly outputURL?: string;
  readonly cost?: number;
  readonly createdAt: Date;
}

/**
 * Complete session history including aggregated statistics.
 */
export interface SessionHistory {
  readonly totalGenerations: number;
  readonly totalCost: number;
  readonly entries: readonly SessionHistoryEntry[];
  readonly startedAt: Date;
}
