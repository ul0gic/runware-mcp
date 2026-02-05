import { describe, expect, it, vi } from 'vitest';

// ============================================================================
// Mocks — must be declared before imports
// ============================================================================

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
  isDatabaseEnabled: vi.fn().mockReturnValue(false),
}));

// ============================================================================
// Imports
// ============================================================================

import {
  documentationProvider,
  getDocCount,
} from '../../../src/resources/documentation/index.js';

import type { DocResource } from '../../../src/resources/documentation/index.js';

// ============================================================================
// Valid categories for URI validation
// ============================================================================

const VALID_CATEGORIES = new Set<string>([
  'concepts',
  'tools',
  'features',
  'providers',
  'guides',
]);

const URI_PATTERN = /^runware:\/\/docs\/([^/]+)\/(.+)$/;

// ============================================================================
// Provider Metadata
// ============================================================================

describe('documentationProvider', () => {
  describe('metadata', () => {
    it('has correct URI pattern', () => {
      expect(documentationProvider.uri).toBe('runware://docs/{category}/{id}');
    });

    it('has correct name', () => {
      expect(documentationProvider.name).toBe('Runware Documentation');
    });

    it('has a non-empty description', () => {
      expect(documentationProvider.description).toBeTruthy();
      expect(typeof documentationProvider.description).toBe('string');
    });

    it('has application/json mimeType', () => {
      expect(documentationProvider.mimeType).toBe('application/json');
    });
  });

  // ==========================================================================
  // list()
  // ==========================================================================

  describe('list()', () => {
    it('returns an array', async () => {
      const entries = await documentationProvider.list();
      expect(Array.isArray(entries)).toBe(true);
    });

    it('returns the expected number of resources', async () => {
      const entries = await documentationProvider.list();
      const expectedCount = getDocCount();
      expect(entries).toHaveLength(expectedCount);
      expect(entries.length).toBeGreaterThanOrEqual(40);
    });

    it('every entry has uri, name, description, and mimeType', async () => {
      const entries = await documentationProvider.list();
      for (const entry of entries) {
        expect(entry.uri).toBeDefined();
        expect(typeof entry.uri).toBe('string');
        expect(entry.uri.length).toBeGreaterThan(0);

        expect(entry.name).toBeDefined();
        expect(typeof entry.name).toBe('string');
        expect(entry.name.length).toBeGreaterThan(0);

        expect(entry.description).toBeDefined();
        expect(typeof entry.description).toBe('string');
        expect(entry.description!.length).toBeGreaterThan(0);

        expect(entry.mimeType).toBe('application/json');
      }
    });

    it('all URIs match the runware://docs/{category}/{id} pattern', async () => {
      const entries = await documentationProvider.list();
      for (const entry of entries) {
        const match = URI_PATTERN.exec(entry.uri);
        expect(match).not.toBeNull();
      }
    });

    it('all URIs have valid categories', async () => {
      const entries = await documentationProvider.list();
      for (const entry of entries) {
        const match = URI_PATTERN.exec(entry.uri);
        expect(match).not.toBeNull();
        const category = match![1]!;
        expect(VALID_CATEGORIES.has(category)).toBe(true);
      }
    });

    it('all URIs are unique', async () => {
      const entries = await documentationProvider.list();
      const uris = entries.map((e) => e.uri);
      const uniqueUris = new Set(uris);
      expect(uniqueUris.size).toBe(uris.length);
    });

    it('contains entries from all five categories', async () => {
      const entries = await documentationProvider.list();
      const categoriesFound = new Set<string>();
      for (const entry of entries) {
        const match = URI_PATTERN.exec(entry.uri);
        if (match !== null && match[1] !== undefined) {
          categoriesFound.add(match[1]);
        }
      }
      expect(categoriesFound).toEqual(VALID_CATEGORIES);
    });
  });

  // ==========================================================================
  // get() — Known URIs
  // ==========================================================================

  describe('get() — known URIs', () => {
    it('returns valid ResourceContent for a known URI', async () => {
      const result = await documentationProvider.get('runware://docs/concepts/air-identifiers');
      expect(result).not.toBeNull();
      expect(result!.uri).toBe('runware://docs/concepts/air-identifiers');
      expect(result!.mimeType).toBe('application/json');
      expect(typeof result!.text).toBe('string');
    });

    it('returned JSON parses to a valid DocResource structure', async () => {
      const result = await documentationProvider.get('runware://docs/concepts/air-identifiers');
      expect(result).not.toBeNull();
      const doc: DocResource = JSON.parse(result!.text!);

      expect(doc.id).toBe('air-identifiers');
      expect(doc.category).toBe('concepts');
      expect(typeof doc.title).toBe('string');
      expect(doc.title.length).toBeGreaterThan(0);
      expect(typeof doc.summary).toBe('string');
      expect(doc.summary.length).toBeGreaterThan(0);
      expect(Array.isArray(doc.tags)).toBe(true);
      expect(doc.tags.length).toBeGreaterThan(0);
      expect(typeof doc.content).toBe('object');
      expect(typeof doc.content.description).toBe('string');
      expect(doc.content.description.length).toBeGreaterThan(0);
      expect(typeof doc.lastUpdated).toBe('string');
    });

    it('spot-check: concepts/air-identifiers', async () => {
      const result = await documentationProvider.get('runware://docs/concepts/air-identifiers');
      expect(result).not.toBeNull();
      const doc: DocResource = JSON.parse(result!.text!);

      expect(doc.id).toBe('air-identifiers');
      expect(doc.category).toBe('concepts');
      expect(doc.title).toBe('AIR Model Identifiers');
      expect(doc.tags).toContain('AIR');
      expect(doc.content.parameters).toBeDefined();
      expect(doc.content.parameters!.length).toBeGreaterThan(0);
      expect(doc.content.examples).toBeDefined();
      expect(doc.content.examples!.length).toBeGreaterThan(0);
      expect(doc.content.tips).toBeDefined();
      expect(doc.content.tips!.length).toBeGreaterThan(0);
      expect(doc.content.relatedDocs).toBeDefined();
      expect(doc.content.relatedDocs!.length).toBeGreaterThan(0);
    });

    it('spot-check: tools/image-inference', async () => {
      const result = await documentationProvider.get('runware://docs/tools/image-inference');
      expect(result).not.toBeNull();
      const doc: DocResource = JSON.parse(result!.text!);

      expect(doc.id).toBe('image-inference');
      expect(doc.category).toBe('tools');
      expect(doc.title).toBe('Image Generation');
      expect(doc.tags).toContain('image');
      expect(doc.content.parameters).toBeDefined();
      expect(doc.content.parameters!.length).toBeGreaterThanOrEqual(10);
      expect(doc.content.examples).toBeDefined();
      expect(doc.content.examples!.length).toBeGreaterThanOrEqual(2);
    });

    it('spot-check: features/controlnet-guide', async () => {
      const result = await documentationProvider.get('runware://docs/features/controlnet-guide');
      expect(result).not.toBeNull();
      const doc: DocResource = JSON.parse(result!.text!);

      expect(doc.id).toBe('controlnet-guide');
      expect(doc.category).toBe('features');
      expect(doc.title).toBe('ControlNet Guidance');
      expect(doc.tags).toContain('controlnet');
      expect(doc.content.parameters).toBeDefined();
      expect(doc.content.parameters!.length).toBeGreaterThan(0);
      expect(doc.content.examples).toBeDefined();
      expect(doc.content.examples!.length).toBeGreaterThanOrEqual(2);
    });

    it('spot-check: providers/kling-ai', async () => {
      const result = await documentationProvider.get('runware://docs/providers/kling-ai');
      expect(result).not.toBeNull();
      const doc: DocResource = JSON.parse(result!.text!);

      expect(doc.id).toBe('kling-ai');
      expect(doc.category).toBe('providers');
      expect(doc.title).toContain('Kling');
      expect(doc.tags).toContain('kling-ai');
      expect(doc.content.parameters).toBeDefined();
      expect(doc.content.parameters!.length).toBeGreaterThan(0);
    });

    it('spot-check: guides/batch-processing', async () => {
      const result = await documentationProvider.get('runware://docs/guides/batch-processing');
      expect(result).not.toBeNull();
      const doc: DocResource = JSON.parse(result!.text!);

      expect(doc.id).toBe('batch-processing');
      expect(doc.category).toBe('guides');
      expect(doc.title).toContain('Batch');
      expect(doc.tags).toContain('batch');
      expect(doc.content.examples).toBeDefined();
      expect(doc.content.examples!.length).toBeGreaterThanOrEqual(2);
      expect(doc.content.tips).toBeDefined();
      expect(doc.content.tips!.length).toBeGreaterThan(0);
    });

    it('every listed URI is resolvable via get()', async () => {
      const entries = await documentationProvider.list();
      for (const entry of entries) {
        const result = await documentationProvider.get(entry.uri);
        expect(result).not.toBeNull();
        expect(result!.uri).toBe(entry.uri);
        expect(result!.mimeType).toBe('application/json');
        expect(typeof result!.text).toBe('string');

        const doc: DocResource = JSON.parse(result!.text!);
        expect(doc.id).toBeTruthy();
        expect(doc.category).toBeTruthy();
        expect(doc.title).toBe(entry.name);
      }
    });
  });

  // ==========================================================================
  // get() — Unknown / Malformed URIs
  // ==========================================================================

  describe('get() — unknown and malformed URIs', () => {
    it('returns null for unknown category/id', async () => {
      const result = await documentationProvider.get('runware://docs/invalid/foo');
      expect(result).toBeNull();
    });

    it('returns null for valid category but unknown id', async () => {
      const result = await documentationProvider.get('runware://docs/concepts/nonexistent');
      expect(result).toBeNull();
    });

    it('returns null for malformed URI (wrong scheme)', async () => {
      const result = await documentationProvider.get('runware://other/thing');
      expect(result).toBeNull();
    });

    it('returns null for empty string', async () => {
      const result = await documentationProvider.get('');
      expect(result).toBeNull();
    });

    it('returns null for URI with only prefix', async () => {
      const result = await documentationProvider.get('runware://docs/');
      expect(result).toBeNull();
    });

    it('returns null for URI with only one path segment', async () => {
      const result = await documentationProvider.get('runware://docs/concepts');
      expect(result).toBeNull();
    });

    it('returns null for completely unrelated string', async () => {
      const result = await documentationProvider.get('https://example.com/something');
      expect(result).toBeNull();
    });

    it('returns null for URI with extra path segments', async () => {
      const result = await documentationProvider.get('runware://docs/concepts/air-identifiers/extra');
      expect(result).toBeNull();
    });
  });
});
