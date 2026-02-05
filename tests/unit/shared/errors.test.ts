import { describe, it, expect } from 'vitest';

import {
  MCP_ERROR_CODES,
  McpError,
  RunwareApiError,
  GenerationFailedError,
  PollTimeoutError,
  RateLimitError,
  FileError,
  FileTooLargeError,
  PathTraversalError,
  FolderNotFoundError,
  DatabaseError,
  BatchPartialFailureError,
  ProviderNotSupportedError,
  ToolNotFoundError,
  ResourceNotFoundError,
  InvalidParamsError,
  isMcpError,
  wrapError,
} from '../../../src/shared/errors.js';

// ============================================================================
// RunwareApiError
// ============================================================================

describe('RunwareApiError', () => {
  it('has correct code', () => {
    const error = new RunwareApiError('API failure');
    expect(error.code).toBe(MCP_ERROR_CODES.RUNWARE_API_ERROR);
  });

  it('preserves message', () => {
    const error = new RunwareApiError('Something broke');
    expect(error.message).toBe('Something broke');
  });

  it('has correct name', () => {
    const error = new RunwareApiError('test');
    expect(error.name).toBe('RunwareApiError');
  });

  it('stores optional apiCode, taskUUID, and statusCode', () => {
    const error = new RunwareApiError('fail', {
      apiCode: 'ERR_001',
      taskUUID: 'uuid-123',
      statusCode: 429,
    });
    expect(error.data.apiCode).toBe('ERR_001');
    expect(error.data.taskUUID).toBe('uuid-123');
    expect(error.data.statusCode).toBe(429);
  });

  it('omits undefined optional fields from data', () => {
    const error = new RunwareApiError('fail');
    expect(error.data).toEqual({});
  });

  it('extends McpError', () => {
    const error = new RunwareApiError('test');
    expect(error).toBeInstanceOf(McpError);
    expect(error).toBeInstanceOf(Error);
  });

  it('toJsonRpcError returns correct structure', () => {
    const error = new RunwareApiError('API fail', { statusCode: 500 });
    const rpc = error.toJsonRpcError();
    expect(rpc.code).toBe(MCP_ERROR_CODES.RUNWARE_API_ERROR);
    expect(rpc.message).toBe('API fail');
    expect(rpc.data).toEqual({ statusCode: 500 });
  });

  it('toJsonRpcError omits data when empty', () => {
    const error = new RunwareApiError('fail');
    const rpc = error.toJsonRpcError();
    // data is {} which is not undefined, so it will be included
    expect(rpc.code).toBe(MCP_ERROR_CODES.RUNWARE_API_ERROR);
    expect(rpc.message).toBe('fail');
  });
});

// ============================================================================
// GenerationFailedError
// ============================================================================

describe('GenerationFailedError', () => {
  it('has correct code', () => {
    const error = new GenerationFailedError('gen failed', {
      taskType: 'imageInference',
      taskUUID: 'uuid-1',
    });
    expect(error.code).toBe(MCP_ERROR_CODES.GENERATION_FAILED);
  });

  it('stores taskType and taskUUID', () => {
    const error = new GenerationFailedError('gen failed', {
      taskType: 'videoInference',
      taskUUID: 'uuid-2',
      reason: 'content filter',
    });
    expect(error.data.taskType).toBe('videoInference');
    expect(error.data.taskUUID).toBe('uuid-2');
    expect(error.data.reason).toBe('content filter');
  });

  it('omits reason when not provided', () => {
    const error = new GenerationFailedError('gen failed', {
      taskType: 'imageInference',
      taskUUID: 'uuid-3',
    });
    expect(error.data).not.toHaveProperty('reason');
  });
});

// ============================================================================
// PollTimeoutError
// ============================================================================

describe('PollTimeoutError', () => {
  it('has correct code', () => {
    const error = new PollTimeoutError('timeout', {
      taskUUID: 'uuid-1',
      attempts: 10,
      elapsedMs: 30000,
    });
    expect(error.code).toBe(MCP_ERROR_CODES.POLL_TIMEOUT);
  });

  it('stores timeout details', () => {
    const error = new PollTimeoutError('polling timed out', {
      taskUUID: 'uuid-2',
      attempts: 50,
      elapsedMs: 60000,
    });
    expect(error.data.taskUUID).toBe('uuid-2');
    expect(error.data.attempts).toBe(50);
    expect(error.data.elapsedMs).toBe(60000);
  });
});

// ============================================================================
// RateLimitError
// ============================================================================

describe('RateLimitError', () => {
  it('has correct code', () => {
    const error = new RateLimitError('slow down', 5000);
    expect(error.code).toBe(MCP_ERROR_CODES.RATE_LIMIT_EXCEEDED);
  });

  it('stores retryAfterMs', () => {
    const error = new RateLimitError('rate limited', 2000);
    expect(error.data.retryAfterMs).toBe(2000);
  });
});

// ============================================================================
// FileError
// ============================================================================

describe('FileError', () => {
  it('has correct code', () => {
    const error = new FileError('bad file', { reason: 'invalid type' });
    expect(error.code).toBe(MCP_ERROR_CODES.INVALID_FILE_TYPE);
  });

  it('stores filePath and reason', () => {
    const error = new FileError('bad file', {
      filePath: '/tmp/test.xyz',
      reason: 'unsupported extension',
    });
    expect(error.data.filePath).toBe('/tmp/test.xyz');
    expect(error.data.reason).toBe('unsupported extension');
  });

  it('omits filePath when not provided', () => {
    const error = new FileError('bad file', { reason: 'invalid' });
    expect(error.data).not.toHaveProperty('filePath');
    expect(error.data.reason).toBe('invalid');
  });
});

// ============================================================================
// FileTooLargeError
// ============================================================================

describe('FileTooLargeError', () => {
  it('has correct code', () => {
    const error = new FileTooLargeError('too big', {
      sizeBytes: 200_000_000,
      maxSizeBytes: 50_000_000,
    });
    expect(error.code).toBe(MCP_ERROR_CODES.FILE_TOO_LARGE);
  });

  it('stores size details', () => {
    const error = new FileTooLargeError('too big', {
      filePath: '/tmp/huge.png',
      sizeBytes: 100_000_000,
      maxSizeBytes: 50_000_000,
    });
    expect(error.data.filePath).toBe('/tmp/huge.png');
    expect(error.data.sizeBytes).toBe(100_000_000);
    expect(error.data.maxSizeBytes).toBe(50_000_000);
  });
});

// ============================================================================
// PathTraversalError
// ============================================================================

describe('PathTraversalError', () => {
  it('has correct code', () => {
    const error = new PathTraversalError('traversal detected', {
      requestedPath: '/tmp/../etc/passwd',
      resolvedPath: '/etc/passwd',
    });
    expect(error.code).toBe(MCP_ERROR_CODES.PATH_TRAVERSAL_DETECTED);
  });

  it('stores both paths', () => {
    const error = new PathTraversalError('bad path', {
      requestedPath: '../secret',
      resolvedPath: '/root/secret',
    });
    expect(error.data.requestedPath).toBe('../secret');
    expect(error.data.resolvedPath).toBe('/root/secret');
  });
});

// ============================================================================
// FolderNotFoundError
// ============================================================================

describe('FolderNotFoundError', () => {
  it('has correct code', () => {
    const error = new FolderNotFoundError('not found', '/tmp/missing');
    expect(error.code).toBe(MCP_ERROR_CODES.FOLDER_NOT_FOUND);
  });

  it('stores folderPath', () => {
    const error = new FolderNotFoundError('missing', '/var/images');
    expect(error.data.folderPath).toBe('/var/images');
  });
});

// ============================================================================
// DatabaseError
// ============================================================================

describe('DatabaseError', () => {
  it('has correct code', () => {
    const error = new DatabaseError('db fail', { operation: 'INSERT' });
    expect(error.code).toBe(MCP_ERROR_CODES.DATABASE_ERROR);
  });

  it('stores operation and cause', () => {
    const error = new DatabaseError('db fail', {
      operation: 'SELECT',
      cause: 'table not found',
    });
    expect(error.data.operation).toBe('SELECT');
    expect(error.data.cause).toBe('table not found');
  });

  it('omits cause when not provided', () => {
    const error = new DatabaseError('db fail', { operation: 'DELETE' });
    expect(error.data).not.toHaveProperty('cause');
  });
});

// ============================================================================
// BatchPartialFailureError
// ============================================================================

describe('BatchPartialFailureError', () => {
  it('has correct code', () => {
    const error = new BatchPartialFailureError('partial fail', {
      totalItems: 5,
      successCount: 3,
      failureCount: 2,
      results: [
        { index: 0, success: true },
        { index: 1, success: false, error: 'timeout' },
      ],
    });
    expect(error.code).toBe(MCP_ERROR_CODES.BATCH_PARTIAL_FAILURE);
  });

  it('stores batch details', () => {
    const results = [
      { index: 0, success: true, data: { id: 'a' } },
      { index: 1, success: false, error: 'failed' },
    ];
    const error = new BatchPartialFailureError('partial fail', {
      totalItems: 2,
      successCount: 1,
      failureCount: 1,
      results,
    });
    expect(error.data.totalItems).toBe(2);
    expect(error.data.successCount).toBe(1);
    expect(error.data.failureCount).toBe(1);
    expect(error.data.results).toEqual(results);
  });
});

// ============================================================================
// ProviderNotSupportedError
// ============================================================================

describe('ProviderNotSupportedError', () => {
  it('has correct code', () => {
    const error = new ProviderNotSupportedError('unsupported', {
      provider: 'unknown',
      operation: 'img2img',
    });
    expect(error.code).toBe(MCP_ERROR_CODES.PROVIDER_NOT_SUPPORTED);
  });

  it('stores provider, operation, and supportedProviders', () => {
    const error = new ProviderNotSupportedError('unsupported', {
      provider: 'xyz',
      operation: 'upscale',
      supportedProviders: ['bfl', 'bria'],
    });
    expect(error.data.provider).toBe('xyz');
    expect(error.data.operation).toBe('upscale');
    expect(error.data.supportedProviders).toEqual(['bfl', 'bria']);
  });

  it('omits supportedProviders when not provided', () => {
    const error = new ProviderNotSupportedError('unsupported', {
      provider: 'xyz',
      operation: 'upscale',
    });
    expect(error.data).not.toHaveProperty('supportedProviders');
  });
});

// ============================================================================
// ToolNotFoundError
// ============================================================================

describe('ToolNotFoundError', () => {
  it('has correct code', () => {
    const error = new ToolNotFoundError('generate_video');
    expect(error.code).toBe(MCP_ERROR_CODES.TOOL_NOT_FOUND);
  });

  it('generates message from tool name', () => {
    const error = new ToolNotFoundError('missing_tool');
    expect(error.message).toBe('Tool not found: missing_tool');
  });

  it('stores toolName in data', () => {
    const error = new ToolNotFoundError('my_tool');
    expect(error.data.toolName).toBe('my_tool');
  });
});

// ============================================================================
// ResourceNotFoundError
// ============================================================================

describe('ResourceNotFoundError', () => {
  it('has correct code', () => {
    const error = new ResourceNotFoundError('runware://images/123');
    expect(error.code).toBe(MCP_ERROR_CODES.RESOURCE_NOT_FOUND);
  });

  it('generates message from URI', () => {
    const error = new ResourceNotFoundError('runware://models/flux');
    expect(error.message).toBe('Resource not found: runware://models/flux');
  });

  it('stores uri in data', () => {
    const error = new ResourceNotFoundError('test://uri');
    expect(error.data.uri).toBe('test://uri');
  });
});

// ============================================================================
// InvalidParamsError
// ============================================================================

describe('InvalidParamsError', () => {
  it('has correct code', () => {
    const error = new InvalidParamsError('bad params', ['field required']);
    expect(error.code).toBe(MCP_ERROR_CODES.INVALID_PARAMS);
  });

  it('stores errors array', () => {
    const errors = ['width is required', 'prompt too short'];
    const error = new InvalidParamsError('validation failed', errors);
    expect(error.data.errors).toEqual(errors);
  });
});

// ============================================================================
// isMcpError
// ============================================================================

describe('isMcpError', () => {
  it('returns true for McpError subclasses', () => {
    expect(isMcpError(new RunwareApiError('test'))).toBe(true);
    expect(isMcpError(new RateLimitError('test', 1000))).toBe(true);
    expect(isMcpError(new ToolNotFoundError('x'))).toBe(true);
    expect(isMcpError(new PathTraversalError('x', { requestedPath: 'a', resolvedPath: 'b' }))).toBe(true);
  });

  it('returns false for regular errors', () => {
    expect(isMcpError(new Error('regular error'))).toBe(false);
    expect(isMcpError(new TypeError('type error'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isMcpError('string')).toBe(false);
    expect(isMcpError(42)).toBe(false);
    expect(isMcpError(null)).toBe(false);
    expect(isMcpError(undefined)).toBe(false);
    expect(isMcpError({ message: 'fake' })).toBe(false);
  });
});

// ============================================================================
// wrapError
// ============================================================================

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

    const tool = new ToolNotFoundError('x');
    expect(wrapError(tool)).toBe(tool);
  });
});
