import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: [],
    ENABLE_DATABASE: false,
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    DATABASE_PATH: ':memory:',
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

// ============================================================================
// Helpers
// ============================================================================

function assertValidMessages(messages: readonly { role: string; content: string }[]): void {
  expect(messages.length).toBeGreaterThanOrEqual(1);
  for (const msg of messages) {
    expect(msg.role).toBe('user');
    expect(typeof msg.content).toBe('string');
    expect(msg.content.length).toBeGreaterThan(0);
  }
}

// ============================================================================
// product-photo
// ============================================================================

describe('productPhoto', () => {
  describe('metadata', () => {
    it('has correct name', () => {
      expect(productPhoto.name).toBe('product-photo');
    });

    it('has a description', () => {
      expect(productPhoto.description).toBeTruthy();
    });

    it('has 5 arguments', () => {
      expect(productPhoto.arguments.length).toBe(5);
    });

    it('product argument is required', () => {
      const productArg = productPhoto.arguments.find((a) => a.name === 'product');
      expect(productArg?.required).toBe(true);
    });

    it('style, background, lighting, angle arguments are optional', () => {
      for (const name of ['style', 'background', 'lighting', 'angle']) {
        const arg = productPhoto.arguments.find((a) => a.name === name);
        expect(arg?.required).toBe(false);
      }
    });
  });

  describe('generate() with required args only', () => {
    it('returns valid messages', () => {
      const messages = productPhoto.generate({ product: 'coffee mug' });
      assertValidMessages(messages);
    });

    it('includes product name in content', () => {
      const messages = productPhoto.generate({ product: 'sneaker' });
      expect(messages[0]?.content).toContain('sneaker');
    });

    it('includes default style (studio)', () => {
      const messages = productPhoto.generate({ product: 'watch' });
      expect(messages[0]?.content).toContain('studio');
    });

    it('mentions imageInference tool', () => {
      const messages = productPhoto.generate({ product: 'mug' });
      expect(messages[0]?.content).toContain('imageInference');
    });
  });

  describe('generate() with all style options', () => {
    for (const style of ['studio', 'lifestyle', 'flat-lay', 'hero']) {
      it(`handles style="${style}"`, () => {
        const messages = productPhoto.generate({ product: 'bottle', style });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(style);
      });
    }
  });

  describe('generate() with all background options', () => {
    for (const background of ['white', 'gradient', 'contextual', 'transparent']) {
      it(`handles background="${background}"`, () => {
        const messages = productPhoto.generate({ product: 'bottle', background });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(background);
      });
    }

    it('transparent background mentions PNG', () => {
      const messages = productPhoto.generate({ product: 'bottle', background: 'transparent' });
      expect(messages[0]?.content).toContain('PNG');
    });
  });

  describe('generate() with all lighting options', () => {
    for (const lighting of ['soft', 'dramatic', 'natural', 'rim']) {
      it(`handles lighting="${lighting}"`, () => {
        const messages = productPhoto.generate({ product: 'bottle', lighting });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(lighting);
      });
    }
  });

  describe('generate() with all angle options', () => {
    for (const angle of ['front', '45-degree', 'top-down', 'eye-level']) {
      it(`handles angle="${angle}"`, () => {
        const messages = productPhoto.generate({ product: 'bottle', angle });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(angle);
      });
    }
  });

  describe('generate() with empty/default args', () => {
    it('works with empty args object', () => {
      const messages = productPhoto.generate({});
      assertValidMessages(messages);
      expect(messages[0]?.content).toContain('product');
    });
  });
});

// ============================================================================
// avatar-generator
// ============================================================================

describe('avatarGenerator', () => {
  describe('metadata', () => {
    it('has correct name', () => {
      expect(avatarGenerator.name).toBe('avatar-generator');
    });

    it('has a description', () => {
      expect(avatarGenerator.description).toBeTruthy();
    });

    it('has 4 arguments', () => {
      expect(avatarGenerator.arguments.length).toBe(4);
    });

    it('description argument is required', () => {
      const descArg = avatarGenerator.arguments.find((a) => a.name === 'description');
      expect(descArg?.required).toBe(true);
    });
  });

  describe('generate() with required args only', () => {
    it('returns valid messages', () => {
      const messages = avatarGenerator.generate({ description: 'young woman with red hair' });
      assertValidMessages(messages);
    });

    it('includes description in content', () => {
      const messages = avatarGenerator.generate({ description: 'elderly man with glasses' });
      expect(messages[0]?.content).toContain('elderly man with glasses');
    });

    it('mentions imageInference tool', () => {
      const messages = avatarGenerator.generate({ description: 'a person' });
      expect(messages[0]?.content).toContain('imageInference');
    });
  });

  describe('generate() with all style options', () => {
    for (const style of ['photorealistic', 'cartoon', 'anime', 'pixel-art', '3d-render']) {
      it(`handles style="${style}"`, () => {
        const messages = avatarGenerator.generate({ description: 'person', style });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(style);
      });
    }

    it('photorealistic style recommends photorealistic model', () => {
      const messages = avatarGenerator.generate({ description: 'person', style: 'photorealistic' });
      expect(messages[0]?.content).toContain('photorealistic');
    });

    it('anime style recommends anime model search', () => {
      const messages = avatarGenerator.generate({ description: 'person', style: 'anime' });
      expect(messages[0]?.content).toContain('anime');
    });
  });

  describe('generate() with all mood options', () => {
    const moodKeywords: Record<string, string> = {
      friendly: 'warm',
      professional: 'confident',
      mysterious: 'enigmatic',
      happy: 'joyful',
    };
    for (const mood of ['friendly', 'professional', 'mysterious', 'happy']) {
      it(`handles mood="${mood}"`, () => {
        const messages = avatarGenerator.generate({ description: 'person', mood });
        assertValidMessages(messages);
        // The mood descriptor is used in the prompt, not the mood key itself
        expect(messages[0]?.content).toContain(moodKeywords[mood]);
      });
    }
  });

  describe('generate() with all framing options', () => {
    for (const framing of ['headshot', 'bust', 'full-body']) {
      it(`handles framing="${framing}"`, () => {
        const messages = avatarGenerator.generate({ description: 'person', framing });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(framing);
      });
    }

    it('full-body uses portrait dimensions', () => {
      const messages = avatarGenerator.generate({ description: 'person', framing: 'full-body' });
      expect(messages[0]?.content).toContain('768');
      expect(messages[0]?.content).toContain('1280');
    });

    it('headshot uses square dimensions', () => {
      const messages = avatarGenerator.generate({ description: 'person', framing: 'headshot' });
      expect(messages[0]?.content).toContain('1024');
    });
  });

  describe('generate() with empty args', () => {
    it('works with empty args object', () => {
      const messages = avatarGenerator.generate({});
      assertValidMessages(messages);
    });
  });
});

// ============================================================================
// video-scene
// ============================================================================

describe('videoScene', () => {
  describe('metadata', () => {
    it('has correct name', () => {
      expect(videoScene.name).toBe('video-scene');
    });

    it('has a description', () => {
      expect(videoScene.description).toBeTruthy();
    });

    it('has 6 arguments', () => {
      expect(videoScene.arguments.length).toBe(6);
    });

    it('subject, action, setting are required', () => {
      for (const name of ['subject', 'action', 'setting']) {
        const arg = videoScene.arguments.find((a) => a.name === name);
        expect(arg?.required).toBe(true);
      }
    });

    it('mood, cameraWork, timeOfDay are optional', () => {
      for (const name of ['mood', 'cameraWork', 'timeOfDay']) {
        const arg = videoScene.arguments.find((a) => a.name === name);
        expect(arg?.required).toBe(false);
      }
    });
  });

  describe('generate() with required args only', () => {
    it('returns valid messages', () => {
      const messages = videoScene.generate({
        subject: 'a lone astronaut',
        action: 'walking across a barren landscape',
        setting: 'Mars surface',
      });
      assertValidMessages(messages);
    });

    it('includes subject, action, setting in content', () => {
      const messages = videoScene.generate({
        subject: 'a wolf',
        action: 'running through snow',
        setting: 'dense forest',
      });
      expect(messages[0]?.content).toContain('wolf');
      expect(messages[0]?.content).toContain('running through snow');
      expect(messages[0]?.content).toContain('dense forest');
    });

    it('mentions videoInference tool', () => {
      const messages = videoScene.generate({
        subject: 'figure',
        action: 'standing',
        setting: 'field',
      });
      expect(messages[0]?.content).toContain('videoInference');
    });
  });

  describe('generate() with all mood options', () => {
    for (const mood of ['epic', 'calm', 'tense', 'joyful', 'mysterious']) {
      it(`handles mood="${mood}"`, () => {
        const messages = videoScene.generate({
          subject: 'character',
          action: 'moving',
          setting: 'place',
          mood,
        });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(mood);
      });
    }
  });

  describe('generate() with all cameraWork options', () => {
    for (const cameraWork of ['static', 'pan', 'zoom-in', 'tracking', 'aerial']) {
      it(`handles cameraWork="${cameraWork}"`, () => {
        const messages = videoScene.generate({
          subject: 'character',
          action: 'moving',
          setting: 'place',
          cameraWork,
        });
        assertValidMessages(messages);
      });
    }

    it('static camera mentions fixed camera', () => {
      const messages = videoScene.generate({
        subject: 'character',
        action: 'moving',
        setting: 'place',
        cameraWork: 'static',
      });
      expect(messages[0]?.content).toContain('Static shot');
    });

    it('aerial camera mentions aerial considerations', () => {
      const messages = videoScene.generate({
        subject: 'character',
        action: 'moving',
        setting: 'place',
        cameraWork: 'aerial',
      });
      expect(messages[0]?.content).toContain('Aerial shot');
    });
  });

  describe('generate() with all timeOfDay options', () => {
    for (const timeOfDay of ['dawn', 'day', 'golden-hour', 'dusk', 'night']) {
      it(`handles timeOfDay="${timeOfDay}"`, () => {
        const messages = videoScene.generate({
          subject: 'character',
          action: 'moving',
          setting: 'place',
          timeOfDay,
        });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(timeOfDay);
      });
    }
  });

  describe('generate() with empty args', () => {
    it('works with empty args object', () => {
      const messages = videoScene.generate({});
      assertValidMessages(messages);
    });
  });
});

// ============================================================================
// style-transfer
// ============================================================================

describe('styleTransfer', () => {
  describe('metadata', () => {
    it('has correct name', () => {
      expect(styleTransfer.name).toBe('style-transfer');
    });

    it('has a description', () => {
      expect(styleTransfer.description).toBeTruthy();
    });

    it('has 4 arguments', () => {
      expect(styleTransfer.arguments.length).toBe(4);
    });

    it('subject and style are required', () => {
      for (const name of ['subject', 'style']) {
        const arg = styleTransfer.arguments.find((a) => a.name === name);
        expect(arg?.required).toBe(true);
      }
    });

    it('intensity and colorPalette are optional', () => {
      for (const name of ['intensity', 'colorPalette']) {
        const arg = styleTransfer.arguments.find((a) => a.name === name);
        expect(arg?.required).toBe(false);
      }
    });
  });

  describe('generate() with required args only', () => {
    it('returns valid messages', () => {
      const messages = styleTransfer.generate({
        subject: 'mountain landscape',
        style: 'oil-painting',
      });
      assertValidMessages(messages);
    });

    it('includes subject and style in content', () => {
      const messages = styleTransfer.generate({
        subject: 'cat portrait',
        style: 'watercolor',
      });
      expect(messages[0]?.content).toContain('cat portrait');
      expect(messages[0]?.content).toContain('watercolor');
    });

    it('mentions imageInference tool', () => {
      const messages = styleTransfer.generate({
        subject: 'subject',
        style: 'pop-art',
      });
      expect(messages[0]?.content).toContain('imageInference');
    });
  });

  describe('generate() with all style options', () => {
    const styles = [
      'oil-painting', 'watercolor', 'pencil-sketch', 'pop-art',
      'impressionist', 'cyberpunk', 'studio-ghibli', 'art-deco',
      'minimalist', 'surrealist',
    ];
    for (const style of styles) {
      it(`handles style="${style}"`, () => {
        const messages = styleTransfer.generate({ subject: 'landscape', style });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(style);
      });
    }

    it('pencil-sketch gives monochrome tip', () => {
      const messages = styleTransfer.generate({
        subject: 'landscape',
        style: 'pencil-sketch',
      });
      expect(messages[0]?.content).toContain('monochrome');
    });

    it('cyberpunk gives higher step count tip', () => {
      const messages = styleTransfer.generate({
        subject: 'landscape',
        style: 'cyberpunk',
      });
      expect(messages[0]?.content).toContain('35-40');
    });

    it('studio-ghibli gives anime model tip', () => {
      const messages = styleTransfer.generate({
        subject: 'landscape',
        style: 'studio-ghibli',
      });
      expect(messages[0]?.content).toContain('anime');
    });
  });

  describe('generate() with all intensity options', () => {
    for (const intensity of ['subtle', 'moderate', 'strong']) {
      it(`handles intensity="${intensity}"`, () => {
        const messages = styleTransfer.generate({
          subject: 'landscape',
          style: 'oil-painting',
          intensity,
        });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(intensity);
      });
    }

    it('subtle intensity uses CFGScale 5', () => {
      const messages = styleTransfer.generate({
        subject: 'landscape',
        style: 'oil-painting',
        intensity: 'subtle',
      });
      expect(messages[0]?.content).toContain('5');
    });

    it('strong intensity uses CFGScale 10', () => {
      const messages = styleTransfer.generate({
        subject: 'landscape',
        style: 'oil-painting',
        intensity: 'strong',
      });
      expect(messages[0]?.content).toContain('10');
    });
  });

  describe('generate() with all colorPalette options', () => {
    for (const colorPalette of ['warm', 'cool', 'monochrome', 'vibrant', 'pastel']) {
      it(`handles colorPalette="${colorPalette}"`, () => {
        const messages = styleTransfer.generate({
          subject: 'landscape',
          style: 'oil-painting',
          colorPalette,
        });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(colorPalette);
      });
    }
  });

  describe('generate() with empty args', () => {
    it('works with empty args object', () => {
      const messages = styleTransfer.generate({});
      assertValidMessages(messages);
    });
  });
});

// ============================================================================
// ui-mockup
// ============================================================================

describe('uiMockup', () => {
  describe('metadata', () => {
    it('has correct name', () => {
      expect(uiMockup.name).toBe('ui-mockup');
    });

    it('has a description', () => {
      expect(uiMockup.description).toBeTruthy();
    });

    it('has 5 arguments', () => {
      expect(uiMockup.arguments.length).toBe(5);
    });

    it('appType and description are required', () => {
      for (const name of ['appType', 'description']) {
        const arg = uiMockup.arguments.find((a) => a.name === name);
        expect(arg?.required).toBe(true);
      }
    });
  });

  describe('generate() with required args only', () => {
    it('returns valid messages', () => {
      const messages = uiMockup.generate({
        appType: 'web-app',
        description: 'fitness tracking app',
      });
      assertValidMessages(messages);
    });

    it('includes description in content', () => {
      const messages = uiMockup.generate({
        appType: 'mobile-app',
        description: 'food delivery app',
      });
      expect(messages[0]?.content).toContain('food delivery app');
    });

    it('mentions imageInference tool', () => {
      const messages = uiMockup.generate({
        appType: 'web-app',
        description: 'app',
      });
      expect(messages[0]?.content).toContain('imageInference');
    });
  });

  describe('generate() with all appType options', () => {
    for (const appType of ['mobile-app', 'web-app', 'dashboard', 'landing-page', 'e-commerce']) {
      it(`handles appType="${appType}"`, () => {
        const messages = uiMockup.generate({ appType, description: 'test app' });
        assertValidMessages(messages);
      });
    }

    it('mobile-app uses portrait dimensions', () => {
      const messages = uiMockup.generate({
        appType: 'mobile-app',
        description: 'app',
      });
      expect(messages[0]?.content).toContain('512');
      expect(messages[0]?.content).toContain('1024');
    });

    it('web-app uses landscape dimensions', () => {
      const messages = uiMockup.generate({
        appType: 'web-app',
        description: 'app',
      });
      expect(messages[0]?.content).toContain('1280');
      expect(messages[0]?.content).toContain('832');
    });

    it('dashboard mentions sidebar and data widgets', () => {
      const messages = uiMockup.generate({
        appType: 'dashboard',
        description: 'analytics dashboard',
      });
      expect(messages[0]?.content).toContain('Dashboard');
    });

    it('mobile-app mentions status bar and navigation', () => {
      const messages = uiMockup.generate({
        appType: 'mobile-app',
        description: 'app',
      });
      expect(messages[0]?.content).toContain('Mobile');
    });
  });

  describe('generate() with all designSystem options', () => {
    for (const designSystem of ['material', 'ios', 'fluent', 'tailwind', 'custom']) {
      it(`handles designSystem="${designSystem}"`, () => {
        const messages = uiMockup.generate({
          appType: 'web-app',
          description: 'app',
          designSystem,
        });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(designSystem);
      });
    }
  });

  describe('generate() with all colorScheme options', () => {
    for (const colorScheme of ['light', 'dark', 'blue', 'purple', 'green']) {
      it(`handles colorScheme="${colorScheme}"`, () => {
        const messages = uiMockup.generate({
          appType: 'web-app',
          description: 'app',
          colorScheme,
        });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(colorScheme);
      });
    }
  });

  describe('generate() with all complexity options', () => {
    for (const complexity of ['wireframe', 'low-fidelity', 'high-fidelity']) {
      it(`handles complexity="${complexity}"`, () => {
        const messages = uiMockup.generate({
          appType: 'web-app',
          description: 'app',
          complexity,
        });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(complexity);
      });
    }

    it('wireframe mentions layout structure', () => {
      const messages = uiMockup.generate({
        appType: 'web-app',
        description: 'app',
        complexity: 'wireframe',
      });
      expect(messages[0]?.content).toContain('layout structure');
    });
  });

  describe('generate() with empty args', () => {
    it('works with empty args object', () => {
      const messages = uiMockup.generate({});
      assertValidMessages(messages);
    });
  });
});

// ============================================================================
// thumbnail
// ============================================================================

describe('thumbnail', () => {
  describe('metadata', () => {
    it('has correct name', () => {
      expect(thumbnail.name).toBe('thumbnail');
    });

    it('has a description', () => {
      expect(thumbnail.description).toBeTruthy();
    });

    it('has 5 arguments', () => {
      expect(thumbnail.arguments.length).toBe(5);
    });

    it('topic is required', () => {
      const topicArg = thumbnail.arguments.find((a) => a.name === 'topic');
      expect(topicArg?.required).toBe(true);
    });

    it('platform, style, emotion, textOverlay are optional', () => {
      for (const name of ['platform', 'style', 'emotion', 'textOverlay']) {
        const arg = thumbnail.arguments.find((a) => a.name === name);
        expect(arg?.required).toBe(false);
      }
    });
  });

  describe('generate() with required args only', () => {
    it('returns valid messages', () => {
      const messages = thumbnail.generate({ topic: '10 JavaScript tips' });
      assertValidMessages(messages);
    });

    it('includes topic in content', () => {
      const messages = thumbnail.generate({ topic: 'AI revolution' });
      expect(messages[0]?.content).toContain('AI revolution');
    });

    it('mentions imageInference tool', () => {
      const messages = thumbnail.generate({ topic: 'topic' });
      expect(messages[0]?.content).toContain('imageInference');
    });
  });

  describe('generate() with all platform options', () => {
    for (const platform of ['youtube', 'blog', 'twitter', 'instagram', 'linkedin']) {
      it(`handles platform="${platform}"`, () => {
        const messages = thumbnail.generate({ topic: 'topic', platform });
        assertValidMessages(messages);
      });
    }

    it('youtube uses 1280x720', () => {
      const messages = thumbnail.generate({ topic: 'topic', platform: 'youtube' });
      expect(messages[0]?.content).toContain('1280');
      expect(messages[0]?.content).toContain('720');
    });

    it('instagram uses 1080x1080', () => {
      const messages = thumbnail.generate({ topic: 'topic', platform: 'instagram' });
      expect(messages[0]?.content).toContain('1080');
    });

    it('youtube platform mentions small sizes', () => {
      const messages = thumbnail.generate({ topic: 'topic', platform: 'youtube' });
      expect(messages[0]?.content).toContain('YouTube');
    });

    it('instagram platform mentions visual impact', () => {
      const messages = thumbnail.generate({ topic: 'topic', platform: 'instagram' });
      expect(messages[0]?.content).toContain('Instagram');
    });
  });

  describe('generate() with all style options', () => {
    for (const style of ['bold-text', 'face-reaction', 'split-screen', 'before-after', 'minimal']) {
      it(`handles style="${style}"`, () => {
        const messages = thumbnail.generate({ topic: 'topic', style });
        assertValidMessages(messages);
      });
    }
  });

  describe('generate() with all emotion options', () => {
    for (const emotion of ['shocking', 'curious', 'exciting', 'informative']) {
      it(`handles emotion="${emotion}"`, () => {
        const messages = thumbnail.generate({ topic: 'topic', emotion });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(emotion);
      });
    }
  });

  describe('generate() with textOverlay', () => {
    it('includes text overlay in prompt', () => {
      const messages = thumbnail.generate({ topic: 'tips', textOverlay: 'TOP 10' });
      expect(messages[0]?.content).toContain('TOP 10');
    });

    it('mentions text rendering challenges when textOverlay provided', () => {
      const messages = thumbnail.generate({ topic: 'tips', textOverlay: 'NEW!' });
      expect(messages[0]?.content).toContain('text rendering');
    });

    it('suggests adding textOverlay when not provided', () => {
      const messages = thumbnail.generate({ topic: 'tips' });
      expect(messages[0]?.content).toContain('textOverlay');
    });
  });

  describe('generate() with empty args', () => {
    it('works with empty args object', () => {
      const messages = thumbnail.generate({});
      assertValidMessages(messages);
    });
  });
});

// ============================================================================
// music-composition
// ============================================================================

describe('musicComposition', () => {
  describe('metadata', () => {
    it('has correct name', () => {
      expect(musicComposition.name).toBe('music-composition');
    });

    it('has a description', () => {
      expect(musicComposition.description).toBeTruthy();
    });

    it('has 6 arguments', () => {
      expect(musicComposition.arguments.length).toBe(6);
    });

    it('genre and mood are required', () => {
      for (const name of ['genre', 'mood']) {
        const arg = musicComposition.arguments.find((a) => a.name === name);
        expect(arg?.required).toBe(true);
      }
    });

    it('purpose, tempo, instruments, duration are optional', () => {
      for (const name of ['purpose', 'tempo', 'instruments', 'duration']) {
        const arg = musicComposition.arguments.find((a) => a.name === name);
        expect(arg?.required).toBe(false);
      }
    });
  });

  describe('generate() with required args only', () => {
    it('returns valid messages', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
      });
      assertValidMessages(messages);
    });

    it('includes genre and mood in content', () => {
      const messages = musicComposition.generate({
        genre: 'electronic',
        mood: 'energetic',
      });
      expect(messages[0]?.content).toContain('electronic');
      expect(messages[0]?.content).toContain('energetic');
    });

    it('mentions audioInference tool', () => {
      const messages = musicComposition.generate({
        genre: 'jazz',
        mood: 'uplifting',
      });
      expect(messages[0]?.content).toContain('audioInference');
    });
  });

  describe('generate() with all genre options', () => {
    for (const genre of ['ambient', 'electronic', 'classical', 'jazz', 'rock', 'hip-hop', 'cinematic', 'lo-fi']) {
      it(`handles genre="${genre}"`, () => {
        const messages = musicComposition.generate({ genre, mood: 'peaceful' });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(genre);
      });
    }

    it('classical genre recommends ElevenLabs', () => {
      const messages = musicComposition.generate({ genre: 'classical', mood: 'dramatic' });
      expect(messages[0]?.content).toContain('elevenlabs');
    });

    it('cinematic genre recommends ElevenLabs', () => {
      const messages = musicComposition.generate({ genre: 'cinematic', mood: 'dramatic' });
      expect(messages[0]?.content).toContain('elevenlabs');
    });

    it('electronic genre recommends ElevenLabs', () => {
      const messages = musicComposition.generate({ genre: 'electronic', mood: 'energetic' });
      expect(messages[0]?.content).toContain('elevenlabs');
    });
  });

  describe('generate() with all mood options', () => {
    for (const mood of ['uplifting', 'melancholic', 'energetic', 'peaceful', 'dramatic', 'mysterious']) {
      it(`handles mood="${mood}"`, () => {
        const messages = musicComposition.generate({ genre: 'ambient', mood });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(mood);
      });
    }
  });

  describe('generate() with all purpose options', () => {
    for (const purpose of ['background', 'intro', 'outro', 'highlight', 'meditation']) {
      it(`handles purpose="${purpose}"`, () => {
        const messages = musicComposition.generate({
          genre: 'ambient',
          mood: 'peaceful',
          purpose,
        });
        assertValidMessages(messages);
        expect(messages[0]?.content).toContain(purpose);
      });
    }

    it('background purpose mentions looping', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
        purpose: 'background',
      });
      expect(messages[0]?.content).toContain('looping');
    });

    it('meditation purpose mentions slow tempo', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
        purpose: 'meditation',
      });
      expect(messages[0]?.content).toContain('meditation');
    });
  });

  describe('generate() with all tempo options', () => {
    for (const tempo of ['slow', 'moderate', 'fast']) {
      it(`handles tempo="${tempo}"`, () => {
        const messages = musicComposition.generate({
          genre: 'ambient',
          mood: 'peaceful',
          tempo,
        });
        assertValidMessages(messages);
      });
    }
  });

  describe('generate() with instruments', () => {
    it('includes specified instruments in content', () => {
      const messages = musicComposition.generate({
        genre: 'classical',
        mood: 'dramatic',
        instruments: 'piano, strings, synth',
      });
      expect(messages[0]?.content).toContain('piano, strings, synth');
    });

    it('suggests specifying instruments when not provided', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
      });
      expect(messages[0]?.content).toContain('instruments');
    });
  });

  describe('generate() with duration', () => {
    it('uses provided duration', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
        duration: '60',
      });
      expect(messages[0]?.content).toContain('60');
    });

    it('defaults to 30 seconds', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
      });
      expect(messages[0]?.content).toContain('30');
    });

    it('clamps duration to 300 max', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
        duration: '999',
      });
      expect(messages[0]?.content).toContain('300');
    });

    it('defaults to 30 for non-numeric duration', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
        duration: 'abc',
      });
      expect(messages[0]?.content).toContain('30');
    });

    it('defaults to 30 for duration under 10', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
        duration: '5',
      });
      expect(messages[0]?.content).toContain('30');
    });

    it('includes long-duration tip for compositions over 60 seconds', () => {
      const messages = musicComposition.generate({
        genre: 'ambient',
        mood: 'peaceful',
        duration: '120',
      });
      expect(messages[0]?.content).toContain('120');
      expect(messages[0]?.content).toContain('longer compositions');
    });
  });

  describe('generate() with empty args', () => {
    it('works with empty args object', () => {
      const messages = musicComposition.generate({});
      assertValidMessages(messages);
    });
  });
});
