/**
 * Bria Provider — Provider Documentation
 *
 * Image generation provider focused on commercial use
 * with content moderation, medium selection, and generation modes.
 */

import type { DocResource } from '../../types.js';

export const briaDoc: DocResource = {
  id: 'bria',
  category: 'providers',
  title: 'Bria (Image)',
  summary:
    'Commercial-grade image generation with content moderation, photography/art medium selection, and base/high_control/fast modes',
  tags: ['bria', 'image', 'provider', 'commercial', 'content-moderation', 'photography'],
  content: {
    description:
      'Bria is an image generation provider designed for commercial and enterprise use. Its models are trained on licensed data, making them safe for commercial applications without copyright concerns. Choose Bria when you need legally safe commercial images, built-in content moderation, or control over the output medium (photography vs art). Bria offers three generation modes: "base" for standard quality, "high_control" for maximum prompt adherence, and "fast" for rapid generation. The contentModeration flag (on by default) ensures outputs meet commercial safety standards.',

    parameters: [
      {
        name: 'providerSettings.bria.promptEnhancement',
        type: 'boolean',
        required: false,
        default: 'false',
        description:
          'Enable prompt enhancement. Generates more descriptive prompt variations for richer, more detailed output.',
      },
      {
        name: 'providerSettings.bria.medium',
        type: 'string (enum)',
        required: false,
        description:
          'Output medium type. "photography" produces photorealistic results suitable for stock photography and product images. "art" produces artistic/illustrative output suitable for creative and design work.',
      },
      {
        name: 'providerSettings.bria.enhanceImage',
        type: 'boolean',
        required: false,
        default: 'false',
        description:
          'Enable image enhancement post-processing. Adds richer details, improved contrast, and sharper textures to the generated image.',
      },
      {
        name: 'providerSettings.bria.contentModeration',
        type: 'boolean',
        required: false,
        default: 'true',
        description:
          'Enable content moderation. When true (default), enforces commercial-safe content standards. Recommended for all commercial applications.',
      },
      {
        name: 'providerSettings.bria.mode',
        type: 'string (enum)',
        required: false,
        description:
          'Generation mode. "base" = standard balanced generation. "high_control" = maximum adherence to the prompt with higher quality. "fast" = faster generation with potentially lower quality. Options: base, high_control, fast.',
      },
    ],

    examples: [
      {
        title: 'Commercial product photography',
        input: {
          positivePrompt:
            'professional product photo of a ceramic coffee mug, white background, studio lighting, commercial',
          model: 'bria:1@1',
          width: 1024,
          height: 1024,
          providerSettings: {
            bria: {
              medium: 'photography',
              enhanceImage: true,
              contentModeration: true,
              mode: 'high_control',
            },
          },
        },
        explanation:
          'Generates a commercial-safe product photograph with maximum prompt adherence (high_control mode), photographic medium, and image enhancement for sharp, professional output. Content moderation ensures the output is safe for commercial use.',
      },
      {
        title: 'Fast art generation for design iteration',
        input: {
          positivePrompt:
            'abstract geometric pattern, vibrant colors, modern design, teal and coral palette',
          model: 'bria:1@1',
          width: 1024,
          height: 1024,
          providerSettings: {
            bria: {
              medium: 'art',
              mode: 'fast',
              promptEnhancement: true,
            },
          },
        },
        explanation:
          'Uses fast mode with art medium for rapid design iteration. Prompt enhancement expands the brief description into richer detail. Fast mode trades some quality for speed, ideal when exploring multiple design concepts.',
      },
    ],

    tips: [
      'Bria models are trained on licensed data. Use Bria for any commercial project where copyright safety is a requirement.',
      'Keep contentModeration: true (default) for all client-facing and commercial work. Disable only for internal creative exploration.',
      'Use "high_control" mode when prompt accuracy is critical (product photography, brand assets). Use "fast" mode for brainstorming and iteration. Use "base" for general-purpose generation.',
      'The "photography" medium produces cleaner, more realistic output. The "art" medium allows more creative interpretation and stylistic variation.',
      'Combine enhanceImage: true with high_control mode for the highest quality output. This adds processing time but produces noticeably sharper results.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/features/safety-filtering',
      'runware://docs/providers/bfl',
      'runware://docs/providers/ideogram',
    ],
  },
  lastUpdated: '2026-02-05',
};
