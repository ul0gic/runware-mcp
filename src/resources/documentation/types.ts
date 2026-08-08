export interface DocParameter {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly range?: string;
  readonly default?: string;
  readonly description: string;
}

export interface DocExample {
  readonly title: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly explanation: string;
}

export interface DocContent {
  readonly description: string;
  readonly parameters?: readonly DocParameter[];
  readonly examples?: readonly DocExample[];
  readonly tips?: readonly string[];
  readonly relatedDocs?: readonly string[];
}

export type DocCategory = 'concepts' | 'tools' | 'features' | 'providers' | 'guides';

/** Keyed in the documentation registry by `{category}/{id}`. */
export interface DocResource {
  readonly id: string;
  readonly category: DocCategory;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly content: DocContent;
  readonly lastUpdated: string;
}
