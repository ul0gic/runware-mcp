import { type Dirent } from 'node:fs';
import { readdir, stat, mkdir, access, constants } from 'node:fs/promises';
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

export interface WalkFolderOptions {
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
export async function* walkFolder(
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

export async function getVideosInFolder(
  folderPath: string,
  recursive = false,
): Promise<string[]> {
  const videos: string[] = [];

  for await (const file of walkFolder(folderPath, {
    extensions: VIDEO_EXTENSIONS,
    recursive,
  })) {
    videos.push(file);
  }

  return videos;
}

export async function getAudioInFolder(
  folderPath: string,
  recursive = false,
): Promise<string[]> {
  const audio: string[] = [];

  for await (const file of walkFolder(folderPath, {
    extensions: AUDIO_EXTENSIONS,
    recursive,
  })) {
    audio.push(file);
  }

  return audio;
}

/** Caller must validate path safety — this creates directories unconditionally. */
export async function ensureFolder(folderPath: string): Promise<void> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- caller validates the path
    await mkdir(folderPath, { recursive: true });
  } catch (error) {
    throw new FileError(`Failed to create folder: ${folderPath}`, {
      filePath: folderPath,
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
  }
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

export async function folderExists(folderPath: string): Promise<boolean> {
  try {
    await access(folderPath, constants.R_OK);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- caller validates the path
    const stats = await stat(folderPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export interface FolderStats {
  readonly fileCount: number;

  readonly totalSizeBytes: number;

  readonly byType: Readonly<{
    images: number;
    videos: number;
    audio: number;
    other: number;
  }>;
}

export async function getFolderStats(
  folderPath: string,
  recursive = false,
): Promise<FolderStats> {
  const resolvedPath = await validateFolder(folderPath);

  let fileCount = 0;
  let totalSizeBytes = 0;
  let images = 0;
  let videos = 0;
  let audio = 0;
  let other = 0;

  for await (const file of walkFolder(resolvedPath, { recursive })) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path comes from walkFolder over a validated root
      const stats = await stat(file);
      fileCount += 1;
      totalSizeBytes += stats.size;

      const ext = path.extname(file).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        images += 1;
      } else if (VIDEO_EXTENSIONS.has(ext)) {
        videos += 1;
      } else if (AUDIO_EXTENSIONS.has(ext)) {
        audio += 1;
      } else {
        other += 1;
      }
    } catch {
      // A file that cannot be stat'd (raced deletion, permission) is skipped rather than failing the whole scan
    }
  }

  return {
    fileCount,
    totalSizeBytes,
    byType: {
      images,
      videos,
      audio,
      other,
    },
  };
}

export async function countFilesInFolder(
  folderPath: string,
  extensions?: ReadonlySet<string>,
  recursive = false,
): Promise<number> {
  let count = 0;

  for await (const file of walkFolder(folderPath, { extensions, recursive })) {
    if (file) {
      count += 1;
    }
  }

  return count;
}
