/**
 * Prompt Weighting — Feature Guide Documentation
 *
 * Covers Compel syntax for emphasis, de-emphasis,
 * blending, and conjunction in prompts.
 */

import type { DocResource } from '../../types.js';

const PROMPT_SYNTAX_TYPE = 'prompt syntax';

export const promptWeightingDoc: DocResource = {
  id: 'prompt-weighting',
  category: 'features',
  title: 'Prompt Weighting (Compel Syntax)',
  summary:
    'Advanced prompt weighting using Compel syntax for precise control over emphasis, blending, and conjunction of prompt terms',
  tags: ['prompt', 'weighting', 'compel', 'emphasis', 'blending', 'image-generation'],
  content: {
    description:
      'Prompt weighting allows fine-grained control over how strongly individual words or phrases influence the generated image. Using Compel syntax, you can increase or decrease the importance of specific terms, blend multiple concepts together, or create conjunctions that maintain separate concept identities. This is more powerful than simply repeating words or reordering the prompt. The imageInference tool supports two prompt weighting systems: "compel" (recommended, supports advanced operations) and "sdEmbeds" (parentheses/brackets with multipliers). With Compel, you use the (word:weight) syntax where weight > 1 increases emphasis and weight < 1 decreases it.',

    parameters: [
      {
        name: 'Compel emphasis syntax',
        type: PROMPT_SYNTAX_TYPE,
        description:
          '(word:1.5) increases emphasis, (word:0.5) decreases emphasis. The weight is a multiplier relative to 1.0 (normal). Range typically 0.1-2.0.',
      },
      {
        name: 'Compel blend syntax',
        type: PROMPT_SYNTAX_TYPE,
        description:
          '("concept A", "concept B").blend(0.6, 0.4) blends two concepts with specified weights that should sum to 1.0. Creates smooth interpolation between concepts.',
      },
      {
        name: 'Compel conjunction syntax',
        type: PROMPT_SYNTAX_TYPE,
        description:
          '("concept A", "concept B").and() generates both concepts simultaneously without blending. Each concept maintains its full identity. Useful for scenes with distinct elements.',
      },
      {
        name: 'Nested emphasis',
        type: PROMPT_SYNTAX_TYPE,
        description:
          '((word)) doubles emphasis (equivalent to (word:1.21)). Each layer of parentheses multiplies by 1.1. Can be nested up to 3-4 levels.',
      },
    ],

    examples: [
      {
        title: 'Emphasis and de-emphasis for subject control',
        input: {
          positivePrompt:
            'a (dramatic:1.5) sunset over the ocean, (silhouette:1.3) of a lighthouse, (clouds:0.7) in the sky',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 768,
        },
        explanation:
          'Increases emphasis on "dramatic" (1.5x) and "silhouette" (1.3x) to make them dominant features. Decreases "clouds" (0.7x) to make them a subtle background element rather than a focal point.',
      },
      {
        title: 'Blending two art styles',
        input: {
          positivePrompt:
            '("watercolor painting of flowers", "oil painting of flowers").blend(0.6, 0.4)',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 1024,
        },
        explanation:
          'Blends watercolor style (60%) with oil painting style (40%) to create a hybrid artistic medium. The blend weights control the ratio of each concept in the final output.',
      },
    ],

    tips: [
      'Use (word:1.3) to (word:1.5) for moderate emphasis. Going above 2.0 often causes artifacts or distortion.',
      'Use (word:0.5) to (word:0.8) to de-emphasize elements you want present but not dominant.',
      'The .blend() weights should sum to approximately 1.0 for balanced results. Unequal sums shift the output toward the heavier concept.',
      'The .and() conjunction is ideal for complex scenes: ("a red car", "a blue sky background").and() ensures both elements render clearly.',
      'Compel syntax works in both positivePrompt and negativePrompt. Use emphasis in negative prompts to strongly suppress unwanted elements.',
      'Do not mix Compel syntax with sdEmbeds syntax in the same prompt. Choose one system.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/prompt-enhancer',
      'runware://docs/features/lora-guide',
    ],
  },
  lastUpdated: '2026-02-05',
};
