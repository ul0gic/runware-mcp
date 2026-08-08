export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'all';

export interface TaskTypeUsage {
  readonly taskType: string;
  readonly count: number;
  readonly cost: number;
}

export interface ProviderUsage {
  readonly provider: string;
  readonly count: number;
  readonly cost: number;
}

export interface TopModelEntry {
  readonly model: string;
  readonly count: number;
}

export interface AnalyticsData {
  readonly period: AnalyticsPeriod;
  readonly totalGenerations: number;
  readonly totalCost: number;
  readonly byTaskType: readonly TaskTypeUsage[];
  readonly byProvider: readonly ProviderUsage[];
  readonly topModels: readonly TopModelEntry[];
}
