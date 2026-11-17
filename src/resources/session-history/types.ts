// Does:  Defines one session-history entry and the aggregated history document.
// Holds: Type-only; the history provider serializes SessionHistory as-is to clients.
export interface SessionHistoryEntry {
  readonly id: string;
  readonly taskType: string;
  readonly prompt?: string | undefined;
  readonly model?: string | undefined;
  readonly outputURL?: string | undefined;
  readonly cost?: number | undefined;
  readonly createdAt: Date;
}

export interface SessionHistory {
  readonly totalGenerations: number;
  readonly totalCost: number;
  readonly entries: readonly SessionHistoryEntry[];
  readonly startedAt: Date;
}
