import {
  type RunwareClient,
  getDefaultClient,
} from '../../integrations/runware/client.js';
import { wrapError } from '../../shared/errors.js';
import {
  type ToolContext,
  type ToolResult,
  errorResult,
  successResult,
} from '../../shared/types.js';
import { imageCaption } from '../image-caption/index.js';
import { imageInference } from '../image-inference/index.js';

import type {
  ArtStyle,
  ColorPalette,
  Intensity,
  StyleTransferOutput,
  styleTransferInputSchema,
} from './schema.js';
import type { z } from 'zod';

type StyleTransferInput = z.infer<typeof styleTransferInputSchema>;

function getStyleDescriptor(style: ArtStyle): string {
  switch (style) {
    case 'oil-painting': {
      return 'classical oil painting, visible brushstrokes, rich texture, canvas feel, impasto technique';
    }
    case 'watercolor': {
      return 'delicate watercolor painting, soft color bleeds, translucent washes, wet-on-wet technique, paper texture';
    }
    case 'pencil-sketch': {
      return 'detailed pencil sketch, fine hatching, cross-hatching shading, graphite on paper, hand-drawn quality';
    }
    case 'pop-art': {
      return 'bold pop art style, Ben-Day dots, strong outlines, flat vivid colors, Andy Warhol inspired';
    }
    case 'impressionist': {
      return 'impressionist painting, loose brushwork, emphasis on light and color, Monet-inspired, plein air quality';
    }
    case 'cyberpunk': {
      return 'cyberpunk aesthetic, neon glow, holographic elements, dystopian tech, rain-slicked surfaces, chromatic aberration';
    }
    case 'studio-ghibli': {
      return 'Studio Ghibli anime style, whimsical, lush environments, hand-painted backgrounds, Miyazaki-inspired';
    }
    case 'art-deco': {
      return 'Art Deco design, geometric patterns, gold accents, symmetrical composition, 1920s glamour, luxurious feel';
    }
    case 'minimalist': {
      return 'minimalist art, clean lines, negative space, reduced color palette, essential forms only, modern simplicity';
    }
    case 'surrealist': {
      return 'surrealist art, dreamlike imagery, impossible geometry, melting forms, Dali-inspired, subconscious symbolism';
    }
  }
}

function getIntensityDescriptor(intensity: Intensity): string {
  switch (intensity) {
    case 'subtle': {
      return 'with a subtle artistic touch that preserves the original subject clarity';
    }
    case 'moderate': {
      return 'with a balanced blend of artistic style and subject detail';
    }
    case 'strong': {
      return 'with heavy stylization where the artistic style dominates the composition';
    }
  }
}

function getPaletteDescriptor(palette: ColorPalette): string {
  switch (palette) {
    case 'warm': {
      return 'warm color palette with reds, oranges, ambers, and golden tones';
    }
    case 'cool': {
      return 'cool color palette with blues, teals, purples, and silver tones';
    }
    case 'monochrome': {
      return 'monochromatic palette, single color family with tonal variations, dramatic contrast';
    }
    case 'vibrant': {
      return 'vibrant, saturated colors with high contrast and visual impact';
    }
    case 'pastel': {
      return 'soft pastel palette, muted colors, gentle tones, dreamy quality';
    }
  }
}

function getCfgScale(intensity: Intensity): number {
  switch (intensity) {
    case 'subtle': {
      return 5;
    }
    case 'moderate': {
      return 7;
    }
    case 'strong': {
      return 10;
    }
  }
}

function buildStyledPrompt(
  subject: string,
  style: ArtStyle,
  intensity: Intensity,
  colorPalette: ColorPalette,
): string {
  const styleDesc = getStyleDescriptor(style);
  const intensityDesc = getIntensityDescriptor(intensity);
  const paletteDesc = getPaletteDescriptor(colorPalette);

  return [
    `${subject} rendered in ${style} style.`,
    `${styleDesc}.`,
    `${intensityDesc}.`,
    `${paletteDesc}.`,
    'Masterful artistic execution, high detail, gallery-quality artwork.',
  ].join(' ');
}

async function captionImage(
  inputImage: string,
  client: RunwareClient,
  context?: ToolContext,
): Promise<{ readonly caption: string; readonly cost: number } | ToolResult> {
  const captionResult = await imageCaption(
    {
      inputImage,
      model: 'runware:152@2',
      includeCost: true,
    },
    client,
    context,
  );

  if (captionResult.status === 'error') {
    return errorResult(`Auto-caption failed: ${captionResult.message}`);
  }

  const captionData = captionResult.data as { readonly text?: string } | undefined;
  const captionText = captionData?.text ?? 'an image';

  return {
    caption: captionText,
    cost: captionResult.cost ?? 0,
  };
}

function buildInferenceInput(
  input: StyleTransferInput,
  styledPrompt: string,
  cfgScale: number,
): Parameters<typeof imageInference>[0] {
  return {
    positivePrompt: styledPrompt,
    model: input.model,
    width: input.width ?? 1024,
    height: input.height ?? 1024,
    seedImage: input.inputImage,
    strength: input.strength,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Runware API parameter name
    CFGScale: cfgScale,
    numberResults: 1,
    includeCost: input.includeCost,
    ...(input.steps !== undefined && { steps: input.steps }),
    ...(input.outputType !== undefined && { outputType: input.outputType }),
    ...(input.outputFormat !== undefined && { outputFormat: input.outputFormat }),
  };
}

function extractOutput(
  inferenceResult: ToolResult,
  input: StyleTransferInput,
  styledPrompt: string,
  captionUsed: string | undefined,
  captionCost: number,
): ToolResult {
  const inferenceData = inferenceResult.data as {
    readonly images?: readonly (
      { readonly imageUUID: string; readonly imageURL?: string }
    )[];
    readonly cost?: number;
  } | undefined;

  const firstImage = inferenceData?.images?.[0];
  if (firstImage === undefined) {
    return errorResult('Style transfer produced no output image');
  }

  const generationCost = inferenceData?.cost ?? 0;
  const totalCost = captionCost + generationCost;

  const output: StyleTransferOutput = {
    imageUUID: firstImage.imageUUID,
    ...(firstImage.imageURL !== undefined && { imageURL: firstImage.imageURL }),
    style: input.style,
    prompt: styledPrompt,
    ...(captionUsed !== undefined && { captionUsed }),
    ...(input.includeCost && totalCost > 0 && { cost: totalCost }),
  };

  return successResult(
    `Applied ${input.style} style successfully`,
    output,
    input.includeCost ? totalCost : undefined,
  );
}

/** Auto-captions the source image when no subject is given, then runs img2img with it as seed. */
export async function styleTransfer(
  input: StyleTransferInput,
  client?: RunwareClient,
  context?: ToolContext,
): Promise<ToolResult> {
  const runwareClient = client ?? getDefaultClient();

  try {
    let subject = input.subject;
    let captionUsed: string | undefined;
    let captionCost = 0;

    if (subject === undefined) {
      const captionResult = await captionImage(input.inputImage, runwareClient, context);

      if ('status' in captionResult) {
        return captionResult;
      }

      subject = captionResult.caption;
      captionUsed = captionResult.caption;
      captionCost = captionResult.cost;
    }

    const styledPrompt = buildStyledPrompt(subject, input.style, input.intensity, input.colorPalette);

    const cfgScale = getCfgScale(input.intensity);
    const inferenceInput = buildInferenceInput(input, styledPrompt, cfgScale);

    const inferenceResult = await imageInference(inferenceInput, runwareClient, context);

    if (inferenceResult.status === 'error') {
      return errorResult(`Style transfer generation failed: ${inferenceResult.message}`);
    }

    return extractOutput(inferenceResult, input, styledPrompt, captionUsed, captionCost);
  } catch (error) {
    const mcpError = wrapError(error);
    return errorResult(mcpError.message, mcpError.data);
  }
}

export const styleTransferToolDefinition = {
  name: 'styleTransfer',
  description:
    'Apply an artistic style to a source image. Supports 10 art styles with configurable intensity and color palette via img2img generation.\n\n' +
    'Styles: oil-painting, watercolor, pencil-sketch, pop-art, impressionist, cyberpunk, studio-ghibli, art-deco, minimalist, surrealist. Auto-captions the image if no subject is provided.\n\n' +
    'Docs: runware://docs/features/controlnet-guide',
  inputSchema: {
    type: 'object',
    properties: {
      inputImage: {
        type: 'string',
        description: 'Source image to stylize (UUID, URL, base64, or data URI)',
      },
      style: {
        type: 'string',
        enum: [
          'oil-painting', 'watercolor', 'pencil-sketch', 'pop-art',
          'impressionist', 'cyberpunk', 'studio-ghibli', 'art-deco',
          'minimalist', 'surrealist',
        ],
        description: 'Artistic style to apply',
      },
      subject: {
        type: 'string',
        description: 'Text description of the image subject (auto-captioned if omitted)',
      },
      intensity: {
        type: 'string',
        enum: ['subtle', 'moderate', 'strong'],
        description: 'Stylization intensity (default: moderate)',
        default: 'moderate',
      },
      colorPalette: {
        type: 'string',
        enum: ['warm', 'cool', 'monochrome', 'vibrant', 'pastel'],
        description: 'Color palette to guide the output (default: vibrant)',
        default: 'vibrant',
      },
      model: {
        type: 'string',
        description: 'Model identifier for generation (default: runware:100@1)',
        default: 'runware:100@1',
      },
      width: {
        type: 'number',
        description: 'Output width in pixels (512-2048, multiple of 64)',
      },
      height: {
        type: 'number',
        description: 'Output height in pixels (512-2048, multiple of 64)',
      },
      steps: {
        type: 'number',
        description: 'Number of diffusion steps (1-100)',
      },
      strength: {
        type: 'number',
        description: 'Img2img denoising strength 0-1, lower preserves more of original (default: 0.65)',
        default: 0.65,
      },
      outputType: {
        type: 'string',
        enum: ['URL', 'base64Data', 'dataURI'],
        description: 'How to return the generated image',
      },
      outputFormat: {
        type: 'string',
        enum: ['JPG', 'PNG', 'WEBP'],
        description: 'Image format for output',
      },
      includeCost: {
        type: 'boolean',
        description: 'Include cost information in response',
        default: true,
      },
    },
    required: ['inputImage', 'style'],
  },
} as const;
