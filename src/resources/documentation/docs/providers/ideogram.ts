/**
 * Ideogram Provider — Provider Documentation
 *
 * Image generation provider focused on creative styling
 * with extensive style presets, magic prompt, and color palettes.
 */

import type { DocResource } from '../../types.js';

export const ideogramDoc: DocResource = {
  id: 'ideogram',
  category: 'providers',
  title: 'Ideogram (Image)',
  summary:
    'Creative image generation with 65+ style presets, magic prompt enhancement, color palette control, and speed/quality tradeoffs',
  tags: ['ideogram', 'image', 'provider', 'styles', 'magic-prompt', 'color-palette'],
  content: {
    description:
      'Ideogram is an image generation provider that excels at creative and artistic output with extensive styling controls. Choose Ideogram when you need specific artistic styles (65+ presets), custom color palettes, or the magic prompt feature that intelligently enhances your prompt. Ideogram also offers three rendering speed tiers (TURBO/DEFAULT/QUALITY) for balancing generation speed against output quality. The combination of style types, style presets, and color palettes gives you granular creative control that exceeds most other providers.',

    parameters: [
      {
        name: 'providerSettings.ideogram.renderingSpeed',
        type: 'string (enum)',
        required: false,
        description:
          'Speed/quality tradeoff. "TURBO" = fastest generation with lower quality. "DEFAULT" = balanced speed and quality. "QUALITY" = slowest generation with highest quality. Options: TURBO, DEFAULT, QUALITY.',
      },
      {
        name: 'providerSettings.ideogram.magicPrompt',
        type: 'string (enum)',
        required: false,
        description:
          'Magic prompt enhancement mode. "AUTO" = model decides whether to enhance. "ON" = always enhance the prompt with creative details. "OFF" = use the prompt exactly as provided. Options: AUTO, ON, OFF.',
      },
      {
        name: 'providerSettings.ideogram.styleType',
        type: 'string',
        required: false,
        description:
          'High-level artistic style category. Available types include: AUTO, GENERAL, REALISTIC, DESIGN, FICTION, ANIME, 3D_RENDERING, CINEMATIC, FASHION, FOOD, INTERIOR, ARCHITECTURE, and more.',
      },
      {
        name: 'providerSettings.ideogram.stylePreset',
        type: 'string',
        required: false,
        description:
          'Specific style preset name for fine-grained control. Over 65 style presets are available, providing detailed artistic direction beyond the broader styleType categories.',
      },
      {
        name: 'providerSettings.ideogram.colorPalette',
        type: 'string | array of hex colors',
        required: false,
        description:
          'Color palette for the generation. Can be a preset palette name (string) or an array of specific hex color codes (e.g., ["#FF5733", "#33FF57", "#3357FF"]) for custom color control.',
      },
    ],

    examples: [
      {
        title: 'Anime-style character with magic prompt',
        input: {
          positivePrompt: 'a warrior princess in an enchanted forest',
          model: 'ideogram:1@1',
          width: 1024,
          height: 1024,
          providerSettings: {
            ideogram: {
              styleType: 'ANIME',
              magicPrompt: 'ON',
              renderingSpeed: 'QUALITY',
            },
          },
        },
        explanation:
          'Generates an anime-style character image with maximum quality. Magic prompt enhances the brief prompt with anime-specific details (eye style, hair flow, environment detail). QUALITY rendering speed produces the best possible output.',
      },
      {
        title: 'Brand-aligned design with custom color palette',
        input: {
          positivePrompt:
            'modern minimalist logo design for a tech startup, clean geometric shapes',
          model: 'ideogram:1@1',
          width: 1024,
          height: 1024,
          providerSettings: {
            ideogram: {
              styleType: 'DESIGN',
              magicPrompt: 'OFF',
              colorPalette: ['#1A73E8', '#FFFFFF', '#34A853', '#171717'],
              renderingSpeed: 'DEFAULT',
            },
          },
        },
        explanation:
          'Creates a logo design constrained to specific brand colors. Magic prompt is OFF to preserve the exact prompt intent for design work. Custom hex colors ensure brand consistency.',
      },
    ],

    tips: [
      'Use magicPrompt "ON" for creative exploration and "OFF" for precise design work where prompt accuracy matters.',
      'styleType sets the broad category (ANIME, REALISTIC, DESIGN); stylePreset adds fine-grained control within that category. You can use both together.',
      'TURBO rendering is ideal for rapid iteration and previews. Switch to QUALITY only for final renders, as it takes significantly longer.',
      'Custom color palettes work best with design-oriented prompts (logos, patterns, illustrations). For photorealistic prompts, color control may produce unnatural results.',
      'Ideogram is particularly strong at text rendering in images, similar to FLUX. Choose it for posters, signs, or any image that needs legible text.',
      'The AUTO styleType and AUTO magicPrompt are good defaults. They let the model analyze your prompt and choose optimal settings.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/providers/bfl',
      'runware://docs/providers/bria',
      'runware://docs/providers/bytedance',
    ],
  },
  lastUpdated: '2026-02-05',
};
