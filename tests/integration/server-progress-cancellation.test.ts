// Does:  Proves progress notifications echo the client's token and client cancellation stops task polling.
// Holds: Only global fetch is stubbed; polling runs on fake setTimeout so backoff sleeps elapse on demand.

import { ProgressNotificationSchema, type ProgressToken } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('RUNWARE_API_KEY', 'e2e-test-key-that-is-at-least-32-characters');
  vi.stubEnv('RATE_LIMIT_MAX_TOKENS', '100');
});

import { connectClient, parseToolPayload, stubRunwareApi } from './harness.js';

import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

const VIDEO_ARGS = { positivePrompt: 'a fox running through snow', model: 'klingai:5@3', duration: 5 };

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function stubVideoApi(pollStatus: 'success' | 'processing'): ReturnType<typeof stubRunwareApi> {
  return stubRunwareApi((task) => ({
    taskType: task.taskType === 'getResponse' ? 'videoInference' : task.taskType,
    taskUUID: task.taskUUID,
    status: task.taskType === 'getResponse' ? pollStatus : 'processing',
    videoUUID: 'vid-1',
  }));
}

function collectProgressTokens(client: Client): ProgressToken[] {
  const tokens: ProgressToken[] = [];
  client.setNotificationHandler(ProgressNotificationSchema, (notification) => {
    tokens.push(notification.params.progressToken);
  });
  return tokens;
}

describe('progress notifications', () => {
  it.each([
    ['numeric', 7],
    ['string', 'video-job-7'],
  ])('echo a %s progressToken with its original type', async (_kind, token) => {
    stubVideoApi('success');
    const client = await connectClient();
    const tokens = collectProgressTokens(client);

    const result = await client.callTool({
      name: 'videoInference',
      arguments: VIDEO_ARGS,
      _meta: { progressToken: token },
    });

    expect(parseToolPayload(result)).toMatchObject({ status: 'success' });
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every((received) => received === token)).toBe(true);
  });

  it('are not sent when the request carries no progressToken', async () => {
    stubVideoApi('success');
    const client = await connectClient();
    const tokens = collectProgressTokens(client);

    const result = await client.callTool({ name: 'videoInference', arguments: VIDEO_ARGS });

    expect(parseToolPayload(result)).toMatchObject({ status: 'success' });
    expect(tokens).toEqual([]);
  });
});

describe('cancellation', () => {
  it('stops polling and rejects the call when the client cancels mid-poll', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const api = stubVideoApi('processing');
    const client = await connectClient();
    const controller = new AbortController();

    const call = client.callTool({ name: 'videoInference', arguments: VIDEO_ARGS }, undefined, {
      signal: controller.signal,
    });
    const settled = expect(call).rejects.toThrow('user cancelled');

    await vi.advanceTimersByTimeAsync(5000);
    const pollsBeforeCancel = api.tasks.filter((task) => task.taskType === 'getResponse').length;
    expect(pollsBeforeCancel).toBeGreaterThan(1);

    controller.abort('user cancelled');
    await settled;
    await vi.advanceTimersByTimeAsync(120_000);

    expect(api.tasks.filter((task) => task.taskType === 'getResponse')).toHaveLength(pollsBeforeCancel);
  });
});
