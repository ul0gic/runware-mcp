// Kept separate from the registry so providers can import types without a cycle.

export interface ResourceEntry {
  readonly uri: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeType?: string;
}

export interface ResourceContent {
  readonly uri: string;
  readonly mimeType: string;
  readonly text?: string;
  readonly blob?: Uint8Array;
}

export interface ResourceProvider {
  /** URI pattern, e.g. `runware://images/{id}`. */
  readonly uri: string;

  readonly name: string;

  readonly description: string;

  /** Default MIME type for resources from this provider. */
  readonly mimeType: string;

  list(): Promise<readonly ResourceEntry[]>;

  /** Resolves to null when the URI does not match a known resource. */
  get(uri: string): Promise<ResourceContent | null>;
}
