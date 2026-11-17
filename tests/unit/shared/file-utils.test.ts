// Does:  Proves file-path confinement to allowed roots, size limits, extension checks and base64 reads.
// Holds: Node:fs/promises (realpath as identity) and config are mocked; path resolution and limit logic are real.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  realpath: vi.fn((target: string) => Promise.resolve(target)),
  stat: vi.fn(),
  access: vi.fn(),
  constants: { R_OK: 4 },
}));

vi.mock('../../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'test-key-that-is-at-least-32-characters-long',
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: ['/tmp', '/home/testuser/Pictures'],
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  getMaxFileSizeBytes: () => 50 * 1024 * 1024,
}));

import { readFile, stat, access } from 'node:fs/promises';

import {
  getFileMimeType,
  isPathSafe,
  readFileAsBase64,
  validateFileSize,
  validateFilePath,
  validateFileType,
} from '../../../src/shared/file-utils.js';
import { FileError, FileTooLargeError, PathTraversalError } from '../../../src/shared/errors.js';

const mockReadFile = vi.mocked(readFile);
const mockStat = vi.mocked(stat);
const mockAccess = vi.mocked(access);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getFileMimeType', () => {
  it('returns application/octet-stream for unknown extension', () => {
    expect(getFileMimeType('/path/to/file.xyz')).toBe('application/octet-stream');
  });

  it('is case-insensitive', () => {
    expect(getFileMimeType('/path/to/photo.JPG')).toBe('image/jpeg');
    expect(getFileMimeType('/path/to/photo.PNG')).toBe('image/png');
  });
});

describe('isPathSafe', () => {
  it('returns true for path under allowed root', () => {
    expect(isPathSafe('/tmp/images/test.jpg', ['/tmp'])).toBe(true);
  });

  it('returns false for path not under allowed root', () => {
    expect(isPathSafe('/etc/passwd', ['/tmp'])).toBe(false);
  });

  it('returns false for relative path', () => {
    expect(isPathSafe('relative/path.jpg', ['/tmp'])).toBe(false);
  });

  it('returns false for path with .. traversal', () => {
    expect(isPathSafe('/tmp/../etc/passwd', ['/tmp'])).toBe(false);
  });

  it('returns true for multiple allowed roots', () => {
    expect(isPathSafe('/home/testuser/Pictures/photo.jpg', ['/tmp', '/home/testuser/Pictures'])).toBe(true);
  });
});

describe('readFileAsBase64', () => {
  it('reads file and returns base64', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({ size: 1000 } as never);
    mockReadFile.mockResolvedValue(Buffer.from('hello world'));

    const result = await readFileAsBase64('/tmp/test.txt', ['/tmp']);
    expect(result).toBe(Buffer.from('hello world').toString('base64'));
  });

  it('throws PathTraversalError for path outside roots', async () => {
    await expect(readFileAsBase64('/etc/passwd', ['/tmp'])).rejects.toThrow(PathTraversalError);
  });

  it('throws FileError when file not readable', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    await expect(readFileAsBase64('/tmp/missing.txt', ['/tmp'])).rejects.toThrow(FileError);
  });
});

describe('validateFileSize', () => {
  it('passes for file under limit', async () => {
    mockStat.mockResolvedValue({ size: 1000 } as never);
    await expect(validateFileSize('/tmp/small.jpg')).resolves.toBeUndefined();
  });

  it('throws FileTooLargeError for file over limit', async () => {
    mockStat.mockResolvedValue({ size: 60_000_000 } as never);
    await expect(validateFileSize('/tmp/huge.jpg')).rejects.toThrow(FileTooLargeError);
  });

  it('supports custom maxSizeMB', async () => {
    mockStat.mockResolvedValue({ size: 2_000_000 } as never);
    await expect(validateFileSize('/tmp/file.jpg', 1)).rejects.toThrow(FileTooLargeError);
  });

  it('throws FileError when stat fails', async () => {
    mockStat.mockRejectedValue(new Error('ENOENT'));
    await expect(validateFileSize('/tmp/missing.jpg')).rejects.toThrow(FileError);
  });
});

describe('validateFilePath', () => {
  it('returns resolved path for valid file', async () => {
    mockAccess.mockResolvedValue(undefined);

    const result = await validateFilePath('/tmp/test.jpg');
    expect(result).toContain('/tmp/test.jpg');
  });

  it('throws for path outside allowed roots', async () => {
    await expect(validateFilePath('/etc/secret')).rejects.toThrow();
  });
});

describe('validateFileType', () => {
  it('passes for allowed extension', () => {
    expect(() => validateFileType('.jpg', ['.jpg', '.png', '.webp'])).not.toThrow();
  });

  it('passes for extension without leading dot', () => {
    expect(() => validateFileType('png', ['.jpg', '.png', '.webp'])).not.toThrow();
  });

  it('throws for disallowed extension', () => {
    expect(() => validateFileType('.bmp', ['.jpg', '.png'])).toThrow(FileError);
  });

  it('is case-insensitive', () => {
    expect(() => validateFileType('.JPG', ['.jpg', '.png'])).not.toThrow();
  });
});
