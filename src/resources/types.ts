// Does:  Defines the resource provider contract and the entry and content shapes it returns.
// Holds: Type-only module, kept apart from resources/index.ts so providers import it without a cycle.

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
  // Holds: The text before the first `{` is the prefix findProviderForUri routes on.
  readonly uri: string;

  readonly name: string;

  readonly description: string;

  readonly mimeType: string;

  list(): Promise<readonly ResourceEntry[]>;

  // Holds: Resolves null, never rejects, for a URI this provider has no resource for.
  get(uri: string): Promise<ResourceContent | null>;
}
