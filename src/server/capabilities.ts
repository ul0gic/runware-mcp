/**
 * MCP server capabilities declaration.
 *
 * Aggregates all tool definitions, resource providers, and prompt templates
 * into a single capabilities object for the MCP server.
 */

import { PROMPT_TEMPLATES } from '../prompts/index.js';
import { RESOURCE_PROVIDERS } from '../resources/index.js';
import { toolDefinitions } from '../tools/index.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Resource provider summary for capability negotiation.
 */
interface ResourceProviderSummary {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
}

/**
 * Prompt template summary for capability negotiation.
 */
interface PromptTemplateSummary {
  readonly name: string;
  readonly description: string;
  readonly arguments: readonly {
    readonly name: string;
    readonly description: string;
    readonly required: boolean;
  }[];
}

/**
 * Server capabilities aggregation.
 */
interface ServerCapabilitiesInfo {
  readonly tools: typeof toolDefinitions;
  readonly resources: {
    readonly providers: readonly ResourceProviderSummary[];
  };
  readonly prompts: readonly PromptTemplateSummary[];
}

// ============================================================================
// Capabilities
// ============================================================================

/**
 * Builds the full server capabilities declaration.
 *
 * This is used for logging and introspection. The MCP SDK handles
 * actual capability negotiation via the Server constructor options.
 *
 * @returns Aggregated server capabilities info
 */
export function getServerCapabilities(): ServerCapabilitiesInfo {
  return {
    tools: toolDefinitions,
    resources: {
      providers: RESOURCE_PROVIDERS.map((provider) => ({
        uri: provider.uri,
        name: provider.name,
        description: provider.description,
        mimeType: provider.mimeType,
      })),
    },
    prompts: Object.entries(PROMPT_TEMPLATES).map(([name, template]) => ({
      name,
      description: template.description,
      arguments: template.arguments,
    })),
  };
}
