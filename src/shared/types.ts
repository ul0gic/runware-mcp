// Does:  Defines branded ID types, the Runware response envelope, and the tool result shape.
// Holds: Brands exist only at compile time; the create* helpers cast without checking the string format.

function brand<B extends string>(value: string): B {
  // biome-ignore lint/nursery/noUnsafeTypeAssertion: a nominal brand has no runtime form, so minting one is necessarily a cast.
  return value as B;
}

declare const API_KEY_BRAND: unique symbol;
export type ApiKey = string & { readonly [API_KEY_BRAND]: typeof API_KEY_BRAND };

export function createApiKey(key: string): ApiKey {
  return brand<ApiKey>(key);
}

declare const TASK_UUID_BRAND: unique symbol;
export type TaskUUID = string & { readonly [TASK_UUID_BRAND]: typeof TASK_UUID_BRAND };

export function createTaskUUID(uuid: string): TaskUUID {
  return brand<TaskUUID>(uuid);
}

declare const IMAGE_UUID_BRAND: unique symbol;

declare const VIDEO_UUID_BRAND: unique symbol;

declare const AUDIO_UUID_BRAND: unique symbol;

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
  readonly progress?: ProgressReporter | undefined;
  readonly signal?: AbortSignal;
}

export interface BaseTaskRequest {
  readonly taskType: string;
  readonly taskUUID: string;
}
