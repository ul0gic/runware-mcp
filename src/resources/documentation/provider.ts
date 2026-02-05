/**
 * Resource provider for Runware documentation.
 *
 * Provides comprehensive API reference, feature guides, and
 * provider documentation as structured JSON resources. LLM
 * clients can discover and read documentation on demand via
 * the `runware://docs/{category}/{id}` URI pattern.
 *
 * URI pattern: runware://docs/{category}/{id}
 * Categories: concepts, tools, features, providers, guides
 */

// Side-effect imports: register all documentation resources into the registry.
// These must be imported before the provider is used so that list() and get()
// return populated results. Order does not matter for correctness.
import './register-guides.js';

import { getDocResource, listDocResources } from './registry.js';

import type { ResourceContent, ResourceEntry, ResourceProvider } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * URI prefix for documentation resources.
 */
const URI_PREFIX = 'runware://docs/';

/**
 * Regex pattern for parsing documentation URIs.
 * Captures category and id from `runware://docs/{category}/{id}`.
 */
const URI_PATTERN = /^runware:\/\/docs\/([^/]+)\/(.+)$/;

// ============================================================================
// Provider
// ============================================================================

/**
 * Resource provider for Runware documentation.
 *
 * Exposes structured documentation resources via the MCP resource system.
 * Documents are registered in the documentation registry and served as
 * JSON with full parameter tables, examples, tips, and cross-references.
 */
export const documentationProvider: ResourceProvider = {
  uri: 'runware://docs/{category}/{id}',
  name: 'Runware Documentation',
  description:
    'Comprehensive API reference, feature guides, and provider documentation for all Runware capabilities',
  mimeType: 'application/json',

  list(): Promise<readonly ResourceEntry[]> {
    const docs = listDocResources();

    const entries: readonly ResourceEntry[] = docs.map((doc) => ({
      uri: `${URI_PREFIX}${doc.category}/${doc.id}`,
      name: doc.title,
      description: doc.summary,
      mimeType: 'application/json',
    }));

    return Promise.resolve(entries);
  },

  get(uri: string): Promise<ResourceContent | null> {
    const match = URI_PATTERN.exec(uri);

    if (match === null) {
      return Promise.resolve(null);
    }

    const category = match[1];
    const id = match[2];

    if (category === undefined || id === undefined) {
      return Promise.resolve(null);
    }

    const doc = getDocResource(category, id);

    if (doc === undefined) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(doc, null, 2),
    });
  },
};
