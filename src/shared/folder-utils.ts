/**
 * Folder utilities module for the Runware MCP server.
 *
 * Provides folder operations for batch processing of media files.
 */

import { type Dirent } from 'node:fs';
import { readdir, stat, mkdir, access, constants } from 'node:fs/promises';
import path from 'node:path';

import { FolderNotFoundError, FileError } from './errors.js';
import { isPathSafe, resolveAndValidatePath } from './file-utils.js';

// ============================================================================
// File Extension Sets
// ============================================================================

/**
 * Set of valid image file extensions (lowercase, including dot).
 */
export const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
]);

/**
 * Set of valid video file extensions (lowercase, including dot).
 */
export const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.webm',
  '.mov',
]);

/**
 * Set of valid audio file extensions (lowercase, including dot).
 */
export const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.wav',
  '.ogg',
]);

// ============================================================================
// Folder Walking Options
// ============================================================================

/**
 * Options for walking a folder.
 */
export interface WalkFolderOptions {
  /**
   * Set of file extensions to include (e.g., ['.jpg', '.png']).
   * If not specified, all files are included.
   */
  readonly extensions?: ReadonlySet<string>;

  /**
   * Whether to recursively walk subdirectories.
   * Default: false
   */
  readonly recursive?: boolean;

  /**
   * Maximum depth to recurse (1 = immediate children only).
   * Only used if recursive is true.
   * Default: unlimited
   */
  readonly maxDepth?: number;

  /**
   * Whether to skip hidden files and directories (starting with '.').
   * Default: true
   */
  readonly skipHidden?: boolean;
}

// ============================================================================
// Folder Walking
// ============================================================================

/**
 * Async generator that yields file paths in a folder.
 *
 * @param folderPath - Path to the folder to walk
 * @param options - Walk options
 * @yields Absolute file paths matching the criteria
 * @throws FolderNotFoundError if the folder doesn't exist
 */
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

  // Validate folder exists and is accessible
  const resolvedPath = await validateFolder(folderPath);

  // Create state object for the walker
  const state: WalkState = {
    extensions,
    recursive,
    maxDepth,
    skipHidden,
  };

  // Walk the folder
  yield* walkFolderInternal(resolvedPath, state, 0);
}

/**
 * Options passed to the internal walker.
 */
interface WalkState {
  readonly extensions: ReadonlySet<string> | undefined;
  readonly recursive: boolean;
  readonly maxDepth: number | undefined;
  readonly skipHidden: boolean;
}

/**
 * Checks if a file should be yielded based on extension filter.
 */
function shouldYieldFile(fileName: string, extensions: ReadonlySet<string> | undefined): boolean {
  if (extensions === undefined) {
    return true;
  }
  const ext = path.extname(fileName).toLowerCase();
  return extensions.has(ext);
}

/**
 * Checks if a directory should be recursed into.
 */
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

/**
 * Reads directory entries with error handling.
 */
async function readDirectoryEntries(folderPath: string): Promise<Dirent[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return await readdir(folderPath, { withFileTypes: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new FileError(`Failed to read directory: ${folderPath}`, {
      filePath: folderPath,
      reason: errorMessage,
    });
  }
}

/**
 * Internal recursive folder walker.
 */
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

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Gets all image files in a folder.
 *
 * @param folderPath - Path to the folder
 * @param recursive - Whether to search recursively
 * @returns Array of absolute image file paths
 */
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

/**
 * Gets all video files in a folder.
 *
 * @param folderPath - Path to the folder
 * @param recursive - Whether to search recursively
 * @returns Array of absolute video file paths
 */
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

/**
 * Gets all audio files in a folder.
 *
 * @param folderPath - Path to the folder
 * @param recursive - Whether to search recursively
 * @returns Array of absolute audio file paths
 */
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

// ============================================================================
// Folder Operations
// ============================================================================

/**
 * Ensures a folder exists, creating it if necessary.
 *
 * @param folderPath - Path to the folder
 * @throws FileError if folder cannot be created
 */
export async function ensureFolder(folderPath: string): Promise<void> {
  try {
    // Caller should validate path safety
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await mkdir(folderPath, { recursive: true });
  } catch (error) {
    throw new FileError(`Failed to create folder: ${folderPath}`, {
      filePath: folderPath,
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Validates that a folder exists and is accessible.
 *
 * @param folderPath - Path to the folder
 * @returns Resolved folder path
 * @throws FolderNotFoundError if the folder doesn't exist
 */
export async function validateFolder(folderPath: string): Promise<string> {
  // Check path safety first
  if (!isPathSafe(folderPath)) {
    throw new FolderNotFoundError(
      `Folder path is not under an allowed root: ${folderPath}`,
      folderPath,
    );
  }

  try {
    const resolvedPath = await resolveAndValidatePath(folderPath);
    // Path is validated by resolveAndValidatePath
    // eslint-disable-next-line security/detect-non-literal-fs-filename
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

/**
 * Checks if a folder exists.
 *
 * @param folderPath - Path to the folder
 * @returns true if the folder exists
 */
export async function folderExists(folderPath: string): Promise<boolean> {
  try {
    await access(folderPath, constants.R_OK);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stats = await stat(folderPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// ============================================================================
// Folder Statistics
// ============================================================================

/**
 * Statistics for a folder.
 */
export interface FolderStats {
  /**
   * Total number of files in the folder.
   */
  readonly fileCount: number;

  /**
   * Total size of all files in bytes.
   */
  readonly totalSizeBytes: number;

  /**
   * Breakdown by file type.
   */
  readonly byType: Readonly<{
    images: number;
    videos: number;
    audio: number;
    other: number;
  }>;
}

/**
 * Gets statistics about a folder's contents.
 *
 * @param folderPath - Path to the folder
 * @param recursive - Whether to count recursively
 * @returns Folder statistics
 */
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
      // Files are from validated folder path
      // eslint-disable-next-line security/detect-non-literal-fs-filename
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
      // Skip files we can't stat
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

/**
 * Counts files in a folder matching the given extensions.
 *
 * @param folderPath - Path to the folder
 * @param extensions - Set of extensions to count
 * @param recursive - Whether to count recursively
 * @returns Number of matching files
 */
export async function countFilesInFolder(
  folderPath: string,
  extensions?: ReadonlySet<string>,
  recursive = false,
): Promise<number> {
  let count = 0;

  for await (const file of walkFolder(folderPath, { extensions, recursive })) {
    // We only need to count, but the loop variable is required
    if (file) {
      count += 1;
    }
  }

  return count;
}
