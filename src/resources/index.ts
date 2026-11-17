// Does:  Lists the resource providers and routes a URI to the provider that owns it.
// Holds: Routing compares only each provider URI up to its first `{`.
import { analyticsProvider } from './analytics/provider.js';
import { documentationProvider } from './documentation/provider.js';
import { generatedAudioProvider } from './generated-audio/provider.js';
import { generatedImagesProvider } from './generated-images/provider.js';
import { generatedVideosProvider } from './generated-videos/provider.js';
import { sessionHistoryProvider } from './session-history/provider.js';

import type { ResourceProvider } from './types.js';

// Holds: Listing order follows this array, and the first matching prefix here wins routing.
export const RESOURCE_PROVIDERS: readonly ResourceProvider[] = [
  generatedImagesProvider,
  generatedVideosProvider,
  generatedAudioProvider,
  sessionHistoryProvider,
  analyticsProvider,
  documentationProvider,
];

export function findProviderForUri(uri: string): ResourceProvider | undefined {
  return RESOURCE_PROVIDERS.find((provider) => {
    const braceIndex = provider.uri.indexOf('{');
    const prefix = braceIndex === -1 ? provider.uri : provider.uri.slice(0, braceIndex);

    return uri.startsWith(prefix) || uri === provider.uri;
  });
}
