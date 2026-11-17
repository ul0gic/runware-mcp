// Does:  Proves successful generations reach the session resources through a real server with only fetch stubbed.
// Holds: Every test starts from empty session stores; they are module-level and shared across servers in a process.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.hoisted(() => {
  vi.stubEnv('RUNWARE_API_KEY', 'e2e-test-key-that-is-at-least-32-characters');
  vi.stubEnv('RATE_LIMIT_MAX_TOKENS', '100');
});

import { clearSessionAudio } from '../../src/resources/generated-audio/provider.js';
import { clearSessionImages } from '../../src/resources/generated-images/provider.js';
import { clearSessionVideos } from '../../src/resources/generated-videos/provider.js';
import { clearSessionEvents } from '../../src/resources/session-history/provider.js';

import { connectClient, stubRunwareApi } from './harness.js';

import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

const IMAGE_UUID = 'img-0001';
const IMAGE_URL = 'https://im.runware.ai/image/img-0001.png';
const VIDEO_UUID = 'vid-0001';
const VIDEO_URL = 'https://vm.runware.ai/video/vid-0001.mp4';

const textResourceSchema = z.object({ contents: z.tuple([z.object({ uri: z.string(), text: z.string() })]) });

const analyticsSchema = z.object({
  totalGenerations: z.number(),
  totalCost: z.number(),
  byTaskType: z.array(z.object({ taskType: z.string(), count: z.number(), cost: z.number() })),
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearSessionImages();
  clearSessionVideos();
  clearSessionAudio();
  clearSessionEvents();
});

async function readJson(client: Client, uri: string): Promise<unknown> {
  const text = textResourceSchema.parse(await client.readResource({ uri })).contents[0].text;
  return JSON.parse(text);
}

async function listUris(client: Client): Promise<string[]> {
  const { resources } = await client.listResources();
  return resources.map((resource) => resource.uri);
}

describe('session recording', () => {
  it('serves an imageInference result as an image resource and counts it in analytics', async () => {
    stubRunwareApi((task) => ({
      taskType: 'imageInference',
      taskUUID: task.taskUUID,
      imageUUID: IMAGE_UUID,
      imageURL: IMAGE_URL,
      cost: 0.0042,
    }));
    const client = await connectClient();

    const result = await client.callTool({
      name: 'imageInference',
      arguments: { positivePrompt: 'a lighthouse at dusk', model: 'runware:100@1' },
    });
    expect(result.isError).toBe(false);

    const imageUri = `runware://images/${IMAGE_UUID}`;
    expect(await listUris(client)).toContain(imageUri);
    expect(await readJson(client, imageUri)).toMatchObject({
      imageUUID: IMAGE_UUID,
      imageURL: IMAGE_URL,
      prompt: 'a lighthouse at dusk',
      model: 'runware:100@1',
      width: 1024,
      height: 1024,
      cost: 0.0042,
    });

    const analytics = analyticsSchema.parse(await readJson(client, 'runware://analytics/day'));
    expect(analytics.totalGenerations).toBe(1);
    expect(analytics.totalCost).toBeCloseTo(0.0042);
    expect(analytics.byTaskType).toEqual([{ taskType: 'imageInference', count: 1, cost: 0.0042 }]);
  });

  it('serves a polled videoInference result as a video resource with its cost', async () => {
    stubRunwareApi((task) => ({
      taskType: 'videoInference',
      taskUUID: task.taskUUID,
      status: task.taskType === 'getResponse' ? 'success' : 'processing',
      videoUUID: VIDEO_UUID,
      videoURL: VIDEO_URL,
      cost: 0.35,
    }));
    const client = await connectClient();

    const result = await client.callTool({
      name: 'videoInference',
      arguments: { positivePrompt: 'a fox running through snow', model: 'klingai:5@3', duration: 5 },
    });
    expect(result.isError).toBe(false);

    const videoUri = `runware://videos/${VIDEO_UUID}`;
    expect(await listUris(client)).toContain(videoUri);
    expect(await readJson(client, videoUri)).toMatchObject({
      videoUUID: VIDEO_UUID,
      videoURL: VIDEO_URL,
      prompt: 'a fox running through snow',
      model: 'klingai:5@3',
      duration: 5,
      cost: 0.35,
    });

    const analytics = analyticsSchema.parse(await readJson(client, 'runware://analytics/day'));
    expect(analytics.totalGenerations).toBe(1);
    expect(analytics.totalCost).toBeCloseTo(0.35);
  });

  it('records an imageUpscale result as a session event that analytics also counts', async () => {
    stubRunwareApi((task) => ({
      taskType: 'upscale',
      taskUUID: task.taskUUID,
      imageUUID: 'up-0001',
      imageURL: 'https://im.runware.ai/image/up-0001.png',
      cost: 0.002,
    }));
    const client = await connectClient();

    const result = await client.callTool({
      name: 'imageUpscale',
      arguments: { inputImage: 'https://example.com/small.png' },
    });
    expect(result.isError).toBe(false);

    expect(await readJson(client, 'runware://session/history')).toMatchObject({
      totalGenerations: 1,
      entries: [{ id: 'up-0001', taskType: 'imageUpscale', outputURL: 'https://im.runware.ai/image/up-0001.png' }],
    });
    const analytics = analyticsSchema.parse(await readJson(client, 'runware://analytics/day'));
    expect(analytics.byTaskType).toEqual([{ taskType: 'imageUpscale', count: 1, cost: 0.002 }]);
  });

  it('records nothing when the tool call fails', async () => {
    stubRunwareApi(() => new Response('upstream exploded', { status: 500, statusText: 'Internal Server Error' }));
    const client = await connectClient();

    const result = await client.callTool({
      name: 'imageInference',
      arguments: { positivePrompt: 'a lighthouse at dusk', model: 'runware:100@1' },
    });
    expect(result.isError).toBe(true);

    const uris = await listUris(client);
    expect(uris.filter((uri) => /^runware:\/\/(images|videos|audio)\//.test(uri))).toEqual([]);
    expect(await readJson(client, 'runware://session/history')).toMatchObject({ totalGenerations: 0, entries: [] });
    expect(analyticsSchema.parse(await readJson(client, 'runware://analytics/day')).totalGenerations).toBe(0);
  });
});
