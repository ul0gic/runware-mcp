/**
 * Outpainting — Feature Guide Documentation
 *
 * Covers extending images beyond their original borders
 * with configurable expansion and blending.
 */

import type { DocResource } from '../../types.js';

export const outpaintingDoc: DocResource = {
  id: 'outpainting',
  category: 'features',
  title: 'Outpainting',
  summary:
    'Extend images beyond their original borders by generating new content that seamlessly blends with the existing image',
  tags: ['outpainting', 'image-extension', 'canvas-expansion', 'inpainting', 'image-generation'],
  content: {
    description:
      'Outpainting extends an image beyond its original borders by generating new content on one or more sides. The model analyzes the existing image content, understands the scene context, and synthesizes new pixels that seamlessly continue the composition. This is useful for changing aspect ratios, revealing more of a scene, or creating panoramic versions of existing images. Outpainting requires a seedImage (the original image to extend) and an outpaint configuration specifying how many pixels to add on each side. A blur parameter controls the blending smoothness between original and generated content.',

    parameters: [
      {
        name: 'outpaint',
        type: 'object',
        required: false,
        description:
          'Outpainting configuration. Specifies pixel extensions for each side and blur blending.',
      },
      {
        name: 'outpaint.left',
        type: 'integer',
        required: false,
        range: '0-512',
        description: 'Pixels to extend on the left side.',
      },
      {
        name: 'outpaint.right',
        type: 'integer',
        required: false,
        range: '0-512',
        description: 'Pixels to extend on the right side.',
      },
      {
        name: 'outpaint.top',
        type: 'integer',
        required: false,
        range: '0-512',
        description: 'Pixels to extend on the top side.',
      },
      {
        name: 'outpaint.bottom',
        type: 'integer',
        required: false,
        range: '0-512',
        description: 'Pixels to extend on the bottom side.',
      },
      {
        name: 'outpaint.blur',
        type: 'integer',
        required: false,
        range: '0-64',
        description:
          'Blur radius for blending the boundary between original and generated content. Higher values create smoother transitions.',
      },
      {
        name: 'seedImage',
        type: 'string (UUID | URL | base64 | dataURI)',
        required: true,
        description: 'The original image to extend. Required for outpainting.',
      },
    ],

    examples: [
      {
        title: 'Horizontal panorama extension',
        input: {
          positivePrompt: 'sweeping mountain landscape, panoramic view, golden hour',
          model: 'civitai:133005@357609',
          width: 1536,
          height: 768,
          seedImage: 'https://example.com/mountain-photo.jpg',
          outpaint: {
            left: 256,
            right: 256,
            blur: 16,
          },
        },
        explanation:
          'Extends a landscape image 256 pixels on each side to create a wider panoramic view. The blur of 16 ensures smooth blending at the boundaries. The prompt guides what content to generate in the new areas.',
      },
      {
        title: 'Vertical extension for social media format',
        input: {
          positivePrompt: 'modern living room interior, natural lighting',
          model: 'civitai:133005@357609',
          width: 768,
          height: 1024,
          seedImage: 'https://example.com/room-photo.jpg',
          outpaint: {
            top: 128,
            bottom: 256,
            blur: 24,
          },
        },
        explanation:
          'Extends a landscape-oriented room photo vertically to fit a portrait social media format. More extension on the bottom (256px) reveals floor area, while top (128px) shows more ceiling. Higher blur (24) creates an imperceptible transition.',
      },
    ],

    tips: [
      'Always provide a descriptive positivePrompt that describes the scene including the areas being generated. The model uses this to understand what content to create in the expanded regions.',
      'Start with blur 16-24 for most images. Lower blur (4-8) for hard edges like architecture; higher blur (32-48) for organic scenes like landscapes.',
      'Smaller extensions (64-128px per side) produce more coherent results than large extensions (384-512px). For large expansions, consider doing multiple smaller outpaint passes.',
      'The total output dimensions (original + extensions) must still fall within the model dimension limits. Plan your extensions accordingly.',
      'Combine outpainting with a strength parameter (0.7-0.9) to control how much the original image influences the generated content near boundaries.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/features/controlnet-guide',
    ],
  },
  lastUpdated: '2026-02-05',
};
