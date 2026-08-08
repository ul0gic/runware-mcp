/** JSON-RPC 2.0 reserves -32700..-32600; MCP-specific errors use -32001..-32099; app errors use -32100..-32199. */
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32_700,
  INVALID_REQUEST: -32_600,
  METHOD_NOT_FOUND: -32_601,
  INVALID_PARAMS: -32_602,
  INTERNAL_ERROR: -32_603,

  TOOL_NOT_FOUND: -32_001,
  RESOURCE_NOT_FOUND: -32_002,
  PROMPT_NOT_FOUND: -32_003,
  CAPABILITY_NOT_SUPPORTED: -32_004,

  RUNWARE_API_ERROR: -32_100,
  RATE_LIMIT_EXCEEDED: -32_101,
  FILE_TOO_LARGE: -32_102,
  INVALID_FILE_TYPE: -32_103,
  PATH_TRAVERSAL_DETECTED: -32_104,
  POLL_TIMEOUT: -32_105,
  GENERATION_FAILED: -32_106,
  BATCH_PARTIAL_FAILURE: -32_108,
  FOLDER_NOT_FOUND: -32_109,
  PROVIDER_NOT_SUPPORTED: -32_110,
} as const;

export type McpErrorCode = (typeof MCP_ERROR_CODES)[keyof typeof MCP_ERROR_CODES];

export abstract class McpError extends Error {
  abstract readonly code: McpErrorCode;
  abstract readonly data?: Readonly<Record<string, unknown>>;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  toJsonRpcError(): Readonly<{
    code: McpErrorCode;
    message: string;
    data?: Readonly<Record<string, unknown>>;
  }> {
    return {
      code: this.code,
      message: this.message,
      ...(this.data !== undefined && { data: this.data }),
    };
  }
}

export class RunwareApiError extends McpError {
  readonly code = MCP_ERROR_CODES.RUNWARE_API_ERROR;
  readonly data: Readonly<{
    apiCode?: string;
    taskUUID?: string;
    statusCode?: number;
  }>;

  constructor(
    message: string,
    options?: {
      apiCode?: string;
      taskUUID?: string;
      statusCode?: number;
    },
  ) {
    super(message);
    this.data = {
      ...(options?.apiCode !== undefined && { apiCode: options.apiCode }),
      ...(options?.taskUUID !== undefined && { taskUUID: options.taskUUID }),
      ...(options?.statusCode !== undefined && { statusCode: options.statusCode }),
    };
  }
}

export class GenerationFailedError extends McpError {
  readonly code = MCP_ERROR_CODES.GENERATION_FAILED;
  readonly data: Readonly<{
    taskType: string;
    taskUUID: string;
    reason?: string;
  }>;

  constructor(
    message: string,
    options: {
      taskType: string;
      taskUUID: string;
      reason?: string;
    },
  ) {
    super(message);
    this.data = {
      taskType: options.taskType,
      taskUUID: options.taskUUID,
      ...(options.reason !== undefined && { reason: options.reason }),
    };
  }
}

export class PollTimeoutError extends McpError {
  readonly code = MCP_ERROR_CODES.POLL_TIMEOUT;
  readonly data: Readonly<{
    taskUUID: string;
    attempts: number;
    elapsedMs: number;
  }>;

  constructor(
    message: string,
    options: {
      taskUUID: string;
      attempts: number;
      elapsedMs: number;
    },
  ) {
    super(message);
    this.data = {
      taskUUID: options.taskUUID,
      attempts: options.attempts,
      elapsedMs: options.elapsedMs,
    };
  }
}

export class RateLimitError extends McpError {
  readonly code = MCP_ERROR_CODES.RATE_LIMIT_EXCEEDED;
  readonly data: Readonly<{
    retryAfterMs: number;
  }>;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.data = { retryAfterMs };
  }
}

export class FileError extends McpError {
  readonly code = MCP_ERROR_CODES.INVALID_FILE_TYPE;
  readonly data: Readonly<{
    filePath?: string;
    reason: string;
  }>;

  constructor(
    message: string,
    options: {
      filePath?: string;
      reason: string;
    },
  ) {
    super(message);
    this.data = {
      ...(options.filePath !== undefined && { filePath: options.filePath }),
      reason: options.reason,
    };
  }
}

export class FileTooLargeError extends McpError {
  readonly code = MCP_ERROR_CODES.FILE_TOO_LARGE;
  readonly data: Readonly<{
    filePath?: string;
    sizeBytes: number;
    maxSizeBytes: number;
  }>;

  constructor(
    message: string,
    options: {
      filePath?: string;
      sizeBytes: number;
      maxSizeBytes: number;
    },
  ) {
    super(message);
    this.data = {
      ...(options.filePath !== undefined && { filePath: options.filePath }),
      sizeBytes: options.sizeBytes,
      maxSizeBytes: options.maxSizeBytes,
    };
  }
}

/** resolvedPath is kept server-side only (not in data) to avoid exposing internal filesystem structure to clients. */
export class PathTraversalError extends McpError {
  readonly code = MCP_ERROR_CODES.PATH_TRAVERSAL_DETECTED;
  readonly data: Readonly<{
    requestedPath: string;
  }>;

  readonly resolvedPath: string;

  constructor(
    message: string,
    options: {
      requestedPath: string;
      resolvedPath: string;
    },
  ) {
    super(message);
    this.resolvedPath = options.resolvedPath;
    this.data = {
      requestedPath: options.requestedPath,
    };
  }
}

export class FolderNotFoundError extends McpError {
  readonly code = MCP_ERROR_CODES.FOLDER_NOT_FOUND;
  readonly data: Readonly<{
    folderPath: string;
  }>;

  constructor(message: string, folderPath: string) {
    super(message);
    this.data = { folderPath };
  }
}

export interface BatchItemResult {
  readonly index: number;
  readonly success: boolean;
  readonly error?: string;
  readonly data?: unknown;
}

export class BatchPartialFailureError extends McpError {
  readonly code = MCP_ERROR_CODES.BATCH_PARTIAL_FAILURE;
  readonly data: Readonly<{
    totalItems: number;
    successCount: number;
    failureCount: number;
    results: readonly BatchItemResult[];
  }>;

  constructor(
    message: string,
    options: {
      totalItems: number;
      successCount: number;
      failureCount: number;
      results: readonly BatchItemResult[];
    },
  ) {
    super(message);
    this.data = {
      totalItems: options.totalItems,
      successCount: options.successCount,
      failureCount: options.failureCount,
      results: options.results,
    };
  }
}

export class ProviderNotSupportedError extends McpError {
  readonly code = MCP_ERROR_CODES.PROVIDER_NOT_SUPPORTED;
  readonly data: Readonly<{
    provider: string;
    operation: string;
    supportedProviders?: readonly string[];
  }>;

  constructor(
    message: string,
    options: {
      provider: string;
      operation: string;
      supportedProviders?: readonly string[];
    },
  ) {
    super(message);
    this.data = {
      provider: options.provider,
      operation: options.operation,
      ...(options.supportedProviders !== undefined && {
        supportedProviders: options.supportedProviders,
      }),
    };
  }
}

export class ToolNotFoundError extends McpError {
  readonly code = MCP_ERROR_CODES.TOOL_NOT_FOUND;
  readonly data: Readonly<{
    toolName: string;
  }>;

  constructor(toolName: string) {
    super(`Tool not found: ${toolName}`);
    this.data = { toolName };
  }
}

export class ResourceNotFoundError extends McpError {
  readonly code = MCP_ERROR_CODES.RESOURCE_NOT_FOUND;
  readonly data: Readonly<{
    uri: string;
  }>;

  constructor(uri: string) {
    super(`Resource not found: ${uri}`);
    this.data = { uri };
  }
}

export class InvalidParamsError extends McpError {
  readonly code = MCP_ERROR_CODES.INVALID_PARAMS;
  readonly data: Readonly<{
    errors: readonly string[];
  }>;

  constructor(message: string, errors: readonly string[]) {
    super(message);
    this.data = { errors };
  }
}

export function isMcpError(error: unknown): error is McpError {
  return error instanceof McpError;
}

/** If error is already an McpError it's returned unchanged; otherwise it's wrapped in a RunwareApiError. */
export function wrapError(error: unknown): McpError {
  if (isMcpError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new RunwareApiError(error.message);
  }

  return new RunwareApiError(String(error));
}
