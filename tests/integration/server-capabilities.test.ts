/**
 * Integration tests for server capability modules.
 *
 * Tests cancellation tracking and progress reporting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config before importing any module that depends on it.
vi.mock('../../src/shared/config.js', () => ({
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
  isDevelopment: (): boolean => false,
  isProduction: (): boolean => false,
  isTest: (): boolean => true,
  shouldLog: (): boolean => false,
}));

import {
  createCancellableOperation,
  cancelOperation,
  completeOperation,
  getActiveOperationCount,
} from '../../src/server/cancellation.js';

import {
  createProgressReporter,
  type SendProgressNotification,
} from '../../src/server/progress.js';

// ============================================================================
// Cancellation
// ============================================================================

describe('Cancellation', () => {
  afterEach(() => {
    // Clean up any stale operations after each test.
    // We complete all known operations to avoid leaking state.
    // Since we cannot enumerate, we rely on the test doing its own cleanup.
  });

  describe('createCancellableOperation()', () => {
    it('returns an AbortSignal', () => {
      const signal = createCancellableOperation('req-1');
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);

      // Clean up
      completeOperation('req-1');
    });

    it('creates a tracked operation', () => {
      const countBefore = getActiveOperationCount();
      createCancellableOperation('req-track');
      const countAfter = getActiveOperationCount();

      expect(countAfter).toBe(countBefore + 1);

      // Clean up
      completeOperation('req-track');
    });
  });

  describe('cancelOperation()', () => {
    it('aborts the signal and returns true for existing operation', () => {
      const signal = createCancellableOperation('req-cancel');

      const result = cancelOperation('req-cancel');
      expect(result).toBe(true);
      expect(signal.aborted).toBe(true);
    });

    it('returns false for non-existent operation', () => {
      const result = cancelOperation('req-non-existent');
      expect(result).toBe(false);
    });

    it('removes the operation from tracking after cancel', () => {
      createCancellableOperation('req-remove');
      const countBefore = getActiveOperationCount();

      cancelOperation('req-remove');
      const countAfter = getActiveOperationCount();

      expect(countAfter).toBe(countBefore - 1);
    });
  });

  describe('completeOperation()', () => {
    it('removes the operation from tracking', () => {
      createCancellableOperation('req-complete');
      const countBefore = getActiveOperationCount();

      completeOperation('req-complete');
      const countAfter = getActiveOperationCount();

      expect(countAfter).toBe(countBefore - 1);
    });

    it('does not throw for non-existent operation', () => {
      expect(() => {
        completeOperation('req-does-not-exist');
      }).not.toThrow();
    });
  });

  describe('multiple concurrent operations', () => {
    it('tracks multiple operations independently', () => {
      const signal1 = createCancellableOperation('req-multi-1');
      const signal2 = createCancellableOperation('req-multi-2');
      const signal3 = createCancellableOperation('req-multi-3');

      expect(signal1.aborted).toBe(false);
      expect(signal2.aborted).toBe(false);
      expect(signal3.aborted).toBe(false);

      // Cancel only the second one
      cancelOperation('req-multi-2');

      expect(signal1.aborted).toBe(false);
      expect(signal2.aborted).toBe(true);
      expect(signal3.aborted).toBe(false);

      // Clean up the rest
      completeOperation('req-multi-1');
      completeOperation('req-multi-3');
    });

    it('getActiveOperationCount reflects state accurately', () => {
      const baseline = getActiveOperationCount();

      createCancellableOperation('req-count-1');
      createCancellableOperation('req-count-2');
      createCancellableOperation('req-count-3');

      expect(getActiveOperationCount()).toBe(baseline + 3);

      completeOperation('req-count-1');
      expect(getActiveOperationCount()).toBe(baseline + 2);

      cancelOperation('req-count-2');
      expect(getActiveOperationCount()).toBe(baseline + 1);

      completeOperation('req-count-3');
      expect(getActiveOperationCount()).toBe(baseline);
    });
  });
});

// ============================================================================
// Progress Reporting
// ============================================================================

describe('Progress Reporting', () => {
  describe('createProgressReporter()', () => {
    it('creates a reporter with a report method', () => {
      const sendNotification: SendProgressNotification = vi.fn();
      const reporter = createProgressReporter('req-progress', sendNotification);

      expect(reporter).toBeDefined();
      expect(typeof reporter.report).toBe('function');
    });

    it('calls the notification callback with correct params', () => {
      const sendNotification = vi.fn<SendProgressNotification>();
      const reporter = createProgressReporter('req-progress-2', sendNotification);

      reporter.report({
        progress: 5,
        total: 10,
        message: 'Processing...',
      });

      expect(sendNotification).toHaveBeenCalledOnce();
      expect(sendNotification).toHaveBeenCalledWith({
        progressToken: 'req-progress-2',
        progress: 5,
        total: 10,
        message: 'Processing...',
      });
    });

    it('passes multiple progress updates correctly', () => {
      const sendNotification = vi.fn<SendProgressNotification>();
      const reporter = createProgressReporter('req-progress-3', sendNotification);

      reporter.report({ progress: 1, total: 3, message: 'Step 1' });
      reporter.report({ progress: 2, total: 3, message: 'Step 2' });
      reporter.report({ progress: 3, total: 3, message: 'Done' });

      expect(sendNotification).toHaveBeenCalledTimes(3);

      expect(sendNotification).toHaveBeenNthCalledWith(1, {
        progressToken: 'req-progress-3',
        progress: 1,
        total: 3,
        message: 'Step 1',
      });

      expect(sendNotification).toHaveBeenNthCalledWith(3, {
        progressToken: 'req-progress-3',
        progress: 3,
        total: 3,
        message: 'Done',
      });
    });

    it('uses requestId as progressToken', () => {
      const sendNotification = vi.fn<SendProgressNotification>();
      const reporter = createProgressReporter('my-unique-id', sendNotification);

      reporter.report({ progress: 0, total: 1, message: 'start' });

      const callArg = sendNotification.mock.calls[0]![0];
      expect(callArg.progressToken).toBe('my-unique-id');
    });
  });
});


