/**
 * Resource provider for generated videos.
 *
 * Maintains an in-memory session store of all videos generated
 * during the current session.
 *
 * URI pattern: runware://videos/{videoId}
 */

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
 */
export const generatedVideosProvider: ResourceProvider = {
  uri: 'runware://videos/{id}',
  name: 'Generated Videos',
  description: 'AI-generated videos from the current session',
  mimeType: 'application/json',

  list(): Promise<readonly ResourceEntry[]> {
    const entries: ResourceEntry[] = [];

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

    return Promise.resolve(entries);
  },

  get(uri: string): Promise<ResourceContent | null> {
    const id = uri.replace(URI_PREFIX, '');

    const sessionVideo = SESSION_VIDEOS.get(id);
    if (sessionVideo !== undefined) {
      return Promise.resolve({
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(sessionVideo, null, 2),
      });
    }

    return Promise.resolve(null);
  },
};
