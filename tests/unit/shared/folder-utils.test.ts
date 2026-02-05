import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node:fs/promises BEFORE importing the module under test
vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
  lstat: vi.fn(),
  realpath: vi.fn(),
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

import { readdir, stat, access, lstat } from 'node:fs/promises';

import {
  validateFolder,
  getImagesInFolder,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
} from '../../../src/shared/folder-utils.js';
import { FolderNotFoundError } from '../../../src/shared/errors.js';

// ============================================================================
// Setup
// ============================================================================

const mockReaddir = vi.mocked(readdir);
const mockStat = vi.mocked(stat);
const mockAccess = vi.mocked(access);
const mockLstat = vi.mocked(lstat);

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Extension Sets
// ============================================================================

describe('extension sets', () => {
  it('IMAGE_EXTENSIONS contains expected formats', () => {
    expect(IMAGE_EXTENSIONS.has('.jpg')).toBe(true);
    expect(IMAGE_EXTENSIONS.has('.jpeg')).toBe(true);
    expect(IMAGE_EXTENSIONS.has('.png')).toBe(true);
    expect(IMAGE_EXTENSIONS.has('.webp')).toBe(true);
    expect(IMAGE_EXTENSIONS.has('.gif')).toBe(true);
    expect(IMAGE_EXTENSIONS.has('.bmp')).toBe(true);
  });

  it('VIDEO_EXTENSIONS contains expected formats', () => {
    expect(VIDEO_EXTENSIONS.has('.mp4')).toBe(true);
    expect(VIDEO_EXTENSIONS.has('.webm')).toBe(true);
    expect(VIDEO_EXTENSIONS.has('.mov')).toBe(true);
  });

  it('AUDIO_EXTENSIONS contains expected formats', () => {
    expect(AUDIO_EXTENSIONS.has('.mp3')).toBe(true);
    expect(AUDIO_EXTENSIONS.has('.wav')).toBe(true);
    expect(AUDIO_EXTENSIONS.has('.ogg')).toBe(true);
  });
});

// ============================================================================
// validateFolder
// ============================================================================

describe('validateFolder', () => {
  it('throws FolderNotFoundError for path outside allowed roots', async () => {
    await expect(validateFolder('/etc/secret')).rejects.toThrow(FolderNotFoundError);
  });

  it('throws FolderNotFoundError when folder does not exist', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));
    await expect(validateFolder('/tmp/missing')).rejects.toThrow(FolderNotFoundError);
  });

  it('returns resolved path for valid directory', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);
    mockStat.mockResolvedValue({ isDirectory: () => true } as never);

    const result = await validateFolder('/tmp/images');
    expect(result).toContain('/tmp/images');
  });

  it('throws FolderNotFoundError when path is a file not a directory', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);
    mockStat.mockResolvedValue({ isDirectory: () => false } as never);

    await expect(validateFolder('/tmp/somefile.txt')).rejects.toThrow(FolderNotFoundError);
  });
});

// ============================================================================
// getImagesInFolder
// ============================================================================

describe('getImagesInFolder', () => {
  it('finds image files in folder', async () => {
    // Setup: validate folder
    mockAccess.mockResolvedValue(undefined);
    mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);
    mockStat.mockResolvedValue({ isDirectory: () => true } as never);

    // readdir returns dirents
    mockReaddir.mockResolvedValue([
      { name: 'photo.jpg', isFile: () => true, isDirectory: () => false } as never,
      { name: 'image.png', isFile: () => true, isDirectory: () => false } as never,
      { name: 'readme.txt', isFile: () => true, isDirectory: () => false } as never,
      { name: 'video.mp4', isFile: () => true, isDirectory: () => false } as never,
    ]);

    const images = await getImagesInFolder('/tmp/gallery');

    expect(images).toHaveLength(2);
    expect(images[0]).toContain('photo.jpg');
    expect(images[1]).toContain('image.png');
  });

  it('returns empty array for folder with no images', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);
    mockStat.mockResolvedValue({ isDirectory: () => true } as never);

    mockReaddir.mockResolvedValue([
      { name: 'readme.txt', isFile: () => true, isDirectory: () => false } as never,
    ]);

    const images = await getImagesInFolder('/tmp/docs');
    expect(images).toHaveLength(0);
  });

  it('skips hidden files by default', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);
    mockStat.mockResolvedValue({ isDirectory: () => true } as never);

    mockReaddir.mockResolvedValue([
      { name: '.hidden.jpg', isFile: () => true, isDirectory: () => false } as never,
      { name: 'visible.png', isFile: () => true, isDirectory: () => false } as never,
    ]);

    const images = await getImagesInFolder('/tmp/gallery');
    expect(images).toHaveLength(1);
    expect(images[0]).toContain('visible.png');
  });

  it('handles recursive option', async () => {
    mockAccess.mockResolvedValue(undefined);
    mockLstat.mockResolvedValue({ isSymbolicLink: () => false } as never);
    // First call for the root folder, second call for subfolder stat
    mockStat
      .mockResolvedValueOnce({ isDirectory: () => true } as never) // validateFolder
      .mockResolvedValueOnce({ isDirectory: () => true } as never); // subfolder

    // Root folder has a subfolder and an image
    mockReaddir
      .mockResolvedValueOnce([
        { name: 'root.jpg', isFile: () => true, isDirectory: () => false } as never,
        { name: 'subdir', isFile: () => false, isDirectory: () => true } as never,
      ])
      .mockResolvedValueOnce([
        { name: 'nested.png', isFile: () => true, isDirectory: () => false } as never,
      ]);

    const images = await getImagesInFolder('/tmp/gallery', true);
    expect(images).toHaveLength(2);
    expect(images.some((f) => f.includes('root.jpg'))).toBe(true);
    expect(images.some((f) => f.includes('nested.png'))).toBe(true);
  });
});
