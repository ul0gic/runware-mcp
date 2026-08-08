import {
  accountBalance,
  accountBalanceToolDefinition,
  accountBalanceInputSchema,
} from './account-balance/index.js';
import {
  accountManagement,
  accountManagementToolDefinition,
  accountManagementInputSchema,
} from './account-management/index.js';
import {
  audioInference,
  audioInferenceToolDefinition,
  audioInferenceInputSchema,
} from './audio-inference/index.js';
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
import {
  costEstimate,
  costEstimateToolDefinition,
  costEstimateInputSchema,
} from './cost-estimate/index.js';
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
import {
  imageCaption,
  imageCaptionToolDefinition,
  imageCaptionInputSchema,
} from './image-caption/index.js';
import {
  imageInference,
  imageInferenceToolDefinition,
  imageInferenceInputSchema,
} from './image-inference/index.js';
import {
  imageMasking,
  imageMaskingToolDefinition,
  imageMaskingInputSchema,
} from './image-masking/index.js';
import {
  imageUpload,
  imageUploadToolDefinition,
  imageUploadInputSchema,
} from './image-upload/index.js';
import {
  imageUpscale,
  imageUpscaleToolDefinition,
  imageUpscaleInputSchema,
} from './image-upscale/index.js';
import {
  listVideoModels,
  listVideoModelsToolDefinition,
  listVideoModelsInputSchema,
} from './list-video-models/index.js';
import {
  mediaStorage,
  mediaStorageInputSchema,
  mediaStorageToolDefinition,
} from './media-storage/index.js';
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
import {
  modelSearch,
  modelSearchToolDefinition,
  modelSearchInputSchema,
} from './model-search/index.js';
import {
  modelUpload,
  modelUploadInputSchema,
  modelUploadToolDefinition,
} from './model-upload/index.js';
import {
  photoMaker,
  photoMakerToolDefinition,
  photoMakerInputSchema,
} from './photo-maker/index.js';
import {
  processFolder,
  processFolderToolDefinition,
  processFolderInputSchema,
} from './process-folder/index.js';
import {
  promptEnhance,
  promptEnhanceToolDefinition,
  promptEnhanceInputSchema,
} from './prompt-enhance/index.js';
import {
  runInference,
  runInferenceInputSchema,
  runInferenceToolDefinition,
} from './run-inference/index.js';
import {
  styleTransfer,
  styleTransferToolDefinition,
  styleTransferInputSchema,
} from './style-transfer/index.js';
import {
  getTaskDetails,
  getTaskDetailsInputSchema,
  getTaskDetailsToolDefinition,
} from './task-details/index.js';
import {
  textInference,
  textInferenceInputSchema,
  textInferenceToolDefinition,
} from './text-inference/index.js';
import {
  threeDInference,
  threeDInferenceInputSchema,
  threeDInferenceToolDefinition,
} from './three-d-inference/index.js';
import {
  training,
  trainingInputSchema,
  trainingToolDefinition,
} from './training/index.js';
import {
  transcription,
  transcriptionToolDefinition,
  transcriptionInputSchema,
} from './transcription/index.js';
import {
  vectorize,
  vectorizeToolDefinition,
  vectorizeInputSchema,
} from './vectorize/index.js';
import {
  videoInference,
  videoInferenceToolDefinition,
  videoInferenceInputSchema,
} from './video-inference/index.js';
import {
  watchFolder,
  watchFolderToolDefinition,
  watchFolderInputSchema,
} from './watch-folder/index.js';

import type { z } from 'zod';

export const toolHandlers = {
  imageInference,
  photoMaker,
  imageUpscale,
  imageBackgroundRemoval,
  imageCaption,
  imageMasking,
  imageUpload,
  videoInference,
  listVideoModels,
  getVideoModelInfo,
  audioInference,
  transcription,
  vectorize,
  promptEnhance,
  controlNetPreprocess,
  styleTransfer,
  modelSearch,
  costEstimate,
  accountBalance,
  accountManagement,
  listModels,
  modelDetails,
  modelExamples,
  modelPricing,
  listCapabilities,
  modelSchema,
  runInference,
  getTaskDetails,
  mediaStorage,
  modelUpload,
  training,
  textInference,
  threeDInference,
  processFolder,
  batchImageInference,
  watchFolder,
} as const;

/** Used by the dispatch layer to validate raw JSON args and apply Zod defaults. */
export const toolInputSchemas: Record<string, z.ZodType> = {
  imageInference: imageInferenceInputSchema,
  photoMaker: photoMakerInputSchema,
  imageUpscale: imageUpscaleInputSchema,
  imageBackgroundRemoval: imageBackgroundRemovalInputSchema,
  imageCaption: imageCaptionInputSchema,
  imageMasking: imageMaskingInputSchema,
  imageUpload: imageUploadInputSchema,
  videoInference: videoInferenceInputSchema,
  listVideoModels: listVideoModelsInputSchema,
  getVideoModelInfo: getVideoModelInfoInputSchema,
  audioInference: audioInferenceInputSchema,
  transcription: transcriptionInputSchema,
  vectorize: vectorizeInputSchema,
  promptEnhance: promptEnhanceInputSchema,
  controlNetPreprocess: controlNetPreprocessInputSchema,
  styleTransfer: styleTransferInputSchema,
  modelSearch: modelSearchInputSchema,
  costEstimate: costEstimateInputSchema,
  accountBalance: accountBalanceInputSchema,
  accountManagement: accountManagementInputSchema,
  listModels: listModelsInputSchema,
  modelDetails: modelIdentifierInputSchema,
  modelExamples: modelExamplesInputSchema,
  modelPricing: modelIdentifierInputSchema,
  listCapabilities: listCapabilitiesInputSchema,
  modelSchema: modelSchemaInputSchema,
  runInference: runInferenceInputSchema,
  getTaskDetails: getTaskDetailsInputSchema,
  mediaStorage: mediaStorageInputSchema,
  modelUpload: modelUploadInputSchema,
  training: trainingInputSchema,
  textInference: textInferenceInputSchema,
  threeDInference: threeDInferenceInputSchema,
  processFolder: processFolderInputSchema,
  batchImageInference: batchImageInferenceInputSchema,
  watchFolder: watchFolderInputSchema,
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
