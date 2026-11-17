// Does:  Validates styleTransfer input and describes the styled image it returns.
// Holds: style, intensity and colorPalette are closed enums, so every prompt descriptor switch stays exhaustive.

import { z } from 'zod';

import {
  dimensionSchema,
  imageInputSchema,
  outputFormatSchema,
  outputTypeSchema,
  stepsSchema,
  strengthSchema,
} from '../../shared/validation.js';

const ART_STYLES = [
  'oil-painting',
  'watercolor',
  'pencil-sketch',
  'pop-art',
  'impressionist',
  'cyberpunk',
  'studio-ghibli',
  'art-deco',
  'minimalist',
  'surrealist',
] as const;

const INTENSITY_LEVELS = ['subtle', 'moderate', 'strong'] as const;

const COLOR_PALETTES = ['warm', 'cool', 'monochrome', 'vibrant', 'pastel'] as const;

const artStyleSchema = z.enum(ART_STYLES);

export type ArtStyle = z.infer<typeof artStyleSchema>;

const intensitySchema = z.enum(INTENSITY_LEVELS);

export type Intensity = z.infer<typeof intensitySchema>;

const colorPaletteSchema = z.enum(COLOR_PALETTES);

export type ColorPalette = z.infer<typeof colorPaletteSchema>;

export const styleTransferInputSchema = z.object({
  inputImage: imageInputSchema,

  style: artStyleSchema,

  subject: z.string().min(2).max(500).optional(),

  intensity: intensitySchema.optional().default('moderate'),

  colorPalette: colorPaletteSchema.optional().default('vibrant'),

  model: z.string().optional().default('runware:100@1'),

  width: dimensionSchema.optional(),

  height: dimensionSchema.optional(),

  steps: stepsSchema.optional(),

  strength: strengthSchema.optional().default(0.65),

  outputType: outputTypeSchema.optional(),

  outputFormat: outputFormatSchema.optional(),

  includeCost: z.boolean().optional().default(true),
});

const styleTransferOutputSchema = z.object({
  imageUUID: z.string(),

  imageURL: z.string().optional(),

  style: artStyleSchema,

  prompt: z.string(),

  captionUsed: z.string().optional(),

  cost: z.number().optional(),
});

export type StyleTransferOutput = z.infer<typeof styleTransferOutputSchema>;
