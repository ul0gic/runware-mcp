// Does:  Defines the shape of a documentation resource and its content.
// Holds: category is a closed union of the five docs/ subdirectories.
interface DocParameter {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly range?: string;
  readonly default?: string;
  readonly description: string;
}

interface DocExample {
  readonly title: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly explanation: string;
}

interface DocContent {
  readonly description: string;
  readonly parameters?: readonly DocParameter[];
  readonly examples?: readonly DocExample[];
  readonly tips?: readonly string[];
  readonly relatedDocs?: readonly string[];
}

type DocCategory = 'concepts' | 'tools' | 'features' | 'providers' | 'guides';

export interface DocResource {
  readonly id: string;
  readonly category: DocCategory;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly content: DocContent;
  readonly lastUpdated: string;
}
