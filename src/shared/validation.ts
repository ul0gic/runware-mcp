import { z } from 'zod';

const UUID_V4_REGEX = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

export const uuidSchema = z
  .string()
  .regex(UUID_V4_REGEX, 'Must be a valid UUID v4');

const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

const urlSchema = z.url('Must be a valid URL').refine(
  (urlString) => {
    try {
      const parsedUrl = new URL(urlString);
      return (ALLOWED_PROTOCOLS as readonly string[]).includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  },
  { message: 'URL must use http or https protocol' },
);

const BASE64_REGEX = /^[\w+/]+=*$/;

const DATA_URI_REGEX = /^data:image\/(jpeg|jpg|png|webp|gif|bmp);base64,[\w+/]+=*$/i;

export const imageInputSchema = z.union([
  uuidSchema.describe('Runware image UUID'),

  urlSchema.describe('Image URL'),

  z
    .string()
    .min(100, 'Base64 data appears too short')
    .regex(BASE64_REGEX, 'Invalid base64 format')
    .describe('Base64 encoded image data'),

  z
    .string()
    .regex(DATA_URI_REGEX, 'Invalid data URI format')
    .describe('Data URI with base64 image'),
]);

export const MIN_DIMENSION = 256;

export const MAX_DIMENSION = 16_384;

export const DIMENSION_STEP = 8;

export const dimensionSchema = z
  .number()
  .int('Dimension must be an integer')
  .min(MIN_DIMENSION, `Dimension must be at least ${String(MIN_DIMENSION)}px`)
  .max(MAX_DIMENSION, `Dimension cannot exceed ${String(MAX_DIMENSION)}px`)
  .refine(
    (value) => value % DIMENSION_STEP === 0,
    { message: `Dimension must be a multiple of ${String(DIMENSION_STEP)}` },
  );

export const MIN_STEPS = 1;

export const MAX_STEPS = 100;

export const stepsSchema = z
  .number()
  .int('Steps must be an integer')
  .min(MIN_STEPS, `Steps must be at least ${String(MIN_STEPS)}`)
  .max(MAX_STEPS, `Steps cannot exceed ${String(MAX_STEPS)}`);

export const MIN_CFG_SCALE = 0;

export const MAX_CFG_SCALE = 50;

export const cfgScaleSchema = z
  .number()
  .min(MIN_CFG_SCALE, `CFG scale must be at least ${String(MIN_CFG_SCALE)}`)
  .max(MAX_CFG_SCALE, `CFG scale cannot exceed ${String(MAX_CFG_SCALE)}`);

export const seedSchema = z
  .number()
  .int('Seed must be an integer')
  .min(0, 'Seed must be non-negative')
  .optional();

export const numberResultsSchema = z
  .number()
  .int('Number of results must be an integer')
  .min(1, 'Must generate at least 1 result')
  .max(20, 'Cannot generate more than 20 results');

export const strengthSchema = z
  .number()
  .min(0, 'Strength must be at least 0')
  .max(1, 'Strength cannot exceed 1');

const OUTPUT_TYPES = ['URL', 'base64Data', 'dataURI'] as const;

export const outputTypeSchema = z.enum(OUTPUT_TYPES);

const IMAGE_OUTPUT_FORMATS = ['JPG', 'PNG', 'WEBP'] as const;

export const outputFormatSchema = z.enum(IMAGE_OUTPUT_FORMATS);

const VIDEO_OUTPUT_FORMATS = ['MP4', 'WEBM', 'MOV'] as const;

export const videoOutputFormatSchema = z.enum(VIDEO_OUTPUT_FORMATS);

export const outputQualitySchema = z
  .number()
  .int('Output quality must be an integer')
  .min(20, 'Output quality must be at least 20')
  .max(99, 'Output quality cannot exceed 99');

/** AIR format: provider:modelId@version or civitai:modelId@versionId. */
const AIR_MODEL_REGEX = /^[\w-]+:\d+@\d+$/;

export const modelIdentifierSchema = z
  .string()
  .regex(AIR_MODEL_REGEX, 'Model must be in AIR format (e.g., civitai:123@456)');

export const MIN_PROMPT_LENGTH = 2;

export const MAX_PROMPT_LENGTH = 3000;

export const positivePromptSchema = z
  .string()
  .min(MIN_PROMPT_LENGTH, `Prompt must be at least ${String(MIN_PROMPT_LENGTH)} characters`)
  .max(MAX_PROMPT_LENGTH, `Prompt cannot exceed ${String(MAX_PROMPT_LENGTH)} characters`);

export const negativePromptSchema = z
  .string()
  .max(MAX_PROMPT_LENGTH, `Negative prompt cannot exceed ${String(MAX_PROMPT_LENGTH)} characters`)
  .optional();

export const videoDurationSchema = z
  .number()
  .min(1, 'Video duration must be at least 1 second')
  .max(600, 'Video duration cannot exceed 600 seconds');

export const audioDurationSchema = z
  .number()
  .int('Audio duration must be an integer')
  .min(10, 'Audio duration must be at least 10 seconds')
  .max(300, 'Audio duration cannot exceed 300 seconds');

export const fpsSchema = z
  .number()
  .int('FPS must be an integer')
  .min(15, 'FPS must be at least 15')
  .max(60, 'FPS cannot exceed 60');

export const filePathSchema = z
  .string()
  .min(1, 'File path cannot be empty')
  .refine(
    (path) => path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path),
    { message: 'File path must be absolute' },
  );

export const folderPathSchema = filePathSchema.describe('Absolute folder path');

export const concurrencySchema = z
  .number()
  .int('Concurrency must be an integer')
  .min(1, 'Concurrency must be at least 1')
  .max(5, 'Concurrency cannot exceed 5')
  .default(2);

const CONTROLNET_PREPROCESSORS = [
  'canny',
  'depth',
  'mlsd',
  'normalbae',
  'openpose',
  'tile',
  'seg',
  'lineart',
  'lineart_anime',
  'shuffle',
  'scribble',
  'softedge',
] as const;

export const controlNetPreprocessorSchema = z.enum(CONTROLNET_PREPROCESSORS);

export const controlNetConfigSchema = z.object({
  guideImage: imageInputSchema,
  preprocessor: controlNetPreprocessorSchema,
  model: z.string().optional(),
  weight: z.number().min(0).max(1).optional(),
  startStep: z.number().min(0).max(1).optional(),
  endStep: z.number().min(0).max(1).optional(),
});

export const controlNetArraySchema = z
  .array(controlNetConfigSchema)
  .max(4, 'Cannot use more than 4 ControlNets');

export const loraConfigSchema = z.object({
  model: z.string(),
  weight: z.number().min(-2).max(2).optional().default(1),
});

export const loraArraySchema = z
  .array(loraConfigSchema)
  .max(5, 'Cannot use more than 5 LoRAs');

export const upscaleFactorSchema = z.union([
  z.literal(2),
  z.literal(4),
]);
