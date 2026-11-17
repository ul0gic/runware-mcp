// Does:  Parses and validates the environment configuration once, when this module is first imported.
// Holds: Importing this module throws on any missing or invalid variable, so `config` always satisfies envSchema.

import process from 'node:process';

import { z } from 'zod';

import { type ApiKey, createApiKey } from './types.js';

// Holds: Ordered least to most severe; shouldLog compares by index.
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

const NODE_ENVIRONMENTS = ['development', 'production', 'test'] as const;

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

  // Holds: An empty list makes file-utils fall back to its default home-directory roots.
  ALLOWED_FILE_ROOTS: z.string().default('').transform(splitCommaSeparated),

  // Holds: Bounds each API call alone, never a whole polling sequence.
  REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int('REQUEST_TIMEOUT_MS must be an integer')
    .min(1000, 'REQUEST_TIMEOUT_MS must be at least 1000ms')
    .max(300_000, 'REQUEST_TIMEOUT_MS cannot exceed 300000ms (5 minutes)')
    .default(60_000),

  // Holds: With the polling backoff this is the only bound on total poll time; there is no wall-clock limit.
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

  // Holds: Tokens per second, the sustained request rate.
  RATE_LIMIT_REFILL_RATE: z.coerce
    .number()
    .min(0.1, 'RATE_LIMIT_REFILL_RATE must be at least 0.1')
    .max(10, 'RATE_LIMIT_REFILL_RATE cannot exceed 10')
    .default(1),

  WATCH_FOLDERS: z.string().default('').transform(splitCommaSeparated),

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

// Why: Validating at import fails startup instead of mid-request; tests must mock this module before its importers.
export const config: Config = validateConfig();

export const API_BASE_URL = 'https://api.runware.ai/v1';

export const DEFAULT_POLL_INTERVAL_MS = 2000;

export const MAX_POLL_INTERVAL_MS = 10_000;

export function getMaxFileSizeBytes(): number {
  return config.MAX_FILE_SIZE_MB * 1024 * 1024;
}
