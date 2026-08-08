// Every fs call here takes a non-literal path by design; paths pass through resolveAndValidatePath() (traversal + allowed-root + symlink checks) first.

import { readFile, lstat, realpath, stat, access, constants } from 'node:fs/promises';
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

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
]);

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
]);

/** Falls back to common home-directory media folders when ALLOWED_FILE_ROOTS is unset. */
function getDefaultAllowedRoots(): readonly string[] {
  if (config.ALLOWED_FILE_ROOTS.length > 0) {
    return config.ALLOWED_FILE_ROOTS;
  }

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

/** Purely lexical check — does not resolve symlinks; use resolveAndValidatePath before touching the filesystem. */
export function isPathSafe(filePath: string, allowedRoots?: readonly string[]): boolean {
  try {
    const roots = allowedRoots ?? getDefaultAllowedRoots();

    if (!path.isAbsolute(filePath)) {
      return false;
    }

    const normalizedPath = path.normalize(filePath);

    if (normalizedPath.includes('..')) {
      return false;
    }

    // Trailing separator prevents a sibling directory sharing the root's prefix from passing
    const isUnderAllowedRoot = roots.some((root) => {
      const normalizedRoot = path.normalize(root);
      const rootWithSep = normalizedRoot.endsWith(path.sep) ? normalizedRoot : normalizedRoot + path.sep;
      return normalizedPath === normalizedRoot || normalizedPath.startsWith(rootWithSep);
    });

    return isUnderAllowedRoot;
  } catch {
    return false;
  }
}

/** Resolves symlinks and re-checks the real target against the allowed roots, so a symlink cannot escape them. */
export async function resolveAndValidatePath(
  filePath: string,
  allowedRoots?: readonly string[],
): Promise<string> {
  const roots = allowedRoots ?? getDefaultAllowedRoots();

  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  const normalizedPath = path.normalize(absolutePath);

  if (normalizedPath.includes('..')) {
    throw new PathTraversalError('Path contains traversal sequences', {
      requestedPath: filePath,
      resolvedPath: normalizedPath,
    });
  }

  // Trailing separator prevents a sibling directory sharing the root's prefix from passing
  const isUnderAllowedRoot = roots.some((root) => {
    const normalizedRoot = path.normalize(root);
    const rootWithSep = normalizedRoot.endsWith(path.sep) ? normalizedRoot : normalizedRoot + path.sep;
    return normalizedPath === normalizedRoot || normalizedPath.startsWith(rootWithSep);
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

  try {
    await access(absolutePath, constants.R_OK);
  } catch {
    throw new FileError(`File not found or not readable: ${filePath}`, {
      filePath,
      reason: 'File not found or not readable',
    });
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated above
  const stats = await lstat(absolutePath);

  if (stats.isSymbolicLink()) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated above; real target re-checked below
    const realPath = await realpath(absolutePath);
    const normalizedRealPath = path.normalize(realPath);

    // Trailing separator prevents a sibling directory sharing the root's prefix from passing
    const realPathSafe = roots.some((root) => {
      const normalizedRoot = path.normalize(root);
      const rootWithSep = normalizedRoot.endsWith(path.sep) ? normalizedRoot : normalizedRoot + path.sep;
      return normalizedRealPath === normalizedRoot || normalizedRealPath.startsWith(rootWithSep);
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

export async function readFileAsBase64(
  filePath: string,
  allowedRoots?: readonly string[],
): Promise<string> {
  const resolvedPath = await resolveAndValidatePath(filePath, allowedRoots);

  await validateFileSize(resolvedPath);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated above
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

export async function readFileAsDataUri(
  filePath: string,
  allowedRoots?: readonly string[],
): Promise<string> {
  const base64 = await readFileAsBase64(filePath, allowedRoots);
  const mimeType = getFileMimeType(filePath);

  return `data:${mimeType};base64,${base64}`;
}

/** Extension-based only — never inspects file contents. */
export function getFileMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_MIME.get(ext) ?? MIME_OCTET_STREAM;
}

export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mimeType);
}

export function isAllowedVideoType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.has(mimeType);
}

export function isAllowedAudioType(mimeType: string): boolean {
  return ALLOWED_AUDIO_TYPES.has(mimeType);
}

export function isAllowedImageFile(filePath: string): boolean {
  const mimeType = getFileMimeType(filePath);
  return isAllowedImageType(mimeType);
}

/** Caller must pass a path already through resolveAndValidatePath. */
export async function validateFileSize(
  filePath: string,
  maxSizeMB?: number,
): Promise<void> {
  const maxSizeBytes = maxSizeMB === undefined
    ? getMaxFileSizeBytes()
    : maxSizeMB * 1024 * 1024;

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- caller validates the path
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

/** Caller must pass a path already through resolveAndValidatePath. */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- caller validates the path
    const stats = await stat(filePath);
    return stats.size;
  } catch (error) {
    throw new FileError(`Failed to get file size: ${filePath}`, {
      filePath,
      reason: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
    });
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function isFile(filePath: string): Promise<boolean> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- caller validates the path
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

export async function isDirectory(filePath: string): Promise<boolean> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- caller validates the path
    const stats = await stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function validateFilePath(filePath: string): Promise<string> {
  return resolveAndValidatePath(filePath);
}

/** Accepts the extension with or without a leading dot; allowedExtensions must include the dot. */
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
