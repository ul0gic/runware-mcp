import * as process from 'node:process';

import { z } from 'zod';

import { type ApiKey, createApiKey } from './types.js';

/** Ordered least to most severe — shouldLog compares by index. */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const NODE_ENVIRONMENTS = ['development', 'production', 'test'] as const;
export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

function splitCommaSeparated(value: string): string[] {
  return value.split(',').filter((path) => path.trim().length > 0);
}

const envSchema = z.object({
  RUNWARE_API_KEY: z
    .string()
    .min(32, 'RUNWARE_API_KEY appears to be too short (minimum 32 characters)')
    .transform((key): ApiKey => createApiKey(key)),

  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('production'),

  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),

  MAX_FILE_SIZE_MB: z.coerce
    .number()
    .int('MAX_FILE_SIZE_MB must be an integer')
    .min(1, 'MAX_FILE_SIZE_MB must be at least 1')
    .max(100, 'MAX_FILE_SIZE_MB cannot exceed 100')
    .default(50),

  /** Empty falls back to the default roots in file-utils. */
  ALLOWED_FILE_ROOTS: z
    .string()
    .default('')
    .transform(splitCommaSeparated),

  /** Applies to individual API calls, not to a whole polling sequence. */
  REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int('REQUEST_TIMEOUT_MS must be an integer')
    .min(1000, 'REQUEST_TIMEOUT_MS must be at least 1000ms')
    .max(300_000, 'REQUEST_TIMEOUT_MS cannot exceed 300000ms (5 minutes)')
    .default(60_000),

  /** Combined with exponential backoff, this sets the total wait ceiling. */
  POLL_MAX_ATTEMPTS: z.coerce
    .number()
    .int('POLL_MAX_ATTEMPTS must be an integer')
    .min(10, 'POLL_MAX_ATTEMPTS must be at least 10')
    .max(500, 'POLL_MAX_ATTEMPTS cannot exceed 500')
    .default(150),

  RATE_LIMIT_MAX_TOKENS: z.coerce
    .number()
    .int('RATE_LIMIT_MAX_TOKENS must be an integer')
    .min(1, 'RATE_LIMIT_MAX_TOKENS must be at least 1')
    .max(100, 'RATE_LIMIT_MAX_TOKENS cannot exceed 100')
    .default(10),

  /** Tokens per second — the sustained request rate. */
  RATE_LIMIT_REFILL_RATE: z.coerce
    .number()
    .min(0.1, 'RATE_LIMIT_REFILL_RATE must be at least 0.1')
    .max(10, 'RATE_LIMIT_REFILL_RATE cannot exceed 10')
    .default(1),

  WATCH_FOLDERS: z
    .string()
    .default('')
    .transform(splitCommaSeparated),

  WATCH_DEBOUNCE_MS: z.coerce
    .number()
    .int('WATCH_DEBOUNCE_MS must be an integer')
    .min(100, 'WATCH_DEBOUNCE_MS must be at least 100ms')
    .max(5000, 'WATCH_DEBOUNCE_MS cannot exceed 5000ms')
    .default(500),
});

export type Config = z.infer<typeof envSchema>;

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

/** Runs at import time so invalid config fails startup rather than surfacing mid-request; tests must mock this module before importing consumers. */
export const config: Config = validateConfig();

export const API_BASE_URL = 'https://api.runware.ai/v1';

/** Not yet wired up — reserved for streaming support. */
export const WS_BASE_URL = 'wss://ws-api.runware.ai/v1';

export const DEFAULT_POLL_INTERVAL_MS = 2000;

export const MAX_POLL_INTERVAL_MS = 10_000;

export function getMaxFileSizeBytes(): number {
  return config.MAX_FILE_SIZE_MB * 1024 * 1024;
}

export function isDevelopment(): boolean {
  return config.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return config.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return config.NODE_ENV === 'test';
}

export function shouldLog(level: LogLevel): boolean {
  const levels: readonly LogLevel[] = LOG_LEVELS;
  const configLevelIndex = levels.indexOf(config.LOG_LEVEL);
  const messageLevelIndex = levels.indexOf(level);
  return messageLevelIndex >= configLevelIndex;
}
