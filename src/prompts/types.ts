// Does:  Defines the prompt template contract and the messages it generates.
// Holds: An optional argument's default lives in its description text; PromptArgument has no default field.

interface PromptArgument {
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
