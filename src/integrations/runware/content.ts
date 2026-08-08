/**
 * Read-only client for Runware's public curated-model content service.
 */

const CONTENT_BASE_URL = 'https://content.runware.ai';
const DEFAULT_TIMEOUT_MS = 10_000;

type ModelCategory = 'image' | 'video' | 'audio' | 'text' | '3d';

export interface ModelListOptions {
  readonly capability?: string;
  readonly category?: ModelCategory;
  readonly creator?: string;
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface CuratedModel {
  readonly air: string;
  readonly model: string;
  readonly name: string;
  readonly headline?: string;
  readonly description?: string;
  readonly category?: string;
  readonly creator?: string;
  readonly capabilities?: readonly string[];
  readonly coverImage?: string;
  readonly pricingOverview?: string;
  readonly status?: string;
  readonly [key: string]: unknown;
}

export interface Capability {
  readonly id: string;
  readonly label: string;
  readonly [key: string]: unknown;
}

function buildQuery(options: ModelListOptions): string {
  const parameters = new URLSearchParams();

  if (options.capability !== undefined) {
    parameters.set('capability', options.capability);
  }
  if (options.category !== undefined) {
    parameters.set('category', options.category);
  }
  if (options.creator !== undefined) {
    parameters.set('creator', options.creator);
  }
  if (options.search !== undefined) {
    parameters.set('q', options.search);
  }
  if (options.limit !== undefined || options.offset !== undefined) {
    parameters.set('paginate', 'true');
  }
  if (options.limit !== undefined) {
    parameters.set('limit', String(options.limit));
  }
  if (options.offset !== undefined) {
    parameters.set('offset', String(options.offset));
  }

  const query = parameters.toString();
  return query.length === 0 ? '' : `?${query}`;
}

async function fetchJson<T>(
  path: string,
  options?: { readonly signal?: AbortSignal; readonly allowNotFound?: boolean },
): Promise<T | undefined> {
  const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
  const signal = options?.signal === undefined
    ? timeoutSignal
    : AbortSignal.any([options.signal, timeoutSignal]);
  const response = await fetch(`${CONTENT_BASE_URL}${path}`, {
    headers: { accept: 'application/json' },
    signal,
  });

  if (response.status === 404 && options?.allowNotFound === true) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(`Runware content service returned HTTP ${String(response.status)}`);
  }

  return await response.json() as T;
}

export async function listCuratedModels(
  options: ModelListOptions = {},
  signal?: AbortSignal,
): Promise<readonly CuratedModel[]> {
  const result = await fetchJson<readonly CuratedModel[] | {
    readonly items: readonly CuratedModel[];
  }>(`/models${buildQuery(options)}`, { signal });

  if (result === undefined) {
    return [];
  }
  return 'items' in result ? result.items : result;
}

export async function getCuratedModel(
  identifier: string,
  signal?: AbortSignal,
): Promise<CuratedModel | undefined> {
  return fetchJson<CuratedModel>(
    `/models/${encodeURIComponent(identifier)}`,
    { signal, allowNotFound: true },
  );
}

export async function getModelExamples(
  identifier: string,
  capability?: string,
  signal?: AbortSignal,
): Promise<readonly Record<string, unknown>[]> {
  const query = capability === undefined
    ? ''
    : `?capability=${encodeURIComponent(capability)}`;
  return await fetchJson<readonly Record<string, unknown>[]>(
    `/models/${encodeURIComponent(identifier)}/examples${query}`,
    { signal, allowNotFound: true },
  ) ?? [];
}

export async function getModelPricing(
  identifier: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown> | undefined> {
  return fetchJson<Record<string, unknown>>(
    `/models/${encodeURIComponent(identifier)}/pricing`,
    { signal, allowNotFound: true },
  );
}

export async function listCapabilities(signal?: AbortSignal): Promise<readonly Capability[]> {
  return await fetchJson<readonly Capability[]>('/capabilities', { signal }) ?? [];
}
