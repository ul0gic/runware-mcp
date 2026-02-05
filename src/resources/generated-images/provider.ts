/**
 * Resource provider for generated images.
 *
 * Maintains an in-memory session store of all images generated
 * during the current session. Also queries the database for
 * persisted images when database is enabled.
 *
 * URI pattern: runware://images/{imageId}
 */

import { getGeneration, getGenerationsByType } from '../../database/operations.js';
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
 * When database is enabled, also includes persisted images from previous sessions.
 */
export const generatedImagesProvider: ResourceProvider = {
  uri: 'runware://images/{id}',
  name: 'Generated Images',
  description: 'AI-generated images from the current session',
  mimeType: 'application/json',

  list(): Promise<readonly ResourceEntry[]> {
    const entries: ResourceEntry[] = [];

    // Add session images
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

    // Add database images (if enabled, avoiding duplicates)
    const dbGenerations = getGenerationsByType('imageInference', { limit: 100 });
    for (const gen of dbGenerations) {
      if (!SESSION_IMAGES.has(gen.id)) {
        entries.push({
          uri: `${URI_PREFIX}${gen.id}`,
          name: gen.prompt !== null && gen.prompt.length > 0
            ? truncate(gen.prompt, MAX_PROMPT_DISPLAY_LENGTH)
            : `Image ${gen.id}`,
          description: gen.width !== null && gen.height !== null
            ? `${String(gen.width)}x${String(gen.height)} via ${gen.model ?? 'unknown'}`
            : `via ${gen.model ?? 'unknown'}`,
          mimeType: 'application/json',
        });
      }
    }

    return Promise.resolve(entries);
  },

  get(uri: string): Promise<ResourceContent | null> {
    const id = uri.replace(URI_PREFIX, '');

    // Check session store first
    const sessionImage = SESSION_IMAGES.get(id);
    if (sessionImage !== undefined) {
      return Promise.resolve({
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(sessionImage, null, 2),
      });
    }

    // Fall back to database
    const dbGeneration = getGeneration(id);
    if (dbGeneration !== null) {
      return Promise.resolve({
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(dbGeneration, null, 2),
      });
    }

    return Promise.resolve(null);
  },
};
