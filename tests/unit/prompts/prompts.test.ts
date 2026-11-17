// Does:  Proves prompt templates clamp music duration to 10..300 and render a usable message from empty arguments.
// Holds: Templates run for real; only config is mocked because config.ts validates env at import.
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: [],
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  API_BASE_URL: 'https://api.runware.ai/v1',
}));

import { productPhoto } from '../../../src/prompts/product-photo/template.js';
import { avatarGenerator } from '../../../src/prompts/avatar-generator/template.js';
import { videoScene } from '../../../src/prompts/video-scene/template.js';
import { styleTransfer } from '../../../src/prompts/style-transfer/template.js';
import { uiMockup } from '../../../src/prompts/ui-mockup/template.js';
import { thumbnail } from '../../../src/prompts/thumbnail/template.js';
import { musicComposition } from '../../../src/prompts/music-composition/template.js';

describe('every prompt template', () => {
  it.each([productPhoto, avatarGenerator, videoScene, styleTransfer, uiMockup, thumbnail, musicComposition])(
    '$name handles empty args',
    (template) => {
      const messages = template.generate({});
      expect(messages.length).toBeGreaterThanOrEqual(1);
      for (const msg of messages) {
        expect(msg.role).toBe('user');
        expect(typeof msg.content).toBe('string');
        expect(msg.content.length).toBeGreaterThan(0);
      }
    },
  );
});

describe('musicComposition duration', () => {
  it('uses provided duration', () => {
    const messages = musicComposition.generate({ genre: 'ambient', mood: 'peaceful', duration: '60' });
    expect(messages[0]?.content).toContain('60');
  });

  it('defaults to 30 seconds', () => {
    const messages = musicComposition.generate({ genre: 'ambient', mood: 'peaceful' });
    expect(messages[0]?.content).toContain('30');
  });

  it('clamps duration to 300 max', () => {
    const messages = musicComposition.generate({ genre: 'ambient', mood: 'peaceful', duration: '999' });
    expect(messages[0]?.content).toContain('300');
  });

  it('defaults to 30 for non-numeric duration', () => {
    const messages = musicComposition.generate({ genre: 'ambient', mood: 'peaceful', duration: 'abc' });
    expect(messages[0]?.content).toContain('30');
  });

  it('defaults to 30 for duration under 10', () => {
    const messages = musicComposition.generate({ genre: 'ambient', mood: 'peaceful', duration: '5' });
    expect(messages[0]?.content).toContain('30');
  });
});
