/**
 * Handler for the transcription tool.
 *
 * Implements video transcription using the Runware caption API
 * with the memories:1@1 model. The API is async — submit with
 * `inputs: { video: "..." }` then poll with `getResponse`.
 */

import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { pollForResult } from '../../integrations/runware/polling.js';
import { wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import {
  type TaskUUID,
  type ToolContext,
  type ToolResult,
  errorResult,
  successResult,
} from '../../shared/types.js';

import type { TranscriptionInput, TranscriptionOutput } from './schema.js';

// ============================================================================
// Types
// ============================================================================

interface TranscriptionApiResponse {
  readonly taskType: 'caption';
  readonly taskUUID: string;
  readonly status?: 'processing' | 'success' | 'error';
  readonly text?: string;
  readonly structuredData?: Record<string, unknown>;
  readonly cost?: number;
}

// ============================================================================
// Request Building
// ============================================================================

/**
 * Builds the API request from validated input.
 *
 * The memories:1@1 model uses `inputs: { video: "..." }` format
 * for the video source. The API is async and requires polling.
 */
function buildApiRequest(input: TranscriptionInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    inputs: { video: input.inputMedia },
    model: input.model,
    includeCost: input.includeCost,
  };

  if (input.language !== undefined) {
    request.prompt = `Transcribe the video content. Language: ${input.language}`;
  }

  return request;
}

// ============================================================================
// Response Processing
// ============================================================================

/**
 * Processes API response into the output format.
 */
function processResponse(
  response: TranscriptionApiResponse,
  pollingAttempts: number,
  elapsedMs: number,
): TranscriptionOutput {
  return {
    text: response.text ?? '',
    ...(response.structuredData !== undefined && { structuredData: response.structuredData }),
    ...(response.cost !== undefined && { cost: response.cost }),
    pollingAttempts,
    elapsedMs,
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Transcribes video using the Runware caption API.
 *
 * Uses the caption taskType with the memories:1@1 model
 * to convert speech in video content to text. The API is async:
 * 1. Submit the task with `inputs: { video: "..." }`
 * 2. Poll with `getResponse` until `status: "success"`
 * 3. The poll result contains the transcribed `text`
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client
 * @param context - Optional tool context for cancellation and progress
 * @returns Tool result with transcribed text
 */
export async function transcription(
  input: TranscriptionInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    // Rate limit check
    await defaultRateLimiter.waitForToken(context?.signal);

    // Build request — uses inputs: { video: "..." } for the caption API
    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('caption', requestParams);

    // Submit the task — the API is async for memories:1@1, the initial
    // response is just an acknowledgment with taskType and taskUUID.
    await runwareClient.requestSingle<TranscriptionApiResponse>(
      task,
      { signal: context?.signal },
    );

    // Report progress: task submitted
    context?.progress?.report({
      progress: 0,
      total: 100,
      message: 'Transcription task submitted, polling for result...',
    });

    // Poll for result — the actual text comes from the poll response
    const pollResult = await pollForResult<TranscriptionApiResponse>(task.taskUUID as TaskUUID, {
      client: runwareClient,
      signal: context?.signal,
      progress: context?.progress,
    });

    // Process response
    const output = processResponse(pollResult.result, pollResult.attempts, pollResult.elapsedMs);

    // Report progress: complete
    context?.progress?.report({
      progress: 100,
      total: 100,
      message: 'Transcription complete',
    });

    const elapsedSeconds = Math.round((output.elapsedMs ?? 0) / 1000);
    return successResult(
      `Video transcribed successfully in ${String(elapsedSeconds)}s (${String(output.pollingAttempts)} poll attempts)`,
      output,
      output.cost,
    );
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

/**
 * MCP tool definition for transcription.
 */
export const transcriptionToolDefinition = {
  name: 'transcription',
  description:
    'Transcribe video content to text. Supports multiple languages with auto-detection.',
  inputSchema: {
    type: 'object',
    properties: {
      inputMedia: {
        type: 'string',
        description: 'Video file to transcribe (UUID or URL). Supported formats: MP4, M4V, QuickTime.',
      },
      model: {
        type: 'string',
        description: 'Transcription model',
        default: 'memories:1@1',
      },
      language: {
        type: 'string',
        description: 'Language code (ISO 639-1, e.g., "en", "es")',
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information',
        default: true,
      },
    },
    required: ['inputMedia'],
  },
} as const;
