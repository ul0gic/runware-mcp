// Does:  Records a successful tool call's media and cost into the session stores the resource providers serve.
// Holds: Input and data are re-parsed here; an unmapped tool or unknown shape records nothing rather than throwing.

import { z } from 'zod';

import { registerAudio } from '../resources/generated-audio/provider.js';
import { registerImage } from '../resources/generated-images/provider.js';
import { registerVideo } from '../resources/generated-videos/provider.js';
import { recordSessionEvent } from '../resources/session-history/provider.js';

const DEFAULT_IMAGE_SIZE = 1024;

const optionalCost = z.number().optional();

const generationInputSchema = z.object({
  positivePrompt: z.string().optional(),
  model: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  audioType: z.enum(['music', 'sfx', 'speech', 'ambient']).optional(),
  voice: z.string().optional(),
});

type GenerationInput = z.infer<typeof generationInputSchema>;

const imageItemSchema = z.object({ imageUUID: z.string(), imageURL: z.string().optional() });

const imageListDataSchema = z.object({ images: z.array(imageItemSchema), cost: optionalCost });

const batchDataSchema = z.object({
  results: z.array(
    z.object({
      prompt: z.string(),
      status: z.enum(['success', 'failed']),
      images: z.array(imageItemSchema).optional(),
      cost: optionalCost,
    }),
  ),
});

const styleTransferDataSchema = imageItemSchema.extend({ prompt: z.string(), cost: optionalCost });

const videoDataSchema = z.object({ videoUUID: z.string(), videoURL: z.string().optional(), cost: optionalCost });

const audioDataSchema = z.object({
  results: z.array(z.object({ audioUUID: z.string(), audioURL: z.string().optional() })),
  cost: optionalCost,
});

const singleImageDataSchema = imageItemSchema.extend({ cost: optionalCost });

const maskDataSchema = z.object({ maskImageUUID: z.string(), maskImageURL: z.string().optional(), cost: optionalCost });

const guideDataSchema = z.object({
  guideImageUUID: z.string(),
  guideImageURL: z.string().optional(),
  cost: optionalCost,
});

const threeDDataSchema = z.object({
  taskUUID: z.string(),
  files: z.array(z.object({ uuid: z.string(), url: z.string() })),
});

interface OutputItem {
  readonly id: string;
  readonly url: string | undefined;
}

// Why: Multi-output results report one total, so each output is charged an equal share to keep the sum exact.
function shareOf(total: number | undefined, count: number): { cost?: number } {
  return total === undefined || count === 0 ? {} : { cost: total / count };
}

function registerImages(
  images: readonly z.infer<typeof imageItemSchema>[],
  totalCost: number | undefined,
  prompt: string,
  input: GenerationInput,
): void {
  const createdAt = new Date();
  for (const image of images) {
    registerImage({
      id: image.imageUUID,
      imageUUID: image.imageUUID,
      imageURL: image.imageURL ?? '',
      prompt,
      model: input.model ?? 'unknown',
      width: input.width ?? DEFAULT_IMAGE_SIZE,
      height: input.height ?? DEFAULT_IMAGE_SIZE,
      ...shareOf(totalCost, images.length),
      createdAt,
    });
  }
}

function recordImageList(input: GenerationInput, data: unknown): void {
  const parsed = imageListDataSchema.safeParse(data);
  if (parsed.success) {
    registerImages(parsed.data.images, parsed.data.cost, input.positivePrompt ?? '', input);
  }
}

function recordBatch(input: GenerationInput, data: unknown): void {
  const parsed = batchDataSchema.safeParse(data);
  if (!parsed.success) {
    return;
  }
  for (const result of parsed.data.results) {
    if (result.status === 'success' && result.images !== undefined) {
      registerImages(result.images, result.cost, result.prompt, input);
    }
  }
}

function recordStyleTransfer(input: GenerationInput, data: unknown): void {
  const parsed = styleTransferDataSchema.safeParse(data);
  if (parsed.success) {
    registerImages([parsed.data], parsed.data.cost, parsed.data.prompt, input);
  }
}

function recordVideo(input: GenerationInput, data: unknown): void {
  const parsed = videoDataSchema.safeParse(data);
  if (!parsed.success) {
    return;
  }
  registerVideo({
    id: parsed.data.videoUUID,
    videoUUID: parsed.data.videoUUID,
    videoURL: parsed.data.videoURL ?? '',
    prompt: input.positivePrompt ?? '',
    model: input.model ?? 'unknown',
    duration: input.duration ?? 0,
    width: input.width ?? 0,
    height: input.height ?? 0,
    ...shareOf(parsed.data.cost, 1),
    createdAt: new Date(),
  });
}

function recordAudio(input: GenerationInput, data: unknown): void {
  const parsed = audioDataSchema.safeParse(data);
  if (!parsed.success) {
    return;
  }
  const createdAt = new Date();
  // Why: audioType is optional input and never echoed by the API; a voice implies speech, otherwise music.
  const audioType = input.audioType ?? (input.voice === undefined ? 'music' : 'speech');
  for (const audio of parsed.data.results) {
    registerAudio({
      id: audio.audioUUID,
      audioUUID: audio.audioUUID,
      audioURL: audio.audioURL ?? '',
      prompt: input.positivePrompt ?? '',
      model: input.model ?? 'unknown',
      duration: input.duration ?? 0,
      audioType,
      ...shareOf(parsed.data.cost, parsed.data.results.length),
      createdAt,
    });
  }
}

function extractEventOutput(toolName: string, data: unknown): OutputItem | undefined {
  switch (toolName) {
    case 'imageUpscale':
    case 'imageBackgroundRemoval':
    case 'vectorize': {
      const parsed = singleImageDataSchema.safeParse(data);
      return parsed.success ? { id: parsed.data.imageUUID, url: parsed.data.imageURL } : undefined;
    }
    case 'imageMasking': {
      const parsed = maskDataSchema.safeParse(data);
      return parsed.success ? { id: parsed.data.maskImageUUID, url: parsed.data.maskImageURL } : undefined;
    }
    case 'controlNetPreprocess': {
      const parsed = guideDataSchema.safeParse(data);
      return parsed.success ? { id: parsed.data.guideImageUUID, url: parsed.data.guideImageURL } : undefined;
    }
    case 'threeDInference': {
      const parsed = threeDDataSchema.safeParse(data);
      return parsed.success ? { id: parsed.data.taskUUID, url: parsed.data.files[0]?.url } : undefined;
    }
    default: {
      return undefined;
    }
  }
}

function recordEvent(toolName: string, input: GenerationInput, data: unknown, cost: number | undefined): void {
  const output = extractEventOutput(toolName, data);
  if (output === undefined) {
    return;
  }
  recordSessionEvent({
    id: output.id,
    taskType: toolName,
    ...(input.positivePrompt !== undefined && { prompt: input.positivePrompt }),
    ...(input.model !== undefined && { model: input.model }),
    ...(output.url !== undefined && { outputURL: output.url }),
    ...(cost !== undefined && { cost }),
    createdAt: new Date(),
  });
}

// Holds: Called only for a success result; failed calls must leave the stores untouched.
export function recordGeneration(toolName: string, rawInput: unknown, data: unknown, cost: number | undefined): void {
  const parsedInput = generationInputSchema.safeParse(rawInput);
  const input: GenerationInput = parsedInput.success ? parsedInput.data : {};
  switch (toolName) {
    case 'imageInference':
    case 'photoMaker': {
      recordImageList(input, data);
      return;
    }
    case 'batchImageInference': {
      recordBatch(input, data);
      return;
    }
    case 'styleTransfer': {
      recordStyleTransfer(input, data);
      return;
    }
    case 'videoInference': {
      recordVideo(input, data);
      return;
    }
    case 'audioInference': {
      recordAudio(input, data);
      return;
    }
    default: {
      recordEvent(toolName, input, data, cost);
    }
  }
}
