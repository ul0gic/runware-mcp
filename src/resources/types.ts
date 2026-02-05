/**
 * Shared types for the MCP resource system.
 *
 * Defines the interfaces that all resource providers must implement.
 * These are separated from the registry to avoid circular dependencies.
 */

// ============================================================================
// Resource Provider Interface
// ============================================================================

/**
 * A single entry in a resource listing.
 *
 * Returned by ResourceProvider.list() to describe available resources.
 */
export interface ResourceEntry {
  readonly uri: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
}

/**
 * Content of a specific resource.
 *
 * Returned by ResourceProvider.get() when a resource is found.
 */
export interface ResourceContent {
  readonly uri: string;
  readonly mimeType: string;
  readonly text?: string;
  readonly blob?: Uint8Array;
}

/**
 * Interface that all resource providers must implement.
 *
 * Each provider manages a specific category of resources
 * (images, videos, audio, session history, analytics).
 */
export interface ResourceProvider {
  /** URI pattern for this provider (e.g., 'runware://images/{id}'). */
  readonly uri: string;

  /** Human-readable display name. */
  readonly name: string;

  /** Description of what this provider exposes. */
  readonly description: string;

  /** Default MIME type for resources from this provider. */
  readonly mimeType: string;

  /**
   * Lists all available resources from this provider.
   *
   * @returns Array of resource entries describing available resources
   */
  list(): Promise<readonly ResourceEntry[]>;

  /**
   * Gets the content of a specific resource by URI.
   *
   * @param uri - The full URI of the resource to retrieve
   * @returns The resource content, or null if not found
   */
  get(uri: string): Promise<ResourceContent | null>;
}
