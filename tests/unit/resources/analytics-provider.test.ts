// Does:  Proves the analytics resource counts only generations created inside the requested period.
// Holds: Session stores and the provider are real; the clock is faked so period windows are exact.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsProvider } from '../../../src/resources/analytics/provider.js';
import { clearSessionAudio, registerAudio } from '../../../src/resources/generated-audio/provider.js';
import { clearSessionImages, registerImage } from '../../../src/resources/generated-images/provider.js';
import { clearSessionVideos, registerVideo } from '../../../src/resources/generated-videos/provider.js';

const NOW = new Date('2026-03-31T12:00:00Z');
const HOUR_MS = 3_600_000;

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * HOUR_MS);
}

async function readTotals(period: string): Promise<{ totalGenerations: number; totalCost: number }> {
  const content = await analyticsProvider.get(`runware://analytics/${period}`);
  const parsed: unknown = JSON.parse(content?.text ?? 'null');
  if (typeof parsed !== 'object' || parsed === null || !('totalGenerations' in parsed) || !('totalCost' in parsed)) {
    throw new Error(`analytics/${period} returned no totals`);
  }
  return { totalGenerations: Number(parsed.totalGenerations), totalCost: Number(parsed.totalCost) };
}

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
  clearSessionImages();
  clearSessionVideos();
  clearSessionAudio();
  registerImage({
    id: 'img-1',
    imageUUID: 'img-1',
    imageURL: 'https://im.runware.ai/img-1.png',
    prompt: 'within the last day',
    model: 'runware:101@1',
    width: 1024,
    height: 1024,
    cost: 1,
    createdAt: hoursAgo(2),
  });
  registerVideo({
    id: 'vid-1',
    videoUUID: 'vid-1',
    videoURL: 'https://vm.runware.ai/vid-1.mp4',
    prompt: 'within the last week',
    model: 'klingai:5@3',
    duration: 5,
    width: 1920,
    height: 1080,
    cost: 10,
    createdAt: hoursAgo(3 * 24),
  });
  registerAudio({
    id: 'aud-1',
    audioUUID: 'aud-1',
    audioURL: 'https://am.runware.ai/aud-1.mp3',
    prompt: 'within the last month',
    model: 'elevenlabs:1@1',
    audioType: 'music',
    duration: 30,
    cost: 100,
    createdAt: hoursAgo(20 * 24),
  });
  registerImage({
    id: 'img-2',
    imageUUID: 'img-2',
    imageURL: 'https://im.runware.ai/img-2.png',
    prompt: 'older than a month',
    model: 'runware:101@1',
    width: 1024,
    height: 1024,
    cost: 1000,
    createdAt: hoursAgo(60 * 24),
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('analyticsProvider period filtering', () => {
  it.each([
    ['day', 1, 1],
    ['week', 2, 11],
    ['month', 3, 111],
    ['all', 4, 1111],
  ])('counts only %s generations', async (period, totalGenerations, totalCost) => {
    expect(await readTotals(period)).toEqual({ totalGenerations, totalCost });
  });
});
