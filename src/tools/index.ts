// Does:  Registers every tool's schema-bound invoker and MCP definition for the server.
// Holds: Each tool name in toolInvokers matches the name field of its entry in toolDefinitions.

import { accountBalance, accountBalanceToolDefinition, accountBalanceInputSchema } from './account-balance/index.js';
import {
  accountManagement,
  accountManagementToolDefinition,
  accountManagementInputSchema,
} from './account-management/index.js';
import { audioInference, audioInferenceToolDefinition, audioInferenceInputSchema } from './audio-inference/index.js';
import {
  batchImageInference,
  batchImageInferenceToolDefinition,
  batchImageInferenceInputSchema,
} from './batch-image-inference/index.js';
import {
  controlNetPreprocess,
  controlNetPreprocessToolDefinition,
  controlNetPreprocessInputSchema,
} from './controlnet-preprocess/index.js';
import { costEstimate, costEstimateToolDefinition, costEstimateInputSchema } from './cost-estimate/index.js';
import {
  getVideoModelInfo,
  getVideoModelInfoToolDefinition,
  getVideoModelInfoInputSchema,
} from './get-video-model-info/index.js';
import {
  imageBackgroundRemoval,
  imageBackgroundRemovalToolDefinition,
  imageBackgroundRemovalInputSchema,
} from './image-background-removal/index.js';
import { imageCaption, imageCaptionToolDefinition, imageCaptionInputSchema } from './image-caption/index.js';
import { imageInference, imageInferenceToolDefinition, imageInferenceInputSchema } from './image-inference/index.js';
import { imageMasking, imageMaskingToolDefinition, imageMaskingInputSchema } from './image-masking/index.js';
import { imageUpload, imageUploadToolDefinition, imageUploadInputSchema } from './image-upload/index.js';
import { imageUpscale, imageUpscaleToolDefinition, imageUpscaleInputSchema } from './image-upscale/index.js';
import {
  listVideoModels,
  listVideoModelsToolDefinition,
  listVideoModelsInputSchema,
} from './list-video-models/index.js';
import { mediaStorage, mediaStorageInputSchema, mediaStorageToolDefinition } from './media-storage/index.js';
import {
  listCapabilities,
  listCapabilitiesInputSchema,
  listCapabilitiesToolDefinition,
  listModels,
  listModelsInputSchema,
  listModelsToolDefinition,
  modelDetails,
  modelDetailsToolDefinition,
  modelExamples,
  modelExamplesInputSchema,
  modelExamplesToolDefinition,
  modelIdentifierInputSchema,
  modelPricing,
  modelPricingToolDefinition,
  modelSchema,
  modelSchemaInputSchema,
  modelSchemaToolDefinition,
} from './model-catalog/index.js';
import { modelSearch, modelSearchToolDefinition, modelSearchInputSchema } from './model-search/index.js';
import { modelUpload, modelUploadInputSchema, modelUploadToolDefinition } from './model-upload/index.js';
import { photoMaker, photoMakerToolDefinition, photoMakerInputSchema } from './photo-maker/index.js';
import { processFolder, processFolderToolDefinition, processFolderInputSchema } from './process-folder/index.js';
import { promptEnhance, promptEnhanceToolDefinition, promptEnhanceInputSchema } from './prompt-enhance/index.js';
import { runInference, runInferenceInputSchema, runInferenceToolDefinition } from './run-inference/index.js';
import { styleTransfer, styleTransferToolDefinition, styleTransferInputSchema } from './style-transfer/index.js';
import { getTaskDetails, getTaskDetailsInputSchema, getTaskDetailsToolDefinition } from './task-details/index.js';
import { textInference, textInferenceInputSchema, textInferenceToolDefinition } from './text-inference/index.js';
import {
  threeDInference,
  threeDInferenceInputSchema,
  threeDInferenceToolDefinition,
} from './three-d-inference/index.js';
import { training, trainingInputSchema, trainingToolDefinition } from './training/index.js';
import { transcription, transcriptionToolDefinition, transcriptionInputSchema } from './transcription/index.js';
import { vectorize, vectorizeToolDefinition, vectorizeInputSchema } from './vectorize/index.js';
import { videoInference, videoInferenceToolDefinition, videoInferenceInputSchema } from './video-inference/index.js';
import { watchFolder, watchFolderToolDefinition, watchFolderInputSchema } from './watch-folder/index.js';

import type { RunwareClient } from '../integrations/runware/client.js';
import type { ToolContext, ToolResult } from '../shared/types.js';
import type { z } from 'zod';

type ToolInvocation =
  | { readonly valid: false; readonly errors: readonly string[] }
  | {
      readonly valid: true;
      readonly input: unknown;
      readonly run: (client: RunwareClient, context: ToolContext) => Promise<ToolResult>;
    };

type ToolInvoker = (args: Record<string, unknown>) => ToolInvocation;

// Does:  Pairs a tool's schema with its handler so raw MCP args are parsed, Zod defaults applied, before the call.
// Holds: A handler only ever runs with input its own schema produced.
function bindTool<S extends z.ZodType>(
  schema: S,
  handler: (input: z.output<S>, client: RunwareClient, context: ToolContext) => Promise<ToolResult> | ToolResult,
): ToolInvoker {
  return (args) => {
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      return { valid: false, errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
    }
    return {
      valid: true,
      input: parsed.data,
      run: (client, context) => Promise.resolve().then(() => handler(parsed.data, client, context)),
    };
  };
}

export const toolInvokers: Readonly<Record<string, ToolInvoker>> = {
  imageInference: bindTool(imageInferenceInputSchema, imageInference),
  photoMaker: bindTool(photoMakerInputSchema, photoMaker),
  imageUpscale: bindTool(imageUpscaleInputSchema, imageUpscale),
  imageBackgroundRemoval: bindTool(imageBackgroundRemovalInputSchema, imageBackgroundRemoval),
  imageCaption: bindTool(imageCaptionInputSchema, imageCaption),
  imageMasking: bindTool(imageMaskingInputSchema, imageMasking),
  imageUpload: bindTool(imageUploadInputSchema, imageUpload),
  videoInference: bindTool(videoInferenceInputSchema, videoInference),
  listVideoModels: bindTool(listVideoModelsInputSchema, listVideoModels),
  getVideoModelInfo: bindTool(getVideoModelInfoInputSchema, getVideoModelInfo),
  audioInference: bindTool(audioInferenceInputSchema, audioInference),
  transcription: bindTool(transcriptionInputSchema, transcription),
  vectorize: bindTool(vectorizeInputSchema, vectorize),
  promptEnhance: bindTool(promptEnhanceInputSchema, promptEnhance),
  controlNetPreprocess: bindTool(controlNetPreprocessInputSchema, controlNetPreprocess),
  styleTransfer: bindTool(styleTransferInputSchema, styleTransfer),
  modelSearch: bindTool(modelSearchInputSchema, modelSearch),
  costEstimate: bindTool(costEstimateInputSchema, costEstimate),
  accountBalance: bindTool(accountBalanceInputSchema, accountBalance),
  accountManagement: bindTool(accountManagementInputSchema, accountManagement),
  listModels: bindTool(listModelsInputSchema, listModels),
  modelDetails: bindTool(modelIdentifierInputSchema, modelDetails),
  modelExamples: bindTool(modelExamplesInputSchema, modelExamples),
  modelPricing: bindTool(modelIdentifierInputSchema, modelPricing),
  listCapabilities: bindTool(listCapabilitiesInputSchema, listCapabilities),
  modelSchema: bindTool(modelSchemaInputSchema, modelSchema),
  runInference: bindTool(runInferenceInputSchema, runInference),
  getTaskDetails: bindTool(getTaskDetailsInputSchema, getTaskDetails),
  mediaStorage: bindTool(mediaStorageInputSchema, mediaStorage),
  modelUpload: bindTool(modelUploadInputSchema, modelUpload),
  training: bindTool(trainingInputSchema, training),
  textInference: bindTool(textInferenceInputSchema, textInference),
  threeDInference: bindTool(threeDInferenceInputSchema, threeDInference),
  processFolder: bindTool(processFolderInputSchema, processFolder),
  batchImageInference: bindTool(batchImageInferenceInputSchema, batchImageInference),
  watchFolder: bindTool(watchFolderInputSchema, watchFolder),
};

export const toolDefinitions = [
  imageInferenceToolDefinition,
  photoMakerToolDefinition,
  imageUpscaleToolDefinition,
  imageBackgroundRemovalToolDefinition,
  imageCaptionToolDefinition,
  imageMaskingToolDefinition,
  imageUploadToolDefinition,
  videoInferenceToolDefinition,
  listVideoModelsToolDefinition,
  getVideoModelInfoToolDefinition,
  audioInferenceToolDefinition,
  transcriptionToolDefinition,
  vectorizeToolDefinition,
  promptEnhanceToolDefinition,
  controlNetPreprocessToolDefinition,
  styleTransferToolDefinition,
  modelSearchToolDefinition,
  costEstimateToolDefinition,
  accountBalanceToolDefinition,
  accountManagementToolDefinition,
  listModelsToolDefinition,
  modelDetailsToolDefinition,
  modelExamplesToolDefinition,
  modelPricingToolDefinition,
  listCapabilitiesToolDefinition,
  modelSchemaToolDefinition,
  runInferenceToolDefinition,
  getTaskDetailsToolDefinition,
  mediaStorageToolDefinition,
  modelUploadToolDefinition,
  trainingToolDefinition,
  textInferenceToolDefinition,
  threeDInferenceToolDefinition,
  processFolderToolDefinition,
  batchImageInferenceToolDefinition,
  watchFolderToolDefinition,
] as const;
