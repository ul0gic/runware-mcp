export interface SessionHistoryEntry {
  readonly id: string;
  readonly taskType: string;
  readonly prompt?: string;
  readonly model?: string;
  readonly outputURL?: string;
  readonly cost?: number;
  readonly createdAt: Date;
}

export interface SessionHistory {
  readonly totalGenerations: number;
  readonly totalCost: number;
  readonly entries: readonly SessionHistoryEntry[];
  readonly startedAt: Date;
}
