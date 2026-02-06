/**
 * Handler for the audio inference tool.
 *
 * Implements audio generation using the Runware API.
 * Audio generation can be async for longer durations or complex compositions.
 */

import { isValidAudioModel, isValidTTSVoice } from '../../constants/audio-models.js';
import {
  type RunwareClient,
  createTaskRequest,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { pollForResult } from '../../integrations/runware/polling.js';
import { RunwareApiError, wrapError } from '../../shared/errors.js';
import { defaultRateLimiter } from '../../shared/rate-limiter.js';
import {
  type TaskUUID,
  type ToolContext,
  type ToolResult,
  errorResult,
  successResult,
} from '../../shared/types.js';

import type { AudioInferenceInput, AudioInferenceOutput } from './schema.js';

// ============================================================================
// Types
// ============================================================================

interface AudioResultItem {
  readonly audioUUID: string;
  readonly audioURL?: string;
  readonly audioBase64Data?: string;
  readonly audioDataURI?: string;
}

interface AudioInferenceApiResponse {
  readonly taskType: 'audioInference';
  readonly taskUUID: string;
  readonly status?: 'processing' | 'success' | 'error';
  readonly audioUUID?: string;
  readonly audioURL?: string;
  readonly audioBase64Data?: string;
  readonly audioDataURI?: string;
  readonly cost?: number;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates the audio model against known models.
 */
function validateModel(model: string): void {
  if (!isValidAudioModel(model)) {
    throw new RunwareApiError(
      `Invalid audio model: ${model}. Use a valid AIR format like 'elevenlabs:1@1' or 'mirelo:1@1'.`,
      { apiCode: 'INVALID_MODEL' },
    );
  }
}

/**
 * Validates voice if provided for speech generation.
 */
function validateVoice(voice: string | undefined, audioType: string | undefined): void {
  if (voice !== undefined && !isValidTTSVoice(voice)) {
    throw new RunwareApiError(
      `Invalid TTS voice: ${voice}. Use a valid voice name like 'alloy', 'echo', 'nova', etc.`,
      { apiCode: 'INVALID_VOICE' },
    );
  }

  // Warn if voice is provided but not for speech
  if (voice !== undefined && audioType !== undefined && audioType !== 'speech') {
    // Voice is only used for speech type, but we don't error - just ignore it
  }
}

// ============================================================================
// Request Building
// ============================================================================

/**
 * Builds the API request from validated input.
 */
function buildApiRequest(input: AudioInferenceInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    positivePrompt: input.positivePrompt,
    model: input.model,
    duration: input.duration,
    deliveryMethod: 'async', // Audio often requires async processing
    includeCost: input.includeCost,
  };

  // Optional parameters
  // NOTE: audioType is intentionally NOT sent to the API — Runware rejects it
  // as an unsupported parameter. It remains in the schema for informational use only.
  if (input.voice !== undefined) {
    request.voice = input.voice;
  }
  // numberResults has a default, so always set it
  request.numberResults = input.numberResults;

  if (input.outputType !== undefined) {
    request.outputType = input.outputType;
  }
  if (input.outputFormat !== undefined) {
    request.outputFormat = input.outputFormat;
  }

  // Audio settings
  if (input.audioSettings !== undefined) {
    if (input.audioSettings.sampleRate !== undefined) {
      request.sampleRate = input.audioSettings.sampleRate;
    }
    if (input.audioSettings.bitrate !== undefined) {
      request.bitrate = input.audioSettings.bitrate;
    }
  }

  // ElevenLabs-specific settings
  if (input.elevenlabs?.compositionPlan !== undefined) {
    request.compositionPlan = input.elevenlabs.compositionPlan;
  }

  // Mirelo-specific settings
  if (input.mirelo?.startOffset !== undefined) {
    request.startOffset = input.mirelo.startOffset;
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
  response: AudioInferenceApiResponse,
  pollingAttempts: number,
  elapsedMs: number,
): AudioInferenceOutput {
  const audioUUID = response.audioUUID ?? response.taskUUID;
  const result: AudioResultItem = {
    audioUUID,
    ...(response.audioURL !== undefined && { audioURL: response.audioURL }),
    ...(response.audioBase64Data !== undefined && { audioBase64Data: response.audioBase64Data }),
    ...(response.audioDataURI !== undefined && { audioDataURI: response.audioDataURI }),
  };

  return {
    results: [result],
    ...(response.cost !== undefined && { cost: response.cost }),
    pollingAttempts,
    elapsedMs,
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Generates audio using the Runware API.
 *
 * Audio generation is typically asynchronous. This handler:
 * 1. Validates the model and voice (if provided)
 * 2. Submits the request with deliveryMethod: 'async'
 * 3. Polls for the result using the polling module
 * 4. Reports progress via the context
 * 5. Supports cancellation via the context signal
 *
 * @param input - Validated input parameters
 * @param client - Optional Runware client
 * @param context - Optional tool context for progress and cancellation
 * @returns Tool result with generated audio
 */
export async function audioInference(
  input: AudioInferenceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    // Validate model and voice
    validateModel(input.model);
    validateVoice(input.voice, input.audioType);

    // Rate limit check
    await defaultRateLimiter.waitForToken(context?.signal);

    // Build request
    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('audioInference', requestParams);

    // Submit the task — use request() instead of requestSingle() because
    // async tasks may return { data: [] } on submission, which requestSingle() rejects.
    await runwareClient.request<AudioInferenceApiResponse>([task], {
      signal: context?.signal,
    });

    // Report progress: task submitted
    context?.progress?.report({
      progress: 0,
      total: 100,
      message: 'Audio generation task submitted, polling for result...',
    });

    // Poll for result
    const pollResult = await pollForResult<AudioInferenceApiResponse>(task.taskUUID as TaskUUID, {
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
      message: 'Audio generation complete',
    });

    const elapsedSeconds = Math.round((output.elapsedMs ?? 0) / 1000);
    return successResult(
      `Audio generated successfully in ${String(elapsedSeconds)}s (${String(output.pollingAttempts)} poll attempts)`,
      output,
      output.cost,
    );
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

/**
 * MCP tool definition for audio inference.
 */
export const audioInferenceToolDefinition = {
  name: 'audioInference',
  description:
    'Generate music, sound effects, speech, or ambient audio from text prompts using AI models.\n\n' +
    'Capabilities: music composition, sound effects, text-to-speech (with voice selection), ambient audio. Providers: ElevenLabs (composition plans), Mirelo (audio generation)\n\n' +
    'Docs: runware://docs/tools/audio-inference',
  inputSchema: {
    type: 'object',
    properties: {
      positivePrompt: {
        type: 'string',
        description: 'Text description of the desired audio',
      },
      model: {
        type: 'string',
        description: 'Audio model identifier (e.g., "elevenlabs:1@1", "mirelo:1@1")',
      },
      duration: {
        type: 'number',
        description: 'Audio duration in seconds (10-300)',
        default: 30,
      },
      audioType: {
        type: 'string',
        enum: ['music', 'sfx', 'speech', 'ambient'],
        description: 'Type of audio to generate',
      },
      voice: {
        type: 'string',
        description: 'TTS voice name for speech generation',
      },
      numberResults: {
        type: 'number',
        description: 'Number of audio variations (1-3)',
        default: 1,
      },
      outputType: {
        type: 'string',
        enum: ['URL', 'base64Data', 'dataURI'],
        description: 'How to return the audio',
      },
      outputFormat: {
        type: 'string',
        enum: ['MP3', 'WAV', 'OGG'],
        description: 'Audio format',
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information',
        default: true,
      },
    },
    required: ['positivePrompt', 'model'],
  },
} as const;
