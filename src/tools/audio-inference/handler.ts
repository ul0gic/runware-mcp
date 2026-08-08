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

function validateModel(model: string): void {
  if (!isValidAudioModel(model)) {
    throw new RunwareApiError(
      `Invalid audio model: ${model}. Use a valid AIR format like 'elevenlabs:1@1' or 'mirelo:1@1'.`,
      { apiCode: 'INVALID_MODEL' },
    );
  }
}

function validateVoice(voice: string | undefined, audioType: string | undefined): void {
  if (voice !== undefined && !isValidTTSVoice(voice)) {
    throw new RunwareApiError(
      `Invalid TTS voice: ${voice}. Use a valid voice name like 'alloy', 'echo', 'nova', etc.`,
      { apiCode: 'INVALID_VOICE' },
    );
  }

  if (voice !== undefined && audioType !== undefined && audioType !== 'speech') {
    // Voice applies only to speech generation; other types ignore it rather than erroring.
  }
}

function buildApiRequest(input: AudioInferenceInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    positivePrompt: input.positivePrompt,
    model: input.model,
    duration: input.duration,
    deliveryMethod: 'async', // Audio often requires async processing
    includeCost: input.includeCost,
  };

  // audioType is never sent: Runware rejects it as an unsupported parameter.
  if (input.voice !== undefined) {
    request.voice = input.voice;
  }
  request.numberResults = input.numberResults;

  if (input.outputType !== undefined) {
    request.outputType = input.outputType;
  }
  if (input.outputFormat !== undefined) {
    request.outputFormat = input.outputFormat;
  }

  if (input.audioSettings !== undefined) {
    if (input.audioSettings.sampleRate !== undefined) {
      request.sampleRate = input.audioSettings.sampleRate;
    }
    if (input.audioSettings.bitrate !== undefined) {
      request.bitrate = input.audioSettings.bitrate;
    }
  }

  if (input.elevenlabs?.compositionPlan !== undefined) {
    request.compositionPlan = input.elevenlabs.compositionPlan;
  }

  if (input.mirelo?.startOffset !== undefined) {
    request.startOffset = input.mirelo.startOffset;
  }

  return request;
}

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

export async function audioInference(
  input: AudioInferenceInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    validateModel(input.model);
    validateVoice(input.voice, input.audioType);

    await defaultRateLimiter.waitForToken(context?.signal);

    const requestParams = buildApiRequest(input);
    const task = createTaskRequest('audioInference', requestParams);

    // request() not requestSingle(): async submission may return { data: [] }, which requestSingle() rejects.
    await runwareClient.request<AudioInferenceApiResponse>([task], {
      signal: context?.signal,
    });

    context?.progress?.report({
      progress: 0,
      total: 100,
      message: 'Audio generation task submitted, polling for result...',
    });

    const pollResult = await pollForResult<AudioInferenceApiResponse>(task.taskUUID as TaskUUID, {
      client: runwareClient,
      signal: context?.signal,
      progress: context?.progress,
    });

    const output = processResponse(pollResult.result, pollResult.attempts, pollResult.elapsedMs);

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
