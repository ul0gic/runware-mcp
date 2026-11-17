// Does:  Validates a folder against the allowed roots and walks it for files with the given extensions.
// Holds: Walks yield only regular files and descend only real directories; symlink entries are skipped, never followed.

import type { Dirent } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { FolderNotFoundError, FileError, PathTraversalError } from './errors.js';
import { resolveAndValidatePath } from './file-utils.js';

// Holds: Lowercase with the leading dot, to compare against `path.extname(x).toLowerCase()`.
export const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']);

interface WalkFolderOptions {
  readonly extensions?: ReadonlySet<string>;

  readonly recursive?: boolean;

  // Holds: 0 lists only the folder itself and each step adds one subdirectory level; ignored unless recursive.
  readonly maxDepth?: number;

  readonly skipHidden?: boolean;
}

async function* walkFolder(
  folderPath: string,
  options: WalkFolderOptions = {},
): AsyncGenerator<string, void, undefined> {
  const { extensions, recursive = false, maxDepth, skipHidden = true } = options;

  const resolvedPath = await validateFolder(folderPath);

  const state: WalkState = {
    extensions,
    recursive,
    maxDepth,
    skipHidden,
  };

  yield* walkFolderInternal(resolvedPath, state, 0);
}

interface WalkState {
  readonly extensions: ReadonlySet<string> | undefined;
  readonly recursive: boolean;
  readonly maxDepth: number | undefined;
  readonly skipHidden: boolean;
}

function shouldYieldFile(fileName: string, extensions: ReadonlySet<string> | undefined): boolean {
  if (extensions === undefined) {
    return true;
  }
  const ext = path.extname(fileName).toLowerCase();
  return extensions.has(ext);
}

function shouldRecurse(state: WalkState, currentDepth: number): boolean {
  if (!state.recursive) {
    return false;
  }
  if (state.maxDepth !== undefined && currentDepth >= state.maxDepth) {
    return false;
  }
  return true;
}

async function readDirectoryEntries(folderPath: string): Promise<Dirent[]> {
  try {
    return await readdir(folderPath, { withFileTypes: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new FileError(`Failed to read directory: ${folderPath}`, {
      filePath: folderPath,
      reason: errorMessage,
    });
  }
}

async function* walkFolderInternal(
  folderPath: string,
  state: WalkState,
  currentDepth: number,
): AsyncGenerator<string, void, undefined> {
  const entries = await readDirectoryEntries(folderPath);

  for (const entry of entries) {
    if (state.skipHidden && entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(folderPath, entry.name);

    if (entry.isFile() && shouldYieldFile(entry.name, state.extensions)) {
      yield fullPath;
    } else if (entry.isDirectory() && shouldRecurse(state, currentDepth)) {
      yield* walkFolderInternal(fullPath, state, currentDepth + 1);
    }
  }
}

export async function getImagesInFolder(folderPath: string, recursive = false): Promise<string[]> {
  const images: string[] = await Array.fromAsync(
    walkFolder(folderPath, {
      extensions: IMAGE_EXTENSIONS,
      recursive,
    }),
  );

  return images;
}

// Holds: Returns the folder's real path; a folder reached through a symlink must still resolve inside an allowed root.
export async function validateFolder(folderPath: string): Promise<string> {
  try {
    const resolvedPath = await resolveAndValidatePath(folderPath);
    const stats = await stat(resolvedPath);

    if (!stats.isDirectory()) {
      throw new FolderNotFoundError(`Path is not a directory: ${folderPath}`, folderPath);
    }

    return resolvedPath;
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      throw error;
    }
    if (error instanceof PathTraversalError) {
      throw new FolderNotFoundError(`Folder path is not under an allowed root: ${folderPath}`, folderPath);
    }
    throw new FolderNotFoundError(`Folder not found or not accessible: ${folderPath}`, folderPath);
  }
}
