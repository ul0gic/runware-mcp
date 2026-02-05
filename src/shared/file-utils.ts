/**
 * File utilities module for the Runware MCP server.
 *
 * Provides safe file operations with security hardening against
 * path traversal attacks and symlink escapes.
 */

import { readFile, lstat, realpath, stat, access, constants } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import { config, getMaxFileSizeBytes } from './config.js';
import { FileError, FileTooLargeError, PathTraversalError } from './errors.js';

// ============================================================================
// MIME Type Mapping
// ============================================================================

// NOTE: The security/detect-non-literal-fs-filename warnings in this file are
// intentional. All file paths are validated through resolveAndValidatePath()
// before being used, which checks for path traversal and allowed roots.

/**
 * MIME type for JPEG images.
 */
const MIME_JPEG = 'image/jpeg';

/**
 * MIME type for TIFF images.
 */
const MIME_TIFF = 'image/tiff';

/**
 * Default MIME type for unknown file types.
 */
const MIME_OCTET_STREAM = 'application/octet-stream';

/**
 * Default error message for unknown errors.
 */
const DEFAULT_ERROR_MESSAGE = 'Unknown error';

/**
 * Mapping of file extensions to MIME types.
 */
const EXTENSION_TO_MIME = new Map<string, string>([
  // Images
  ['.jpg', MIME_JPEG],
  ['.jpeg', MIME_JPEG],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.bmp', 'image/bmp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.tiff', MIME_TIFF],
  ['.tif', MIME_TIFF],

  // Videos
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.mov', 'video/quicktime'],
  ['.avi', 'video/x-msvideo'],
  ['.mkv', 'video/x-matroska'],

  // Audio
  ['.mp3', 'audio/mpeg'],
  ['.wav', 'audio/wav'],
  ['.ogg', 'audio/ogg'],
  ['.flac', 'audio/flac'],
  ['.aac', 'audio/aac'],
  ['.m4a', 'audio/mp4'],
]);

/**
 * Set of allowed image MIME types.
 */
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
]);

/**
 * Set of allowed video MIME types.
 */
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

/**
 * Set of allowed audio MIME types.
 */
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
]);

// ============================================================================
// Default Allowed Roots
// ============================================================================

/**
 * Gets the default allowed file roots.
 *
 * If ALLOWED_FILE_ROOTS is not configured, defaults to common safe paths.
 */
function getDefaultAllowedRoots(): readonly string[] {
  // Use configured roots if available
  if (config.ALLOWED_FILE_ROOTS.length > 0) {
    return config.ALLOWED_FILE_ROOTS;
  }

  // Default to user's home directory subdirectories
  const home = homedir();
  return [
    `${home}/Pictures`,
    `${home}/Images`,
    `${home}/Downloads`,
    `${home}/Documents`,
    `${home}/Desktop`,
    '/tmp',
  ];
}

// ============================================================================
// Path Security
// ============================================================================

/**
 * Checks if a file path is safe (no path traversal).
 *
 * @param filePath - Path to check
 * @param allowedRoots - Optional array of allowed root directories
 * @returns true if the path is safe
 */
export function isPathSafe(filePath: string, allowedRoots?: readonly string[]): boolean {
  try {
    const roots = allowedRoots ?? getDefaultAllowedRoots();

    // Must be absolute
    if (!path.isAbsolute(filePath)) {
      return false;
    }

    // Normalize to resolve . and ..
    const normalizedPath = path.normalize(filePath);

    // Check for path traversal sequences that might remain after normalize
    if (normalizedPath.includes('..')) {
      return false;
    }

    // Check if under an allowed root
    const isUnderAllowedRoot = roots.some((root) => {
      const normalizedRoot = path.normalize(root);
      return normalizedPath.startsWith(normalizedRoot);
    });

    return isUnderAllowedRoot;
  } catch {
    return false;
  }
}

/**
 * Resolves and validates a file path.
 *
 * Normalizes the path and checks it's under an allowed root.
 * Also resolves symlinks and checks the real path is safe.
 *
 * @param filePath - Path to resolve and validate
 * @param allowedRoots - Optional array of allowed root directories
 * @returns Resolved absolute path
 * @throws PathTraversalError if the path is not safe
 */
export async function resolveAndValidatePath(
  filePath: string,
  allowedRoots?: readonly string[],
): Promise<string> {
  const roots = allowedRoots ?? getDefaultAllowedRoots();

  // Convert to absolute path
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  // Normalize to remove . and ..
  const normalizedPath = path.normalize(absolutePath);

  // Check for path traversal in the normalized path
  if (normalizedPath.includes('..')) {
    throw new PathTraversalError('Path contains traversal sequences', {
      requestedPath: filePath,
      resolvedPath: normalizedPath,
    });
  }

  // Check if under an allowed root before resolving symlinks
  const isUnderAllowedRoot = roots.some((root) => {
    const normalizedRoot = path.normalize(root);
    return normalizedPath.startsWith(normalizedRoot);
  });

  if (!isUnderAllowedRoot) {
    throw new PathTraversalError(
      'Path is not under an allowed root directory',
      {
        requestedPath: filePath,
        resolvedPath: normalizedPath,
      },
    );
  }

  // Check if path exists
  try {
    await access(absolutePath, constants.R_OK);
  } catch {
    throw new FileError(`File not found or not readable: ${filePath}`, {
      filePath,
      reason: 'File not found or not readable',
    });
  }

  // Get file stats to check if it's a symlink
  // Path has been validated above for traversal and allowed roots
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const stats = await lstat(absolutePath);

  if (stats.isSymbolicLink()) {
    // Resolve the symlink and check the real path
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const realPath = await realpath(absolutePath);
    const normalizedRealPath = path.normalize(realPath);

    // Check if the real path is also under an allowed root
    const realPathSafe = roots.some((root) => {
      const normalizedRoot = path.normalize(root);
      return normalizedRealPath.startsWith(normalizedRoot);
    });

    if (!realPathSafe) {
      throw new PathTraversalError(
        'Symlink target escapes allowed roots',
        {
          requestedPath: filePath,
          resolvedPath: normalizedRealPath,
        },
      );
    }

    return normalizedRealPath;
  }

  return normalizedPath;
}

// ============================================================================
// File Reading
// ============================================================================

/**
 * Reads a file and returns its contents as base64.
 *
 * @param filePath - Path to the file
 * @param allowedRoots - Optional array of allowed root directories
 * @returns Base64 encoded file contents
 * @throws PathTraversalError if path is not safe
 * @throws FileTooLargeError if file exceeds size limit
 * @throws FileError for other file errors
 */
export async function readFileAsBase64(
  filePath: string,
  allowedRoots?: readonly string[],
): Promise<string> {
  // Validate and resolve path
  const resolvedPath = await resolveAndValidatePath(filePath, allowedRoots);

  // Check file size
  await validateFileSize(resolvedPath);

  // Read file
  try {
    // Path is validated through resolveAndValidatePath above
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const buffer = await readFile(resolvedPath);
    return buffer.toString('base64');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
    throw new FileError(`Failed to read file: ${filePath}`, {
      filePath,
      reason: errorMessage,
    });
  }
}

/**
 * Reads a file and returns it as a data URI.
 *
 * @param filePath - Path to the file
 * @param allowedRoots - Optional array of allowed root directories
 * @returns Data URI with base64 encoded file
 * @throws PathTraversalError if path is not safe
 * @throws FileTooLargeError if file exceeds size limit
 * @throws FileError for other file errors
 */
export async function readFileAsDataUri(
  filePath: string,
  allowedRoots?: readonly string[],
): Promise<string> {
  const base64 = await readFileAsBase64(filePath, allowedRoots);
  const mimeType = getFileMimeType(filePath);

  return `data:${mimeType};base64,${base64}`;
}

// ============================================================================
// MIME Type Detection
// ============================================================================

/**
 * Gets the MIME type for a file based on its extension.
 *
 * @param filePath - Path or filename
 * @returns MIME type string
 */
export function getFileMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_MIME.get(ext) ?? MIME_OCTET_STREAM;
}

/**
 * Checks if a MIME type is an allowed image type.
 *
 * @param mimeType - MIME type to check
 * @returns true if the MIME type is an allowed image type
 */
export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mimeType);
}

/**
 * Checks if a MIME type is an allowed video type.
 *
 * @param mimeType - MIME type to check
 * @returns true if the MIME type is an allowed video type
 */
export function isAllowedVideoType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.has(mimeType);
}

/**
 * Checks if a MIME type is an allowed audio type.
 *
 * @param mimeType - MIME type to check
 * @returns true if the MIME type is an allowed audio type
 */
export function isAllowedAudioType(mimeType: string): boolean {
  return ALLOWED_AUDIO_TYPES.has(mimeType);
}

/**
 * Checks if a file path has an allowed image extension.
 *
 * @param filePath - Path or filename
 * @returns true if the file has an allowed image extension
 */
export function isAllowedImageFile(filePath: string): boolean {
  const mimeType = getFileMimeType(filePath);
  return isAllowedImageType(mimeType);
}

// ============================================================================
// File Size Validation
// ============================================================================

/**
 * Validates that a file does not exceed the maximum size.
 *
 * @param filePath - Path to the file
 * @param maxSizeMB - Optional maximum size in MB (defaults to config value)
 * @throws FileTooLargeError if file exceeds size limit
 * @throws FileError if file cannot be accessed
 */
export async function validateFileSize(
  filePath: string,
  maxSizeMB?: number,
): Promise<void> {
  const maxSizeBytes = maxSizeMB === undefined
    ? getMaxFileSizeBytes()
    : maxSizeMB * 1024 * 1024;

  try {
    // Path should be validated before calling this function
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stats = await stat(filePath);

    if (stats.size > maxSizeBytes) {
      throw new FileTooLargeError(
        `File exceeds maximum size of ${String(maxSizeMB ?? config.MAX_FILE_SIZE_MB)}MB`,
        {
          filePath,
          sizeBytes: stats.size,
          maxSizeBytes,
        },
      );
    }
  } catch (error) {
    if (error instanceof FileTooLargeError) {
      throw error;
    }
    throw new FileError(`Failed to check file size: ${filePath}`, {
      filePath,
      reason: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
    });
  }
}

/**
 * Gets the size of a file in bytes.
 *
 * @param filePath - Path to the file
 * @returns File size in bytes
 * @throws FileError if file cannot be accessed
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    // Path should be validated before calling this function
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stats = await stat(filePath);
    return stats.size;
  } catch (error) {
    throw new FileError(`Failed to get file size: ${filePath}`, {
      filePath,
      reason: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
    });
  }
}

// ============================================================================
// File Existence
// ============================================================================

/**
 * Checks if a file exists and is readable.
 *
 * @param filePath - Path to check
 * @returns true if file exists and is readable
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a path is a file (not a directory).
 *
 * @param filePath - Path to check
 * @returns true if the path is a file
 */
export async function isFile(filePath: string): Promise<boolean> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Checks if a path is a directory.
 *
 * @param filePath - Path to check
 * @returns true if the path is a directory
 */
export async function isDirectory(filePath: string): Promise<boolean> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const stats = await stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates a file path and returns the resolved path.
 *
 * This is a convenience wrapper around resolveAndValidatePath.
 *
 * @param filePath - Path to validate
 * @returns Resolved absolute path
 * @throws PathTraversalError if path is not safe
 * @throws FileError if file doesn't exist
 */
export async function validateFilePath(filePath: string): Promise<string> {
  return resolveAndValidatePath(filePath);
}

/**
 * Validates that a file extension is in the allowed list.
 *
 * @param extension - File extension (with or without leading dot)
 * @param allowedExtensions - Array of allowed extensions (with leading dot)
 * @throws FileError if extension is not allowed
 */
export function validateFileType(
  extension: string,
  allowedExtensions: readonly string[],
): void {
  const normalizedExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

  if (!allowedExtensions.includes(normalizedExt)) {
    throw new FileError(`File type not allowed: ${normalizedExt}`, {
      reason: `Allowed types: ${allowedExtensions.join(', ')}`,
    });
  }
}
