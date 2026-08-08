import { truncate } from '../../shared/utils.js';

import type { GeneratedImageEntry } from './types.js';
import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

const MAX_SESSION_SIZE = 10_000;

const SESSION_IMAGES = new Map<string, GeneratedImageEntry>();

export function registerImage(image: GeneratedImageEntry): void {
  SESSION_IMAGES.set(image.id, image);
  if (SESSION_IMAGES.size > MAX_SESSION_SIZE) {
    const oldestKey = SESSION_IMAGES.keys().next().value;
    if (oldestKey !== undefined) {
      SESSION_IMAGES.delete(oldestKey);
    }
  }
}

export function getSessionImages(): readonly GeneratedImageEntry[] {
  return [...SESSION_IMAGES.values()];
}

/** Test-support hook — production code never clears the store. */
export function clearSessionImages(): void {
  SESSION_IMAGES.clear();
}

const MAX_PROMPT_DISPLAY_LENGTH = 50;

const URI_PREFIX = 'runware://images/';

export const generatedImagesProvider: ResourceProvider = {
  uri: 'runware://images/{id}',
  name: 'Generated Images',
  description: 'AI-generated images from the current session',
  mimeType: 'application/json',

  list(): Promise<readonly ResourceEntry[]> {
    const entries: ResourceEntry[] = [];

    for (const image of SESSION_IMAGES.values()) {
      entries.push({
        uri: `${URI_PREFIX}${image.id}`,
        name: image.prompt.length > 0
          ? truncate(image.prompt, MAX_PROMPT_DISPLAY_LENGTH)
          : `Image ${image.id}`,
        description: `${String(image.width)}x${String(image.height)} via ${image.model}`,
        mimeType: 'application/json',
      });
    }

    return Promise.resolve(entries);
  },

  get(uri: string): Promise<ResourceContent | null> {
    const id = uri.replace(URI_PREFIX, '');

    const sessionImage = SESSION_IMAGES.get(id);
    if (sessionImage !== undefined) {
      return Promise.resolve({
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(sessionImage, null, 2),
      });
    }

    return Promise.resolve(null);
  },
};
