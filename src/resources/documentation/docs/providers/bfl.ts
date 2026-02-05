/**
 * Black Forest Labs (BFL) Provider — Provider Documentation
 *
 * Image generation provider for FLUX models with prompt
 * upsampling, safety tolerance, and raw output mode.
 */

import type { DocResource } from '../../types.js';

export const bflDoc: DocResource = {
  id: 'bfl',
  category: 'providers',
  title: 'Black Forest Labs / FLUX (Image)',
  summary:
    'Image generation provider for FLUX models with prompt upsampling, configurable safety tolerance (0-6), and raw output mode',
  tags: ['bfl', 'flux', 'image', 'provider', 'prompt-upsampling', 'safety'],
  content: {
    description:
      'Black Forest Labs (BFL) is the creator of FLUX, a state-of-the-art transformer-based image generation model family. Choose BFL/FLUX when you need high-quality photorealistic images, excellent text rendering in images, or fine-grained safety control. BFL models use AIR identifiers prefixed with "bfl:" or "flux:". Key differentiators: prompt upsampling (automatic prompt enrichment), a 7-level safety tolerance scale for precise content moderation control, and a raw output mode that minimizes post-processing for authentic, unpolished results.',

    parameters: [
      {
        name: 'providerSettings.bfl.promptUpsampling',
        type: 'boolean',
        required: false,
        default: 'false',
        description:
          'Enable automatic prompt enhancement. The model enriches the prompt with additional detail and quality-boosting keywords. Useful for short prompts; disable for precise prompt control.',
      },
      {
        name: 'providerSettings.bfl.safetyTolerance',
        type: 'integer',
        required: false,
        range: '0-6',
        default: '2',
        description:
          'Content moderation strictness level. 0 = strictest (blocks most content), 6 = most permissive. Default 2 is appropriate for general audiences. Higher values suit art, creative, or unrestricted contexts.',
      },
      {
        name: 'providerSettings.bfl.raw',
        type: 'boolean',
        required: false,
        default: 'false',
        description:
          'Enable raw output mode. Produces images with minimal post-processing for a more authentic, less polished aesthetic. Useful for photojournalism, documentary, or raw photography styles.',
      },
    ],

    examples: [
      {
        title: 'FLUX with prompt upsampling for quick generation',
        input: {
          positivePrompt: 'a cat sitting on a windowsill',
          model: 'bfl:1@1',
          width: 1024,
          height: 1024,
          providerSettings: {
            bfl: {
              promptUpsampling: true,
            },
          },
        },
        explanation:
          'A simple prompt is automatically enriched by BFL to include quality-boosting details like lighting, composition, and detail descriptions. This produces higher quality results from minimal input.',
      },
      {
        title: 'Raw mode for documentary photography',
        input: {
          positivePrompt:
            'street photography, rain-soaked tokyo alley at night, neon reflections on wet pavement, 35mm film grain',
          model: 'bfl:1@1',
          width: 1024,
          height: 768,
          providerSettings: {
            bfl: {
              raw: true,
              safetyTolerance: 3,
            },
          },
        },
        explanation:
          'Raw mode produces an unpolished, authentic look ideal for street and documentary photography. Combined with the film grain prompt and slightly relaxed safety tolerance, this creates a gritty, realistic image.',
      },
    ],

    tips: [
      'FLUX excels at text rendering in images. Use it when the generated image needs readable text (signs, labels, posters).',
      'safetyTolerance scale: 0-1 for children/family content, 2 (default) for general audiences, 3-4 for art/creative platforms, 5-6 for unrestricted contexts.',
      'Raw mode disables the model\'s aesthetic polish. The result looks more like a real photograph and less like AI-generated art.',
      'Prompt upsampling and raw mode serve opposite goals. Upsampling adds polish; raw removes it. Do not enable both simultaneously.',
      'FLUX is a transformer model, so TeaCache acceleration works well with it but DeepCache does not.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/features/acceleration',
      'runware://docs/features/safety-filtering',
      'runware://docs/providers/bria',
      'runware://docs/providers/ideogram',
    ],
  },
  lastUpdated: '2026-02-05',
};
