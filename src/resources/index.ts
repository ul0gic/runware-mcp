/**
 * Resource registry for the Runware MCP server.
 *
 * Central registry that manages all resource providers. Each provider
 * handles a specific category of resources (images, videos, audio,
 * session history, analytics).
 *
 * Re-exports the shared types and all provider modules for convenience.
 */

export type { ResourceContent, ResourceEntry, ResourceProvider } from './types.js';

export {
  clearSessionImages,
  generatedImagesProvider,
  getSessionImages,
  registerImage,
} from './generated-images/provider.js';
export type { GeneratedImageEntry } from './generated-images/types.js';

export {
  clearSessionVideos,
  generatedVideosProvider,
  getSessionVideos,
  registerVideo,
} from './generated-videos/provider.js';
export type { GeneratedVideoEntry } from './generated-videos/types.js';

export {
  clearSessionAudio,
  generatedAudioProvider,
  getSessionAudio,
  registerAudio,
} from './generated-audio/provider.js';
export type { GeneratedAudioEntry } from './generated-audio/types.js';
export type { AudioType } from './generated-audio/types.js';

export {
  clearSessionEvents,
  recordSessionEvent,
  sessionHistoryProvider,
} from './session-history/provider.js';
export type {
  SessionHistory,
  SessionHistoryEntry,
} from './session-history/types.js';

export { analyticsProvider } from './analytics/provider.js';
export type {
  AnalyticsData,
  AnalyticsPeriod,
  ProviderUsage as AnalyticsProviderUsage,
  TaskTypeUsage,
  TopModelEntry,
} from './analytics/types.js';

// ============================================================================
// Provider Registry
// ============================================================================

import { analyticsProvider } from './analytics/provider.js';
import { generatedAudioProvider } from './generated-audio/provider.js';
import { generatedImagesProvider } from './generated-images/provider.js';
import { generatedVideosProvider } from './generated-videos/provider.js';
import { sessionHistoryProvider } from './session-history/provider.js';

import type { ResourceProvider } from './types.js';

/**
 * All registered resource providers.
 *
 * The server iterates this array to handle resource listing and retrieval.
 * Order determines listing priority.
 */
export const RESOURCE_PROVIDERS: readonly ResourceProvider[] = [
  generatedImagesProvider,
  generatedVideosProvider,
  generatedAudioProvider,
  sessionHistoryProvider,
  analyticsProvider,
];

/**
 * Finds the resource provider that matches a given URI.
 *
 * Matches by checking if the URI starts with the provider's
 * URI prefix (everything before the first '{').
 *
 * @param uri - The resource URI to look up
 * @returns The matching provider, or undefined if none matches
 */
export function findProviderForUri(uri: string): ResourceProvider | undefined {
  return RESOURCE_PROVIDERS.find((provider) => {
    // Extract the static prefix from the URI pattern
    // e.g., 'runware://images/{id}' -> 'runware://images/'
    const braceIndex = provider.uri.indexOf('{');
    const prefix = braceIndex === -1
      ? provider.uri
      : provider.uri.slice(0, braceIndex);

    return uri.startsWith(prefix) || uri === provider.uri;
  });
}
