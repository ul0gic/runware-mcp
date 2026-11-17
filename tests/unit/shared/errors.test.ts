// Does:  Proves path-traversal errors keep the resolved path server-side and wrapError normalises any thrown value.
// Holds: Exercises the real error classes; nothing is mocked.

import { describe, expect, it } from 'vitest';

import { PathTraversalError, RateLimitError, RunwareApiError, wrapError } from '../../../src/shared/errors.js';

describe('PathTraversalError', () => {
  it('keeps resolvedPath on the error object and out of client-facing data', () => {
    const error = new PathTraversalError('bad path', {
      requestedPath: '../secret',
      resolvedPath: '/root/secret',
    });
    expect(error.data.requestedPath).toBe('../secret');
    expect(error.resolvedPath).toBe('/root/secret');
    expect('resolvedPath' in error.data).toBe(false);
  });
});

describe('wrapError', () => {
  it('returns McpError unchanged', () => {
    const original = new RunwareApiError('api error');
    const wrapped = wrapError(original);
    expect(wrapped).toBe(original);
  });

  it('wraps regular Error into RunwareApiError', () => {
    const original = new Error('regular error');
    const wrapped = wrapError(original);
    expect(wrapped).toBeInstanceOf(RunwareApiError);
    expect(wrapped.message).toBe('regular error');
  });

  it('wraps string into RunwareApiError', () => {
    const wrapped = wrapError('string error');
    expect(wrapped).toBeInstanceOf(RunwareApiError);
    expect(wrapped.message).toBe('string error');
  });

  it('wraps number into RunwareApiError', () => {
    const wrapped = wrapError(404);
    expect(wrapped).toBeInstanceOf(RunwareApiError);
    expect(wrapped.message).toBe('404');
  });

  it('wraps null into RunwareApiError', () => {
    const wrapped = wrapError(null);
    expect(wrapped).toBeInstanceOf(RunwareApiError);
    expect(wrapped.message).toBe('null');
  });

  it('preserves different McpError subclasses', () => {
    const rate = new RateLimitError('slow', 5000);
    expect(wrapError(rate)).toBe(rate);
  });
});
