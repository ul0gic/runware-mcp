/**
 * ByteDance Provider — Provider Documentation
 *
 * Image generation provider specializing in sequential
 * narrative image generation and prompt optimization.
 */

import type { DocResource } from '../../types.js';

export const bytedanceDoc: DocResource = {
  id: 'bytedance',
  category: 'providers',
  title: 'ByteDance (Image)',
  summary:
    'Image generation with sequential narrative images (1-15) and standard/fast prompt optimization modes',
  tags: ['bytedance', 'image', 'provider', 'sequential-images', 'narrative', 'prompt-optimization'],
  content: {
    description:
      'ByteDance is an image generation provider that offers a unique sequential image generation capability. Choose ByteDance when you need to generate a series of related images that tell a story, show a progression, or create a visual narrative. The maxSequentialImages parameter (1-15) creates a cohesive set of images that maintain character and scene consistency across frames. This is ideal for storyboards, comic panels, product showcases, or tutorial sequences. ByteDance also provides prompt optimization in two modes: "standard" for thorough optimization and "fast" for quicker results.',

    parameters: [
      {
        name: 'providerSettings.byteDance.maxSequentialImages',
        type: 'integer',
        required: false,
        range: '1-15',
        description:
          'Number of sequential images to generate for narrative sequences. The model maintains character consistency, scene continuity, and visual coherence across all images in the sequence.',
      },
      {
        name: 'providerSettings.byteDance.optimizePromptMode',
        type: 'string (enum)',
        required: false,
        description:
          'Prompt optimization mode. "standard" applies thorough optimization for best quality. "fast" applies lighter optimization for quicker generation. Options: standard, fast.',
      },
    ],

    examples: [
      {
        title: 'Story sequence for a children\'s book',
        input: {
          positivePrompt:
            'a little fox discovers a magical garden, meets friendly animals, illustration style, warm colors, storybook',
          model: 'bytedance:1@1',
          width: 1024,
          height: 768,
          providerSettings: {
            byteDance: {
              maxSequentialImages: 6,
              optimizePromptMode: 'standard',
            },
          },
        },
        explanation:
          'Generates 6 sequential images telling the story of a fox in a magical garden. The model maintains the fox character design, garden setting, and illustration style across all 6 frames, creating a cohesive storybook sequence.',
      },
      {
        title: 'Product showcase sequence',
        input: {
          positivePrompt:
            'sleek wireless headphones from multiple angles, studio lighting, white background, product photography',
          model: 'bytedance:1@1',
          width: 1024,
          height: 1024,
          providerSettings: {
            byteDance: {
              maxSequentialImages: 4,
              optimizePromptMode: 'fast',
            },
          },
        },
        explanation:
          'Creates 4 product shots of the same headphones from different angles. Fast optimization mode speeds up generation for iterative product photography workflows. The model maintains product consistency across views.',
      },
    ],

    tips: [
      'Sequential images work best when the prompt describes a narrative arc or progression. Include story elements: "discovers", "meets", "transforms", "arrives at".',
      'For character consistency across frames, describe the character in detail in the prompt. The model uses this description to maintain appearance across all sequential images.',
      'Start with 3-5 sequential images for testing. Longer sequences (10-15) are useful for detailed storyboards but require more generation time.',
      'Use "standard" optimization for final production sequences and "fast" optimization for brainstorming and iteration.',
      'Sequential images are returned as an array. Each image maintains the visual thread while advancing the narrative described in the prompt.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/providers/ideogram',
      'runware://docs/providers/bfl',
    ],
  },
  lastUpdated: '2026-02-05',
};
