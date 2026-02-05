/**
 * Textual Inversion Embeddings — Feature Guide Documentation
 *
 * Covers custom concept embeddings for image generation
 * using Textual Inversion models.
 */

import type { DocResource } from '../../types.js';

export const embeddingsDoc: DocResource = {
  id: 'embeddings',
  category: 'features',
  title: 'Textual Inversion Embeddings',
  summary:
    'Custom concept embeddings that teach the model new words representing specific objects, styles, or concepts',
  tags: ['embeddings', 'textual-inversion', 'custom-concepts', 'image-generation'],
  content: {
    description:
      'Textual Inversion (TI) embeddings are small trained vectors that represent specific visual concepts not in the base model vocabulary. They work by adding new "words" to the model that map to learned visual features. When you load an embedding, its trigger word becomes available in your prompts, allowing you to reference the learned concept naturally. Embeddings are much smaller than LoRAs (typically KBs vs MBs) and focus on teaching the model a single concept rather than modifying its generation style. You can use up to 5 embeddings simultaneously. Each embedding has a weight that controls how strongly it influences the output.',

    parameters: [
      {
        name: 'embeddings',
        type: 'array of embedding configs',
        required: false,
        range: 'max 5 items',
        description: 'Array of Textual Inversion embedding configurations to load.',
      },
      {
        name: 'embeddings[].model',
        type: 'string',
        required: true,
        description:
          'Embedding model identifier. Use the modelSearch tool to find embeddings by concept.',
      },
      {
        name: 'embeddings[].weight',
        type: 'number',
        required: false,
        range: '-2 to 2',
        default: '1',
        description:
          'Influence weight of this embedding. Positive values apply the concept; negative values suppress it.',
      },
    ],

    examples: [
      {
        title: 'Single embedding for a specific art concept',
        input: {
          positivePrompt: 'a castle on a hill, fantasy landscape, mystical atmosphere',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 768,
          embeddings: [
            {
              model: 'civitai:7808@9208',
              weight: 1,
            },
          ],
        },
        explanation:
          'Loads a single Textual Inversion embedding at full weight to apply a specific visual concept to the generation. The embedding teaches the model a particular rendering style or visual element that enhances the fantasy landscape.',
      },
      {
        title: 'Negative embedding for quality improvement',
        input: {
          positivePrompt: 'photorealistic portrait, studio lighting, sharp details',
          negativePrompt: 'blurry, low quality, deformed',
          model: 'civitai:133005@357609',
          width: 768,
          height: 1024,
          embeddings: [
            {
              model: 'civitai:7808@9208',
              weight: 1,
            },
            {
              model: 'civitai:56519@60938',
              weight: -0.8,
            },
          ],
        },
        explanation:
          'Uses two embeddings: one positive to add a desired quality concept, and one negative (weight -0.8) to actively suppress an unwanted visual pattern. Negative-weight embeddings work similarly to negative prompts but with trained precision.',
      },
    ],

    tips: [
      'Embeddings are architecture-specific: SD 1.5 embeddings work with SD 1.5 models, SDXL embeddings with SDXL models.',
      'Unlike LoRAs, embeddings do not modify the model weights. They only add new vocabulary tokens, making them lighter and less likely to cause artifacts.',
      'Use negative weights on "bad quality" or "bad anatomy" embeddings in combination with negative prompts for stronger quality control.',
      'Embeddings combine well with LoRAs. Use embeddings for specific concepts and LoRAs for broader style changes.',
      'The weight range is -2 to 2, but values between -1 and 1.5 produce the most stable results. Extreme weights can cause distortion.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/model-search',
      'runware://docs/features/lora-guide',
      'runware://docs/features/prompt-weighting',
    ],
  },
  lastUpdated: '2026-02-05',
};
