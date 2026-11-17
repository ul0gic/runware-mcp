// Does:  Proves file and folder validation confine every path to an allowed root by its real, fully resolved location.
// Holds: Runs against a real mkdtemp tree with real symlinks; only config is mocked so the allowed roots point into it.

import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const mockConfig = vi.hoisted(() => {
  const allowedRoots: string[] = [];
  return {
    RUNWARE_API_KEY: 'test-key-that-is-at-least-32-characters-long',
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: allowedRoots,
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  };
});

vi.mock('../../src/shared/config.js', () => ({
  config: mockConfig,
  getMaxFileSizeBytes: () => 50 * 1024 * 1024,
}));

import { FolderNotFoundError, PathTraversalError } from '../../src/shared/errors.js';
import { readFileAsBase64, resolveAndValidatePath } from '../../src/shared/file-utils.js';
import { validateFolder } from '../../src/shared/folder-utils.js';

let base = '';
let root = '';
let outside = '';
let linkedRoot = '';

beforeAll(async () => {
  base = await realpath(await mkdtemp(path.join(tmpdir(), 'runware-path-')));
  root = path.join(base, 'root');
  outside = path.join(base, 'outside');
  linkedRoot = path.join(base, 'linked-root');

  await mkdir(path.join(root, 'photos'), { recursive: true });
  await mkdir(path.join(outside, 'secrets'), { recursive: true });
  await mkdir(path.join(base, 'rootevil'), { recursive: true });
  await writeFile(path.join(outside, 'passwd'), 'root:x:0:0');
  await writeFile(path.join(outside, 'secrets', 'key.png'), 'secret');
  await writeFile(path.join(root, 'photos', 'cat.png'), 'meow');
  await writeFile(path.join(root, 'a..b.jpg'), 'dots');
  await writeFile(path.join(base, 'rootevil', 'x.jpg'), 'evil');
  await symlink(outside, path.join(root, 'link'));
  await symlink(root, linkedRoot);

  mockConfig.ALLOWED_FILE_ROOTS.push(root);
});

afterAll(async () => {
  await rm(base, { recursive: true, force: true });
});

describe('resolveAndValidatePath with real symlinks', () => {
  it('rejects a file reached through a symlinked parent directory that escapes the root', async () => {
    await expect(resolveAndValidatePath(path.join(root, 'link', 'passwd'), [root])).rejects.toThrow(PathTraversalError);
  });

  it('refuses to read a file through a symlinked parent directory', async () => {
    await expect(readFileAsBase64(path.join(root, 'link', 'secrets', 'key.png'), [root])).rejects.toThrow(
      PathTraversalError,
    );
  });

  it('rejects a sibling directory that only shares the root prefix', async () => {
    await expect(resolveAndValidatePath(path.join(base, 'rootevil', 'x.jpg'), [root])).rejects.toThrow(
      PathTraversalError,
    );
  });

  it('rejects .. traversal out of the root', async () => {
    await expect(resolveAndValidatePath(`${root}/../outside/passwd`, [root])).rejects.toThrow(PathTraversalError);
  });

  it('accepts a file name that merely contains two dots', async () => {
    await expect(resolveAndValidatePath(path.join(root, 'a..b.jpg'), [root])).resolves.toBe(
      path.join(root, 'a..b.jpg'),
    );
  });

  it('accepts the real path of a file when the allowed root is itself a symlink', async () => {
    await expect(resolveAndValidatePath(path.join(root, 'photos', 'cat.png'), [linkedRoot])).resolves.toBe(
      path.join(root, 'photos', 'cat.png'),
    );
  });

  it('accepts a file under a symlinked root and returns its real path', async () => {
    await expect(resolveAndValidatePath(path.join(linkedRoot, 'photos', 'cat.png'), [linkedRoot])).resolves.toBe(
      path.join(root, 'photos', 'cat.png'),
    );
  });
});

describe('validateFolder with real symlinks', () => {
  it('rejects a folder reached through a symlinked parent directory that escapes the root', async () => {
    await expect(validateFolder(path.join(root, 'link', 'secrets'))).rejects.toThrow(FolderNotFoundError);
  });

  it('rejects a symlinked folder that escapes the root', async () => {
    await expect(validateFolder(path.join(root, 'link'))).rejects.toThrow(FolderNotFoundError);
  });

  it('accepts a real folder under the root', async () => {
    await expect(validateFolder(path.join(root, 'photos'))).resolves.toBe(path.join(root, 'photos'));
  });
});
