/**
 * Runware API client module.
 *
 * Type-safe HTTP client for the Runware API using native fetch.
 * Handles authentication, request formatting, and error handling.
 */

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

// ============================================================================
// Client Types
// ============================================================================

/**
 * Options for the Runware client.
 */
export interface RunwareClientOptions {
  /**
   * API key for authentication.
   */
  readonly apiKey: ApiKey;

  /**
   * Request timeout in milliseconds.
   * Defaults to config.REQUEST_TIMEOUT_MS.
   */
  readonly timeoutMs?: number;

  /**
   * Base URL for the API.
   * Defaults to the official API endpoint.
   */
  readonly baseUrl?: string;
}

/**
 * Request options for individual API calls.
 */
export interface RequestOptions {
  /**
   * Abort signal for cancellation.
   */
  readonly signal?: AbortSignal;

  /**
   * Custom timeout for this request (overrides client default).
   */
  readonly timeoutMs?: number;
}

// ============================================================================
// Error Handling Helpers
// ============================================================================

/**
 * Wraps an error caught during a request into a RunwareApiError.
 */
function wrapRequestError(
  error: unknown,
  timeout: number,
  wasUserCancelled: boolean,
): RunwareApiError {
  // Re-throw McpErrors as-is
  if (error instanceof RunwareApiError) {
    return error;
  }

  // Handle abort errors
  if (error instanceof Error && error.name === 'AbortError') {
    if (wasUserCancelled) {
      return new RunwareApiError('Request was cancelled');
    }
    return new RunwareApiError(`Request timed out after ${String(timeout)}ms`);
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new RunwareApiError('Network error: Unable to connect to Runware API');
  }

  // Wrap unknown errors
  const message = error instanceof Error ? error.message : String(error);
  return new RunwareApiError(message);
}

/**
 * Creates an error from an HTTP response.
 */
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

/**
 * Creates an error from API-level errors in the response.
 */
function createApiLevelError(errors: readonly { message: string; code?: string; taskUUID?: string }[]): RunwareApiError {
  const firstError = errors[0];
  return new RunwareApiError(firstError?.message ?? 'Unknown API error', {
    apiCode: firstError?.code,
    taskUUID: firstError?.taskUUID,
  });
}

// ============================================================================
// Runware Client Class
// ============================================================================

/**
 * Type-safe client for the Runware API.
 *
 * Uses native fetch with proper timeout handling, error wrapping,
 * and typed responses.
 */
export class RunwareClient {
  private readonly apiKey: ApiKey;
  private readonly timeoutMs: number;
  private readonly baseUrl: string;

  constructor(options: RunwareClientOptions) {
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? config.REQUEST_TIMEOUT_MS;
    this.baseUrl = options.baseUrl ?? API_BASE_URL;
  }

  /**
   * Generates a new TaskUUID for request tracking.
   */
  generateTaskUUID(): TaskUUID {
    return createTaskUUID(randomUUID());
  }

  /**
   * Makes a typed request to the Runware API.
   *
   * @param tasks - Array of task objects to send
   * @param options - Optional request configuration
   * @returns Typed API response
   * @throws RunwareApiError on API errors or network failures
   */
  async request<T>(
    tasks: readonly BaseTaskRequest[],
    options?: RequestOptions,
  ): Promise<RunwareResponse<T>> {
    const timeout = options?.timeoutMs ?? this.timeoutMs;
    const userSignal = options?.signal;

    // Create an abort controller for timeout
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, timeout);

    // Combine user signal with timeout signal
    const combinedSignal = userSignal === undefined
      ? timeoutController.signal
      : this.combineAbortSignals(userSignal, timeoutController.signal);

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

  /**
   * Executes the HTTP request and processes the response.
   */
  private async executeRequest<T>(
    tasks: readonly BaseTaskRequest[],
    signal: AbortSignal,
  ): Promise<RunwareResponse<T>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${String(this.apiKey)}`,
      },
      body: JSON.stringify(tasks),
      signal,
    });

    // Handle HTTP errors
    if (!response.ok) {
      throw await createHttpError(response);
    }

    // Parse response
    const result = (await response.json()) as RunwareResponse<T>;

    // Check for API-level errors
    if (result.errors !== undefined && result.errors.length > 0) {
      throw createApiLevelError(result.errors);
    }

    return result;
  }

  /**
   * Makes a single-task request and returns the first result.
   *
   * @param task - Single task object to send
   * @param options - Optional request configuration
   * @returns The first result from the response
   * @throws RunwareApiError if no results are returned
   */
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

  /**
   * Combines multiple abort signals into one.
   * The combined signal aborts when any of the input signals abort.
   */
  private combineAbortSignals(...signals: readonly AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        return controller.signal;
      }

      signal.addEventListener(
        'abort',
        () => {
          controller.abort(signal.reason);
        },
        { once: true },
      );
    }

    return controller.signal;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a new Runware client with the default configuration.
 *
 * Uses the API key from environment configuration.
 *
 * @param options - Optional overrides for client configuration
 * @returns Configured RunwareClient instance
 */
export function createRunwareClient(
  options?: Partial<Omit<RunwareClientOptions, 'apiKey'>>,
): RunwareClient {
  return new RunwareClient({
    apiKey: config.RUNWARE_API_KEY,
    ...options,
  });
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Lazy-initialized singleton client instance.
 * Created on first access to avoid import-time side effects.
 */
let defaultClient: RunwareClient | undefined;

/**
 * Gets the default Runware client instance.
 *
 * Creates the client on first access. Uses the API key from
 * environment configuration.
 *
 * @returns The default RunwareClient instance
 */
export function getDefaultClient(): RunwareClient {
  defaultClient ??= createRunwareClient();
  return defaultClient;
}

// ============================================================================
// Request Helpers
// ============================================================================

/**
 * Creates a task request object with auto-generated UUID.
 *
 * @param taskType - The type of task to create
 * @param params - Additional parameters for the task
 * @returns Task request object with generated UUID
 */
export function createTaskRequest<T extends Record<string, unknown>>(
  taskType: string,
  params: T,
): BaseTaskRequest & T & { taskUUID: string } {
  return {
    taskType,
    taskUUID: randomUUID(),
    ...params,
  };
}
