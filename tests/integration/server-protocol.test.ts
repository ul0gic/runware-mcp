// Does:  Proves the server's MCP request handling end to end through an SDK Client with only fetch stubbed.
// Holds: Tool failures surface as isError results; unknown resources and prompts surface as JSON-RPC errors.

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('RUNWARE_API_KEY', 'e2e-test-key-that-is-at-least-32-characters');
  vi.stubEnv('RATE_LIMIT_MAX_TOKENS', '100');
});

import { toolInvokers } from '../../src/tools/index.js';

import { connectClient, parseToolPayload, stubRunwareApi } from './harness.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tools/list', () => {
  it('advertises every registered tool', async () => {
    stubRunwareApi(() => ({}));
    const client = await connectClient();

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).toSorted()).toEqual(Object.keys(toolInvokers).toSorted());
  });
});

describe('tools/call', () => {
  it('returns isError for an unknown tool', async () => {
    const { fetchMock } = stubRunwareApi(() => ({}));
    const client = await connectClient();

    const result = await client.callTool({ name: 'noSuchTool', arguments: {} });

    expect(result.isError).toBe(true);
    expect(parseToolPayload(result)).toMatchObject({ status: 'error', message: 'Unknown tool: noSuchTool' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns isError with validationErrors for invalid arguments', async () => {
    const { fetchMock } = stubRunwareApi(() => ({}));
    const client = await connectClient();

    const result = await client.callTool({ name: 'imageCaption', arguments: { model: 42 } });

    expect(result.isError).toBe(true);
    const payload = parseToolPayload(result);
    expect(payload.message).toBe('Invalid input for tool "imageCaption"');
    expect(payload.validationErrors).toEqual(
      expect.arrayContaining([expect.stringContaining('inputImage'), expect.stringContaining('model')]),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applies schema defaults before the request reaches the API', async () => {
    const api = stubRunwareApi((task) => ({ taskType: 'caption', taskUUID: task.taskUUID, text: 'a red bicycle' }));
    const client = await connectClient();

    const result = await client.callTool({
      name: 'imageCaption',
      arguments: { inputImage: 'https://example.com/bike.png' },
    });

    expect(result.isError).toBe(false);
    expect(api.tasks).toEqual([
      expect.objectContaining({ taskType: 'caption', model: 'runware:152@2', includeCost: true }),
    ]);
  });

  it('returns isError, not a transport error, when the API answers 500', async () => {
    stubRunwareApi(() => new Response('upstream exploded', { status: 500, statusText: 'Internal Server Error' }));
    const client = await connectClient();

    const result = await client.callTool({ name: 'accountBalance', arguments: {} });

    expect(result.isError).toBe(true);
    expect(parseToolPayload(result)).toMatchObject({
      status: 'error',
      message: expect.stringContaining('500'),
    });
  });

  it('sends the parsed imageInference task to the API and returns its images', async () => {
    const api = stubRunwareApi((task) => ({
      taskType: 'imageInference',
      taskUUID: task.taskUUID,
      imageUUID: 'img-1',
      imageURL: 'https://im.runware.ai/img-1.png',
      cost: 0.0013,
    }));
    const client = await connectClient();

    const result = await client.callTool({
      name: 'imageInference',
      arguments: { positivePrompt: 'a lighthouse at dusk', model: 'runware:101@1' },
    });

    expect(api.fetchMock).toHaveBeenCalledWith(
      'https://api.runware.ai/v1',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer e2e-test-key-that-is-at-least-32-characters' }),
      }),
    );
    expect(api.tasks).toEqual([
      expect.objectContaining({
        taskType: 'imageInference',
        taskUUID: expect.any(String),
        positivePrompt: 'a lighthouse at dusk',
        model: 'runware:101@1',
        width: 1024,
        height: 1024,
        numberResults: 1,
        includeCost: true,
      }),
    ]);
    expect(result.isError).toBe(false);
    expect(parseToolPayload(result)).toMatchObject({
      status: 'success',
      data: { images: [expect.objectContaining({ imageUUID: 'img-1' })] },
    });
  });
});

describe('resources/read and prompts/get', () => {
  it('rejects an unknown resource URI with a JSON-RPC error', async () => {
    stubRunwareApi(() => ({}));
    const client = await connectClient();

    await expect(client.readResource({ uri: 'runware://nowhere/at-all' })).rejects.toThrow(
      'No resource provider for URI: runware://nowhere/at-all',
    );
  });

  it('rejects an unknown prompt name with a JSON-RPC error', async () => {
    stubRunwareApi(() => ({}));
    const client = await connectClient();

    await expect(client.getPrompt({ name: '__proto__' })).rejects.toThrow('Unknown prompt template: __proto__');
  });
});
