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
