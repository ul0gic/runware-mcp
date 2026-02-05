/**
 * Unit tests for the server capabilities module.
 *
 * Tests the getServerCapabilities() function which aggregates
 * tool definitions, resource providers, and prompt templates.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock config before importing modules that depend on it.
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
  isDatabaseEnabled: (): boolean => false,
  isDevelopment: (): boolean => false,
  isProduction: (): boolean => false,
  isTest: (): boolean => true,
  shouldLog: (): boolean => false,
}));

// Mock the rate limiter (tool handlers import it)
vi.mock('../../../src/shared/rate-limiter.js', () => ({
  defaultRateLimiter: {
    waitForToken: vi.fn().mockResolvedValue(undefined),
  },
}));

import { getServerCapabilities } from '../../../src/server/capabilities.js';

describe('getServerCapabilities()', () => {
  it('returns an object with tools, resources, and prompts', () => {
    const capabilities = getServerCapabilities();

    expect(capabilities).toHaveProperty('tools');
    expect(capabilities).toHaveProperty('resources');
    expect(capabilities).toHaveProperty('prompts');
  });

  it('returns tools as an array', () => {
    const capabilities = getServerCapabilities();

    expect(Array.isArray(capabilities.tools)).toBe(true);
    expect(capabilities.tools.length).toBeGreaterThan(0);
  });

  it('each tool has name, description, and inputSchema', () => {
    const capabilities = getServerCapabilities();

    for (const tool of capabilities.tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
    }
  });

  it('returns resource providers with uri, name, description, mimeType', () => {
    const capabilities = getServerCapabilities();

    expect(Array.isArray(capabilities.resources.providers)).toBe(true);

    for (const provider of capabilities.resources.providers) {
      expect(provider).toHaveProperty('uri');
      expect(provider).toHaveProperty('name');
      expect(provider).toHaveProperty('description');
      expect(provider).toHaveProperty('mimeType');
      expect(typeof provider.uri).toBe('string');
      expect(typeof provider.name).toBe('string');
      expect(typeof provider.description).toBe('string');
      expect(typeof provider.mimeType).toBe('string');
    }
  });

  it('returns prompt templates with name, description, and arguments', () => {
    const capabilities = getServerCapabilities();

    expect(Array.isArray(capabilities.prompts)).toBe(true);
    expect(capabilities.prompts.length).toBeGreaterThan(0);

    for (const prompt of capabilities.prompts) {
      expect(prompt).toHaveProperty('name');
      expect(prompt).toHaveProperty('description');
      expect(prompt).toHaveProperty('arguments');
      expect(typeof prompt.name).toBe('string');
      expect(typeof prompt.description).toBe('string');
      expect(Array.isArray(prompt.arguments)).toBe(true);
    }
  });

  it('prompt arguments have name, description, and required fields', () => {
    const capabilities = getServerCapabilities();

    for (const prompt of capabilities.prompts) {
      for (const arg of prompt.arguments) {
        expect(arg).toHaveProperty('name');
        expect(arg).toHaveProperty('description');
        expect(arg).toHaveProperty('required');
        expect(typeof arg.name).toBe('string');
        expect(typeof arg.description).toBe('string');
        expect(typeof arg.required).toBe('boolean');
      }
    }
  });
});
