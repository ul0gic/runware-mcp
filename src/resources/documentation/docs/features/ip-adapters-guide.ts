/**
 * IP-Adapter Image Prompts — Feature Guide Documentation
 *
 * Covers image prompt adapters for style transfer,
 * composition transfer, and face-based generation.
 */

import type { DocResource } from '../../types.js';

export const ipAdaptersGuideDoc: DocResource = {
  id: 'ip-adapters-guide',
  category: 'features',
  title: 'IP-Adapter Image Prompts',
  summary:
    'Image prompt adapters that use reference images to guide style, composition, or facial features in generated images',
  tags: ['ip-adapter', 'image-prompt', 'style-transfer', 'composition', 'image-generation'],
  content: {
    description:
      'IP-Adapters (Image Prompt Adapters) allow you to use reference images as visual prompts alongside text prompts. Instead of describing a style or composition in words, you provide one or more reference images that the adapter encodes into visual features. The model then generates output that incorporates those visual qualities. IP-Adapters support multiple modes: style_transfer extracts artistic style, composition captures layout and spatial arrangement, face_id preserves facial identity, plus provides general image influence, and plus_face combines general features with facial emphasis. You can use up to 4 IP-Adapters simultaneously, each with independent weight and step controls.',

    parameters: [
      {
        name: 'ipAdapters',
        type: 'array of IP-Adapter configs',
        required: false,
        range: 'max 4 items',
        description:
          'Array of IP-Adapter configurations. Each entry specifies a model, guide images, and influence settings.',
      },
      {
        name: 'ipAdapters[].model',
        type: 'string',
        required: true,
        description: 'IP-Adapter model identifier. Different models specialize in different tasks.',
      },
      {
        name: 'ipAdapters[].guideImages',
        type: 'array of image inputs',
        required: true,
        range: '1-4 images',
        description:
          'Reference images that provide visual guidance. Multiple images blend their features.',
      },
      {
        name: 'ipAdapters[].weight',
        type: 'number',
        required: false,
        range: '0-1',
        description:
          'How strongly the reference images influence the output. Higher values follow the reference more closely.',
      },
      {
        name: 'ipAdapters[].startStep',
        type: 'number',
        required: false,
        range: '0-1',
        description:
          'Normalized step at which IP-Adapter influence begins. Delaying the start lets the text prompt establish the base composition first.',
      },
      {
        name: 'ipAdapters[].endStep',
        type: 'number',
        required: false,
        range: '0-1',
        description:
          'Normalized step at which IP-Adapter influence ends. Ending early allows the model to refine details independently.',
      },
      {
        name: 'ipAdapters[].mode',
        type: 'string (enum)',
        required: false,
        description:
          'Weighting mode that determines what visual features are extracted. Options: style_transfer, composition, face_id, plus, plus_face.',
      },
    ],

    examples: [
      {
        title: 'Style transfer from a reference painting',
        input: {
          positivePrompt: 'a coastal village at sunset, warm tones',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 768,
          ipAdapters: [
            {
              model: 'runware:55@3',
              guideImages: ['https://example.com/impressionist-painting.jpg'],
              weight: 0.75,
              mode: 'style_transfer',
            },
          ],
        },
        explanation:
          'Extracts the artistic style (brushwork, color palette, lighting) from an impressionist painting and applies it to a new scene. The text prompt defines the subject; the IP-Adapter defines the style.',
      },
      {
        title: 'Composition transfer with step control',
        input: {
          positivePrompt: 'cyberpunk city street, neon lights, rain',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 1024,
          ipAdapters: [
            {
              model: 'runware:55@3',
              guideImages: ['https://example.com/composition-reference.jpg'],
              weight: 0.6,
              startStep: 0,
              endStep: 0.5,
              mode: 'composition',
            },
          ],
        },
        explanation:
          'Uses a reference image to guide the spatial layout and composition of the scene. The IP-Adapter is active only for the first half of generation (endStep 0.5), establishing layout early and then letting the model develop cyberpunk details freely.',
      },
    ],

    tips: [
      'Use mode "style_transfer" when you want the artistic qualities (color palette, brushwork, lighting mood) of a reference without copying its content.',
      'Use mode "composition" when you want to replicate the spatial layout, framing, and object placement of a reference while generating entirely new content.',
      'For portrait work, mode "face_id" or "plus_face" preserves facial features from the reference while allowing different poses, lighting, and backgrounds.',
      'When combining IP-Adapters with ControlNet, use IP-Adapter for style/mood and ControlNet for structural guidance. They complement each other well.',
      'Lower weights (0.3-0.5) produce subtle influence; higher weights (0.7-1.0) strongly impose the reference. Start at 0.6 and adjust.',
      'Multiple guide images per IP-Adapter blend their features. Use 2-3 images of the same style for more consistent style extraction.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/features/controlnet-guide',
      'runware://docs/features/identity-preservation',
      'runware://docs/features/lora-guide',
    ],
  },
  lastUpdated: '2026-02-05',
};
