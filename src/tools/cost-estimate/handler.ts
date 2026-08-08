import { getVideoModel } from '../../constants/video-models.js';
import { type ToolResult, successResult } from '../../shared/types.js';

import type { costEstimateInputSchema, CostEstimateOutput } from './schema.js';
import type { z } from 'zod';

type CostEstimateInput = z.infer<typeof costEstimateInputSchema>;

const IMAGE_INFERENCE_BASE_COST_PER_MP = 0.002;

/** USD per image. */
const PHOTO_MAKER_BASE_COST = 0.004;

/** USD per image. */
const UPSCALE_BASE_COST = 0.002;

/** USD per image. */
const REMOVE_BACKGROUND_BASE_COST = 0.001;

/** USD per image. */
const CAPTION_BASE_COST = 0.0005;

/** USD per image. */
const MASKING_BASE_COST = 0.0013;

/** Fallback when the model has no known per-second price. */
const DEFAULT_VIDEO_COST_PER_SECOND = 0.05;

const AUDIO_COST_PER_SECOND = 0.001;

const DEFAULT_DIMENSION = 1024;

const DEFAULT_VIDEO_DURATION = 5;

const DEFAULT_AUDIO_DURATION = 30;

function estimateImageInference(input: CostEstimateInput): CostEstimateOutput {
  const width = input.width ?? DEFAULT_DIMENSION;
  const height = input.height ?? DEFAULT_DIMENSION;
  const megapixels = (width * height) / 1_000_000;
  const numberResults = input.numberResults;

  const stepsMultiplier = input.steps === undefined ? 1 : input.steps / 20;

  const costPerUnit = IMAGE_INFERENCE_BASE_COST_PER_MP * megapixels * stepsMultiplier;
  const totalCost = costPerUnit * numberResults;

  return {
    taskType: 'imageInference',
    costPerUnit,
    units: numberResults,
    unitDescription: 'image',
    totalCost,
    pricingBasis: `${String(width)}x${String(height)} (${megapixels.toFixed(2)} MP)`,
    isEstimate: true,
    notes: 'Cost varies by model and provider. This is a rough estimate.',
  };
}

function estimatePhotoMaker(input: CostEstimateInput): CostEstimateOutput {
  const numberResults = input.numberResults;
  const costPerUnit = PHOTO_MAKER_BASE_COST;
  const totalCost = costPerUnit * numberResults;

  return {
    taskType: 'photoMaker',
    costPerUnit,
    units: numberResults,
    unitDescription: 'image',
    totalCost,
    pricingBasis: 'PhotoMaker standard rate',
    isEstimate: true,
  };
}

function estimateUpscale(input: CostEstimateInput): CostEstimateOutput {
  const numberResults = input.numberResults;
  const costPerUnit = UPSCALE_BASE_COST;
  const totalCost = costPerUnit * numberResults;

  return {
    taskType: 'upscale',
    costPerUnit,
    units: numberResults,
    unitDescription: 'image',
    totalCost,
    pricingBasis: 'Upscale standard rate',
    isEstimate: true,
  };
}

function estimateRemoveBackground(input: CostEstimateInput): CostEstimateOutput {
  const numberResults = input.numberResults;
  const costPerUnit = REMOVE_BACKGROUND_BASE_COST;
  const totalCost = costPerUnit * numberResults;

  return {
    taskType: 'removeBackground',
    costPerUnit,
    units: numberResults,
    unitDescription: 'image',
    totalCost,
    pricingBasis: 'Background removal standard rate',
    isEstimate: true,
  };
}

function estimateCaption(input: CostEstimateInput): CostEstimateOutput {
  const numberResults = input.numberResults;
  const costPerUnit = CAPTION_BASE_COST;
  const totalCost = costPerUnit * numberResults;

  return {
    taskType: 'caption',
    costPerUnit,
    units: numberResults,
    unitDescription: 'image',
    totalCost,
    pricingBasis: 'Caption standard rate',
    isEstimate: true,
  };
}

function estimateMasking(input: CostEstimateInput): CostEstimateOutput {
  const numberResults = input.numberResults;
  const costPerUnit = MASKING_BASE_COST;
  const totalCost = costPerUnit * numberResults;

  return {
    taskType: 'imageMasking',
    costPerUnit,
    units: numberResults,
    unitDescription: 'image',
    totalCost,
    pricingBasis: 'Masking standard rate',
    isEstimate: true,
  };
}

function estimateVideoInference(input: CostEstimateInput): CostEstimateOutput {
  const duration = input.duration ?? DEFAULT_VIDEO_DURATION;

  let costPerSecond = DEFAULT_VIDEO_COST_PER_SECOND;
  let pricingBasis = 'Default video rate';

  if (input.model !== undefined) {
    const model = getVideoModel(input.model);
    if (model?.costPerSecond !== undefined) {
      costPerSecond = model.costPerSecond;
      pricingBasis = `${model.name} pricing`;
    }
  }

  const totalCost = costPerSecond * duration;

  return {
    taskType: 'videoInference',
    costPerUnit: costPerSecond,
    units: duration,
    unitDescription: 'second',
    totalCost,
    pricingBasis,
    isEstimate: true,
    notes: 'Video costs vary significantly by provider and model.',
  };
}

function estimateAudioInference(input: CostEstimateInput): CostEstimateOutput {
  const duration = input.duration ?? DEFAULT_AUDIO_DURATION;
  const costPerUnit = AUDIO_COST_PER_SECOND;
  const totalCost = costPerUnit * duration;

  return {
    taskType: 'audioInference',
    costPerUnit,
    units: duration,
    unitDescription: 'second',
    totalCost,
    pricingBasis: 'Audio standard rate',
    isEstimate: true,
  };
}

const estimationFunctions: Record<CostEstimateInput['taskType'], (input: CostEstimateInput) => CostEstimateOutput> = {
  imageInference: estimateImageInference,
  photoMaker: estimatePhotoMaker,
  upscale: estimateUpscale,
  removeBackground: estimateRemoveBackground,
  caption: estimateCaption,
  imageMasking: estimateMasking,
  videoInference: estimateVideoInference,
  audioInference: estimateAudioInference,
};

/** Pure local computation from bundled pricing tables — makes no API call. */
export function costEstimate(
  input: CostEstimateInput,
): ToolResult {
  const estimator = estimationFunctions[input.taskType];
  const output = estimator(input);

  const formattedCost = output.totalCost.toFixed(4);
  const message = `Estimated cost for ${input.taskType}: $${formattedCost} USD`;

  return successResult(message, output);
}

export const costEstimateToolDefinition = {
  name: 'costEstimate',
  description: 'Estimate the cost of an operation before executing it. Provides rough estimates based on known pricing.',
  inputSchema: {
    type: 'object',
    properties: {
      taskType: {
        type: 'string',
        enum: ['imageInference', 'photoMaker', 'upscale', 'removeBackground', 'caption', 'imageMasking', 'videoInference', 'audioInference'],
        description: 'Type of task to estimate',
      },
      model: {
        type: 'string',
        description: 'Model identifier (affects pricing for some tasks)',
      },
      width: {
        type: 'number',
        description: 'Image width (for image tasks)',
      },
      height: {
        type: 'number',
        description: 'Image height (for image tasks)',
      },
      duration: {
        type: 'number',
        description: 'Duration in seconds (for video/audio tasks)',
      },
      numberResults: {
        type: 'number',
        description: 'Number of results to generate',
        default: 1,
      },
      steps: {
        type: 'number',
        description: 'Number of steps (affects some image tasks)',
      },
    },
    required: ['taskType'],
  },
} as const;
