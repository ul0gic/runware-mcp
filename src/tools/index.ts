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
  accountBalanceInputSchema,
} from './account-balance/index.js';
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
  modelSearch,
  modelSearchToolDefinition,
  modelSearchInputSchema,
} from './model-search/index.js';
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
  styleTransfer,
  styleTransferToolDefinition,
  styleTransferInputSchema,
} from './style-transfer/index.js';
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
  styleTransfer,
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
 * Map of all tool input schemas by name.
 *
 * Used by the MCP dispatch layer to validate and apply Zod defaults
 * to raw JSON arguments before passing them to handlers.
 */
export const toolInputSchemas: Record<string, z.ZodType> = {
  // Core Image Tools
  imageInference: imageInferenceInputSchema,
  photoMaker: photoMakerInputSchema,
  imageUpscale: imageUpscaleInputSchema,
  imageBackgroundRemoval: imageBackgroundRemovalInputSchema,
  imageCaption: imageCaptionInputSchema,
  imageMasking: imageMaskingInputSchema,
  imageUpload: imageUploadInputSchema,
  // Video Tools
  videoInference: videoInferenceInputSchema,
  listVideoModels: listVideoModelsInputSchema,
  getVideoModelInfo: getVideoModelInfoInputSchema,
  // Audio Tools
  audioInference: audioInferenceInputSchema,
  transcription: transcriptionInputSchema,
  // Creative Tools
  vectorize: vectorizeInputSchema,
  promptEnhance: promptEnhanceInputSchema,
  controlNetPreprocess: controlNetPreprocessInputSchema,
  styleTransfer: styleTransferInputSchema,
  // Utility Tools
  modelSearch: modelSearchInputSchema,
  costEstimate: costEstimateInputSchema,
  accountBalance: accountBalanceInputSchema,
  // Batch & Folder Tools
  processFolder: processFolderInputSchema,
  batchImageInference: batchImageInferenceInputSchema,
  watchFolder: watchFolderInputSchema,
};

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
  styleTransferToolDefinition,
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
