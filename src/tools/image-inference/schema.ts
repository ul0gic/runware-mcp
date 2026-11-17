// Does:  Validates imageInference input across generation, editing, adapters and acceleration.
// Holds: Every image field passes the shared image-input check; IP-adapters cap at 4 and embeddings at 5.

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

const embeddingConfigSchema = z.object({
  model: z.string(),

  weight: z.number().min(-2).max(2).optional().default(1),
});

const ipAdapterConfigSchema = z.object({
  model: z.string(),

  guideImages: z.array(imageInputSchema).min(1).max(4),

  weight: z.number().min(0).max(1).optional(),

  startStep: z.number().min(0).max(1).optional(),

  endStep: z.number().min(0).max(1).optional(),

  mode: z.enum(['style_transfer', 'composition', 'face_id', 'plus', 'plus_face']).optional(),
});

const refinerConfigSchema = z.object({
  model: z.string(),

  startStep: z.number().min(0).max(1).optional(),
});

const pulidConfigSchema = z.object({
  inputImages: z.array(imageInputSchema).min(1).max(4),

  idWeight: z.number().min(0).max(3).optional(),

  trueCFGScale: z.number().min(1).max(3).optional(),

  startStep: z.number().int().min(0).optional(),

  maxTimestep: z.number().int().optional(),
});

const acePlusPlusConfigSchema = z.object({
  referenceImage: imageInputSchema,

  mode: z.enum(['portrait', 'subject', 'local_editing']).optional(),

  weight: z.number().min(0).max(1).optional(),
});

const outpaintConfigSchema = z.object({
  left: z.number().int().min(0).max(512).optional(),

  right: z.number().int().min(0).max(512).optional(),

  top: z.number().int().min(0).max(512).optional(),

  bottom: z.number().int().min(0).max(512).optional(),

  blur: z.number().int().min(0).max(64).optional(),
});

const safetyConfigSchema = z.object({
  checkContent: z.boolean().optional(),
});

const ultralyticsConfigSchema = z.object({
  confidence: z.number().min(0).max(1).optional(),

  CFGScale: z.number().min(0).max(50).optional(),

  steps: z.number().int().min(1).max(100).optional(),
});

export const imageInferenceInputSchema = z.object({
  positivePrompt: positivePromptSchema,

  model: modelIdentifierSchema,

  width: dimensionSchema.optional().default(1024),

  height: dimensionSchema.optional().default(1024),

  steps: stepsSchema.optional(),

  CFGScale: cfgScaleSchema.optional(),

  seed: seedSchema,

  scheduler: z.string().optional(),

  numberResults: numberResultsSchema.optional().default(1),

  negativePrompt: negativePromptSchema,

  seedImage: imageInputSchema.optional(),

  maskImage: imageInputSchema.optional(),

  // Holds: FLUX.1 Kontext accepts at most 2; that lower limit is left to the API.
  referenceImages: z.array(imageInputSchema).max(4).optional(),

  strength: strengthSchema.optional(),

  maskMargin: z.number().int().min(32).max(128).optional(),

  outpaint: outpaintConfigSchema.optional(),

  controlNet: controlNetArraySchema.optional(),

  lora: loraArraySchema.optional(),

  embeddings: z.array(embeddingConfigSchema).max(5).optional(),

  ipAdapters: z.array(ipAdapterConfigSchema).max(4).optional(),

  // Holds: Only SDXL models support a refiner; the schema does not check the architecture.
  refiner: refinerConfigSchema.optional(),

  vae: z.string().optional(),

  pulid: pulidConfigSchema.optional(),

  acePlusPlus: acePlusPlusConfigSchema.optional(),

  acceleration: z.enum(['none', 'low', 'medium', 'high']).optional(),

  // Holds: Only transformer models (Flux, SD3) support teaCache; UNet models need deepCache instead.
  teaCache: z.boolean().optional(),

  deepCache: z.boolean().optional(),

  providerSettings: providerSettingsSchema.optional(),

  ultralytics: ultralyticsConfigSchema.optional(),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  outputQuality: outputQualitySchema.optional(),

  safety: safetyConfigSchema.optional(),

  includeCost: z.boolean().optional().default(true),

  ttl: z.number().int().min(60).optional(),
});

const imageResultSchema = z.object({
  imageUUID: z.string(),

  imageURL: z.string().optional(),

  imageBase64Data: z.string().optional(),

  imageDataURI: z.string().optional(),

  seed: z.number().optional(),

  nsfwContent: z.boolean().optional(),
});

const imageInferenceOutputSchema = z.object({
  images: z.array(imageResultSchema),

  cost: z.number().optional(),
});

export type ImageInferenceOutput = z.infer<typeof imageInferenceOutputSchema>;
