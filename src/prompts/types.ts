/** Defaults for optional arguments belong in the description text. */
interface PromptArgument {
  /** Key in the args record. */
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
}

export interface PromptMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface PromptTemplate {
  readonly name: string;
  readonly description: string;
  readonly arguments: readonly PromptArgument[];
  generate(args: Record<string, string>): readonly PromptMessage[];
}
