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

export {
  imageInference,
  imageInferenceToolDefinition,
  imageInferenceInputSchema,
  imageInferenceOutputSchema,
  type ImageInferenceInput,
  type ImageInferenceOutput,
} from './image-inference/index.js';

export {
  photoMaker,
  photoMakerToolDefinition,
  photoMakerInputSchema,
  photoMakerOutputSchema,
  type PhotoMakerInput,
  type PhotoMakerOutput,
} from './photo-maker/index.js';

export {
  imageUpscale,
  imageUpscaleToolDefinition,
  imageUpscaleInputSchema,
  imageUpscaleOutputSchema,
  type ImageUpscaleInput,
  type ImageUpscaleOutput,
} from './image-upscale/index.js';

export {
  imageBackgroundRemoval,
  imageBackgroundRemovalToolDefinition,
  imageBackgroundRemovalInputSchema,
  imageBackgroundRemovalOutputSchema,
  type ImageBackgroundRemovalInput,
  type ImageBackgroundRemovalOutput,
} from './image-background-removal/index.js';

export {
  imageCaption,
  imageCaptionToolDefinition,
  imageCaptionInputSchema,
  imageCaptionOutputSchema,
  type ImageCaptionInput,
  type ImageCaptionOutput,
} from './image-caption/index.js';

export {
  imageMasking,
  imageMaskingToolDefinition,
  imageMaskingInputSchema,
  imageMaskingOutputSchema,
  type ImageMaskingInput,
  type ImageMaskingOutput,
} from './image-masking/index.js';

export {
  imageUpload,
  imageUploadToolDefinition,
  imageUploadInputSchema,
  imageUploadOutputSchema,
  type ImageUploadInput,
  type ImageUploadOutput,
} from './image-upload/index.js';

export {
  videoInference,
  videoInferenceToolDefinition,
  videoInferenceInputSchema,
  videoInferenceOutputSchema,
  type VideoInferenceInput,
  type VideoInferenceOutput,
} from './video-inference/index.js';

export {
  listVideoModels,
  listVideoModelsToolDefinition,
  listVideoModelsInputSchema,
  listVideoModelsOutputSchema,
  type ListVideoModelsInput,
  type ListVideoModelsOutput,
} from './list-video-models/index.js';

export {
  getVideoModelInfo,
  getVideoModelInfoToolDefinition,
  getVideoModelInfoInputSchema,
  getVideoModelInfoOutputSchema,
  type GetVideoModelInfoInput,
  type GetVideoModelInfoOutput,
} from './get-video-model-info/index.js';

export {
  audioInference,
  audioInferenceToolDefinition,
  audioInferenceInputSchema,
  audioInferenceOutputSchema,
  type AudioInferenceInput,
  type AudioInferenceOutput,
} from './audio-inference/index.js';

export {
  transcription,
  transcriptionToolDefinition,
  transcriptionInputSchema,
  transcriptionOutputSchema,
  type TranscriptionInput,
  type TranscriptionOutput,
} from './transcription/index.js';

export {
  vectorize,
  vectorizeToolDefinition,
  vectorizeInputSchema,
  vectorizeOutputSchema,
  type VectorizeInput,
  type VectorizeOutput,
} from './vectorize/index.js';

export {
  promptEnhance,
  promptEnhanceToolDefinition,
  promptEnhanceInputSchema,
  promptEnhanceOutputSchema,
  type PromptEnhanceInput,
  type PromptEnhanceOutput,
} from './prompt-enhance/index.js';

export {
  controlNetPreprocess,
  controlNetPreprocessToolDefinition,
  controlNetPreprocessInputSchema,
  controlNetPreprocessOutputSchema,
  type ControlNetPreprocessInput,
  type ControlNetPreprocessOutput,
} from './controlnet-preprocess/index.js';

export {
  styleTransfer,
  styleTransferToolDefinition,
  styleTransferInputSchema,
  styleTransferOutputSchema,
  artStyleSchema,
  intensitySchema,
  colorPaletteSchema,
  ART_STYLES,
  INTENSITY_LEVELS,
  COLOR_PALETTES,
  type StyleTransferInput,
  type StyleTransferOutput,
  type ArtStyle,
  type Intensity,
  type ColorPalette,
} from './style-transfer/index.js';

export {
  modelSearch,
  modelSearchToolDefinition,
  modelSearchInputSchema,
  modelSearchOutputSchema,
  type ModelSearchInput,
  type ModelSearchOutput,
} from './model-search/index.js';

export {
  costEstimate,
  costEstimateToolDefinition,
  costEstimateInputSchema,
  costEstimateOutputSchema,
  type CostEstimateInput,
  type CostEstimateOutput,
} from './cost-estimate/index.js';

export {
  accountBalance,
  accountBalanceToolDefinition,
  accountBalanceInputSchema,
  accountBalanceOutputSchema,
  type AccountBalanceInput,
  type AccountBalanceOutput,
} from './account-balance/index.js';

export * from './account-management/index.js';
export * from './media-storage/index.js';
export * from './model-catalog/index.js';
export * from './model-upload/index.js';
export * from './run-inference/index.js';
export * from './task-details/index.js';
export * from './text-inference/index.js';
export * from './three-d-inference/index.js';
export * from './training/index.js';

export {
  processFolder,
  processFolderToolDefinition,
  processFolderInputSchema,
  processFolderOutputSchema,
  fileResultSchema,
  folderOperationSchema,
  FOLDER_OPERATIONS,
  type ProcessFolderInput,
  type ProcessFolderOutput,
  type FileResult,
  type FolderOperation,
} from './process-folder/index.js';

export {
  batchImageInference,
  batchImageInferenceToolDefinition,
  batchImageInferenceInputSchema,
  batchImageInferenceOutputSchema,
  batchPromptResultSchema,
  batchImageResultSchema,
  type BatchImageInferenceInput,
  type BatchImageInferenceOutput,
  type BatchPromptResult,
} from './batch-image-inference/index.js';

export {
  watchFolder,
  watchFolderToolDefinition,
  watchFolderInputSchema,
  watchFolderOutputSchema,
  watcherInfoSchema,
  watchActionSchema,
  watchOperationSchema,
  stopAllWatchers,
  getActiveWatcherCount,
  WATCH_ACTIONS,
  WATCH_OPERATIONS,
  type WatchFolderInput,
  type WatchFolderOutput,
  type WatcherInfo,
  type WatchAction,
  type WatchOperation,
} from './watch-folder/index.js';

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

export type ToolName = keyof typeof toolHandlers;

export const toolNames = Object.keys(toolHandlers) as ToolName[];
