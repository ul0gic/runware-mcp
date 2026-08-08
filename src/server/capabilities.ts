import { PROMPT_TEMPLATES } from '../prompts/index.js';
import { RESOURCE_PROVIDERS } from '../resources/index.js';
import { toolDefinitions } from '../tools/index.js';

interface ResourceProviderSummary {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
}

interface PromptTemplateSummary {
  readonly name: string;
  readonly description: string;
  readonly arguments: readonly {
    readonly name: string;
    readonly description: string;
    readonly required: boolean;
  }[];
}

interface ServerCapabilitiesInfo {
  readonly tools: typeof toolDefinitions;
  readonly resources: {
    readonly providers: readonly ResourceProviderSummary[];
  };
  readonly prompts: readonly PromptTemplateSummary[];
}

/** Logging and introspection only; the SDK negotiates capabilities via the Server constructor. */
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
