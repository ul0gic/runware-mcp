/**
 * Shared types for the Runware MCP server.
 *
 * This module defines branded types for type-safe identifiers and
 * common interfaces used throughout the codebase.
 */

// ============================================================================
// Branded Types
// ============================================================================

/**
 * Branded type for Runware API keys.
 * Prevents accidental usage of arbitrary strings as API keys.
 */
declare const API_KEY_BRAND: unique symbol;
export type ApiKey = string & { readonly [API_KEY_BRAND]: typeof API_KEY_BRAND };

/**
 * Type guard to create an ApiKey from a validated string.
 */
export function createApiKey(key: string): ApiKey {
  return key as ApiKey;
}

/**
 * Branded type for task UUIDs.
 * Used to track individual API requests.
 */
declare const TASK_UUID_BRAND: unique symbol;
export type TaskUUID = string & { readonly [TASK_UUID_BRAND]: typeof TASK_UUID_BRAND };

/**
 * Type guard to create a TaskUUID from a validated string.
 */
export function createTaskUUID(uuid: string): TaskUUID {
  return uuid as TaskUUID;
}

/**
 * Branded type for image UUIDs.
 * Identifies generated or uploaded images in Runware.
 */
declare const IMAGE_UUID_BRAND: unique symbol;
export type ImageUUID = string & { readonly [IMAGE_UUID_BRAND]: typeof IMAGE_UUID_BRAND };

/**
 * Type guard to create an ImageUUID from a validated string.
 */
export function createImageUUID(uuid: string): ImageUUID {
  return uuid as ImageUUID;
}

/**
 * Branded type for video UUIDs.
 * Identifies generated videos in Runware.
 */
declare const VIDEO_UUID_BRAND: unique symbol;
export type VideoUUID = string & { readonly [VIDEO_UUID_BRAND]: typeof VIDEO_UUID_BRAND };

/**
 * Type guard to create a VideoUUID from a validated string.
 */
export function createVideoUUID(uuid: string): VideoUUID {
  return uuid as VideoUUID;
}

/**
 * Branded type for audio UUIDs.
 * Identifies generated audio in Runware.
 */
declare const AUDIO_UUID_BRAND: unique symbol;
export type AudioUUID = string & { readonly [AUDIO_UUID_BRAND]: typeof AUDIO_UUID_BRAND };

/**
 * Type guard to create an AudioUUID from a validated string.
 */
export function createAudioUUID(uuid: string): AudioUUID {
  return uuid as AudioUUID;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Error object returned by the Runware API.
 */
export interface RunwareApiErrorData {
  readonly message: string;
  readonly code?: string;
  readonly taskUUID?: string;
}

/**
 * Generic response wrapper for Runware API responses.
 * The API returns data as an array of result objects.
 */
export interface RunwareResponse<T = unknown> {
  readonly data: readonly T[];
  readonly errors?: readonly RunwareApiErrorData[];
}

/**
 * Status values for async task polling.
 */
export type TaskStatus = 'processing' | 'success' | 'error';

/**
 * Base response shape for async task results.
 */
export interface AsyncTaskResponse {
  readonly taskType: string;
  readonly taskUUID: string;
  readonly status?: TaskStatus;
  readonly cost?: number;
}

/**
 * Image generation result from the API.
 */
export interface ImageResult extends AsyncTaskResponse {
  readonly taskType: 'imageInference';
  readonly imageUUID?: string;
  readonly imageURL?: string;
  readonly imageBase64Data?: string;
  readonly imageDataURI?: string;
  // API returns this exact property name
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly NSFWContent?: boolean;
}

/**
 * Video generation result from the API.
 */
export interface VideoResult extends AsyncTaskResponse {
  readonly taskType: 'videoInference';
  readonly videoUUID?: string;
  readonly videoURL?: string;
}

/**
 * Audio generation result from the API.
 */
export interface AudioResult extends AsyncTaskResponse {
  readonly taskType: 'audioInference';
  readonly audioUUID?: string;
  readonly audioURL?: string;
}

// ============================================================================
// Tool Result Types
// ============================================================================

/**
 * Standardized result returned by MCP tools.
 */
export interface ToolResult {
  readonly status: 'success' | 'error';
  readonly message: string;
  readonly data?: unknown;
  readonly cost?: number;
}

/**
 * Helper to create a success tool result.
 */
export function successResult(message: string, data?: unknown, cost?: number): ToolResult {
  return {
    status: 'success',
    message,
    ...(data !== undefined && { data }),
    ...(cost !== undefined && { cost }),
  };
}

/**
 * Helper to create an error tool result.
 */
export function errorResult(message: string, data?: unknown): ToolResult {
  return {
    status: 'error',
    message,
    ...(data !== undefined && { data }),
  };
}

// ============================================================================
// Progress Reporting
// ============================================================================

/**
 * Progress information for long-running operations.
 */
export interface ProgressInfo {
  readonly progress: number;
  readonly total: number;
  readonly message: string;
}

/**
 * Interface for reporting progress during long-running operations.
 * Used by video/audio generation and batch processing tools.
 */
export interface ProgressReporter {
  report(progress: ProgressInfo): void;
}

// ============================================================================
// Tool Context
// ============================================================================

/**
 * Database interface placeholder.
 * Will be implemented in Phase 4 when database layer is built.
 */
export interface Database {
  readonly isConnected: boolean;
  // Methods will be added in Phase 4
}

/**
 * Context passed to tool handlers.
 * Provides access to optional features like progress reporting,
 * cancellation, and database persistence.
 */
export interface ToolContext {
  /**
   * Optional progress reporter for long-running operations.
   */
  readonly progress?: ProgressReporter;

  /**
   * Optional abort signal for cancellation support.
   */
  readonly signal?: AbortSignal;

  /**
   * Optional database connection for persistence.
   * Only available when ENABLE_DATABASE is true.
   */
  readonly db?: Database;
}

// ============================================================================
// Provider Settings Types
// ============================================================================
// These are forward declarations for the provider settings.
// The actual schemas are defined in provider-settings.ts.

/**
 * Alibaba (Wan) provider settings.
 */
export interface AlibabaSettings {
  readonly promptExtend?: boolean;
  readonly shotType?: 'single' | 'multi';
  readonly audio?: boolean;
}

/**
 * BFL (Black Forest Labs) provider settings.
 */
export interface BFLSettings {
  readonly promptUpsampling?: boolean;
  readonly safetyTolerance?: number;
  readonly raw?: boolean;
}

/**
 * Bria provider settings.
 */
export interface BriaSettings {
  readonly promptEnhancement?: boolean;
  readonly medium?: 'photography' | 'art';
  readonly enhanceImage?: boolean;
  readonly contentModeration?: boolean;
  readonly mode?: 'base' | 'high_control' | 'fast';
}

/**
 * Ideogram provider settings.
 */
export interface IdeogramSettings {
  readonly renderingSpeed?: 'TURBO' | 'DEFAULT' | 'QUALITY';
  readonly magicPrompt?: 'AUTO' | 'ON' | 'OFF';
  readonly styleType?: string;
  readonly stylePreset?: string;
  readonly colorPalette?: string | readonly string[];
}

/**
 * ByteDance provider settings.
 */
export interface ByteDanceSettings {
  readonly maxSequentialImages?: number;
  readonly optimizePromptMode?: 'standard' | 'fast';
}

/**
 * KlingAI provider settings.
 */
export interface KlingAISettings {
  readonly sound?: boolean;
  readonly keepOriginalSound?: boolean;
  readonly cameraFixed?: boolean;
}

/**
 * PixVerse provider settings.
 */
export interface PixVerseSettings {
  readonly effect?: string;
  readonly cameraMovement?: string;
  readonly multiClip?: boolean;
}

/**
 * Veo (Google) provider settings.
 */
export interface VeoSettings {
  readonly enhancePrompt?: boolean;
  readonly generateAudio?: boolean;
}

/**
 * Sync.so provider settings.
 */
export interface AudioSegment {
  readonly start: number;
  readonly end: number;
  readonly audio: string;
}

export interface SyncSettings {
  readonly speakerDetection?: boolean;
  readonly occlusionHandling?: boolean;
  readonly audioSegments?: readonly AudioSegment[];
}

/**
 * Union type of all provider-specific settings.
 */
export type ProviderSettings =
  | AlibabaSettings
  | BFLSettings
  | BriaSettings
  | IdeogramSettings
  | ByteDanceSettings
  | KlingAISettings
  | PixVerseSettings
  | VeoSettings
  | SyncSettings;

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Base request parameters common to all Runware API tasks.
 */
export interface BaseTaskRequest {
  readonly taskType: string;
  readonly taskUUID: string;
}

/**
 * Authentication request for API connection.
 */
export interface AuthenticationRequest {
  readonly taskType: 'authentication';
  readonly apiKey: string;
}

/**
 * Request to poll for async task results.
 */
export interface GetResponseRequest extends BaseTaskRequest {
  readonly taskType: 'getResponse';
}

/**
 * Delivery method for API requests.
 */
export type DeliveryMethod = 'sync' | 'async';

/**
 * Output type for generated media.
 */
export type OutputType = 'URL' | 'base64Data' | 'dataURI';

/**
 * Output format for images.
 */
export type ImageOutputFormat = 'JPG' | 'PNG' | 'WEBP';

/**
 * Output format for videos.
 */
export type VideoOutputFormat = 'MP4' | 'WEBM' | 'MOV';
