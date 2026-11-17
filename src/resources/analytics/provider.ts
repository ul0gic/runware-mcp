// Does:  Computes usage counts and cost by task type, provider and model from the session stores.
// Holds: A period counts only generations whose createdAt falls in its rolling window ending now; all counts every one.
import { getSessionAudio } from '../generated-audio/provider.js';
import { getSessionImages } from '../generated-images/provider.js';
import { getSessionVideos } from '../generated-videos/provider.js';
import { getSessionEvents } from '../session-history/provider.js';

import type { AnalyticsData, AnalyticsPeriod, ProviderUsage, TaskTypeUsage, TopModelEntry } from './types.js';
import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

const URI_PREFIX = 'runware://analytics/';

const VALID_PERIODS: readonly AnalyticsPeriod[] = ['day', 'week', 'month', 'all'];

// Why: A switch rather than a lookup object avoids the object-injection lint.
function getPeriodDisplayName(period: AnalyticsPeriod): string {
  switch (period) {
    case 'day': {
      return "Today's Analytics";
    }
    case 'week': {
      return "This Week's Analytics";
    }
    case 'month': {
      return "This Month's Analytics";
    }
    case 'all': {
      return 'All-Time Analytics';
    }
  }
}

const DAY_MS = 86_400_000;

// Why: Rolling windows ending now, so a generation just before midnight still counts as "today".
function periodWindowMs(period: AnalyticsPeriod): number {
  switch (period) {
    case 'day': {
      return DAY_MS;
    }
    case 'week': {
      return 7 * DAY_MS;
    }
    case 'month': {
      return 30 * DAY_MS;
    }
    case 'all': {
      return Number.POSITIVE_INFINITY;
    }
  }
}

interface GenerationEvent {
  readonly taskType: string;
  readonly model: string | undefined;
  readonly cost: number;
  readonly createdAt: Date;
}

function collectSessionEvents(): GenerationEvent[] {
  const toEvent =
    (taskType: string) =>
    (entry: { readonly model: string; readonly cost?: number; readonly createdAt: Date }): GenerationEvent => ({
      taskType,
      model: entry.model,
      cost: entry.cost ?? 0,
      createdAt: entry.createdAt,
    });
  return [
    ...getSessionImages().map(toEvent('imageInference')),
    ...getSessionVideos().map(toEvent('videoInference')),
    ...getSessionAudio().map(toEvent('audioInference')),
    ...getSessionEvents().map((event) => ({
      taskType: event.taskType,
      model: event.model,
      cost: event.cost ?? 0,
      createdAt: event.createdAt,
    })),
  ];
}

function computeSessionAnalytics(period: AnalyticsPeriod): AnalyticsData {
  const taskTypeMap = new Map<string, { count: number; cost: number }>();
  const providerMap = new Map<string, { count: number; cost: number }>();
  const modelMap = new Map<string, number>();
  const since = Date.now() - periodWindowMs(period);

  let totalGenerations = 0;
  let totalCost = 0;

  for (const event of collectSessionEvents()) {
    if (event.createdAt.getTime() < since) {
      continue;
    }
    totalGenerations += 1;
    totalCost += event.cost;
    incrementMapEntry(taskTypeMap, event.taskType, event.cost);
    incrementMapEntry(providerMap, extractProvider(event.model ?? ''), event.cost);
    if (event.model !== undefined) {
      incrementModelCount(modelMap, event.model);
    }
  }

  return {
    period,
    totalGenerations,
    totalCost,
    byTaskType: mapToTaskTypeUsage(taskTypeMap),
    byProvider: mapToProviderUsage(providerMap),
    topModels: mapToTopModels(modelMap),
  };
}

function incrementMapEntry(map: Map<string, { count: number; cost: number }>, key: string, cost: number): void {
  const existing = map.get(key);
  if (existing === undefined) {
    map.set(key, { count: 1, cost });
  } else {
    existing.count += 1;
    existing.cost += cost;
  }
}

function incrementModelCount(map: Map<string, number>, model: string): void {
  const existing = map.get(model);
  map.set(model, (existing ?? 0) + 1);
}

// Holds: model ids are AIR `provider:model@version`, so the provider is the text before the first colon.
function extractProvider(modelId: string): string {
  const colonIndex = modelId.indexOf(':');
  return colonIndex === -1 ? 'unknown' : modelId.slice(0, colonIndex);
}

function mapToTaskTypeUsage(map: Map<string, { count: number; cost: number }>): TaskTypeUsage[] {
  return [...map]
    .map(([taskType, data]) => ({
      taskType,
      count: data.count,
      cost: data.cost,
    }))
    .toSorted((a, b) => b.count - a.count);
}

function mapToProviderUsage(map: Map<string, { count: number; cost: number }>): ProviderUsage[] {
  return [...map]
    .map(([provider, data]) => ({
      provider,
      count: data.count,
      cost: data.cost,
    }))
    .toSorted((a, b) => b.count - a.count);
}

function mapToTopModels(map: Map<string, number>): TopModelEntry[] {
  return [...map]
    .map(([model, count]) => ({ model, count }))
    .toSorted((a, b) => b.count - a.count)
    .slice(0, 10);
}

function periodDescription(period: AnalyticsPeriod): string {
  if (period === 'all') {
    return 'every generation';
  }
  const days = periodWindowMs(period) / DAY_MS;
  return days === 1 ? 'the last 24 hours' : `the last ${String(days)} days`;
}

function isValidPeriod(value: string): value is AnalyticsPeriod {
  return VALID_PERIODS.some((period) => period === value);
}

export const analyticsProvider: ResourceProvider = {
  uri: 'runware://analytics/{period}',
  name: 'Usage Analytics',
  description: 'Generation usage statistics and cost analytics',
  mimeType: 'application/json',

  list(): Promise<readonly ResourceEntry[]> {
    const entries = VALID_PERIODS.map((period) => ({
      uri: `${URI_PREFIX}${period}`,
      name: getPeriodDisplayName(period),
      description: `Session-only analytics for ${periodDescription(period)}`,
      mimeType: 'application/json',
    }));

    return Promise.resolve(entries);
  },

  get(uri: string): Promise<ResourceContent | null> {
    const periodString = uri.replace(URI_PREFIX, '');

    if (!isValidPeriod(periodString)) {
      return Promise.resolve(null);
    }

    const analyticsData = computeSessionAnalytics(periodString);

    return Promise.resolve({
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(analyticsData, null, 2),
    });
  },
};
