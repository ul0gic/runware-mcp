/**
 * Integration tests for the database layer.
 *
 * Tests all CRUD operations against an in-memory SQLite database
 * using the actual Drizzle ORM operations from the operations module.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock config BEFORE importing database modules.
// The database operations check isDatabaseEnabled() which reads config.ENABLE_DATABASE.
vi.mock('../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: [],
    ENABLE_DATABASE: true,
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    DATABASE_PATH: ':memory:',
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  API_BASE_URL: 'https://api.runware.ai/v1',
  isDatabaseEnabled: (): boolean => true,
  isDevelopment: (): boolean => false,
  isProduction: (): boolean => false,
  isTest: (): boolean => true,
  shouldLog: (): boolean => false,
}));

import {
  initializeDatabase,
  closeDatabase,
} from '../../src/database/client.js';

import {
  saveGeneration,
  getGeneration,
  getGenerationByTaskUUID,
  getRecentGenerations,
  getGenerationsByType,
  getGenerationsByDateRange,
  searchGenerations,
  updateGeneration,
  updateGenerationStatus,
  deleteGeneration,
  addWatchedFolder,
  getWatchedFolders,
  getWatchedFolder,
  getWatchedFolderByPath,
  updateWatchedFolder,
  removeWatchedFolder,
  updateLastScan,
  recordAnalytics,
  getAnalyticsByDate,
  getAnalyticsRange,
  getAnalyticsSummary,
  getTotalSpend,
  getTopModels,
  getUsageByProvider,
} from '../../src/database/operations.js';

// ============================================================================
// Setup / Teardown
// ============================================================================

beforeEach(() => {
  // Initialize a fresh in-memory database before each test
  initializeDatabase();
});

afterEach(() => {
  // Close the database after each test so the next test gets a clean slate
  closeDatabase();
});

// ============================================================================
// Generations Table
// ============================================================================

describe('Generations', () => {
  describe('saveGeneration()', () => {
    it('inserts a generation and returns it with an ID', () => {
      const result = saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'task-uuid-1',
        prompt: 'a beautiful sunset',
        model: 'civitai:943001@1055701',
        provider: 'civitai',
        width: 1024,
        height: 1024,
        status: 'completed',
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBeDefined();
      expect(result!.id.length).toBeGreaterThan(0);
      expect(result!.taskType).toBe('imageInference');
      expect(result!.taskUUID).toBe('task-uuid-1');
      expect(result!.prompt).toBe('a beautiful sunset');
      expect(result!.model).toBe('civitai:943001@1055701');
      expect(result!.provider).toBe('civitai');
      expect(result!.width).toBe(1024);
      expect(result!.height).toBe(1024);
      expect(result!.status).toBe('completed');
      expect(result!.createdAt).toBeInstanceOf(Date);
    });

    it('inserts a generation with minimal fields', () => {
      const result = saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'task-uuid-minimal',
        status: 'pending',
      });

      expect(result).not.toBeNull();
      expect(result!.taskType).toBe('imageInference');
      expect(result!.taskUUID).toBe('task-uuid-minimal');
      expect(result!.prompt ?? null).toBeNull();
      expect(result!.model ?? null).toBeNull();
    });
  });

  describe('getGeneration()', () => {
    it('retrieves a generation by ID', () => {
      const saved = saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'task-uuid-get',
        prompt: 'test prompt',
        status: 'completed',
      });

      const retrieved = getGeneration(saved!.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(saved!.id);
      expect(retrieved!.taskType).toBe('imageInference');
      expect(retrieved!.prompt).toBe('test prompt');
    });

    it('returns null for non-existent ID', () => {
      const result = getGeneration('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getGenerationByTaskUUID()', () => {
    it('retrieves a generation by task UUID', () => {
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'unique-task-uuid',
        prompt: 'find me by task uuid',
        status: 'completed',
      });

      const result = getGenerationByTaskUUID('unique-task-uuid');

      expect(result).not.toBeNull();
      expect(result!.taskUUID).toBe('unique-task-uuid');
      expect(result!.prompt).toBe('find me by task uuid');
    });

    it('returns null for non-existent task UUID', () => {
      const result = getGenerationByTaskUUID('non-existent-task-uuid');
      expect(result).toBeNull();
    });
  });

  describe('getRecentGenerations()', () => {
    it('returns generations ordered by newest first', () => {
      // Insert 3 generations with different timestamps
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'task-1',
        prompt: 'first',
        status: 'completed',
      });

      // Small delay to ensure different timestamps
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'task-2',
        prompt: 'second',
        status: 'completed',
      });

      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'task-3',
        prompt: 'third',
        status: 'completed',
      });

      const results = getRecentGenerations();

      expect(results.length).toBe(3);
      // The newest should be first (task-3)
      expect(results[0]!.taskUUID).toBe('task-3');
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 5; i++) {
        saveGeneration({
          taskType: 'imageInference',
          taskUUID: `task-limit-${String(i)}`,
          status: 'completed',
        });
      }

      const results = getRecentGenerations({ limit: 2 });
      expect(results.length).toBe(2);
    });

    it('respects offset parameter', () => {
      for (let i = 0; i < 5; i++) {
        saveGeneration({
          taskType: 'imageInference',
          taskUUID: `task-offset-${String(i)}`,
          status: 'completed',
        });
      }

      const all = getRecentGenerations();
      const offset = getRecentGenerations({ offset: 2 });
      expect(offset.length).toBe(3);
      expect(offset[0]!.id).toBe(all[2]!.id);
    });

    it('returns empty array when no generations exist', () => {
      const results = getRecentGenerations();
      expect(results).toEqual([]);
    });
  });

  describe('getGenerationsByType()', () => {
    it('filters by task type', () => {
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'img-task-1',
        status: 'completed',
      });

      saveGeneration({
        taskType: 'videoInference',
        taskUUID: 'vid-task-1',
        status: 'completed',
      });

      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'img-task-2',
        status: 'completed',
      });

      const images = getGenerationsByType('imageInference');
      expect(images.length).toBe(2);

      const videos = getGenerationsByType('videoInference');
      expect(videos.length).toBe(1);
      expect(videos[0]!.taskUUID).toBe('vid-task-1');
    });

    it('returns empty array for non-existent type', () => {
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'img-task',
        status: 'completed',
      });

      const result = getGenerationsByType('nonExistent');
      expect(result).toEqual([]);
    });
  });

  describe('getGenerationsByDateRange()', () => {
    it('filters generations by date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'date-task-1',
        status: 'completed',
      });

      const results = getGenerationsByDateRange({
        startDate: yesterday,
        endDate: tomorrow,
      });

      expect(results.length).toBe(1);
    });

    it('returns empty array for out-of-range dates', () => {
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'date-task-2',
        status: 'completed',
      });

      const farPast = new Date('2020-01-01');
      const stillPast = new Date('2020-12-31');

      const results = getGenerationsByDateRange({
        startDate: farPast,
        endDate: stillPast,
      });

      expect(results).toEqual([]);
    });
  });

  describe('searchGenerations()', () => {
    it('searches by prompt text', () => {
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'search-1',
        prompt: 'a beautiful sunset over the ocean',
        status: 'completed',
      });

      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'search-2',
        prompt: 'a mountain landscape with snow',
        status: 'completed',
      });

      const results = searchGenerations({ query: 'sunset' });
      expect(results.length).toBe(1);
      expect(results[0]!.prompt).toContain('sunset');
    });

    it('searches with multiple filters', () => {
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'search-multi-1',
        prompt: 'search target',
        status: 'completed',
        model: 'model-a',
      });

      saveGeneration({
        taskType: 'videoInference',
        taskUUID: 'search-multi-2',
        prompt: 'search target',
        status: 'completed',
        model: 'model-b',
      });

      const results = searchGenerations({
        query: 'search target',
        taskType: 'imageInference',
      });
      expect(results.length).toBe(1);
      expect(results[0]!.taskType).toBe('imageInference');
    });

    it('returns all when no filters are provided', () => {
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'search-all-1',
        status: 'completed',
      });

      saveGeneration({
        taskType: 'videoInference',
        taskUUID: 'search-all-2',
        status: 'completed',
      });

      const results = searchGenerations({});
      expect(results.length).toBe(2);
    });

    it('filters by status', () => {
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'status-1',
        status: 'completed',
      });

      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'status-2',
        status: 'failed',
      });

      const results = searchGenerations({ status: 'failed' });
      expect(results.length).toBe(1);
      expect(results[0]!.status).toBe('failed');
    });
  });

  describe('updateGeneration()', () => {
    it('updates fields on an existing generation', () => {
      const saved = saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'update-task',
        status: 'pending',
      });

      const updated = updateGeneration(saved!.id, {
        status: 'completed',
        outputUrl: 'https://example.com/image.png',
        cost: 0.05,
      });

      expect(updated).toBe(true);

      const retrieved = getGeneration(saved!.id);
      expect(retrieved!.status).toBe('completed');
      expect(retrieved!.outputUrl).toBe('https://example.com/image.png');
      expect(retrieved!.cost).toBe(0.05);
    });

    it('returns false for non-existent ID', () => {
      const result = updateGeneration('non-existent', { status: 'completed' });
      expect(result).toBe(false);
    });
  });

  describe('updateGenerationStatus()', () => {
    it('updates status', () => {
      const saved = saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'status-update-task',
        status: 'pending',
      });

      const result = updateGenerationStatus(saved!.id, 'completed');
      expect(result).toBe(true);

      const retrieved = getGeneration(saved!.id);
      expect(retrieved!.status).toBe('completed');
    });

    it('updates status with error message', () => {
      const saved = saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'status-error-task',
        status: 'processing',
      });

      const result = updateGenerationStatus(saved!.id, 'failed', 'API timeout');
      expect(result).toBe(true);

      const retrieved = getGeneration(saved!.id);
      expect(retrieved!.status).toBe('failed');
      expect(retrieved!.errorMessage).toBe('API timeout');
    });
  });

  describe('deleteGeneration()', () => {
    it('deletes a generation by ID', () => {
      const saved = saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'delete-task',
        status: 'completed',
      });

      const result = deleteGeneration(saved!.id);
      expect(result).toBe(true);

      const retrieved = getGeneration(saved!.id);
      expect(retrieved).toBeNull();
    });

    it('returns false for non-existent ID', () => {
      const result = deleteGeneration('non-existent');
      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// Watched Folders Table
// ============================================================================

describe('Watched Folders', () => {
  describe('addWatchedFolder()', () => {
    it('adds a watched folder and returns it', () => {
      const result = addWatchedFolder({
        path: '/home/user/images',
        operation: 'upscale',
        operationParams: JSON.stringify({ scale: 2 }),
        outputFolder: '/home/user/output',
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBeDefined();
      expect(result!.id.length).toBeGreaterThan(0);
      expect(result!.path).toBe('/home/user/images');
      expect(result!.operation).toBe('upscale');
      expect(result!.operationParams).toBe(JSON.stringify({ scale: 2 }));
      expect(result!.outputFolder).toBe('/home/user/output');
      expect(result!.createdAt).toBeInstanceOf(Date);
    });

    it('adds a folder with minimal fields', () => {
      const result = addWatchedFolder({
        path: '/home/user/minimal',
        operation: 'caption',
      });

      expect(result).not.toBeNull();
      expect(result!.path).toBe('/home/user/minimal');
      expect(result!.operation).toBe('caption');
    });
  });

  describe('getWatchedFolders()', () => {
    it('returns all active watched folders', () => {
      addWatchedFolder({
        path: '/home/user/folder1',
        operation: 'upscale',
      });

      addWatchedFolder({
        path: '/home/user/folder2',
        operation: 'caption',
      });

      const folders = getWatchedFolders();
      expect(folders.length).toBe(2);
    });

    it('excludes inactive folders', () => {
      const folder = addWatchedFolder({
        path: '/home/user/inactive',
        operation: 'upscale',
      });

      removeWatchedFolder(folder!.id);

      const folders = getWatchedFolders();
      expect(folders.length).toBe(0);
    });

    it('returns empty array when no folders exist', () => {
      const folders = getWatchedFolders();
      expect(folders).toEqual([]);
    });
  });

  describe('getWatchedFolder()', () => {
    it('returns a folder by ID', () => {
      const added = addWatchedFolder({
        path: '/home/user/byid',
        operation: 'vectorize',
      });

      const result = getWatchedFolder(added!.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(added!.id);
      expect(result!.path).toBe('/home/user/byid');
    });

    it('returns null for non-existent ID', () => {
      const result = getWatchedFolder('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getWatchedFolderByPath()', () => {
    it('returns a folder by path', () => {
      addWatchedFolder({
        path: '/home/user/bypath',
        operation: 'removeBackground',
      });

      const result = getWatchedFolderByPath('/home/user/bypath');
      expect(result).not.toBeNull();
      expect(result!.path).toBe('/home/user/bypath');
      expect(result!.operation).toBe('removeBackground');
    });

    it('returns null for non-existent path', () => {
      const result = getWatchedFolderByPath('/non/existent/path');
      expect(result).toBeNull();
    });
  });

  describe('updateWatchedFolder()', () => {
    it('updates folder configuration', () => {
      const added = addWatchedFolder({
        path: '/home/user/update',
        operation: 'upscale',
      });

      const result = updateWatchedFolder(added!.id, {
        operation: 'caption',
        outputFolder: '/home/user/captions',
      });

      expect(result).toBe(true);

      const retrieved = getWatchedFolder(added!.id);
      expect(retrieved!.operation).toBe('caption');
      expect(retrieved!.outputFolder).toBe('/home/user/captions');
    });

    it('returns false for non-existent ID', () => {
      const result = updateWatchedFolder('non-existent', {
        operation: 'caption',
      });
      expect(result).toBe(false);
    });
  });

  describe('removeWatchedFolder()', () => {
    it('soft-deletes a folder by setting isActive to false', () => {
      const added = addWatchedFolder({
        path: '/home/user/remove',
        operation: 'upscale',
      });

      const result = removeWatchedFolder(added!.id);
      expect(result).toBe(true);

      // Should still exist but be inactive
      const retrieved = getWatchedFolder(added!.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.isActive).toBe(false);

      // Should not appear in active folders
      const active = getWatchedFolders();
      expect(active.length).toBe(0);
    });
  });

  describe('updateLastScan()', () => {
    it('updates the lastScan timestamp', () => {
      const added = addWatchedFolder({
        path: '/home/user/scan',
        operation: 'upscale',
      });

      // Initially lastScan should be null
      const before = getWatchedFolder(added!.id);
      expect(before!.lastScan).toBeNull();

      const result = updateLastScan(added!.id);
      expect(result).toBe(true);

      const after = getWatchedFolder(added!.id);
      expect(after!.lastScan).not.toBeNull();
      expect(after!.lastScan).toBeInstanceOf(Date);
    });
  });
});

// ============================================================================
// Analytics Table
// ============================================================================

describe('Analytics', () => {
  describe('recordAnalytics()', () => {
    it('creates a new analytics record', () => {
      recordAnalytics('imageInference', 'civitai', 0.05);

      const today = new Date().toISOString().split('T')[0]!;
      const records = getAnalyticsByDate(today);

      expect(records.length).toBe(1);
      expect(records[0]!.taskType).toBe('imageInference');
      expect(records[0]!.provider).toBe('civitai');
      expect(records[0]!.count).toBe(1);
      expect(records[0]!.totalCost).toBeCloseTo(0.05);
    });

    it('increments existing record on second call (upsert)', () => {
      recordAnalytics('imageInference', 'civitai', 0.05);
      recordAnalytics('imageInference', 'civitai', 0.10);

      const today = new Date().toISOString().split('T')[0]!;
      const records = getAnalyticsByDate(today);

      // Should be a single record with count 2
      const record = records.find(
        (r) => r.taskType === 'imageInference' && r.provider === 'civitai',
      );
      expect(record).toBeDefined();
      expect(record!.count).toBe(2);
      expect(record!.totalCost).toBeCloseTo(0.15);
      expect(record!.avgCost).toBeCloseTo(0.075);
    });

    it('creates separate records for different task types', () => {
      recordAnalytics('imageInference', 'civitai', 0.05);
      recordAnalytics('videoInference', 'kling', 0.50);

      const today = new Date().toISOString().split('T')[0]!;
      const records = getAnalyticsByDate(today);
      expect(records.length).toBe(2);
    });

    it('handles null provider', () => {
      recordAnalytics('imageInference', null, 0.03);

      const today = new Date().toISOString().split('T')[0]!;
      const records = getAnalyticsByDate(today);
      expect(records.length).toBe(1);
      expect(records[0]!.provider).toBeNull();
    });
  });

  describe('getAnalyticsByDate()', () => {
    it('returns analytics for a specific date', () => {
      recordAnalytics('imageInference', 'civitai', 0.05);

      const today = new Date().toISOString().split('T')[0]!;
      const results = getAnalyticsByDate(today);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.date).toBe(today);
    });

    it('returns empty array for a date with no data', () => {
      const results = getAnalyticsByDate('1990-01-01');
      expect(results).toEqual([]);
    });
  });

  describe('getAnalyticsRange()', () => {
    it('returns analytics for a date range', () => {
      recordAnalytics('imageInference', 'civitai', 0.05);

      const today = new Date().toISOString().split('T')[0]!;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]!;
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]!;

      const results = getAnalyticsRange(yesterday, tomorrow);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.date).toBe(today);
    });

    it('returns empty array for out-of-range dates', () => {
      recordAnalytics('imageInference', 'civitai', 0.05);

      const results = getAnalyticsRange('1990-01-01', '1990-12-31');
      expect(results).toEqual([]);
    });
  });

  describe('getAnalyticsSummary()', () => {
    it('returns an aggregated summary', () => {
      recordAnalytics('imageInference', 'civitai', 0.05);
      recordAnalytics('imageInference', 'civitai', 0.10);
      recordAnalytics('videoInference', 'kling', 0.50);

      const summary = getAnalyticsSummary(30);

      expect(summary.totalGenerations).toBe(3);
      expect(summary.totalCost).toBeCloseTo(0.65);
      expect(summary.averageCost).toBeCloseTo(0.65 / 3);
      expect(summary.byTaskType.length).toBe(2);
      expect(summary.byProvider.length).toBe(2);
      expect(summary.startDate).toBeDefined();
      expect(summary.endDate).toBeDefined();
    });

    it('returns default summary when no data exists', () => {
      const summary = getAnalyticsSummary(7);

      expect(summary.totalGenerations).toBe(0);
      expect(summary.totalCost).toBe(0);
      expect(summary.averageCost).toBe(0);
      expect(summary.byTaskType).toEqual([]);
      expect(summary.byProvider).toEqual([]);
    });
  });

  describe('getTotalSpend()', () => {
    it('returns total cost across all records', () => {
      recordAnalytics('imageInference', 'civitai', 0.05);
      recordAnalytics('videoInference', 'kling', 0.50);
      recordAnalytics('audioInference', 'elevenlabs', 0.30);

      const total = getTotalSpend();
      expect(total).toBeCloseTo(0.85);
    });

    it('returns 0 when no records exist', () => {
      const total = getTotalSpend();
      expect(total).toBe(0);
    });
  });

  describe('getTopModels()', () => {
    it('returns most used models', () => {
      // Insert generations with models
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'model-1',
        model: 'model-a',
        provider: 'civitai',
        cost: 0.05,
        status: 'completed',
      });

      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'model-2',
        model: 'model-a',
        provider: 'civitai',
        cost: 0.05,
        status: 'completed',
      });

      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'model-3',
        model: 'model-b',
        provider: 'bfl',
        cost: 0.10,
        status: 'completed',
      });

      const top = getTopModels(10);
      expect(top.length).toBe(2);

      // model-a should be first (used 2 times)
      expect(top[0]!.model).toBe('model-a');
      expect(top[0]!.count).toBe(2);

      // model-b should be second
      expect(top[1]!.model).toBe('model-b');
      expect(top[1]!.count).toBe(1);
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 5; i++) {
        saveGeneration({
          taskType: 'imageInference',
          taskUUID: `top-model-${String(i)}`,
          model: `model-${String(i)}`,
          status: 'completed',
        });
      }

      const top = getTopModels(3);
      expect(top.length).toBe(3);
    });

    it('returns empty array when no generations exist', () => {
      const top = getTopModels();
      expect(top).toEqual([]);
    });
  });

  describe('getUsageByProvider()', () => {
    it('returns provider breakdown with percentages', () => {
      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'prov-1',
        provider: 'civitai',
        cost: 0.05,
        status: 'completed',
      });

      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'prov-2',
        provider: 'civitai',
        cost: 0.05,
        status: 'completed',
      });

      saveGeneration({
        taskType: 'imageInference',
        taskUUID: 'prov-3',
        provider: 'bfl',
        cost: 0.10,
        status: 'completed',
      });

      const usage = getUsageByProvider();
      expect(usage.length).toBe(2);

      // Find civitai usage
      const civitai = usage.find((u) => u.provider === 'civitai');
      expect(civitai).toBeDefined();
      expect(civitai!.count).toBe(2);
      expect(civitai!.percentage).toBeCloseTo(66.6666, 1);

      const bfl = usage.find((u) => u.provider === 'bfl');
      expect(bfl).toBeDefined();
      expect(bfl!.count).toBe(1);
      expect(bfl!.percentage).toBeCloseTo(33.3333, 1);
    });

    it('returns empty array when no generations exist', () => {
      const usage = getUsageByProvider();
      expect(usage).toEqual([]);
    });
  });
});
