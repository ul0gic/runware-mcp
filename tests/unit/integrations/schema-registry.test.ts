import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearModelSchemaCache,
  resolveModelSchema,
} from '../../../src/integrations/runware/schema-registry.js';

describe('Runware model schema registry', () => {
  afterEach(() => {
    clearModelSchemaCache();
    vi.unstubAllGlobals();
  });

  it('removes internal fields, infers task type, and caches results', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      requestSchema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          taskType: { const: '3dInference' },
          taskUUID: { type: 'string' },
          model: { type: 'string' },
          positivePrompt: { type: 'string' },
        },
        required: ['taskType', 'taskUUID', 'model'],
      },
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const first = await resolveModelSchema('tripo:v3.1@0');
    const second = await resolveModelSchema('tripo:v3.1@0');

    expect(first?.taskType).toBe('3dInference');
    expect(first?.schema.properties).not.toHaveProperty('taskType');
    expect(first?.schema.properties).not.toHaveProperty('taskUUID');
    expect(first?.schema.required).toEqual(['model']);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns undefined for unknown models', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(resolveModelSchema('missing:model@0')).resolves.toBeUndefined();
  });
});
