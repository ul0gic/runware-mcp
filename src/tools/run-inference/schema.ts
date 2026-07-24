import { z } from 'zod';

export const INFERENCE_TASK_TYPES = [
  'imageInference',
  'videoInference',
  'audioInference',
  'textInference',
  '3dInference',
  'caption',
  'controlNetPreprocess',
  'imageMasking',
  'promptEnhance',
  'removeBackground',
  'upscale',
  'vectorize',
] as const;

const MAX_PARAMETERS_BYTES = 256 * 1024;
const RESERVED_FIELDS = new Set([
  'taskType',
  'taskUUID',
  'deliveryMethod',
  'model',
  'inputs',
  'webhookURL',
  'uploadEndpoint',
  'operation',
]);

export const inferenceParametersSchema = z
  .record(z.string(), z.unknown())
  .superRefine((parameters, context) => {
    for (const field of RESERVED_FIELDS) {
      if (field in parameters) {
        context.addIssue({
          code: 'custom',
          message: `${field} must be supplied through a dedicated safe field or tool`,
          path: [field],
        });
      }
    }

    if (Buffer.byteLength(JSON.stringify(parameters), 'utf8') > MAX_PARAMETERS_BYTES) {
      context.addIssue({
        code: 'custom',
        message: `parameters must not exceed ${String(MAX_PARAMETERS_BYTES)} bytes`,
      });
    }
  });

export const runInferenceInputSchema = z.object({
  model: z.string().min(1).max(256),
  taskType: z.enum(INFERENCE_TASK_TYPES).optional(),
  parameters: inferenceParametersSchema.optional().default({}),
  deliveryMethod: z.enum(['sync', 'async']).optional(),
  validate: z.boolean().optional().default(true),
});

export type RunInferenceInput = z.infer<typeof runInferenceInputSchema>;
