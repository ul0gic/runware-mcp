import { truncate } from '../../shared/utils.js';

import type { GeneratedVideoEntry } from './types.js';
import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

const MAX_SESSION_SIZE = 10_000;

const SESSION_VIDEOS = new Map<string, GeneratedVideoEntry>();

export function registerVideo(video: GeneratedVideoEntry): void {
  SESSION_VIDEOS.set(video.id, video);
  if (SESSION_VIDEOS.size > MAX_SESSION_SIZE) {
    const oldestKey = SESSION_VIDEOS.keys().next().value;
    if (oldestKey !== undefined) {
      SESSION_VIDEOS.delete(oldestKey);
    }
  }
}

export function getSessionVideos(): readonly GeneratedVideoEntry[] {
  return [...SESSION_VIDEOS.values()];
}

/** Test-support hook — production code never clears the store. */
export function clearSessionVideos(): void {
  SESSION_VIDEOS.clear();
}

const MAX_PROMPT_DISPLAY_LENGTH = 50;

const URI_PREFIX = 'runware://videos/';

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
