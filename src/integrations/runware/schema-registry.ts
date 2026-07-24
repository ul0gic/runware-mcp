/**
 * Fetches and caches live per-model JSON Schemas from Runware.
 */

const SCHEMAS_BASE_URL = 'https://schemas.runware.ai';
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const REQUEST_TIMEOUT_MS = 10_000;
const INTERNAL_FIELDS = new Set([
  'taskType',
  'taskUUID',
  'webhookURL',
  'uploadEndpoint',
  'deliveryMethod',
]);

export interface JsonSchema {
  readonly [key: string]: unknown;
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  readonly required?: readonly string[];
}

interface SchemaEnvelope {
  readonly requestSchema?: JsonSchema;
}

interface CacheEntry {
  readonly expiresAt: number;
  readonly resolution: ModelSchemaResolution;
}

const cache = new Map<string, CacheEntry>();

export interface ModelSchemaResolution {
  readonly schema: JsonSchema;
  readonly taskType?: string;
}

function inferTaskType(schema: JsonSchema): string | undefined {
  const taskTypeSchema = schema.properties?.taskType;
  if (taskTypeSchema === undefined) {
    return undefined;
  }

  if (typeof taskTypeSchema.const === 'string') {
    return taskTypeSchema.const;
  }
  if (typeof taskTypeSchema.default === 'string') {
    return taskTypeSchema.default;
  }
  if (
    Array.isArray(taskTypeSchema.enum)
    && taskTypeSchema.enum.length === 1
    && typeof taskTypeSchema.enum[0] === 'string'
  ) {
    return taskTypeSchema.enum[0];
  }
  return undefined;
}

function cleanSchema(schema: JsonSchema): JsonSchema {
  const properties = schema.properties === undefined
    ? undefined
    : Object.fromEntries(
      Object.entries(schema.properties).filter(([name]) => !INTERNAL_FIELDS.has(name)),
    );
  const required = schema.required?.filter(
    (name) => name !== 'taskType' && name !== 'taskUUID',
  );

  const rest: Record<string, unknown> = { ...schema };
  delete rest.$schema;
  delete rest.$id;

  return {
    ...rest,
    ...(properties !== undefined && { properties }),
    ...(required !== undefined && { required }),
  };
}

export async function getModelSchema(
  model: string,
  signal?: AbortSignal,
): Promise<JsonSchema | undefined> {
  const resolution = await resolveModelSchema(model, signal);
  return resolution?.schema;
}

export async function resolveModelSchema(
  model: string,
  signal?: AbortSignal,
): Promise<ModelSchemaResolution | undefined> {
  const cached = cache.get(model);
  if (cached !== undefined && cached.expiresAt > Date.now()) {
    return cached.resolution;
  }

  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combinedSignal = signal === undefined
    ? timeoutSignal
    : AbortSignal.any([signal, timeoutSignal]);
  const response = await fetch(
    `${SCHEMAS_BASE_URL}/resolve/${encodeURIComponent(model)}`,
    { headers: { accept: 'application/json' }, signal: combinedSignal },
  );

  if (response.status === 404) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(`Runware schema service returned HTTP ${String(response.status)}`);
  }

  const envelope = await response.json() as SchemaEnvelope;
  if (envelope.requestSchema === undefined) {
    return undefined;
  }

  const resolution = {
    schema: cleanSchema(envelope.requestSchema),
    ...(inferTaskType(envelope.requestSchema) !== undefined && {
      taskType: inferTaskType(envelope.requestSchema),
    }),
  };
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey: unknown = cache.keys().next().value;
    if (typeof oldestKey === 'string') {
      cache.delete(oldestKey);
    }
  }
  cache.set(model, { expiresAt: Date.now() + CACHE_TTL_MS, resolution });
  return resolution;
}

export function clearModelSchemaCache(): void {
  cache.clear();
}
