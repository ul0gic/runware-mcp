/**
 * Tools index - Registry of all MCP tools.
 *
 * This module exports all tool handlers and definitions for the Runware MCP server.
 */

// ============================================================================
// Imports (for local use in registries)
// ============================================================================

import {
  accountBalance,
  accountBalanceToolDefinition,
} from './account-balance/index.js';
import {
  audioInference,
  audioInferenceToolDefinition,
} from './audio-inference/index.js';
import {
  batchImageInference,
  batchImageInferenceToolDefinition,
} from './batch-image-inference/index.js';
import {
  controlNetPreprocess,
  controlNetPreprocessToolDefinition,
} from './controlnet-preprocess/index.js';
import {
  costEstimate,
  costEstimateToolDefinition,
} from './cost-estimate/index.js';
import {
  getVideoModelInfo,
  getVideoModelInfoToolDefinition,
} from './get-video-model-info/index.js';
import {
  imageBackgroundRemoval,
  imageBackgroundRemovalToolDefinition,
} from './image-background-removal/index.js';
import {
  imageCaption,
  imageCaptionToolDefinition,
} from './image-caption/index.js';
import {
  imageInference,
  imageInferenceToolDefinition,
} from './image-inference/index.js';
import {
  imageMasking,
  imageMaskingToolDefinition,
} from './image-masking/index.js';
import {
  imageUpload,
  imageUploadToolDefinition,
} from './image-upload/index.js';
import {
  imageUpscale,
  imageUpscaleToolDefinition,
} from './image-upscale/index.js';
import {
  listVideoModels,
  listVideoModelsToolDefinition,
} from './list-video-models/index.js';
import {
  modelSearch,
  modelSearchToolDefinition,
} from './model-search/index.js';
import {
  photoMaker,
  photoMakerToolDefinition,
} from './photo-maker/index.js';
import {
  processFolder,
  processFolderToolDefinition,
} from './process-folder/index.js';
import {
  promptEnhance,
  promptEnhanceToolDefinition,
} from './prompt-enhance/index.js';
import {
  transcription,
  transcriptionToolDefinition,
} from './transcription/index.js';
import {
  vectorize,
  vectorizeToolDefinition,
} from './vectorize/index.js';
import {
  videoInference,
  videoInferenceToolDefinition,
} from './video-inference/index.js';
import {
  watchFolder,
  watchFolderToolDefinition,
} from './watch-folder/index.js';

// ============================================================================
// Re-exports - Core Image Tools
// ============================================================================

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

// ============================================================================
// Re-exports - Video Tools
// ============================================================================

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

// ============================================================================
// Re-exports - Audio Tools
// ============================================================================

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

// ============================================================================
// Re-exports - Creative Tools
// ============================================================================

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

// ============================================================================
// Re-exports - Utility Tools
// ============================================================================

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

// ============================================================================
// Re-exports - Batch & Folder Tools
// ============================================================================

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

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * Map of all tool handlers by name.
 */
export const toolHandlers = {
  // Core Image Tools
  imageInference,
  photoMaker,
  imageUpscale,
  imageBackgroundRemoval,
  imageCaption,
  imageMasking,
  imageUpload,
  // Video Tools
  videoInference,
  listVideoModels,
  getVideoModelInfo,
  // Audio Tools
  audioInference,
  transcription,
  // Creative Tools
  vectorize,
  promptEnhance,
  controlNetPreprocess,
  // Utility Tools
  modelSearch,
  costEstimate,
  accountBalance,
  // Batch & Folder Tools
  processFolder,
  batchImageInference,
  watchFolder,
} as const;

/**
 * Array of all tool definitions for MCP registration.
 */
export const toolDefinitions = [
  // Core Image Tools
  imageInferenceToolDefinition,
  photoMakerToolDefinition,
  imageUpscaleToolDefinition,
  imageBackgroundRemovalToolDefinition,
  imageCaptionToolDefinition,
  imageMaskingToolDefinition,
  imageUploadToolDefinition,
  // Video Tools
  videoInferenceToolDefinition,
  listVideoModelsToolDefinition,
  getVideoModelInfoToolDefinition,
  // Audio Tools
  audioInferenceToolDefinition,
  transcriptionToolDefinition,
  // Creative Tools
  vectorizeToolDefinition,
  promptEnhanceToolDefinition,
  controlNetPreprocessToolDefinition,
  // Utility Tools
  modelSearchToolDefinition,
  costEstimateToolDefinition,
  accountBalanceToolDefinition,
  // Batch & Folder Tools
  processFolderToolDefinition,
  batchImageInferenceToolDefinition,
  watchFolderToolDefinition,
] as const;

/**
 * Type for valid tool names.
 */
export type ToolName = keyof typeof toolHandlers;

/**
 * Array of all tool names.
 */
export const toolNames = Object.keys(toolHandlers) as ToolName[];
