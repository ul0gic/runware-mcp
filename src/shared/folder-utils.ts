import { type Dirent } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { FolderNotFoundError, FileError } from './errors.js';
import { isPathSafe, resolveAndValidatePath } from './file-utils.js';

/** Lowercase, leading dot included — compare against `path.extname(x).toLowerCase()`. */
export const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
]);

export const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.webm',
  '.mov',
]);

export const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.wav',
  '.ogg',
]);

interface WalkFolderOptions {
  /** Lowercase extensions with leading dot; unset includes every file. */
  readonly extensions?: ReadonlySet<string>;

  /** Default: false. */
  readonly recursive?: boolean;

  /** 1 = immediate children only. Unset means unlimited; ignored unless recursive. */
  readonly maxDepth?: number;

  /** Skips dot-prefixed files and directories. Default: true. */
  readonly skipHidden?: boolean;
}

/** Yields absolute paths of files under an allowed root. */
async function* walkFolder(
  folderPath: string,
  options: WalkFolderOptions = {},
): AsyncGenerator<string, void, undefined> {
  const {
    extensions,
    recursive = false,
    maxDepth,
    skipHidden = true,
  } = options;

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

function shouldRecurse(
  state: WalkState,
  currentDepth: number,
): boolean {
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- only reached from walkFolder, whose root is validated by validateFolder
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

export async function getImagesInFolder(
  folderPath: string,
  recursive = false,
): Promise<string[]> {
  const images: string[] = [];

  for await (const file of walkFolder(folderPath, {
    extensions: IMAGE_EXTENSIONS,
    recursive,
  })) {
    images.push(file);
  }

  return images;
}

export async function validateFolder(folderPath: string): Promise<string> {
  if (!isPathSafe(folderPath)) {
    throw new FolderNotFoundError(
      `Folder path is not under an allowed root: ${folderPath}`,
      folderPath,
    );
  }

  try {
    const resolvedPath = await resolveAndValidatePath(folderPath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated above
    const stats = await stat(resolvedPath);

    if (!stats.isDirectory()) {
      throw new FolderNotFoundError(
        `Path is not a directory: ${folderPath}`,
        folderPath,
      );
    }

    return resolvedPath;
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      throw error;
    }
    throw new FolderNotFoundError(
      `Folder not found or not accessible: ${folderPath}`,
      folderPath,
    );
  }
}
