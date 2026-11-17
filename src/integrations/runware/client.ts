// Does:  Posts task batches to the Runware REST API with bearer auth and maps every failure to RunwareApiError.
// Holds: Requests abort at their timeout, body read included; errors carry no raw body and never the API key.

import { randomUUID } from 'node:crypto';

import { z } from 'zod';

import { API_BASE_URL, config } from '../../shared/config.js';
import { RunwareApiError } from '../../shared/errors.js';
import {
  type ApiKey,
  type BaseTaskRequest,
  type RunwareResponse,
  type TaskUUID,
  createTaskUUID,
} from '../../shared/types.js';

export interface RunwareClientOptions {
  readonly apiKey: ApiKey;

  readonly timeoutMs?: number;

  readonly baseUrl?: string;
}

export interface RequestOptions {
  readonly signal?: AbortSignal | undefined;

  readonly timeoutMs?: number | undefined;
}

function wrapRequestError(error: unknown, timeout: number, wasUserCancelled: boolean): RunwareApiError {
  if (error instanceof RunwareApiError) {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new RunwareApiError(
      wasUserCancelled ? 'Request was cancelled' : `Request timed out after ${String(timeout)}ms`,
    );
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new RunwareApiError('Network error: Unable to connect to Runware API');
  }

  const message = error instanceof Error ? error.message : String(error);
  return new RunwareApiError(message);
}

const MAX_ERROR_DETAIL_LENGTH = 200;

const MAX_API_CODE_LENGTH = 64;

const REDACTED = '[REDACTED]';

const runwareErrorBodySchema = z.object({
  errors: z.array(z.object({ code: z.string().optional(), message: z.string().optional() })).min(1),
});

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function parseErrorBody(body: string): { code?: string | undefined; message?: string | undefined } | undefined {
  try {
    const parsed = runwareErrorBodySchema.safeParse(JSON.parse(body));
    return parsed.success ? parsed.data.errors[0] : undefined;
  } catch {
    return undefined;
  }
}

async function createHttpError(response: Response): Promise<RunwareApiError> {
  const body = await readErrorBody(response);
  const structured = parseErrorBody(body);
  const detail = truncate((structured?.message ?? body).trim(), MAX_ERROR_DETAIL_LENGTH);
  const summary = `API request failed: ${String(response.status)} ${response.statusText}`;
  return new RunwareApiError(detail === '' ? summary : `${summary}: ${detail}`, {
    statusCode: response.status,
    apiCode: structured?.code === undefined ? undefined : truncate(structured.code, MAX_API_CODE_LENGTH),
  });
}

function redact(text: string | undefined, secret: string): string | undefined {
  return text?.replaceAll(secret, REDACTED);
}

function redactError(error: RunwareApiError, secret: string): RunwareApiError {
  const fields = [error.message, error.data.apiCode, error.data.taskUUID];
  if (secret === '' || !fields.some((field) => field?.includes(secret) === true)) {
    return error;
  }
  return new RunwareApiError(redact(error.message, secret) ?? '', {
    apiCode: redact(error.data.apiCode, secret),
    taskUUID: redact(error.data.taskUUID, secret),
    statusCode: error.data.statusCode,
  });
}

function createApiLevelError(
  errors: readonly { message: string; code?: string; taskUUID?: string }[],
): RunwareApiError {
  const firstError = errors[0];
  return new RunwareApiError(truncate(firstError?.message ?? 'Unknown API error', MAX_ERROR_DETAIL_LENGTH), {
    apiCode: firstError?.code === undefined ? undefined : truncate(firstError.code, MAX_API_CODE_LENGTH),
    taskUUID: firstError?.taskUUID,
  });
}

export class RunwareClient {
  private readonly apiKey: ApiKey;
  private readonly timeoutMs: number;
  private readonly baseUrl: string;

  constructor(options: RunwareClientOptions) {
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? config.REQUEST_TIMEOUT_MS;
    this.baseUrl = options.baseUrl ?? API_BASE_URL;
  }

  generateTaskUUID(): TaskUUID {
    return createTaskUUID(randomUUID());
  }

  async request<T>(tasks: readonly BaseTaskRequest[], options?: RequestOptions): Promise<RunwareResponse<T>> {
    const timeout = options?.timeoutMs ?? this.timeoutMs;
    const userSignal = options?.signal;

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, timeout);

    // Why: AbortSignal.any() releases its listeners; hand-wired abort listeners leak one per request.
    const combinedSignal =
      userSignal === undefined ? timeoutController.signal : AbortSignal.any([userSignal, timeoutController.signal]);

    try {
      const response = await this.executeRequest<T>(tasks, combinedSignal);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      const wasUserCancelled = userSignal?.aborted === true;
      throw redactError(wrapRequestError(error, timeout, wasUserCancelled), this.apiKey);
    }
  }

  private async executeRequest<T>(tasks: readonly BaseTaskRequest[], signal: AbortSignal): Promise<RunwareResponse<T>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(tasks),
      signal,
    });

    if (!response.ok) {
      throw await createHttpError(response);
    }

    // biome-ignore lint/nursery/noUnsafeTypeAssertion: T is the caller-declared task result; Runware publishes no per-task response schema to validate against.
    const result = (await response.json()) as RunwareResponse<T>;

    if (result.errors !== undefined && result.errors.length > 0) {
      throw createApiLevelError(result.errors);
    }

    return result;
  }

  // Holds: Rejects an empty data array, so async submissions must go through request() instead.
  async requestSingle<T>(task: BaseTaskRequest, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>([task], options);

    if (response.data.length === 0) {
      throw new RunwareApiError('API returned no results');
    }

    const firstResult = response.data[0];
    if (firstResult === undefined) {
      throw new RunwareApiError('API returned undefined result');
    }

    return firstResult;
  }
}

export function createRunwareClient(options?: Partial<Omit<RunwareClientOptions, 'apiKey'>>): RunwareClient {
  return new RunwareClient({
    apiKey: config.RUNWARE_API_KEY,
    ...options,
  });
}

let defaultClient: RunwareClient | undefined;

export function getDefaultClient(): RunwareClient {
  defaultClient ??= createRunwareClient();
  return defaultClient;
}

export function createTaskRequest<T extends Record<string, unknown>>(
  taskType: string,
  params: T,
): BaseTaskRequest & T & { taskUUID: TaskUUID } {
  return {
    ...params,
    taskType,
    taskUUID: createTaskUUID(randomUUID()),
  };
}
