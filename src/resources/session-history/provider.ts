import { getSessionAudio } from '../generated-audio/provider.js';
import { getSessionImages } from '../generated-images/provider.js';
import { getSessionVideos } from '../generated-videos/provider.js';

import type { SessionHistory, SessionHistoryEntry } from './types.js';
import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

const SESSION_START = new Date();

const MAX_SESSION_SIZE = 10_000;

/** Holds only events with no dedicated store: upscale, caption, vectorize, and similar. */
const SESSION_EVENTS = new Map<string, SessionHistoryEntry>();

export function recordSessionEvent(event: SessionHistoryEntry): void {
  SESSION_EVENTS.set(event.id, event);
  if (SESSION_EVENTS.size > MAX_SESSION_SIZE) {
    const oldestKey = SESSION_EVENTS.keys().next().value;
    if (oldestKey !== undefined) {
      SESSION_EVENTS.delete(oldestKey);
    }
  }
}

/** Test-support hook — production code never clears the store. */
export function clearSessionEvents(): void {
  SESSION_EVENTS.clear();
}

function getAllSessionEvents(): readonly SessionHistoryEntry[] {
  const events: SessionHistoryEntry[] = [];

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

  for (const event of SESSION_EVENTS.values()) {
    events.push(event);
  }

  return events.toSorted(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

const HISTORY_URI = 'runware://session/history';

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
