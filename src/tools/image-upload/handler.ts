import { readFile } from 'node:fs/promises';

import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import { validateFilePath, validateFileType } from '../../shared/file-utils.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, successResult, errorResult } from '../../shared/types.js';

import type { imageUploadInputSchema, ImageUploadOutput } from './schema.js';
import type { z } from 'zod';

type ImageUploadInput = z.infer<typeof imageUploadInputSchema>;

interface ImageUploadApiResponse {
  readonly taskType: 'imageUpload';
  readonly taskUUID: string;
  readonly imageUUID: string;
}

const MIME_JPEG = 'image/jpeg';

const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp', '.bmp', '.gif'] as const;

const EXTENSION_TO_MIME: Readonly<Record<string, string>> = {
  jpeg: MIME_JPEG,
  jpg: MIME_JPEG,
  png: 'image/png',
  webp: 'image/webp',
  bmp: 'image/bmp',
  gif: 'image/gif',
};

function getMimeType(extension: string): string {
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;
  return EXTENSION_TO_MIME[ext.toLowerCase()] ?? MIME_JPEG;
}

async function resolveImageSource(input: ImageUploadInput): Promise<string> {
  if (input.filePath !== undefined) {
    const validatedPath = await validateFilePath(input.filePath);

    const extension = validatedPath.toLowerCase().slice(validatedPath.lastIndexOf('.'));
    validateFileType(extension, ALLOWED_EXTENSIONS);

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated above
    const fileBuffer = await readFile(validatedPath);
    const base64Data = fileBuffer.toString('base64');

    const mimeType = getMimeType(extension);

    return `data:${mimeType};base64,${base64Data}`;
  }

  if (input.base64 !== undefined) {
    // Assume JPEG if no prefix
    return `data:${MIME_JPEG};base64,${input.base64}`;
  }

  if (input.url !== undefined) {
    return input.url;
  }

  if (input.dataUri !== undefined) {
    return input.dataUri;
  }

  if (input.image !== undefined) {
    return input.image;
  }

  throw new Error('No image source provided');
}

function processResponse(response: ImageUploadApiResponse): ImageUploadOutput {
  return {
    imageUUID: response.imageUUID,
  };
}

export async function imageUpload(
  input: ImageUploadInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const image = await resolveImageSource(input);

    const task = createTaskRequest('imageUpload', { image });

    const response = await runwareClient.requestSingle<ImageUploadApiResponse>(
      task,
      { signal: context?.signal },
    );

    const output = processResponse(response);

    return successResult(
      `Image uploaded successfully. UUID: ${output.imageUUID}`,
      output,
    );
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const imageUploadToolDefinition = {
  name: 'imageUpload',
  description: 'Upload an image to Runware for use in subsequent operations. Returns a UUID for reference.',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Local file path to the image (absolute path)',
      },
      base64: {
        type: 'string',
        description: 'Base64-encoded image data',
      },
      url: {
        type: 'string',
        description: 'URL to the image',
      },
      dataUri: {
        type: 'string',
        description: 'Data URI with base64 image',
      },
      image: {
        type: 'string',
        description: 'Generic image input (UUID, URL, base64, or data URI)',
      },
    },
    required: [],
  },
} as const;
