// Does:  Checks user-supplied paths against the allowed roots and reads the files under them as base64.
// Holds: Reads resolve first: the fully resolved real path must sit inside the real path of an allowed root.

import { readFile, realpath, stat, access, constants } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

import { config, getMaxFileSizeBytes } from './config.js';
import { FileError, FileTooLargeError, PathTraversalError } from './errors.js';

const MIME_JPEG = 'image/jpeg';

const MIME_TIFF = 'image/tiff';

const MIME_OCTET_STREAM = 'application/octet-stream';

const DEFAULT_ERROR_MESSAGE = 'Unknown error';

const EXTENSION_TO_MIME = new Map<string, string>([
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

  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.mov', 'video/quicktime'],
  ['.avi', 'video/x-msvideo'],
  ['.mkv', 'video/x-matroska'],

  ['.mp3', 'audio/mpeg'],
  ['.wav', 'audio/wav'],
  ['.ogg', 'audio/ogg'],
  ['.flac', 'audio/flac'],
  ['.aac', 'audio/aac'],
  ['.m4a', 'audio/mp4'],
]);

function getDefaultAllowedRoots(): readonly string[] {
  if (config.ALLOWED_FILE_ROOTS.length > 0) {
    return config.ALLOWED_FILE_ROOTS;
  }

  const home = homedir();
  // Why: World-writable /tmp lets any local user plant files for the server to read, so it is opt-in only.
  return [`${home}/Pictures`, `${home}/Images`, `${home}/Downloads`, `${home}/Documents`, `${home}/Desktop`];
}

function isWithinRoot(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

// Holds: Lexical only; symlinks are not resolved, so call resolveAndValidatePath before any filesystem access.
export function isPathSafe(filePath: string, allowedRoots?: readonly string[]): boolean {
  if (!path.isAbsolute(filePath)) {
    return false;
  }
  const normalizedPath = path.normalize(filePath);
  const roots = allowedRoots ?? getDefaultAllowedRoots();
  return roots.some((root) => isWithinRoot(normalizedPath, path.normalize(root)));
}

async function realRoots(roots: readonly string[]): Promise<string[]> {
  // Why: A root that does not exist can contain no file, so it is dropped rather than failing the request.
  const resolved = await Promise.all(roots.map((root) => realpath(root).catch(() => '')));
  return resolved.filter((root) => root !== '');
}

async function realPathOf(filePath: string, absolutePath: string): Promise<string> {
  try {
    return await realpath(absolutePath);
  } catch {
    throw new FileError(`File not found or not readable: ${filePath}`, {
      filePath,
      reason: 'File not found or not readable',
    });
  }
}

// Holds: Returns the fully resolved real path, which must sit inside the real path of an allowed root.
export async function resolveAndValidatePath(filePath: string, allowedRoots?: readonly string[]): Promise<string> {
  const roots = allowedRoots ?? getDefaultAllowedRoots();
  const absolutePath = path.resolve(process.cwd(), filePath);
  const resolvedRoots = await realRoots(roots);

  // Why: Checked before touching the path so a request outside every root cannot probe whether a file exists.
  if (!isPathSafe(absolutePath, [...roots, ...resolvedRoots])) {
    throw new PathTraversalError('Path is not under an allowed root directory', {
      requestedPath: filePath,
      resolvedPath: absolutePath,
    });
  }

  const realPath = await realPathOf(filePath, absolutePath);

  if (!resolvedRoots.some((root) => isWithinRoot(realPath, root))) {
    throw new PathTraversalError('Resolved path escapes allowed roots', {
      requestedPath: filePath,
      resolvedPath: realPath,
    });
  }

  try {
    await access(realPath, constants.R_OK);
  } catch {
    throw new FileError(`File not found or not readable: ${filePath}`, {
      filePath,
      reason: 'File not found or not readable',
    });
  }

  return realPath;
}

export async function readFileAsBase64(filePath: string, allowedRoots?: readonly string[]): Promise<string> {
  const resolvedPath = await resolveAndValidatePath(filePath, allowedRoots);

  await validateFileSize(resolvedPath);

  try {
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

// Holds: Decided by extension alone; file contents are never inspected.
export function getFileMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_MIME.get(ext) ?? MIME_OCTET_STREAM;
}

// Holds: Performs no path validation; pass only a path returned by resolveAndValidatePath.
export async function validateFileSize(filePath: string, maxSizeMB?: number): Promise<void> {
  const maxSizeBytes = maxSizeMB === undefined ? getMaxFileSizeBytes() : maxSizeMB * 1024 * 1024;

  try {
    const stats = await stat(filePath);

    if (stats.size > maxSizeBytes) {
      throw new FileTooLargeError(`File exceeds maximum size of ${String(maxSizeMB ?? config.MAX_FILE_SIZE_MB)}MB`, {
        filePath,
        sizeBytes: stats.size,
        maxSizeBytes,
      });
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

export function validateFilePath(filePath: string): Promise<string> {
  return resolveAndValidatePath(filePath);
}

// Holds: extension may omit the leading dot, but every allowedExtensions entry must include it.
export function validateFileType(extension: string, allowedExtensions: readonly string[]): void {
  const normalizedExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;

  if (!allowedExtensions.includes(normalizedExt)) {
    throw new FileError(`File type not allowed: ${normalizedExt}`, {
      reason: `Allowed types: ${allowedExtensions.join(', ')}`,
    });
  }
}
