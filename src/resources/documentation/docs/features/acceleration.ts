/**
 * Generation Acceleration — Feature Guide Documentation
 *
 * Covers TeaCache, DeepCache, and FBCache for faster
 * image generation with quality tradeoffs.
 */

import type { DocResource } from '../../types.js';

export const accelerationDoc: DocResource = {
  id: 'acceleration',
  category: 'features',
  title: 'Generation Acceleration',
  summary:
    'Speed optimization for image generation using TeaCache, DeepCache, and preset acceleration levels',
  tags: ['acceleration', 'speed', 'performance', 'teacache', 'deepcache', 'image-generation'],
  content: {
    description:
      'Runware provides multiple acceleration options to speed up image generation at the cost of minor quality reductions. The simplest approach is the acceleration preset (none/low/medium/high) which automatically applies appropriate optimizations. For fine-grained control, you can enable specific caching strategies: TeaCache for transformer-based models (Flux, SD3) caches attention computations between similar timesteps; DeepCache for UNet-based models (SDXL, SD 1.5) caches intermediate feature maps. The right choice depends on your model architecture and quality requirements.',

    parameters: [
      {
        name: 'acceleration',
        type: 'string (enum)',
        required: false,
        description:
          'Preset acceleration level. "none" = no acceleration, "low" = minor speedup with minimal quality loss, "medium" = balanced speedup, "high" = maximum speedup with noticeable quality reduction. Options: none, low, medium, high.',
      },
      {
        name: 'teaCache',
        type: 'boolean',
        required: false,
        description:
          'Enable TeaCache for transformer models (Flux, SD3). Caches attention computations between timesteps that produce similar outputs. Not effective for UNet models.',
      },
      {
        name: 'deepCache',
        type: 'boolean',
        required: false,
        description:
          'Enable DeepCache for UNet models (SDXL, SD 1.5). Caches intermediate feature maps from deeper network layers. Not effective for transformer models.',
      },
    ],

    examples: [
      {
        title: 'Preset acceleration for quick iteration',
        input: {
          positivePrompt: 'concept art of a futuristic city, neon lights',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 1024,
          acceleration: 'medium',
        },
        explanation:
          'Uses the medium acceleration preset for a good balance between speed and quality. Ideal during iterative prompt development when you want fast feedback without worrying about specific model architecture.',
      },
      {
        title: 'TeaCache for Flux transformer model',
        input: {
          positivePrompt: 'photorealistic portrait, studio lighting, 4k detail',
          model: 'bfl:1@1',
          width: 1024,
          height: 1024,
          teaCache: true,
        },
        explanation:
          'Enables TeaCache specifically for a Flux model (transformer architecture). TeaCache identifies timesteps with similar attention patterns and reuses cached results, reducing computation without significant quality loss.',
      },
    ],

    tips: [
      'Use the "acceleration" preset (low/medium/high) for the simplest approach. It automatically applies the right optimizations for the model.',
      'TeaCache only works with transformer-based models: Flux, SD3, and similar architectures. Do not enable it for SDXL or SD 1.5.',
      'DeepCache only works with UNet-based models: SDXL, SD 1.5, and similar architectures. Do not enable it for Flux or SD3.',
      'For iterative prompt development, use "high" acceleration to get fast previews, then switch to "none" or "low" for final quality renders.',
      'Acceleration has the most impact on high-step counts (30+ steps). At low step counts (10-15), the speedup is less significant.',
      'Do not combine the acceleration preset with explicit teaCache/deepCache settings. Use one approach or the other.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/features/refiner-models',
    ],
  },
  lastUpdated: '2026-02-05',
};
