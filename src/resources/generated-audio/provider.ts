/**
 * Resource provider for generated audio.
 *
 * Maintains an in-memory session store of all audio clips generated
 * during the current session.
 *
 * URI pattern: runware://audio/{audioId}
 */

import { truncate } from '../../shared/utils.js';

import type { GeneratedAudioEntry } from './types.js';
import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

// ============================================================================
// Session Store
// ============================================================================

/**
 * In-memory store for audio clips generated in the current session.
 * Cleared when the server restarts.
 */
const SESSION_AUDIO = new Map<string, GeneratedAudioEntry>();

/**
 * Registers a generated audio clip in the session store.
 *
 * Called by tool handlers after a successful audio generation.
 *
 * @param audio - The generated audio entry to register
 */
export function registerAudio(audio: GeneratedAudioEntry): void {
  SESSION_AUDIO.set(audio.id, audio);
}

/**
 * Gets all audio clips from the session store.
 *
 * @returns Array of all session audio entries
 */
export function getSessionAudio(): readonly GeneratedAudioEntry[] {
  return [...SESSION_AUDIO.values()];
}

/**
 * Clears the session audio store.
 * Primarily used for testing.
 */
export function clearSessionAudio(): void {
  SESSION_AUDIO.clear();
}

// ============================================================================
// Provider
// ============================================================================

/**
 * Maximum prompt length for resource entry names.
 */
const MAX_PROMPT_DISPLAY_LENGTH = 50;

/**
 * URI prefix for audio resources.
 */
const URI_PREFIX = 'runware://audio/';

/**
 * Resource provider for generated audio.
 *
 * Exposes all audio clips generated in the current session as MCP resources.
 */
export const generatedAudioProvider: ResourceProvider = {
  uri: 'runware://audio/{id}',
  name: 'Generated Audio',
  description: 'AI-generated audio clips from the current session',
  mimeType: 'application/json',

  list(): Promise<readonly ResourceEntry[]> {
    const entries: ResourceEntry[] = [];

    for (const audio of SESSION_AUDIO.values()) {
      entries.push({
        uri: `${URI_PREFIX}${audio.id}`,
        name: audio.prompt.length > 0
          ? truncate(audio.prompt, MAX_PROMPT_DISPLAY_LENGTH)
          : `Audio ${audio.id}`,
        description: `${String(audio.duration)}s ${audio.audioType} via ${audio.model}`,
        mimeType: 'application/json',
      });
    }

    return Promise.resolve(entries);
  },

  get(uri: string): Promise<ResourceContent | null> {
    const id = uri.replace(URI_PREFIX, '');

    const sessionAudioEntry = SESSION_AUDIO.get(id);
    if (sessionAudioEntry !== undefined) {
      return Promise.resolve({
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(sessionAudioEntry, null, 2),
      });
    }

    return Promise.resolve(null);
  },
};
