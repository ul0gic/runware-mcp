/**
 * Handler for the transcription tool.
 *
 * Implements video/audio transcription using the Runware API.
 * May use async processing for longer content.
 */

import { recordAnalytics, saveGeneration } from '../../database/operations.js';
import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { pollForResult } from '../../integrations/runware/polling.js';
import { wrapError } from '../../shared/errors.js';
import { detectProvider } from '../../shared/provider-settings.js';
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

interface TranscriptionSegment {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

interface TranscriptionApiResponse {
  readonly taskType: 'transcription';
  readonly taskUUID: string;
  readonly status?: 'processing' | 'success' | 'error';
  readonly text?: string;
  readonly segments?: readonly TranscriptionSegment[];
  readonly detectedLanguage?: string;
  readonly cost?: number;
}

// ============================================================================
// Request Building
// ============================================================================

/**
 * Builds the API request from validated input.
 */
function buildApiRequest(input: TranscriptionInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    inputMedia: input.inputMedia,
    model: input.model,
    deliveryMethod: 'async', // Transcription may take time
    includeCost: input.includeCost,
  };

  if (input.language !== undefined) {
    request.language = input.language;
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
    ...(response.segments !== undefined && {
      segments: response.segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
      })),
    }),
    ...(response.detectedLanguage !== undefined && { detectedLanguage: response.detectedLanguage }),
    ...(response.cost !== undefined && { cost: response.cost }),
    pollingAttempts,
    elapsedMs,
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Transcribes video or audio using the Runware API.
 *
 * Converts speech in video/audio content to text with optional
 * timestamped segments. Uses async processing for reliability.
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client
 * @param context - Optional tool context for progress and cancellation
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

    // Build request
    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('transcription', requestParams);

    // Submit the task
    await runwareClient.requestSingle<TranscriptionApiResponse>(task, {
      signal: context?.signal,
    });

    // Report progress: task submitted
    context?.progress?.report({
      progress: 0,
      total: 100,
      message: 'Transcription task submitted, polling for result...',
    });

    // Poll for result
    const pollResult = await pollForResult<TranscriptionApiResponse>(task.taskUUID as TaskUUID, {
      client: runwareClient,
      signal: context?.signal,
      progress: context?.progress,
    });

    // Process response
    const output = processResponse(pollResult.result, pollResult.attempts, pollResult.elapsedMs);

    // Save to database if enabled
    const provider = detectProvider(input.model);
    saveGeneration({
      taskType: 'transcription',
      taskUUID: task.taskUUID,
      prompt: `Transcribe media (${input.language ?? 'auto-detect'})`,
      model: input.model,
      provider: provider ?? 'memories',
      status: 'completed',
      outputUrl: null,
      outputUuid: task.taskUUID,
      width: null,
      height: null,
      cost: output.cost ?? null,
      metadata: JSON.stringify({
        language: input.language,
        detectedLanguage: output.detectedLanguage,
        segmentCount: output.segments?.length,
        textLength: output.text.length,
        pollingAttempts: output.pollingAttempts,
        elapsedMs: output.elapsedMs,
      }),
    });

    // Record analytics
    if (output.cost !== undefined) {
      recordAnalytics('transcription', provider ?? 'memories', output.cost);
    }

    // Report progress: complete
    context?.progress?.report({
      progress: 100,
      total: 100,
      message: 'Transcription complete',
    });

    const wordCount = output.text.split(/\s+/).filter((w) => w.length > 0).length;
    const elapsedSeconds = Math.round((output.elapsedMs ?? 0) / 1000);
    return successResult(
      `Transcribed ${String(wordCount)} words in ${String(elapsedSeconds)}s`,
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
    'Transcribe video or audio content to text. Supports multiple languages with auto-detection.',
  inputSchema: {
    type: 'object',
    properties: {
      inputMedia: {
        type: 'string',
        description: 'Video or audio file to transcribe (UUID or URL)',
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
