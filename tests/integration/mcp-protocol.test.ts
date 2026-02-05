/**
 * Integration tests for MCP protocol registries.
 *
 * Verifies that all tools, resources, and prompts are properly
 * registered and have the correct shape for MCP protocol compliance.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock config before importing any module that depends on it.
vi.mock('../../src/shared/config.js', () => ({
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
  isDatabaseEnabled: (): boolean => false,
  isDevelopment: (): boolean => false,
  isProduction: (): boolean => false,
  isTest: (): boolean => true,
  shouldLog: (): boolean => false,
}));

import { toolDefinitions, toolHandlers, toolNames } from '../../src/tools/index.js';
import { RESOURCE_PROVIDERS } from '../../src/resources/index.js';
import { PROMPT_TEMPLATES } from '../../src/prompts/index.js';

// ============================================================================
// Tool Registry
// ============================================================================

describe('Tool Registry', () => {
  const EXPECTED_TOOL_NAMES = [
    'imageInference',
    'photoMaker',
    'imageUpscale',
    'imageBackgroundRemoval',
    'imageCaption',
    'imageMasking',
    'imageUpload',
    'videoInference',
    'listVideoModels',
    'getVideoModelInfo',
    'audioInference',
    'transcription',
    'vectorize',
    'promptEnhance',
    'controlNetPreprocess',
    'styleTransfer',
    'modelSearch',
    'costEstimate',
    'accountBalance',
    'processFolder',
    'batchImageInference',
    'watchFolder',
  ] as const;

  it('has 22 tool definitions registered', () => {
    expect(toolDefinitions.length).toBe(22);
  });

  it('has 22 tool handlers registered', () => {
    expect(Object.keys(toolHandlers).length).toBe(22);
  });

  it('has 22 entries in toolNames', () => {
    expect(toolNames.length).toBe(22);
  });

  it('every expected tool name exists in toolNames', () => {
    for (const name of EXPECTED_TOOL_NAMES) {
      expect(toolNames).toContain(name);
    }
  });

  describe('tool definitions structure', () => {
    it('each definition has name, description, and inputSchema', () => {
      for (const def of toolDefinitions) {
        expect(def).toHaveProperty('name');
        expect(def).toHaveProperty('description');
        expect(def).toHaveProperty('inputSchema');

        expect(typeof def.name).toBe('string');
        expect(def.name.length).toBeGreaterThan(0);

        expect(typeof def.description).toBe('string');
        expect(def.description.length).toBeGreaterThan(0);

        expect(def.inputSchema).toBeDefined();
      }
    });

    it('each inputSchema has type "object" and properties', () => {
      for (const def of toolDefinitions) {
        expect(def.inputSchema.type).toBe('object');
        expect(def.inputSchema).toHaveProperty('properties');
        expect(typeof def.inputSchema.properties).toBe('object');
      }
    });
  });

  describe('tool names match between definitions and handlers', () => {
    it('every tool definition name has a corresponding handler', () => {
      const handlerNames = new Set(Object.keys(toolHandlers));
      for (const def of toolDefinitions) {
        expect(handlerNames.has(def.name)).toBe(true);
      }
    });

    it('every handler name has a corresponding tool definition', () => {
      const definitionNames = new Set(toolDefinitions.map((d) => d.name));
      for (const name of Object.keys(toolHandlers)) {
        expect(definitionNames.has(name)).toBe(true);
      }
    });
  });

  describe('specific tool definitions', () => {
    it('imageInference definition exists and has expected properties', () => {
      const def = toolDefinitions.find((d) => d.name === 'imageInference');
      expect(def).toBeDefined();
      expect(def!.inputSchema.properties).toHaveProperty('positivePrompt');
    });

    it('videoInference definition exists', () => {
      const def = toolDefinitions.find((d) => d.name === 'videoInference');
      expect(def).toBeDefined();
      expect(def!.description.length).toBeGreaterThan(0);
    });

    it('audioInference definition exists', () => {
      const def = toolDefinitions.find((d) => d.name === 'audioInference');
      expect(def).toBeDefined();
    });

    it('modelSearch definition exists', () => {
      const def = toolDefinitions.find((d) => d.name === 'modelSearch');
      expect(def).toBeDefined();
    });

    it('accountBalance definition exists', () => {
      const def = toolDefinitions.find((d) => d.name === 'accountBalance');
      expect(def).toBeDefined();
    });

    it('watchFolder definition exists', () => {
      const def = toolDefinitions.find((d) => d.name === 'watchFolder');
      expect(def).toBeDefined();
    });

    it('batchImageInference definition exists', () => {
      const def = toolDefinitions.find((d) => d.name === 'batchImageInference');
      expect(def).toBeDefined();
    });
  });

  describe('handler types', () => {
    it('all handlers are functions', () => {
      for (const [name, handler] of Object.entries(toolHandlers)) {
        expect(typeof handler).toBe('function');
      }
    });
  });
});

// ============================================================================
// Resource Registry
// ============================================================================

describe('Resource Registry', () => {
  it('has 6 resource providers registered', () => {
    expect(RESOURCE_PROVIDERS.length).toBe(6);
  });

  describe('provider interface compliance', () => {
    it('each provider has list() and get() methods', () => {
      for (const provider of RESOURCE_PROVIDERS) {
        expect(typeof provider.list).toBe('function');
        expect(typeof provider.get).toBe('function');
      }
    });

    it('each provider has uri, name, description, and mimeType', () => {
      for (const provider of RESOURCE_PROVIDERS) {
        expect(typeof provider.uri).toBe('string');
        expect(provider.uri.length).toBeGreaterThan(0);

        expect(typeof provider.name).toBe('string');
        expect(provider.name.length).toBeGreaterThan(0);

        expect(typeof provider.description).toBe('string');
        expect(provider.description.length).toBeGreaterThan(0);

        expect(typeof provider.mimeType).toBe('string');
        expect(provider.mimeType.length).toBeGreaterThan(0);
      }
    });
  });

  describe('resource URI patterns', () => {
    it('images provider has correct URI', () => {
      const provider = RESOURCE_PROVIDERS.find((p) =>
        p.uri.includes('images'),
      );
      expect(provider).toBeDefined();
      expect(provider!.uri).toBe('runware://images/{id}');
    });

    it('videos provider has correct URI', () => {
      const provider = RESOURCE_PROVIDERS.find((p) =>
        p.uri.includes('videos'),
      );
      expect(provider).toBeDefined();
      expect(provider!.uri).toBe('runware://videos/{id}');
    });

    it('audio provider has correct URI', () => {
      const provider = RESOURCE_PROVIDERS.find((p) =>
        p.uri.includes('audio'),
      );
      expect(provider).toBeDefined();
      expect(provider!.uri).toBe('runware://audio/{id}');
    });

    it('session-history provider has correct URI', () => {
      const provider = RESOURCE_PROVIDERS.find((p) =>
        p.uri.includes('session'),
      );
      expect(provider).toBeDefined();
      expect(provider!.uri).toBe('runware://session/history');
    });

    it('analytics provider has correct URI', () => {
      const provider = RESOURCE_PROVIDERS.find((p) =>
        p.uri.includes('analytics'),
      );
      expect(provider).toBeDefined();
      expect(provider!.uri).toBe('runware://analytics/{period}');
    });
  });

  describe('provider list() returns arrays', () => {
    it('each provider list() returns a promise that resolves to an array', async () => {
      for (const provider of RESOURCE_PROVIDERS) {
        const result = await provider.list();
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });
});

// ============================================================================
// Prompt Registry
// ============================================================================

describe('Prompt Registry', () => {
  const EXPECTED_PROMPT_NAMES = [
    'product-photo',
    'avatar-generator',
    'video-scene',
    'style-transfer',
    'ui-mockup',
    'thumbnail',
    'music-composition',
  ] as const;

  it('has 7 prompt templates registered', () => {
    const templateCount = Object.keys(PROMPT_TEMPLATES).length;
    expect(templateCount).toBe(7);
  });

  it('every expected prompt name is registered', () => {
    for (const name of EXPECTED_PROMPT_NAMES) {
      expect(PROMPT_TEMPLATES).toHaveProperty(name);
    }
  });

  describe('template interface compliance', () => {
    it('each template has name, description, arguments, and generate', () => {
      for (const [key, template] of Object.entries(PROMPT_TEMPLATES)) {
        expect(typeof template.name).toBe('string');
        expect(template.name.length).toBeGreaterThan(0);

        expect(typeof template.description).toBe('string');
        expect(template.description.length).toBeGreaterThan(0);

        expect(Array.isArray(template.arguments)).toBe(true);

        expect(typeof template.generate).toBe('function');
      }
    });

    it('each template argument has name, description, and required fields', () => {
      for (const [key, template] of Object.entries(PROMPT_TEMPLATES)) {
        for (const arg of template.arguments) {
          expect(typeof arg.name).toBe('string');
          expect(arg.name.length).toBeGreaterThan(0);

          expect(typeof arg.description).toBe('string');
          expect(arg.description.length).toBeGreaterThan(0);

          expect(typeof arg.required).toBe('boolean');
        }
      }
    });
  });

  describe('generate() produces valid messages', () => {
    it('product-photo generates messages with role and content', () => {
      const template = PROMPT_TEMPLATES['product-photo']!;
      const messages = template.generate({ product: 'coffee mug' });

      expect(messages.length).toBeGreaterThan(0);
      for (const msg of messages) {
        expect(msg).toHaveProperty('role');
        expect(msg).toHaveProperty('content');
        expect(['user', 'assistant']).toContain(msg.role);
        expect(typeof msg.content).toBe('string');
        expect(msg.content.length).toBeGreaterThan(0);
      }
    });

    it('avatar-generator generates messages', () => {
      const template = PROMPT_TEMPLATES['avatar-generator']!;
      const messages = template.generate({
        description: 'young woman with red hair',
      });

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.role).toBe('user');
      expect(messages[0]!.content).toContain('young woman with red hair');
    });

    it('video-scene generates messages with all required args', () => {
      const template = PROMPT_TEMPLATES['video-scene']!;
      const messages = template.generate({
        subject: 'a lone astronaut',
        action: 'walking on Mars',
        setting: 'Mars surface',
      });

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.content).toContain('astronaut');
      expect(messages[0]!.content).toContain('Mars');
    });

    it('style-transfer generates messages', () => {
      const template = PROMPT_TEMPLATES['style-transfer']!;
      const messages = template.generate({
        subject: 'a mountain landscape',
        style: 'oil-painting',
      });

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.content).toContain('mountain landscape');
      expect(messages[0]!.content).toContain('oil-painting');
    });

    it('ui-mockup generates messages', () => {
      const template = PROMPT_TEMPLATES['ui-mockup']!;
      const messages = template.generate({
        appType: 'mobile-app',
        description: 'a fitness tracking app',
      });

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.content).toContain('fitness tracking');
    });

    it('thumbnail generates messages', () => {
      const template = PROMPT_TEMPLATES['thumbnail']!;
      const messages = template.generate({
        topic: '10 JavaScript tips',
      });

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.content).toContain('JavaScript');
    });

    it('music-composition generates messages', () => {
      const template = PROMPT_TEMPLATES['music-composition']!;
      const messages = template.generate({
        genre: 'ambient',
        mood: 'peaceful',
      });

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.content).toContain('ambient');
    });

    it('generate() works with empty args (uses defaults)', () => {
      for (const [key, template] of Object.entries(PROMPT_TEMPLATES)) {
        const messages = template.generate({});

        expect(messages.length).toBeGreaterThan(0);
        expect(messages[0]!.role).toBe('user');
        expect(typeof messages[0]!.content).toBe('string');
        expect(messages[0]!.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('template-specific argument validation', () => {
    it('product-photo has "product" as required argument', () => {
      const template = PROMPT_TEMPLATES['product-photo']!;
      const productArg = template.arguments.find((a) => a.name === 'product');
      expect(productArg).toBeDefined();
      expect(productArg!.required).toBe(true);
    });

    it('avatar-generator has "description" as required argument', () => {
      const template = PROMPT_TEMPLATES['avatar-generator']!;
      const descArg = template.arguments.find(
        (a) => a.name === 'description',
      );
      expect(descArg).toBeDefined();
      expect(descArg!.required).toBe(true);
    });

    it('video-scene has subject, action, and setting as required', () => {
      const template = PROMPT_TEMPLATES['video-scene']!;
      const requiredArgs = template.arguments.filter((a) => a.required);
      const requiredNames = requiredArgs.map((a) => a.name);
      expect(requiredNames).toContain('subject');
      expect(requiredNames).toContain('action');
      expect(requiredNames).toContain('setting');
    });

    it('music-composition has genre and mood as required', () => {
      const template = PROMPT_TEMPLATES['music-composition']!;
      const requiredArgs = template.arguments.filter((a) => a.required);
      const requiredNames = requiredArgs.map((a) => a.name);
      expect(requiredNames).toContain('genre');
      expect(requiredNames).toContain('mood');
    });
  });
});
