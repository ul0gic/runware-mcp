import { z } from 'zod';

import { providerSettingsSchema } from '../../shared/provider-settings.js';
import {
  cfgScaleSchema,
  controlNetArraySchema,
  dimensionSchema,
  imageInputSchema,
  loraArraySchema,
  modelIdentifierSchema,
  negativePromptSchema,
  numberResultsSchema,
  outputFormatSchema,
  outputQualitySchema,
  outputTypeSchema,
  positivePromptSchema,
  seedSchema,
  stepsSchema,
  strengthSchema,
} from '../../shared/validation.js';

export const embeddingConfigSchema = z.object({
  model: z.string(),

  weight: z.number().min(-2).max(2).optional().default(1),
});

export const ipAdapterConfigSchema = z.object({
  model: z.string(),

  guideImages: z.array(imageInputSchema).min(1).max(4),

  weight: z.number().min(0).max(1).optional(),

  /** Fraction of the diffusion run at which the adapter starts applying. */
  startStep: z.number().min(0).max(1).optional(),

  /** Fraction of the diffusion run at which the adapter stops applying. */
  endStep: z.number().min(0).max(1).optional(),

  mode: z.enum(['style_transfer', 'composition', 'face_id', 'plus', 'plus_face']).optional(),
});

export const refinerConfigSchema = z.object({
  model: z.string(),

  /** Fraction of the diffusion run at which the refiner takes over. */
  startStep: z.number().min(0).max(1).optional(),
});

/** PuLID identity preservation. */
export const pulidConfigSchema = z.object({
  /** Identity reference images. */
  inputImages: z.array(imageInputSchema).min(1).max(4),

  idWeight: z.number().min(0).max(3).optional(),

  trueCFGScale: z.number().min(1).max(3).optional(),

  startStep: z.number().int().min(0).optional(),

  maxTimestep: z.number().int().optional(),
});

/** ACE++ character-consistent generation. */
export const acePlusPlusConfigSchema = z.object({
  referenceImage: imageInputSchema,

  mode: z.enum(['portrait', 'subject', 'local_editing']).optional(),

  weight: z.number().min(0).max(1).optional(),
});

/** Pixels to extend the image by on each side. */
export const outpaintConfigSchema = z.object({
  left: z.number().int().min(0).max(512).optional(),

  right: z.number().int().min(0).max(512).optional(),

  top: z.number().int().min(0).max(512).optional(),

  bottom: z.number().int().min(0).max(512).optional(),

  /** Blur applied at the seam for blending. */
  blur: z.number().int().min(0).max(64).optional(),
});

export const safetyConfigSchema = z.object({
  checkContent: z.boolean().optional(),
});

/** Ultralytics face detection and enhancement. */
export const ultralyticsConfigSchema = z.object({
  confidence: z.number().min(0).max(1).optional(),

  // eslint-disable-next-line @typescript-eslint/naming-convention -- API parameter name
  CFGScale: z.number().min(0).max(50).optional(),

  steps: z.number().int().min(1).max(100).optional(),
});

export const imageInferenceInputSchema = z.object({
  positivePrompt: positivePromptSchema,

  /** AIR-format identifier, e.g. "civitai:123@456". */
  model: modelIdentifierSchema,

  /** Pixels; must be a multiple of 64. */
  width: dimensionSchema.optional().default(1024),

  /** Pixels; must be a multiple of 64. */
  height: dimensionSchema.optional().default(1024),

  steps: stepsSchema.optional(),

  /** Higher values follow the prompt more closely. */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- API parameter name
  CFGScale: cfgScaleSchema.optional(),

  seed: seedSchema,

  scheduler: z.string().optional(),

  numberResults: numberResultsSchema.optional().default(1),

  negativePrompt: negativePromptSchema,

  /** Accepts an image UUID, URL, base64 payload, or data URI. */
  seedImage: imageInputSchema.optional(),

  /** White marks the area to edit. Accepts a UUID, URL, base64 payload, or data URI. */
  maskImage: imageInputSchema.optional(),

  /** FLUX.1 Kontext accepts at most 2. */
  referenceImages: z.array(imageInputSchema).max(4).optional(),

  /** Denoising strength; higher values deviate further from the seed image. */
  strength: strengthSchema.optional(),

  /** Extra context pixels around the mask, for better blending. */
  maskMargin: z.number().int().min(32).max(128).optional(),

  outpaint: outpaintConfigSchema.optional(),

  controlNet: controlNetArraySchema.optional(),

  lora: loraArraySchema.optional(),

  embeddings: z.array(embeddingConfigSchema).max(5).optional(),

  ipAdapters: z.array(ipAdapterConfigSchema).max(4).optional(),

  /** Two-stage generation, SDXL only. */
  refiner: refinerConfigSchema.optional(),

  /** Overrides the model's visual decoder. */
  vae: z.string().optional(),

  pulid: pulidConfigSchema.optional(),

  acePlusPlus: acePlusPlusConfigSchema.optional(),

  /** Higher levels trade image quality for speed. */
  acceleration: z.enum(['none', 'low', 'medium', 'high']).optional(),

  /** Transformer models only (Flux, SD3). */
  teaCache: z.boolean().optional(),

  /** UNet models only (SDXL, SD1.5). */
  deepCache: z.boolean().optional(),

  /** Use the nested object matching the model's provider. */
  providerSettings: providerSettingsSchema.optional(),

  ultralytics: ultralyticsConfigSchema.optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  /** Applies to JPG and WebP only. */
  outputQuality: outputQualitySchema.optional(),

  safety: safetyConfigSchema.optional(),

  includeCost: z.boolean().optional().default(true),

  /** Lifetime of generated URLs, in seconds. */
  ttl: z.number().int().min(60).optional(),
});

export type ImageInferenceInput = z.infer<typeof imageInferenceInputSchema>;

export const imageResultSchema = z.object({
  imageUUID: z.string(),

  /** Present when outputType is URL. */
  imageURL: z.string().optional(),

  /** Present when outputType is base64Data. */
  imageBase64Data: z.string().optional(),

  /** Present when outputType is dataURI. */
  imageDataURI: z.string().optional(),

  /** Seed used for this image. */
  seed: z.number().optional(),

  nsfwContent: z.boolean().optional(),
});

export const imageInferenceOutputSchema = z.object({
  images: z.array(imageResultSchema),

  /** Total cost in USD. */
  cost: z.number().optional(),
});

export type ImageInferenceOutput = z.infer<typeof imageInferenceOutputSchema>;
