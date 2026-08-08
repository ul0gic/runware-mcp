declare const API_KEY_BRAND: unique symbol;
export type ApiKey = string & { readonly [API_KEY_BRAND]: typeof API_KEY_BRAND };

export function createApiKey(key: string): ApiKey {
  return key as ApiKey;
}

declare const TASK_UUID_BRAND: unique symbol;
export type TaskUUID = string & { readonly [TASK_UUID_BRAND]: typeof TASK_UUID_BRAND };

export function createTaskUUID(uuid: string): TaskUUID {
  return uuid as TaskUUID;
}

declare const IMAGE_UUID_BRAND: unique symbol;
export type ImageUUID = string & { readonly [IMAGE_UUID_BRAND]: typeof IMAGE_UUID_BRAND };

export function createImageUUID(uuid: string): ImageUUID {
  return uuid as ImageUUID;
}

declare const VIDEO_UUID_BRAND: unique symbol;
export type VideoUUID = string & { readonly [VIDEO_UUID_BRAND]: typeof VIDEO_UUID_BRAND };

export function createVideoUUID(uuid: string): VideoUUID {
  return uuid as VideoUUID;
}

declare const AUDIO_UUID_BRAND: unique symbol;
export type AudioUUID = string & { readonly [AUDIO_UUID_BRAND]: typeof AUDIO_UUID_BRAND };

export function createAudioUUID(uuid: string): AudioUUID {
  return uuid as AudioUUID;
}

export interface RunwareApiErrorData {
  readonly message: string;
  readonly code?: string;
  readonly taskUUID?: string;
}

export interface RunwareResponse<T = unknown> {
  readonly data: readonly T[];
  readonly errors?: readonly RunwareApiErrorData[];
}

export type TaskStatus = 'processing' | 'success' | 'error';

export interface AsyncTaskResponse {
  readonly taskType: string;
  readonly taskUUID: string;
  readonly status?: TaskStatus;
  readonly cost?: number;
}

export interface ImageResult extends AsyncTaskResponse {
  readonly taskType: 'imageInference';
  readonly imageUUID?: string;
  readonly imageURL?: string;
  readonly imageBase64Data?: string;
  readonly imageDataURI?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API returns this exact property name
  readonly NSFWContent?: boolean;
}

export interface VideoResult extends AsyncTaskResponse {
  readonly taskType: 'videoInference';
  readonly videoUUID?: string;
  readonly videoURL?: string;
}

export interface AudioResult extends AsyncTaskResponse {
  readonly taskType: 'audioInference';
  readonly audioUUID?: string;
  readonly audioURL?: string;
}

export interface ToolResult {
  readonly status: 'success' | 'error';
  readonly message: string;
  readonly data?: unknown;
  readonly cost?: number;
}

export function successResult(message: string, data?: unknown, cost?: number): ToolResult {
  return {
    status: 'success',
    message,
    ...(data !== undefined && { data }),
    ...(cost !== undefined && { cost }),
  };
}

export function errorResult(message: string, data?: unknown): ToolResult {
  return {
    status: 'error',
    message,
    ...(data !== undefined && { data }),
  };
}

export interface ProgressInfo {
  readonly progress: number;
  readonly total: number;
  readonly message: string;
}

export interface ProgressReporter {
  report(progress: ProgressInfo): void;
}

export interface ToolContext {
  readonly progress?: ProgressReporter;
  readonly signal?: AbortSignal;
}

export interface AlibabaSettings {
  readonly promptExtend?: boolean;
  readonly shotType?: 'single' | 'multi';
  readonly audio?: boolean;
}

export interface BFLSettings {
  readonly promptUpsampling?: boolean;
  readonly safetyTolerance?: number;
  readonly raw?: boolean;
}

export interface BriaSettings {
  readonly promptEnhancement?: boolean;
  readonly medium?: 'photography' | 'art';
  readonly enhanceImage?: boolean;
  readonly contentModeration?: boolean;
  readonly mode?: 'base' | 'high_control' | 'fast';
}

export interface IdeogramSettings {
  readonly renderingSpeed?: 'TURBO' | 'DEFAULT' | 'QUALITY';
  readonly magicPrompt?: 'AUTO' | 'ON' | 'OFF';
  readonly styleType?: string;
  readonly stylePreset?: string;
  readonly colorPalette?: string | readonly string[];
}

export interface ByteDanceSettings {
  readonly maxSequentialImages?: number;
  readonly optimizePromptMode?: 'standard' | 'fast';
}

export interface KlingAISettings {
  readonly sound?: boolean;
  readonly keepOriginalSound?: boolean;
  readonly cameraFixed?: boolean;
}

export interface PixVerseSettings {
  readonly effect?: string;
  readonly cameraMovement?: string;
  readonly multiClip?: boolean;
}

export interface VeoSettings {
  readonly enhancePrompt?: boolean;
  readonly generateAudio?: boolean;
}

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

export interface BaseTaskRequest {
  readonly taskType: string;
  readonly taskUUID: string;
}

export interface AuthenticationRequest {
  readonly taskType: 'authentication';
  readonly apiKey: string;
}

export interface GetResponseRequest extends BaseTaskRequest {
  readonly taskType: 'getResponse';
}

export type DeliveryMethod = 'sync' | 'async';

export type OutputType = 'URL' | 'base64Data' | 'dataURI';

export type ImageOutputFormat = 'JPG' | 'PNG' | 'WEBP';

export type VideoOutputFormat = 'MP4' | 'WEBM' | 'MOV';
