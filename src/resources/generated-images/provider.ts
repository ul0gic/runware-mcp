/**
 * Resource provider for generated images.
 *
 * Maintains an in-memory session store of all images generated
 * during the current session.
 *
 * URI pattern: runware://images/{imageId}
 */

import { truncate } from '../../shared/utils.js';

import type { GeneratedImageEntry } from './types.js';
import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

// ============================================================================
// Session Store
// ============================================================================

/**
 * In-memory store for images generated in the current session.
 * Cleared when the server restarts.
 */
const SESSION_IMAGES = new Map<string, GeneratedImageEntry>();

/**
 * Registers a generated image in the session store.
 *
 * Called by tool handlers after a successful image generation.
 *
 * @param image - The generated image entry to register
 */
export function registerImage(image: GeneratedImageEntry): void {
  SESSION_IMAGES.set(image.id, image);
}

/**
 * Gets all images from the session store.
 *
 * @returns Array of all session image entries
 */
export function getSessionImages(): readonly GeneratedImageEntry[] {
  return [...SESSION_IMAGES.values()];
}

/**
 * Clears the session image store.
 * Primarily used for testing.
 */
export function clearSessionImages(): void {
  SESSION_IMAGES.clear();
}

// ============================================================================
// Provider
// ============================================================================

/**
 * Maximum prompt length for resource entry names.
 */
const MAX_PROMPT_DISPLAY_LENGTH = 50;

/**
 * URI prefix for image resources.
 */
const URI_PREFIX = 'runware://images/';

/**
 * Resource provider for generated images.
 *
 * Exposes all images generated in the current session as MCP resources.
 */
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
