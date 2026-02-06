/**
 * Resource provider for usage analytics.
 *
 * Provides aggregated usage statistics and cost analytics
 * across different time periods from session data.
 *
 * URI pattern: runware://analytics/{period}
 * Periods: day, week, month, all
 */

import { getSessionAudio } from '../generated-audio/provider.js';
import { getSessionImages } from '../generated-images/provider.js';
import { getSessionVideos } from '../generated-videos/provider.js';

import type { AnalyticsData, AnalyticsPeriod, ProviderUsage, TaskTypeUsage, TopModelEntry } from './types.js';
import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * URI prefix for analytics resources.
 */
const URI_PREFIX = 'runware://analytics/';

/**
 * Valid analytics periods.
 */
const VALID_PERIODS: readonly AnalyticsPeriod[] = ['day', 'week', 'month', 'all'];

/**
 * Returns the display name for a given analytics period.
 * Uses a switch to avoid object injection lint issues.
 */
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

// ============================================================================
// Session Analytics
// ============================================================================

/**
 * Computes analytics from the current session stores.
 *
 * @returns Analytics data from session stores
 */
function computeSessionAnalytics(): AnalyticsData {
  const taskTypeMap = new Map<string, { count: number; cost: number }>();
  const providerMap = new Map<string, { count: number; cost: number }>();
  const modelMap = new Map<string, number>();

  let totalGenerations = 0;
  let totalCost = 0;

  // Process images
  for (const image of getSessionImages()) {
    totalGenerations += 1;
    totalCost += image.cost ?? 0;
    incrementMapEntry(taskTypeMap, 'imageInference', image.cost ?? 0);
    incrementMapEntry(providerMap, extractProvider(image.model), image.cost ?? 0);
    incrementModelCount(modelMap, image.model);
  }

  // Process videos
  for (const video of getSessionVideos()) {
    totalGenerations += 1;
    totalCost += video.cost ?? 0;
    incrementMapEntry(taskTypeMap, 'videoInference', video.cost ?? 0);
    incrementMapEntry(providerMap, extractProvider(video.model), video.cost ?? 0);
    incrementModelCount(modelMap, video.model);
  }

  // Process audio
  for (const audio of getSessionAudio()) {
    totalGenerations += 1;
    totalCost += audio.cost ?? 0;
    incrementMapEntry(taskTypeMap, 'audioInference', audio.cost ?? 0);
    incrementMapEntry(providerMap, extractProvider(audio.model), audio.cost ?? 0);
    incrementModelCount(modelMap, audio.model);
  }

  return {
    period: 'all',
    totalGenerations,
    totalCost,
    byTaskType: mapToTaskTypeUsage(taskTypeMap),
    byProvider: mapToProviderUsage(providerMap),
    topModels: mapToTopModels(modelMap),
  };
}

// ============================================================================
// Map Helpers
// ============================================================================

/**
 * Increments a count/cost entry in a map.
 */
function incrementMapEntry(
  map: Map<string, { count: number; cost: number }>,
  key: string,
  cost: number,
): void {
  const existing = map.get(key);
  if (existing === undefined) {
    map.set(key, { count: 1, cost });
  } else {
    existing.count += 1;
    existing.cost += cost;
  }
}

/**
 * Increments a model count in a map.
 */
function incrementModelCount(map: Map<string, number>, model: string): void {
  const existing = map.get(model);
  map.set(model, (existing ?? 0) + 1);
}

/**
 * Extracts the provider name from a model ID string.
 * Model IDs follow the AIR format: "provider:model@version"
 *
 * @param modelId - The full model ID string
 * @returns The provider portion, or 'unknown' if parsing fails
 */
function extractProvider(modelId: string): string {
  const colonIndex = modelId.indexOf(':');
  if (colonIndex === -1) {
    return 'unknown';
  }
  return modelId.slice(0, colonIndex);
}

/**
 * Converts a task type map to sorted TaskTypeUsage array.
 */
function mapToTaskTypeUsage(
  map: Map<string, { count: number; cost: number }>,
): TaskTypeUsage[] {
  return [...map.entries()]
    .map(([taskType, data]) => ({
      taskType,
      count: data.count,
      cost: data.cost,
    }))
    .toSorted((a, b) => b.count - a.count);
}

/**
 * Converts a provider map to sorted ProviderUsage array.
 */
function mapToProviderUsage(
  map: Map<string, { count: number; cost: number }>,
): ProviderUsage[] {
  return [...map.entries()]
    .map(([provider, data]) => ({
      provider,
      count: data.count,
      cost: data.cost,
    }))
    .toSorted((a, b) => b.count - a.count);
}

/**
 * Converts a model count map to sorted TopModelEntry array.
 */
function mapToTopModels(map: Map<string, number>): TopModelEntry[] {
  return [...map.entries()]
    .map(([model, count]) => ({ model, count }))
    .toSorted((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ============================================================================
// Period Validation
// ============================================================================

/**
 * Validates that a string is a valid analytics period.
 *
 * @param value - The string to validate
 * @returns true if the string is a valid period
 */
function isValidPeriod(value: string): value is AnalyticsPeriod {
  return (VALID_PERIODS as readonly string[]).includes(value);
}

// ============================================================================
// Provider
// ============================================================================

/**
 * Resource provider for usage analytics.
 *
 * Exposes analytics data for different time periods as MCP resources.
 * Provides session-only analytics computed from in-memory stores.
 */
export const analyticsProvider: ResourceProvider = {
  uri: 'runware://analytics/{period}',
  name: 'Usage Analytics',
  description: 'Generation usage statistics and cost analytics',
  mimeType: 'application/json',

  list(): Promise<readonly ResourceEntry[]> {
    const entries = VALID_PERIODS.map((period) => ({
      uri: `${URI_PREFIX}${period}`,
      name: getPeriodDisplayName(period),
      description: `Session-only analytics for ${period}`,
      mimeType: 'application/json',
    }));

    return Promise.resolve(entries);
  },

  get(uri: string): Promise<ResourceContent | null> {
    const periodString = uri.replace(URI_PREFIX, '');

    if (!isValidPeriod(periodString)) {
      return Promise.resolve(null);
    }

    const analyticsData = { ...computeSessionAnalytics(), period: periodString };

    return Promise.resolve({
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(analyticsData, null, 2),
    });
  },
};
