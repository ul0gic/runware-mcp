import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getCuratedModel,
  listCapabilities,
  listCuratedModels,
} from '../../../src/integrations/runware/content.js';

describe('Runware content client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses fixed content endpoints and encodes model filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { air: 'google:3@2', model: 'veo-3-1', name: 'Veo 3.1' },
    ]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const models = await listCuratedModels({
      category: 'video',
      creator: 'google',
      search: 'Veo 3.1',
    });

    expect(models).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://content.runware.ai/models?category=video&creator=google&q=Veo+3.1',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('returns undefined for missing model details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(getCuratedModel('missing')).resolves.toBeUndefined();
  });

  it('lists capability metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { id: 'io:text-to-3d', label: 'Text to 3D' },
    ]), { status: 200 })));
    await expect(listCapabilities()).resolves.toEqual([
      { id: 'io:text-to-3d', label: 'Text to 3D' },
    ]);
  });
});
