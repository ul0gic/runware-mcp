/**
 * Resource provider for generated videos.
 *
 * Maintains an in-memory session store of all videos generated
 * during the current session. Also queries the database for
 * persisted videos when database is enabled.
 *
 * URI pattern: runware://videos/{videoId}
 */

import { getGeneration, getGenerationsByType } from '../../database/operations.js';
import { truncate } from '../../shared/utils.js';

import type { GeneratedVideoEntry } from './types.js';
import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

// ============================================================================
// Session Store
// ============================================================================

/**
 * In-memory store for videos generated in the current session.
 * Cleared when the server restarts.
 */
const SESSION_VIDEOS = new Map<string, GeneratedVideoEntry>();

/**
 * Registers a generated video in the session store.
 *
 * Called by tool handlers after a successful video generation.
 *
 * @param video - The generated video entry to register
 */
export function registerVideo(video: GeneratedVideoEntry): void {
  SESSION_VIDEOS.set(video.id, video);
}

/**
 * Gets all videos from the session store.
 *
 * @returns Array of all session video entries
 */
export function getSessionVideos(): readonly GeneratedVideoEntry[] {
  return [...SESSION_VIDEOS.values()];
}

/**
 * Clears the session video store.
 * Primarily used for testing.
 */
export function clearSessionVideos(): void {
  SESSION_VIDEOS.clear();
}

// ============================================================================
// Provider
// ============================================================================

/**
 * Maximum prompt length for resource entry names.
 */
const MAX_PROMPT_DISPLAY_LENGTH = 50;

/**
 * URI prefix for video resources.
 */
const URI_PREFIX = 'runware://videos/';

/**
 * Resource provider for generated videos.
 *
 * Exposes all videos generated in the current session as MCP resources.
 * When database is enabled, also includes persisted videos from previous sessions.
 */
export const generatedVideosProvider: ResourceProvider = {
  uri: 'runware://videos/{id}',
  name: 'Generated Videos',
  description: 'AI-generated videos from the current session',
  mimeType: 'application/json',

  list(): Promise<readonly ResourceEntry[]> {
    const entries: ResourceEntry[] = [];

    // Add session videos
    for (const video of SESSION_VIDEOS.values()) {
      entries.push({
        uri: `${URI_PREFIX}${video.id}`,
        name: video.prompt.length > 0
          ? truncate(video.prompt, MAX_PROMPT_DISPLAY_LENGTH)
          : `Video ${video.id}`,
        description: `${String(video.duration)}s ${String(video.width)}x${String(video.height)} via ${video.model}`,
        mimeType: 'application/json',
      });
    }

    // Add database videos (if enabled, avoiding duplicates)
    const dbGenerations = getGenerationsByType('videoInference', { limit: 100 });
    for (const gen of dbGenerations) {
      if (SESSION_VIDEOS.has(gen.id)) {
        continue;
      }
      const durationDesc = gen.duration === null
        ? `via ${gen.model ?? 'unknown'}`
        : `${String(gen.duration)}s via ${gen.model ?? 'unknown'}`;
      entries.push({
        uri: `${URI_PREFIX}${gen.id}`,
        name: gen.prompt !== null && gen.prompt.length > 0
          ? truncate(gen.prompt, MAX_PROMPT_DISPLAY_LENGTH)
          : `Video ${gen.id}`,
        description: durationDesc,
        mimeType: 'application/json',
      });
    }

    return Promise.resolve(entries);
  },

  get(uri: string): Promise<ResourceContent | null> {
    const id = uri.replace(URI_PREFIX, '');

    // Check session store first
    const sessionVideo = SESSION_VIDEOS.get(id);
    if (sessionVideo !== undefined) {
      return Promise.resolve({
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(sessionVideo, null, 2),
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
