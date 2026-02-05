import { describe, it, expect } from 'vitest';

import {
  createApiKey,
  createTaskUUID,
  createImageUUID,
  createVideoUUID,
  createAudioUUID,
  successResult,
  errorResult,
} from '../../../src/shared/types.js';

// ============================================================================
// Branded Type Constructors
// ============================================================================

describe('createApiKey', () => {
  it('returns the input string as a branded ApiKey', () => {
    const key = createApiKey('test-api-key-12345');
    expect(key).toBe('test-api-key-12345');
    expect(typeof key).toBe('string');
  });

  it('preserves the full key value', () => {
    const longKey = 'a'.repeat(128);
    const key = createApiKey(longKey);
    expect(key).toBe(longKey);
    expect(key.length).toBe(128);
  });
});

describe('createTaskUUID', () => {
  it('returns the input string as a branded TaskUUID', () => {
    const uuid = createTaskUUID('550e8400-e29b-41d4-a716-446655440000');
    expect(uuid).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(typeof uuid).toBe('string');
  });
});

describe('createImageUUID', () => {
  it('returns the input string as a branded ImageUUID', () => {
    const uuid = createImageUUID('img-uuid-123');
    expect(uuid).toBe('img-uuid-123');
    expect(typeof uuid).toBe('string');
  });
});

describe('createVideoUUID', () => {
  it('returns the input string as a branded VideoUUID', () => {
    const uuid = createVideoUUID('vid-uuid-456');
    expect(uuid).toBe('vid-uuid-456');
    expect(typeof uuid).toBe('string');
  });
});

describe('createAudioUUID', () => {
  it('returns the input string as a branded AudioUUID', () => {
    const uuid = createAudioUUID('aud-uuid-789');
    expect(uuid).toBe('aud-uuid-789');
    expect(typeof uuid).toBe('string');
  });
});

// ============================================================================
// Tool Result Helpers
// ============================================================================

describe('successResult', () => {
  it('returns correct shape with status success and message', () => {
    const result = successResult('Operation completed');
    expect(result).toEqual({
      status: 'success',
      message: 'Operation completed',
    });
  });

  it('includes data when provided', () => {
    const data = { imageUrl: 'https://example.com/img.png' };
    const result = successResult('Generated image', data);
    expect(result).toEqual({
      status: 'success',
      message: 'Generated image',
      data,
    });
  });

  it('includes cost when provided', () => {
    const result = successResult('Generated image', undefined, 0.05);
    expect(result).toEqual({
      status: 'success',
      message: 'Generated image',
      cost: 0.05,
    });
  });

  it('includes both data and cost when provided', () => {
    const data = { url: 'https://example.com' };
    const result = successResult('Done', data, 1.23);
    expect(result).toEqual({
      status: 'success',
      message: 'Done',
      data,
      cost: 1.23,
    });
  });

  it('does not include data key when data is undefined', () => {
    const result = successResult('Done');
    expect(result).not.toHaveProperty('data');
    expect(result).not.toHaveProperty('cost');
  });

  it('does not include cost key when cost is undefined', () => {
    const result = successResult('Done', { x: 1 });
    expect(result).not.toHaveProperty('cost');
  });
});

describe('errorResult', () => {
  it('returns correct shape with status error and message', () => {
    const result = errorResult('Something went wrong');
    expect(result).toEqual({
      status: 'error',
      message: 'Something went wrong',
    });
  });

  it('includes data when provided', () => {
    const data = { details: 'Invalid API key' };
    const result = errorResult('Auth failed', data);
    expect(result).toEqual({
      status: 'error',
      message: 'Auth failed',
      data,
    });
  });

  it('does not include data key when data is undefined', () => {
    const result = errorResult('Oops');
    expect(result).not.toHaveProperty('data');
  });

  it('does not include cost key', () => {
    const result = errorResult('Oops');
    expect(result).not.toHaveProperty('cost');
  });
});
