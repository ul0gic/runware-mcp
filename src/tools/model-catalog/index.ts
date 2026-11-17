// Does:  Exposes the six model-catalog tools to the registry in src/tools/index.ts.
// Holds: Only handlers, MCP definitions and input schemas leave this directory; input types stay internal.

export {
  listCapabilities,
  listCapabilitiesToolDefinition,
  listModels,
  listModelsToolDefinition,
  modelDetails,
  modelDetailsToolDefinition,
  modelExamples,
  modelExamplesToolDefinition,
  modelPricing,
  modelPricingToolDefinition,
  modelSchema,
  modelSchemaToolDefinition,
} from './handler.js';
export {
  listCapabilitiesInputSchema,
  listModelsInputSchema,
  modelExamplesInputSchema,
  modelIdentifierInputSchema,
  modelSchemaInputSchema,
} from './schema.js';
