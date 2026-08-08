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

interface RunwareApiErrorData {
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

interface ProgressInfo {
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

export interface BaseTaskRequest {
  readonly taskType: string;
  readonly taskUUID: string;
}
