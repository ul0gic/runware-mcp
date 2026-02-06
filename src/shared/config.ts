/**
 * Configuration module for the Runware MCP server.
 *
 * Uses Zod for runtime validation of environment variables.
 * Fails fast at import time if required configuration is missing or invalid.
 */

import * as process from 'node:process';

import { z } from 'zod';

import { type ApiKey, createApiKey } from './types.js';

// ============================================================================
// Environment Schema
// ============================================================================

/**
 * Log levels supported by the server.
 */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Node environment modes.
 */
export const NODE_ENVIRONMENTS = ['development', 'production', 'test'] as const;
export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

/**
 * Splits a comma-separated string into an array of trimmed, non-empty strings.
 */
function splitCommaSeparated(value: string): string[] {
  return value.split(',').filter((path) => path.trim().length > 0);
}

/**
 * Zod schema for environment variable validation.
 * All environment variables are validated at server startup.
 */
const envSchema = z.object({
  // ========================================================================
  // Required Configuration
  // ========================================================================

  /**
   * Runware API key for authentication.
   * Must be at least 32 characters.
   */
  RUNWARE_API_KEY: z
    .string()
    .min(32, 'RUNWARE_API_KEY appears to be too short (minimum 32 characters)')
    .transform((key): ApiKey => createApiKey(key)),

  // ========================================================================
  // Server Configuration
  // ========================================================================

  /**
   * Node environment mode.
   * Affects logging verbosity and error detail.
   */
  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('production'),

  /**
   * Minimum log level to output.
   */
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),

  // ========================================================================
  // File Handling
  // ========================================================================

  /**
   * Maximum file size in megabytes for uploads.
   */
  MAX_FILE_SIZE_MB: z.coerce
    .number()
    .int('MAX_FILE_SIZE_MB must be an integer')
    .min(1, 'MAX_FILE_SIZE_MB must be at least 1')
    .max(100, 'MAX_FILE_SIZE_MB cannot exceed 100')
    .default(50),

  /**
   * Comma-separated list of allowed file system roots.
   * If empty, defaults to common safe paths.
   */
  ALLOWED_FILE_ROOTS: z
    .string()
    .default('')
    .transform(splitCommaSeparated),

  // ========================================================================
  // API Configuration
  // ========================================================================

  /**
   * Request timeout in milliseconds.
   * Applies to individual API calls, not polling sequences.
   */
  REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int('REQUEST_TIMEOUT_MS must be an integer')
    .min(1000, 'REQUEST_TIMEOUT_MS must be at least 1000ms')
    .max(300_000, 'REQUEST_TIMEOUT_MS cannot exceed 300000ms (5 minutes)')
    .default(60_000),

  /**
   * Maximum polling attempts for async operations.
   * With exponential backoff, this determines total wait time.
   */
  POLL_MAX_ATTEMPTS: z.coerce
    .number()
    .int('POLL_MAX_ATTEMPTS must be an integer')
    .min(10, 'POLL_MAX_ATTEMPTS must be at least 10')
    .max(500, 'POLL_MAX_ATTEMPTS cannot exceed 500')
    .default(150),

  // ========================================================================
  // Rate Limiting
  // ========================================================================

  /**
   * Maximum tokens in the rate limit bucket.
   * Determines burst capacity.
   */
  RATE_LIMIT_MAX_TOKENS: z.coerce
    .number()
    .int('RATE_LIMIT_MAX_TOKENS must be an integer')
    .min(1, 'RATE_LIMIT_MAX_TOKENS must be at least 1')
    .max(100, 'RATE_LIMIT_MAX_TOKENS cannot exceed 100')
    .default(10),

  /**
   * Token refill rate per second.
   * Determines sustained request rate.
   */
  RATE_LIMIT_REFILL_RATE: z.coerce
    .number()
    .min(0.1, 'RATE_LIMIT_REFILL_RATE must be at least 0.1')
    .max(10, 'RATE_LIMIT_REFILL_RATE cannot exceed 10')
    .default(1),

  // ========================================================================
  // Folder Watching
  // ========================================================================

  /**
   * Comma-separated list of folders to watch for new files.
   */
  WATCH_FOLDERS: z
    .string()
    .default('')
    .transform(splitCommaSeparated),

  /**
   * Debounce time in milliseconds for folder watch events.
   * Prevents processing the same file multiple times during rapid changes.
   */
  WATCH_DEBOUNCE_MS: z.coerce
    .number()
    .int('WATCH_DEBOUNCE_MS must be an integer')
    .min(100, 'WATCH_DEBOUNCE_MS must be at least 100ms')
    .max(5000, 'WATCH_DEBOUNCE_MS cannot exceed 5000ms')
    .default(500),
});

/**
 * Inferred TypeScript type from the Zod schema.
 */
export type Config = z.infer<typeof envSchema>;

// ============================================================================
// Configuration Validation
// ============================================================================

/**
 * Validates environment variables against the schema.
 * Throws a detailed error if validation fails.
 */
function validateConfig(): Config {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `  - ${path}: ${issue.message}`;
    });

    const errorMessage = [
      'Configuration validation failed:',
      ...errors,
      '',
      'Please check your environment variables and try again.',
      'Required: RUNWARE_API_KEY (get your key at https://runware.ai)',
    ].join('\n');

    throw new Error(errorMessage);
  }

  return result.data;
}

// ============================================================================
// Configuration Singleton
// ============================================================================

/**
 * Validated configuration singleton.
 *
 * This is evaluated at module import time, which means the server
 * will fail to start if configuration is invalid. This is intentional -
 * we want to fail fast rather than encounter config errors at runtime.
 */
export const config: Config = validateConfig();

// ============================================================================
// Configuration Helpers
// ============================================================================

/**
 * Runware API base URL.
 * Not configurable - this is the official API endpoint.
 */
export const API_BASE_URL = 'https://api.runware.ai/v1';

/**
 * Runware WebSocket base URL for future streaming support.
 */
export const WS_BASE_URL = 'wss://ws-api.runware.ai/v1';

/**
 * Default polling interval in milliseconds.
 * Used as the starting point for exponential backoff.
 */
export const DEFAULT_POLL_INTERVAL_MS = 2000;

/**
 * Maximum polling interval in milliseconds.
 * Caps exponential backoff to prevent excessive wait times.
 */
export const MAX_POLL_INTERVAL_MS = 10_000;

/**
 * Maximum file size in bytes, derived from config.
 */
export function getMaxFileSizeBytes(): number {
  return config.MAX_FILE_SIZE_MB * 1024 * 1024;
}

/**
 * Checks if the server is running in development mode.
 */
export function isDevelopment(): boolean {
  return config.NODE_ENV === 'development';
}

/**
 * Checks if the server is running in production mode.
 */
export function isProduction(): boolean {
  return config.NODE_ENV === 'production';
}

/**
 * Checks if the server is running in test mode.
 */
export function isTest(): boolean {
  return config.NODE_ENV === 'test';
}

/**
 * Checks if a given log level should be output based on config.
 */
export function shouldLog(level: LogLevel): boolean {
  const levels: readonly LogLevel[] = LOG_LEVELS;
  const configLevelIndex = levels.indexOf(config.LOG_LEVEL);
  const messageLevelIndex = levels.indexOf(level);
  return messageLevelIndex >= configLevelIndex;
}
