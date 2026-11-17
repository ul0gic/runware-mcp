// Does:  Transcribes a video by submitting a caption task and polling for the transcript.
// Holds: The transcript comes only from the polled result; a result without text is an error result.

import { type RunwareClient, createTaskRequest, getDefaultClient } from '../../integrations/runware/client.js';
import { pollForResult } from '../../integrations/runware/polling.js';
import { GenerationFailedError, wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import { type ToolContext, type ToolResult, errorResult, successResult } from '../../shared/types.js';

import type { TranscriptionInput, TranscriptionOutput } from './schema.js';

interface TranscriptionApiResponse {
  readonly taskType: 'caption';
  readonly taskUUID: string;
  readonly status?: 'processing' | 'success' | 'error';
  readonly text?: string;
  readonly structuredData?: Record<string, unknown>;
  readonly cost?: number;
}

// Why: Memories:1@1 reads its source from inputs.video, not the inputs.image used by image caption models.
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

function processResponse(
  response: TranscriptionApiResponse,
  pollingAttempts: number,
  elapsedMs: number,
): TranscriptionOutput {
  if (response.text === undefined) {
    throw new GenerationFailedError('Transcription result did not include text', {
      taskType: response.taskType,
      taskUUID: response.taskUUID,
    });
  }
  return {
    text: response.text,
    ...(response.structuredData !== undefined && { structuredData: response.structuredData }),
    ...(response.cost !== undefined && { cost: response.cost }),
    pollingAttempts,
    elapsedMs,
  };
}

export async function transcription(
  input: TranscriptionInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('caption', requestParams);

    // Why: The submit response is only an acknowledgment; the text arrives through polling.
    await runwareClient.requestSingle<TranscriptionApiResponse>(task, { signal: context?.signal });

    context?.progress?.report({
      progress: 0,
      total: 100,
      message: 'Transcription task submitted, polling for result...',
    });

    const pollResult = await pollForResult<TranscriptionApiResponse>(task.taskUUID, {
      client: runwareClient,
      signal: context?.signal,
      progress: context?.progress,
    });

    const output = processResponse(pollResult.result, pollResult.attempts, pollResult.elapsedMs);

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

export const transcriptionToolDefinition = {
  name: 'transcription',
  description: 'Transcribe video content to text. Supports multiple languages with auto-detection.',
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
