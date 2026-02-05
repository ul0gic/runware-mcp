/**
 * Types for the documentation resource provider.
 *
 * Defines the shape of documentation resources served via
 * the `runware://docs/{category}/{id}` URI pattern.
 * Each resource contains structured API reference, feature guides,
 * or provider documentation for Runware capabilities.
 */

// ============================================================================
// Documentation Parameter
// ============================================================================

/**
 * A single parameter in a tool or feature's documentation.
 *
 * Describes name, type, constraints, and usage of an API parameter.
 */
export interface DocParameter {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly range?: string;
  readonly default?: string;
  readonly description: string;
}

// ============================================================================
// Documentation Example
// ============================================================================

/**
 * An example showing how to use a tool or feature.
 *
 * Contains a title, realistic input JSON, and a short explanation
 * of what the example demonstrates.
 */
export interface DocExample {
  readonly title: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly explanation: string;
}

// ============================================================================
// Documentation Content
// ============================================================================

/**
 * The main content body of a documentation resource.
 *
 * Contains the description, optional parameter tables, examples,
 * practical tips, and cross-references to related documentation.
 */
export interface DocContent {
  readonly description: string;
  readonly parameters?: readonly DocParameter[];
  readonly examples?: readonly DocExample[];
  readonly tips?: readonly string[];
  readonly relatedDocs?: readonly string[];
}

// ============================================================================
// Documentation Resource
// ============================================================================

/**
 * Valid documentation categories.
 *
 * - `concepts` — Foundational Runware concepts (AIR IDs, task responses, etc.)
 * - `tools` — Per-tool API reference with full parameter tables
 * - `features` — Deep-dive guides for advanced features (ControlNet, LoRA, etc.)
 * - `providers` — Provider-specific settings and capabilities
 * - `guides` — Practical how-to guides for common workflows
 */
export type DocCategory = 'concepts' | 'tools' | 'features' | 'providers' | 'guides';

/**
 * A complete documentation resource.
 *
 * Represents a single documentation entry served via the MCP resource
 * system. Keyed in the registry by `{category}/{id}`.
 */
export interface DocResource {
  readonly id: string;
  readonly category: DocCategory;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly content: DocContent;
  readonly lastUpdated: string;
}
