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

export {
  documentationProvider,
  getDocCount,
  getDocResource,
  listDocResources,
  registerDoc,
} from './documentation/index.js';
export type {
  DocCategory,
  DocContent,
  DocExample,
  DocParameter,
  DocResource,
} from './documentation/index.js';

import { analyticsProvider } from './analytics/provider.js';
import { documentationProvider } from './documentation/provider.js';
import { generatedAudioProvider } from './generated-audio/provider.js';
import { generatedImagesProvider } from './generated-images/provider.js';
import { generatedVideosProvider } from './generated-videos/provider.js';
import { sessionHistoryProvider } from './session-history/provider.js';

import type { ResourceProvider } from './types.js';

/** Order determines listing priority. */
export const RESOURCE_PROVIDERS: readonly ResourceProvider[] = [
  generatedImagesProvider,
  generatedVideosProvider,
  generatedAudioProvider,
  sessionHistoryProvider,
  analyticsProvider,
  documentationProvider,
];

/** Matches on the provider's static URI prefix — everything before the first `{`. */
export function findProviderForUri(uri: string): ResourceProvider | undefined {
  return RESOURCE_PROVIDERS.find((provider) => {
    const braceIndex = provider.uri.indexOf('{');
    const prefix = braceIndex === -1
      ? provider.uri
      : provider.uri.slice(0, braceIndex);

    return uri.startsWith(prefix) || uri === provider.uri;
  });
}
