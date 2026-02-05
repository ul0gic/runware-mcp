import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node:fs/promises BEFORE importing the module under test
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  lstat: vi.fn(),
  realpath: vi.fn(),
  stat: vi.fn(),
  access: vi.fn(),
  constants: { R_OK: 4 },
}));

// Mock config to avoid env var validation at import time
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
    ENABLE_DATABASE: false,
    DATABASE_PATH: './test.db',
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  getMaxFileSizeBytes: () => 50 * 1024 * 1024,
}));

import { readFile, lstat, stat, access } from 'node:fs/promises';

import {
  getFileMimeType,
  isPathSafe,
  readFileAsBase64,
  validateFileSize,
  validateFilePath,
  isAllowedImageType,
  isAllowedVideoType,
  isAllowedAudioType,
  isAllowedImageFile,
  validateFileType,
} from '../../../src/shared/file-utils.js';
import { FileError, FileTooLargeError, PathTraversalError } from '../../../src/shared/errors.js';

// ============================================================================
// Setup
// ============================================================================

const mockReadFile = vi.mocked(readFile);
const mockLstat = vi.mocked(lstat);
const mockStat = vi.mocked(stat);
const mockAccess = vi.mocked(access);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// getFileMimeType
// ============================================================================

describe('getFileMimeType', () => {
  it('returns image/jpeg for .jpg', () => {
    expect(getFileMimeType('/path/to/photo.jpg')).toBe('image/jpeg');
  });

  it('returns image/jpeg for .jpeg', () => {
    expect(getFileMimeType('/path/to/photo.jpeg')).toBe('image/jpeg');
  });

  it('returns image/png for .png', () => {
    expect(getFileMimeType('/path/to/photo.png')).toBe('image/png');
  });

  it('returns image/webp for .webp', () => {
    expect(getFileMimeType('/path/to/photo.webp')).toBe('image/webp');
  });

  it('returns image/gif for .gif', () => {
    expect(getFileMimeType('/path/to/anim.gif')).toBe('image/gif');
  });

  it('returns image/bmp for .bmp', () => {
    expect(getFileMimeType('/path/to/img.bmp')).toBe('image/bmp');
  });

  it('returns video/mp4 for .mp4', () => {
    expect(getFileMimeType('/path/to/video.mp4')).toBe('video/mp4');
  });

  it('returns video/webm for .webm', () => {
    expect(getFileMimeType('/path/to/video.webm')).toBe('video/webm');
  });

  it('returns audio/mpeg for .mp3', () => {
    expect(getFileMimeType('/path/to/song.mp3')).toBe('audio/mpeg');
  });

  it('returns application/octet-stream for unknown extension', () => {
    expect(getFileMimeType('/path/to/file.xyz')).toBe('application/octet-stream');
  });

  it('is case-insensitive', () => {
    expect(getFileMimeType('/path/to/photo.JPG')).toBe('image/jpeg');
    expect(getFileMimeType('/path/to/photo.PNG')).toBe('image/png');
  });
});

// ============================================================================
// isAllowedImageType / isAllowedVideoType / isAllowedAudioType
// ============================================================================

describe('isAllowedImageType', () => {
  it('returns true for allowed types', () => {
    expect(isAllowedImageType('image/jpeg')).toBe(true);
    expect(isAllowedImageType('image/png')).toBe(true);
    expect(isAllowedImageType('image/webp')).toBe(true);
    expect(isAllowedImageType('image/gif')).toBe(true);
    expect(isAllowedImageType('image/bmp')).toBe(true);
  });

  it('returns false for disallowed types', () => {
    expect(isAllowedImageType('image/svg+xml')).toBe(false);
    expect(isAllowedImageType('image/tiff')).toBe(false);
    expect(isAllowedImageType('video/mp4')).toBe(false);
  });
});

describe('isAllowedVideoType', () => {
  it('returns true for allowed types', () => {
    expect(isAllowedVideoType('video/mp4')).toBe(true);
    expect(isAllowedVideoType('video/webm')).toBe(true);
    expect(isAllowedVideoType('video/quicktime')).toBe(true);
  });

  it('returns false for disallowed types', () => {
    expect(isAllowedVideoType('video/x-msvideo')).toBe(false);
    expect(isAllowedVideoType('image/png')).toBe(false);
  });
});

describe('isAllowedAudioType', () => {
  it('returns true for allowed types', () => {
    expect(isAllowedAudioType('audio/mpeg')).toBe(true);
    expect(isAllowedAudioType('audio/wav')).toBe(true);
    expect(isAllowedAudioType('audio/ogg')).toBe(true);
  });

  it('returns false for disallowed types', () => {
    expect(isAllowedAudioType('audio/midi')).toBe(false);
    expect(isAllowedAudioType('image/png')).toBe(false);
  });
});

describe('isAllowedImageFile', () => {
  it('returns true for files with allowed extensions', () => {
    expect(isAllowedImageFile('/tmp/photo.jpg')).toBe(true);
    expect(isAllowedImageFile('/tmp/photo.png')).toBe(true);
  });

  it('returns false for files with disallowed extensions', () => {
    expect(isAllowedImageFile('/tmp/file.txt')).toBe(false);
    expect(isAllowedImageFile('/tmp/file.svg')).toBe(false);
  });
});

// ============================================================================
// isPathSafe
// ============================================================================

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

// ============================================================================
// readFileAsBase64
// ============================================================================

describe('readFileAsBase64', () => {
  it('reads file and returns base64', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);
    mockStat.mockResolvedValue({ size: 1000 } as never);
    mockReadFile.mockResolvedValue(Buffer.from('hello world'));

    const result = await readFileAsBase64('/tmp/test.txt', ['/tmp']);
    expect(result).toBe(Buffer.from('hello world').toString('base64'));
  });

  it('throws PathTraversalError for path outside roots', async () => {
    await expect(
      readFileAsBase64('/etc/passwd', ['/tmp']),
    ).rejects.toThrow(PathTraversalError);
  });

  it('throws FileError when file not readable', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    await expect(
      readFileAsBase64('/tmp/missing.txt', ['/tmp']),
    ).rejects.toThrow(FileError);
  });
});

// ============================================================================
// validateFileSize
// ============================================================================

describe('validateFileSize', () => {
  it('passes for file under limit', async () => {
    mockStat.mockResolvedValue({ size: 1000 } as never);
    await expect(validateFileSize('/tmp/small.jpg')).resolves.toBeUndefined();
  });

  it('throws FileTooLargeError for file over limit', async () => {
    // Default max is 50MB = 52428800 bytes
    mockStat.mockResolvedValue({ size: 60_000_000 } as never);
    await expect(validateFileSize('/tmp/huge.jpg')).rejects.toThrow(
      FileTooLargeError,
    );
  });

  it('supports custom maxSizeMB', async () => {
    mockStat.mockResolvedValue({ size: 2_000_000 } as never);
    // 1 MB = 1048576 bytes, file is ~2MB
    await expect(validateFileSize('/tmp/file.jpg', 1)).rejects.toThrow(
      FileTooLargeError,
    );
  });

  it('throws FileError when stat fails', async () => {
    mockStat.mockRejectedValue(new Error('ENOENT'));
    await expect(validateFileSize('/tmp/missing.jpg')).rejects.toThrow(FileError);
  });
});

// ============================================================================
// validateFilePath (convenience wrapper)
// ============================================================================

describe('validateFilePath', () => {
  it('returns resolved path for valid file', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);

    const result = await validateFilePath('/tmp/test.jpg');
    expect(result).toContain('/tmp/test.jpg');
  });

  it('throws for path outside allowed roots', async () => {
    await expect(validateFilePath('/etc/secret')).rejects.toThrow();
  });
});

// ============================================================================
// validateFileType
// ============================================================================

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
