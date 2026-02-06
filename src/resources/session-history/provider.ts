/**
 * Resource provider for session history.
 *
 * Aggregates all generation events from the current session
 * into a single timeline resource. Includes images, videos,
 * and audio generations with cost tracking.
 *
 * URI: runware://session/history
 */

import { getSessionAudio } from '../generated-audio/provider.js';
import { getSessionImages } from '../generated-images/provider.js';
import { getSessionVideos } from '../generated-videos/provider.js';

import type { SessionHistory, SessionHistoryEntry } from './types.js';
import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

// ============================================================================
// Session State
// ============================================================================

/**
 * Timestamp when the current server session started.
 */
const SESSION_START = new Date();

/**
 * Additional session events that do not fit into images/videos/audio
 * (e.g., upscale, background removal, captioning, etc.).
 */
const SESSION_EVENTS = new Map<string, SessionHistoryEntry>();

/**
 * Records an additional session event outside of image/video/audio generation.
 *
 * Used by tool handlers for operations like upscale, background removal,
 * caption, vectorize, controlnet preprocessing, etc.
 *
 * @param event - The session history entry to record
 */
export function recordSessionEvent(event: SessionHistoryEntry): void {
  SESSION_EVENTS.set(event.id, event);
}

/**
 * Clears the session events store.
 * Primarily used for testing.
 */
export function clearSessionEvents(): void {
  SESSION_EVENTS.clear();
}

// ============================================================================
// Aggregation
// ============================================================================

/**
 * Collects all events from the current session across all stores.
 *
 * @returns Array of all session events, sorted by creation date (newest first)
 */
function getAllSessionEvents(): readonly SessionHistoryEntry[] {
  const events: SessionHistoryEntry[] = [];

  // Collect from image session store
  for (const image of getSessionImages()) {
    events.push({
      id: image.id,
      taskType: 'imageInference',
      prompt: image.prompt,
      model: image.model,
      outputURL: image.imageURL,
      cost: image.cost,
      createdAt: image.createdAt,
    });
  }

  // Collect from video session store
  for (const video of getSessionVideos()) {
    events.push({
      id: video.id,
      taskType: 'videoInference',
      prompt: video.prompt,
      model: video.model,
      outputURL: video.videoURL,
      cost: video.cost,
      createdAt: video.createdAt,
    });
  }

  // Collect from audio session store
  for (const audio of getSessionAudio()) {
    events.push({
      id: audio.id,
      taskType: 'audioInference',
      prompt: audio.prompt,
      model: audio.model,
      outputURL: audio.audioURL,
      cost: audio.cost,
      createdAt: audio.createdAt,
    });
  }

  // Collect additional session events
  for (const event of SESSION_EVENTS.values()) {
    events.push(event);
  }

  // Sort by creation date, newest first
  return events.toSorted(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

// ============================================================================
// Provider
// ============================================================================

/**
 * URI for the session history resource.
 */
const HISTORY_URI = 'runware://session/history';

/**
 * Resource provider for session history.
 *
 * Exposes a single resource containing the complete generation timeline
 * for the current session, including aggregated cost statistics.
 */
export const sessionHistoryProvider: ResourceProvider = {
  uri: HISTORY_URI,
  name: 'Session History',
  description: 'Complete generation history for this session',
  mimeType: 'application/json',

  list(): Promise<readonly ResourceEntry[]> {
    const events = getAllSessionEvents();

    return Promise.resolve([{
      uri: HISTORY_URI,
      name: 'Session History',
      description: `${String(events.length)} generations this session`,
      mimeType: 'application/json',
    }]);
  },

  get(uri: string): Promise<ResourceContent | null> {
    if (uri !== HISTORY_URI) {
      return Promise.resolve(null);
    }

    const allEvents = getAllSessionEvents();

    const totalCost = allEvents.reduce(
      (sum, event) => sum + (event.cost ?? 0),
      0,
    );

    const history: SessionHistory = {
      totalGenerations: allEvents.length,
      totalCost,
      entries: allEvents,
      startedAt: SESSION_START,
    };

    return Promise.resolve({
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(history, null, 2),
    });
  },
};
