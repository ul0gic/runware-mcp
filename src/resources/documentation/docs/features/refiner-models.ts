/**
 * Refiner Models — Feature Guide Documentation
 *
 * Covers SDXL two-stage generation with refiner models
 * for enhanced detail and quality.
 */

import type { DocResource } from '../../types.js';

export const refinerModelsDoc: DocResource = {
  id: 'refiner-models',
  category: 'features',
  title: 'Refiner Models',
  summary:
    'Two-stage SDXL generation using refiner models to enhance fine detail and overall image quality',
  tags: ['refiner', 'sdxl', 'quality', 'two-stage', 'detail-enhancement', 'image-generation'],
  content: {
    description:
      'Refiner models enable two-stage image generation where a base model generates the initial composition and a refiner model then enhances fine details, textures, and overall quality. This technique was introduced with SDXL and works by splitting the diffusion process: the base model handles the early denoising steps (establishing layout, composition, and major features) while the refiner takes over at a specified step to polish details. The refiner specializes in high-frequency detail, skin texture, fabric patterns, and other fine-grained visual elements that benefit from specialized processing.',

    parameters: [
      {
        name: 'refiner',
        type: 'object',
        required: false,
        description:
          'Refiner configuration for two-stage generation. Only applicable to SDXL-compatible models.',
      },
      {
        name: 'refiner.model',
        type: 'string',
        required: true,
        description:
          'Refiner model identifier in AIR format. Must be an SDXL refiner model compatible with the base model.',
      },
      {
        name: 'refiner.startStep',
        type: 'number',
        required: false,
        range: '0-1',
        description:
          'Normalized step at which the refiner takes over from the base model. 0.8 means the base handles the first 80% of steps and the refiner handles the last 20%. Typical values: 0.7-0.85.',
      },
    ],

    examples: [
      {
        title: 'SDXL base + refiner for portrait quality',
        input: {
          positivePrompt:
            'portrait of a woman, natural lighting, detailed skin texture, photorealistic',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 1024,
          steps: 40,
          refiner: {
            model: 'civitai:133005@357610',
            startStep: 0.8,
          },
        },
        explanation:
          'The base SDXL model generates the portrait layout and features for the first 80% of steps (32 out of 40). The refiner then takes over for the final 20% (8 steps) to enhance skin texture, hair detail, and lighting nuance.',
      },
      {
        title: 'Earlier refiner handoff for maximum detail',
        input: {
          positivePrompt:
            'macro photograph of a butterfly wing, extreme detail, iridescent colors',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 1024,
          steps: 50,
          refiner: {
            model: 'civitai:133005@357610',
            startStep: 0.7,
          },
        },
        explanation:
          'Uses an earlier handoff at 0.7 (35 base steps, 15 refiner steps) to give the refiner more time to develop intricate detail. This is ideal for subjects with complex fine-grained patterns like butterfly wings or fabric textures.',
      },
    ],

    tips: [
      'Refiners only work with SDXL-family models. They are not compatible with SD 1.5, Flux, or SD3 models.',
      'Start with startStep 0.8 for most use cases. Lower values (0.7) give the refiner more influence over details; higher values (0.85-0.9) keep the refiner as a light polish.',
      'Use higher total step counts (30-50) when using a refiner. The base model needs enough steps to establish composition before the handoff.',
      'The refiner adds processing time proportional to the steps it handles. A 40-step generation with startStep 0.8 runs 32 base steps + 8 refiner steps.',
      'For maximum quality, combine refiners with CFGScale 6-8 and high step counts. The refiner benefits from clean base generation.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/features/acceleration',
      'runware://docs/features/lora-guide',
    ],
  },
  lastUpdated: '2026-02-05',
};
