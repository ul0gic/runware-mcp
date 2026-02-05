/**
 * Batch image inference tool barrel export.
 */

export {
  batchImageInference,
  batchImageInferenceToolDefinition,
} from './handler.js';

export {
  batchImageInferenceInputSchema,
  batchImageInferenceOutputSchema,
  batchPromptResultSchema,
  batchImageResultSchema,
  type BatchImageInferenceInput,
  type BatchImageInferenceOutput,
  type BatchPromptResult,
} from './schema.js';
