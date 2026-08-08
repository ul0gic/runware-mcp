import { randomUUID } from 'node:crypto';

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

  /** Defaults to config.REQUEST_TIMEOUT_MS. */
  readonly timeoutMs?: number;

  /** Defaults to the official API endpoint. */
  readonly baseUrl?: string;
}

export interface RequestOptions {
  readonly signal?: AbortSignal;

  /** Overrides the client default for this request only. */
  readonly timeoutMs?: number;
}

function wrapRequestError(
  error: unknown,
  timeout: number,
  wasUserCancelled: boolean,
): RunwareApiError {
  if (error instanceof RunwareApiError) {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    if (wasUserCancelled) {
      return new RunwareApiError('Request was cancelled');
    }
    return new RunwareApiError(`Request timed out after ${String(timeout)}ms`);
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new RunwareApiError('Network error: Unable to connect to Runware API');
  }

  const message = error instanceof Error ? error.message : String(error);
  return new RunwareApiError(message);
}

async function createHttpError(response: Response): Promise<RunwareApiError> {
  const errorText = await response.text().catch(() => 'Unknown error');
  return new RunwareApiError(
    `API request failed: ${String(response.status)} ${response.statusText}`,
    {
      statusCode: response.status,
      apiCode: errorText,
    },
  );
}

function createApiLevelError(errors: readonly { message: string; code?: string; taskUUID?: string }[]): RunwareApiError {
  const firstError = errors[0];
  return new RunwareApiError(firstError?.message ?? 'Unknown API error', {
    apiCode: firstError?.code,
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

  /** Throws RunwareApiError on API errors, network failures, timeout, or cancellation. */
  async request<T>(
    tasks: readonly BaseTaskRequest[],
    options?: RequestOptions,
  ): Promise<RunwareResponse<T>> {
    const timeout = options?.timeoutMs ?? this.timeoutMs;
    const userSignal = options?.signal;

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, timeout);

    // AbortSignal.any() (Node >= 20) tears down its listeners correctly; manual listener wiring leaks.
    const combinedSignal = userSignal === undefined
      ? timeoutController.signal
      : AbortSignal.any([userSignal, timeoutController.signal]);

    try {
      const response = await this.executeRequest<T>(tasks, combinedSignal);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      const wasUserCancelled = userSignal?.aborted === true;
      throw wrapRequestError(error, timeout, wasUserCancelled);
    }
  }

  private async executeRequest<T>(
    tasks: readonly BaseTaskRequest[],
    signal: AbortSignal,
  ): Promise<RunwareResponse<T>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- HTTP header names are not camelCase by spec
        'Content-Type': 'application/json',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- HTTP header names are not camelCase by spec
        Authorization: `Bearer ${String(this.apiKey)}`,
      },
      body: JSON.stringify(tasks),
      signal,
    });

    if (!response.ok) {
      throw await createHttpError(response);
    }

    const result = (await response.json()) as RunwareResponse<T>;

    if (result.errors !== undefined && result.errors.length > 0) {
      throw createApiLevelError(result.errors);
    }

    return result;
  }

  /** Throws RunwareApiError when the response carries no result — unsuitable for async submissions that return an empty data array. */
  async requestSingle<T>(
    task: BaseTaskRequest,
    options?: RequestOptions,
  ): Promise<T> {
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

/** Uses the API key from environment configuration. */
export function createRunwareClient(
  options?: Partial<Omit<RunwareClientOptions, 'apiKey'>>,
): RunwareClient {
  return new RunwareClient({
    apiKey: config.RUNWARE_API_KEY,
    ...options,
  });
}

let defaultClient: RunwareClient | undefined;

/** Constructed on first call, not at import time, so importing this module has no config side effects. */
export function getDefaultClient(): RunwareClient {
  defaultClient ??= createRunwareClient();
  return defaultClient;
}

export function createTaskRequest<T extends Record<string, unknown>>(
  taskType: string,
  params: T,
): BaseTaskRequest & T & { taskUUID: string } {
  return {
    ...params,
    taskType,
    taskUUID: randomUUID(),
  };
}
