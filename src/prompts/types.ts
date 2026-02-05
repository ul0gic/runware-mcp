/**
 * Shared types for the MCP prompt template system.
 *
 * Defines the interfaces that all prompt templates must implement.
 * Each prompt generates a sequence of messages that guide Claude
 * to use the appropriate Runware tools with optimal settings.
 */

// ============================================================================
// Prompt Argument
// ============================================================================

/**
 * Describes a single argument that a prompt template accepts.
 *
 * Arguments can be required or optional. Optional arguments should
 * have sensible defaults documented in the description.
 */
export interface PromptArgument {
  /** Unique name for this argument (used as the key in the args record). */
  readonly name: string;
  /** Human-readable description of what this argument controls. */
  readonly description: string;
  /** Whether this argument must be provided by the caller. */
  readonly required: boolean;
}

// ============================================================================
// Prompt Message
// ============================================================================

/**
 * A single message in the prompt conversation.
 *
 * Prompts generate an array of these messages that form a complete
 * workflow instruction for the LLM.
 */
export interface PromptMessage {
  /** The role of the message sender. */
  readonly role: 'user' | 'assistant';
  /** The text content of the message. */
  readonly content: string;
}

// ============================================================================
// Prompt Template
// ============================================================================

/**
 * A reusable prompt template for a common creative workflow.
 *
 * Templates define their arguments, validate them, and generate
 * a sequence of messages that instruct Claude to use the right
 * Runware tools with appropriate settings.
 */
export interface PromptTemplate {
  /** Unique identifier for this prompt (e.g., 'product-photo'). */
  readonly name: string;
  /** Human-readable description of what this prompt does. */
  readonly description: string;
  /** The arguments this prompt accepts. */
  readonly arguments: readonly PromptArgument[];
  /** Generates the prompt messages from the provided arguments. */
  generate(args: Record<string, string>): readonly PromptMessage[];
}
