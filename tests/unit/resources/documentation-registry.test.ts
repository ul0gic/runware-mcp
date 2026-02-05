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
  getDocCount,
  getDocResource,
  listDocResources,
} from '../../../src/resources/documentation/index.js';

import type {
  DocCategory,
  DocContent,
  DocExample,
  DocParameter,
  DocResource,
} from '../../../src/resources/documentation/index.js';

// ============================================================================
// Valid categories
// ============================================================================

const VALID_CATEGORIES: readonly DocCategory[] = [
  'concepts',
  'tools',
  'features',
  'providers',
  'guides',
];

const VALID_CATEGORY_SET = new Set<string>(VALID_CATEGORIES);

// ============================================================================
// Expected category distribution
// ============================================================================

const EXPECTED_COUNTS: Record<DocCategory, number> = {
  concepts: 5,
  tools: 13,
  features: 10,
  providers: 9,
  guides: 5,
};

const EXPECTED_TOTAL = Object.values(EXPECTED_COUNTS).reduce((a, b) => a + b, 0);

// ============================================================================
// Registry Functions
// ============================================================================

describe('documentation registry', () => {
  describe('getDocCount()', () => {
    it('returns the expected total number of documents', () => {
      const count = getDocCount();
      expect(count).toBe(EXPECTED_TOTAL);
    });

    it('returns a number greater than 40', () => {
      expect(getDocCount()).toBeGreaterThan(40);
    });
  });

  describe('listDocResources()', () => {
    it('returns an array with the correct length', () => {
      const docs = listDocResources();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs).toHaveLength(getDocCount());
    });

    it('every element is a DocResource', () => {
      const docs = listDocResources();
      for (const doc of docs) {
        expect(typeof doc.id).toBe('string');
        expect(typeof doc.category).toBe('string');
        expect(typeof doc.title).toBe('string');
        expect(typeof doc.summary).toBe('string');
        expect(Array.isArray(doc.tags)).toBe(true);
        expect(typeof doc.content).toBe('object');
        expect(typeof doc.lastUpdated).toBe('string');
      }
    });
  });

  describe('getDocResource()', () => {
    it('returns a doc for a valid category and id', () => {
      const doc = getDocResource('concepts', 'air-identifiers');
      expect(doc).toBeDefined();
      expect(doc!.id).toBe('air-identifiers');
      expect(doc!.category).toBe('concepts');
    });

    it('returns undefined for an invalid category', () => {
      const doc = getDocResource('invalid', 'air-identifiers');
      expect(doc).toBeUndefined();
    });

    it('returns undefined for an invalid id within a valid category', () => {
      const doc = getDocResource('concepts', 'nonexistent');
      expect(doc).toBeUndefined();
    });

    it('returns undefined for empty strings', () => {
      const doc = getDocResource('', '');
      expect(doc).toBeUndefined();
    });

    it('returns the correct doc for each category', () => {
      const lookups: Array<{ category: string; id: string }> = [
        { category: 'concepts', id: 'air-identifiers' },
        { category: 'tools', id: 'image-inference' },
        { category: 'features', id: 'controlnet-guide' },
        { category: 'providers', id: 'kling-ai' },
        { category: 'guides', id: 'batch-processing' },
      ];

      for (const lookup of lookups) {
        const doc = getDocResource(lookup.category, lookup.id);
        expect(doc).toBeDefined();
        expect(doc!.category).toBe(lookup.category);
        expect(doc!.id).toBe(lookup.id);
      }
    });
  });

  // ==========================================================================
  // Category Distribution
  // ==========================================================================

  describe('category distribution', () => {
    it('has exactly 5 concept docs', () => {
      const docs = listDocResources().filter((d) => d.category === 'concepts');
      expect(docs).toHaveLength(EXPECTED_COUNTS.concepts);
    });

    it('has exactly 13 tool docs', () => {
      const docs = listDocResources().filter((d) => d.category === 'tools');
      expect(docs).toHaveLength(EXPECTED_COUNTS.tools);
    });

    it('has exactly 10 feature docs', () => {
      const docs = listDocResources().filter((d) => d.category === 'features');
      expect(docs).toHaveLength(EXPECTED_COUNTS.features);
    });

    it('has exactly 9 provider docs', () => {
      const docs = listDocResources().filter((d) => d.category === 'providers');
      expect(docs).toHaveLength(EXPECTED_COUNTS.providers);
    });

    it('has exactly 5 guide docs', () => {
      const docs = listDocResources().filter((d) => d.category === 'guides');
      expect(docs).toHaveLength(EXPECTED_COUNTS.guides);
    });

    it('category counts sum to total count', () => {
      const docs = listDocResources();
      let categoryTotal = 0;
      for (const category of VALID_CATEGORIES) {
        categoryTotal += docs.filter((d) => d.category === category).length;
      }
      expect(categoryTotal).toBe(docs.length);
    });
  });

  // ==========================================================================
  // Structural Validation — All Docs
  // ==========================================================================

  describe('structural validation of all docs', () => {
    let allDocs: readonly DocResource[];

    // Fetch docs once for all structural tests
    allDocs = listDocResources();

    it('all docs have been loaded', () => {
      expect(allDocs.length).toBe(EXPECTED_TOTAL);
    });

    it('every doc has a non-empty id', () => {
      for (const doc of allDocs) {
        expect(doc.id).toBeTruthy();
        expect(doc.id.length).toBeGreaterThan(0);
      }
    });

    it('every doc has a non-empty title', () => {
      for (const doc of allDocs) {
        expect(doc.title).toBeTruthy();
        expect(doc.title.length).toBeGreaterThan(0);
      }
    });

    it('every doc has a non-empty summary', () => {
      for (const doc of allDocs) {
        expect(doc.summary).toBeTruthy();
        expect(doc.summary.length).toBeGreaterThan(0);
      }
    });

    it('every doc has a non-empty lastUpdated string', () => {
      for (const doc of allDocs) {
        expect(doc.lastUpdated).toBeTruthy();
        expect(typeof doc.lastUpdated).toBe('string');
        expect(doc.lastUpdated.length).toBeGreaterThan(0);
      }
    });

    it('every doc has a valid category enum value', () => {
      for (const doc of allDocs) {
        expect(VALID_CATEGORY_SET.has(doc.category)).toBe(true);
      }
    });

    it('every doc has a non-empty tags array', () => {
      for (const doc of allDocs) {
        expect(Array.isArray(doc.tags)).toBe(true);
        expect(doc.tags.length).toBeGreaterThan(0);
        for (const tag of doc.tags) {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        }
      }
    });

    it('every doc has content with a non-empty description', () => {
      for (const doc of allDocs) {
        expect(doc.content).toBeDefined();
        expect(typeof doc.content.description).toBe('string');
        expect(doc.content.description.length).toBeGreaterThan(0);
      }
    });

    it('all doc IDs are unique within their category', () => {
      const seen = new Set<string>();
      for (const doc of allDocs) {
        const key = `${doc.category}/${doc.id}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
  });

  // ==========================================================================
  // Parameter Validation
  // ==========================================================================

  describe('parameter validation', () => {
    it('every doc with parameters has valid parameter objects', () => {
      const allDocs = listDocResources();
      const docsWithParams = allDocs.filter(
        (d) => d.content.parameters !== undefined && d.content.parameters.length > 0
      );

      // At least some docs have parameters
      expect(docsWithParams.length).toBeGreaterThan(0);

      for (const doc of docsWithParams) {
        for (const param of doc.content.parameters!) {
          expect(typeof param.name).toBe('string');
          expect(param.name.length).toBeGreaterThan(0);

          expect(typeof param.type).toBe('string');
          expect(param.type.length).toBeGreaterThan(0);

          expect(typeof param.description).toBe('string');
          expect(param.description.length).toBeGreaterThan(0);

          // Optional fields: if present, must be correct type
          if (param.required !== undefined) {
            expect(typeof param.required).toBe('boolean');
          }
          if (param.range !== undefined) {
            expect(typeof param.range).toBe('string');
          }
          if (param.default !== undefined) {
            expect(typeof param.default).toBe('string');
          }
        }
      }
    });
  });

  // ==========================================================================
  // Example Validation
  // ==========================================================================

  describe('example validation', () => {
    it('every doc with examples has valid example objects', () => {
      const allDocs = listDocResources();
      const docsWithExamples = allDocs.filter(
        (d) => d.content.examples !== undefined && d.content.examples.length > 0
      );

      // At least some docs have examples
      expect(docsWithExamples.length).toBeGreaterThan(0);

      for (const doc of docsWithExamples) {
        for (const example of doc.content.examples!) {
          expect(typeof example.title).toBe('string');
          expect(example.title.length).toBeGreaterThan(0);

          expect(typeof example.input).toBe('object');
          expect(example.input).not.toBeNull();

          expect(typeof example.explanation).toBe('string');
          expect(example.explanation.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ==========================================================================
  // Tips Validation
  // ==========================================================================

  describe('tips validation', () => {
    it('every doc with tips has an array of non-empty strings', () => {
      const allDocs = listDocResources();
      const docsWithTips = allDocs.filter(
        (d) => d.content.tips !== undefined && d.content.tips.length > 0
      );

      // At least some docs have tips
      expect(docsWithTips.length).toBeGreaterThan(0);

      for (const doc of docsWithTips) {
        expect(Array.isArray(doc.content.tips)).toBe(true);
        for (const tip of doc.content.tips!) {
          expect(typeof tip).toBe('string');
          expect(tip.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ==========================================================================
  // Related Docs Validation
  // ==========================================================================

  describe('relatedDocs validation', () => {
    it('every doc with relatedDocs has valid runware://docs/ URIs', () => {
      const allDocs = listDocResources();
      const docsWithRelated = allDocs.filter(
        (d) => d.content.relatedDocs !== undefined && d.content.relatedDocs.length > 0
      );

      // At least some docs have related docs
      expect(docsWithRelated.length).toBeGreaterThan(0);

      const uriPattern = /^runware:\/\/docs\/([^/]+)\/(.+)$/;

      for (const doc of docsWithRelated) {
        for (const uri of doc.content.relatedDocs!) {
          expect(typeof uri).toBe('string');
          const match = uriPattern.exec(uri);
          expect(match).not.toBeNull();
          expect(VALID_CATEGORY_SET.has(match![1]!)).toBe(true);
        }
      }
    });
  });

  // ==========================================================================
  // Cross-Reference Validation
  // ==========================================================================

  describe('cross-reference validation', () => {
    it('all relatedDocs URIs point to docs that actually exist in the registry', () => {
      const allDocs = listDocResources();

      // Build a set of all valid URIs from the registry
      const validUris = new Set<string>();
      for (const doc of allDocs) {
        validUris.add(`runware://docs/${doc.category}/${doc.id}`);
      }

      // Check every relatedDocs URI resolves to an existing doc
      for (const doc of allDocs) {
        if (doc.content.relatedDocs === undefined) {
          continue;
        }
        for (const uri of doc.content.relatedDocs) {
          expect(validUris.has(uri)).toBe(true);
        }
      }
    });

    it('no doc references itself in relatedDocs', () => {
      const allDocs = listDocResources();
      for (const doc of allDocs) {
        if (doc.content.relatedDocs === undefined) {
          continue;
        }
        const selfUri = `runware://docs/${doc.category}/${doc.id}`;
        expect(doc.content.relatedDocs).not.toContain(selfUri);
      }
    });
  });
});
