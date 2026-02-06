/**
 * Error module for the Runware MCP server.
 *
 * Defines MCP-compliant error codes and a type-safe error hierarchy.
 * All errors include proper error codes for JSON-RPC 2.0 compliance.
 */

// ============================================================================
// MCP Error Codes
// ============================================================================

/**
 * Standard JSON-RPC 2.0 and MCP error codes.
 *
 * -32700 to -32600: Reserved for JSON-RPC 2.0
 * -32099 to -32000: Reserved for implementation-defined server errors
 * -32001 to -32099: Reserved for MCP-specific errors
 * -32100 to -32199: Application-specific errors
 */
export const MCP_ERROR_CODES = {
  // ========================================================================
  // JSON-RPC 2.0 Standard Errors (-32700 to -32600)
  // ========================================================================

  /** Parse error - Invalid JSON was received */
  PARSE_ERROR: -32_700,

  /** Invalid Request - The JSON sent is not a valid Request object */
  INVALID_REQUEST: -32_600,

  /** Method not found - The method does not exist / is not available */
  METHOD_NOT_FOUND: -32_601,

  /** Invalid params - Invalid method parameter(s) */
  INVALID_PARAMS: -32_602,

  /** Internal error - Internal JSON-RPC error */
  INTERNAL_ERROR: -32_603,

  // ========================================================================
  // MCP-Specific Errors (-32001 to -32099)
  // ========================================================================

  /** Tool not found in the server's tool registry */
  TOOL_NOT_FOUND: -32_001,

  /** Resource not found in the server's resource registry */
  RESOURCE_NOT_FOUND: -32_002,

  /** Prompt template not found in the server's prompt registry */
  PROMPT_NOT_FOUND: -32_003,

  /** Capability not supported by this server */
  CAPABILITY_NOT_SUPPORTED: -32_004,

  // ========================================================================
  // Application-Specific Errors (-32100 to -32199)
  // ========================================================================

  /** Error from the Runware API */
  RUNWARE_API_ERROR: -32_100,

  /** Rate limit exceeded - too many requests */
  RATE_LIMIT_EXCEEDED: -32_101,

  /** File exceeds maximum allowed size */
  FILE_TOO_LARGE: -32_102,

  /** File type is not supported */
  INVALID_FILE_TYPE: -32_103,

  /** Attempted path traversal attack detected */
  PATH_TRAVERSAL_DETECTED: -32_104,

  /** Polling for async result timed out */
  POLL_TIMEOUT: -32_105,

  /** Media generation failed */
  GENERATION_FAILED: -32_106,

  /** Batch operation partially failed */
  BATCH_PARTIAL_FAILURE: -32_108,

  /** Specified folder was not found */
  FOLDER_NOT_FOUND: -32_109,

  /** Provider is not supported for this operation */
  PROVIDER_NOT_SUPPORTED: -32_110,
} as const;

/**
 * Type for valid MCP error codes.
 */
export type McpErrorCode = (typeof MCP_ERROR_CODES)[keyof typeof MCP_ERROR_CODES];

// ============================================================================
// Base Error Class
// ============================================================================

/**
 * Abstract base class for all MCP errors.
 *
 * Provides a consistent structure with error codes and optional data.
 * All concrete error classes must extend this.
 */
export abstract class McpError extends Error {
  /**
   * MCP-compliant error code.
   */
  abstract readonly code: McpErrorCode;

  /**
   * Optional additional data about the error.
   */
  abstract readonly data?: Readonly<Record<string, unknown>>;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Converts the error to a JSON-RPC 2.0 error object.
   */
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

// ============================================================================
// API Errors
// ============================================================================

/**
 * Error from the Runware API.
 *
 * Wraps errors returned by the Runware API with additional context.
 */
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

/**
 * Error when media generation fails.
 *
 * Includes details about the failed generation task.
 */
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

/**
 * Error when polling for async result times out.
 */
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

// ============================================================================
// Rate Limiting Errors
// ============================================================================

/**
 * Error when rate limit is exceeded.
 */
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

// ============================================================================
// File Errors
// ============================================================================

/**
 * Base class for file-related errors.
 */
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

/**
 * Error when a file exceeds the maximum allowed size.
 */
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

/**
 * Error when a path traversal attack is detected.
 *
 * This is a security error - the requested path attempted to
 * escape the allowed file roots.
 */
export class PathTraversalError extends McpError {
  readonly code = MCP_ERROR_CODES.PATH_TRAVERSAL_DETECTED;
  readonly data: Readonly<{
    requestedPath: string;
    resolvedPath: string;
  }>;

  constructor(
    message: string,
    options: {
      requestedPath: string;
      resolvedPath: string;
    },
  ) {
    super(message);
    this.data = {
      requestedPath: options.requestedPath,
      resolvedPath: options.resolvedPath,
    };
  }
}

/**
 * Error when a folder is not found.
 */
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

// ============================================================================
// Batch Processing Errors
// ============================================================================

/**
 * Result of a single item in a batch operation.
 */
export interface BatchItemResult {
  readonly index: number;
  readonly success: boolean;
  readonly error?: string;
  readonly data?: unknown;
}

/**
 * Error when a batch operation partially fails.
 *
 * Includes details about which items succeeded and which failed.
 */
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

// ============================================================================
// Provider Errors
// ============================================================================

/**
 * Error when a provider is not supported for an operation.
 */
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

// ============================================================================
// MCP Protocol Errors
// ============================================================================

/**
 * Error when a tool is not found.
 */
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

/**
 * Error when a resource is not found.
 */
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

/**
 * Error when invalid parameters are provided.
 */
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

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Type guard to check if an error is an McpError.
 */
export function isMcpError(error: unknown): error is McpError {
  return error instanceof McpError;
}

/**
 * Wraps an unknown error into an McpError.
 *
 * If the error is already an McpError, returns it unchanged.
 * Otherwise, wraps it in a RunwareApiError with the original message.
 */
export function wrapError(error: unknown): McpError {
  if (isMcpError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new RunwareApiError(error.message);
  }

  return new RunwareApiError(String(error));
}
