/**
 * LoRA Style Adaptation — Feature Guide Documentation
 *
 * Covers Low-Rank Adaptation for style and subject emphasis
 * in image generation.
 */

import type { DocResource } from '../../types.js';

export const loraGuideDoc: DocResource = {
  id: 'lora-guide',
  category: 'features',
  title: 'LoRA Style Adaptation',
  summary:
    'Low-Rank Adaptation models for applying specific styles, subjects, or concepts to generated images',
  tags: ['lora', 'style', 'adaptation', 'image-generation', 'fine-tuning'],
  content: {
    description:
      'LoRA (Low-Rank Adaptation) is a technique for applying specialized style, subject, or concept modifications to a base model without replacing it. LoRA models are lightweight adapters trained on specific visual concepts (e.g., a particular art style, character, lighting technique) that can be loaded on top of any compatible base model. You can stack up to 5 LoRAs simultaneously, blending multiple styles or concepts in a single generation. Each LoRA has an adjustable weight that controls how strongly it influences the output. LoRA models use AIR identifiers just like base models.',

    parameters: [
      {
        name: 'lora',
        type: 'array of LoRA configs',
        required: false,
        range: 'max 5 items',
        description:
          'Array of LoRA configurations to apply. Each entry specifies a LoRA model and its influence weight.',
      },
      {
        name: 'lora[].model',
        type: 'string',
        required: true,
        description:
          'LoRA model identifier in AIR format (e.g., "civitai:12345@67890"). Use the modelSearch tool to find LoRA models.',
      },
      {
        name: 'lora[].weight',
        type: 'number',
        required: false,
        range: '-2 to 2',
        default: '1',
        description:
          'Influence weight of this LoRA. Positive values apply the style; negative values suppress it. 1.0 is full effect, 0.5 is half effect.',
      },
    ],

    examples: [
      {
        title: 'Single LoRA for art style',
        input: {
          positivePrompt: 'a serene mountain lake at dawn, soft light',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 768,
          lora: [
            {
              model: 'civitai:82098@87153',
              weight: 0.8,
            },
          ],
        },
        explanation:
          'Applies a single LoRA at 0.8 weight to influence the art style of the landscape. Using a weight below 1.0 blends the LoRA style with the base model for a more natural result.',
      },
      {
        title: 'Stacking multiple LoRAs',
        input: {
          positivePrompt: 'portrait of a woman in a garden, golden hour',
          model: 'civitai:133005@357609',
          width: 768,
          height: 1024,
          lora: [
            {
              model: 'civitai:82098@87153',
              weight: 0.7,
            },
            {
              model: 'civitai:58390@62833',
              weight: 0.5,
            },
            {
              model: 'civitai:14171@16677',
              weight: 0.3,
            },
          ],
        },
        explanation:
          'Stacks three LoRAs with decreasing weights. The first LoRA has the strongest influence (0.7), while the third is a subtle accent (0.3). When stacking, keep total combined influence moderate to avoid artifacts.',
      },
    ],

    tips: [
      'Start with weight 1.0 for a single LoRA and adjust. For multiple LoRAs, use lower weights (0.3-0.7 each) to prevent conflicts.',
      'Negative weights (-0.5 to -2) actively suppress a concept. This can be useful to remove unwanted style elements from the base model.',
      'LoRA compatibility depends on the base model architecture. SD 1.5 LoRAs work with SD 1.5 models, SDXL LoRAs with SDXL models, and FLUX LoRAs with FLUX models.',
      'Use the modelSearch tool with type filter to discover LoRA models for specific styles or subjects.',
      'When stacking LoRAs, apply the most important style at the highest weight and secondary accents at lower weights. Order in the array does not matter; only weight values determine influence.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/model-search',
      'runware://docs/features/controlnet-guide',
      'runware://docs/features/embeddings',
    ],
  },
  lastUpdated: '2026-02-05',
};
