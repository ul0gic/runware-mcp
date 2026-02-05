/**
 * Safety & Content Moderation — Feature Guide Documentation
 *
 * Covers NSFW detection, content safety checking, and
 * provider-specific moderation settings.
 */

import type { DocResource } from '../../types.js';

export const safetyFilteringDoc: DocResource = {
  id: 'safety-filtering',
  category: 'features',
  title: 'Safety & Content Moderation',
  summary:
    'Content safety filtering and NSFW detection for generated images, including provider-specific moderation controls',
  tags: ['safety', 'nsfw', 'content-moderation', 'filtering', 'image-generation'],
  content: {
    description:
      'Runware provides content safety filtering at multiple levels. At the API level, the safety.checkContent flag enables fast-mode content checking that flags generated images containing NSFW content via the NSFWContent boolean in the response. Individual providers offer additional moderation controls: BFL (Black Forest Labs) provides a safetyTolerance scale (0-6) for tuning moderation strictness, and Bria provides a contentModeration toggle that enforces commercial-safe content standards. These controls allow you to balance creative freedom with content safety requirements for your application.',

    parameters: [
      {
        name: 'safety',
        type: 'object',
        required: false,
        description: 'Content safety configuration for the generation.',
      },
      {
        name: 'safety.checkContent',
        type: 'boolean',
        required: false,
        description:
          'Enable content safety checking. When enabled, generated images are scanned and the response includes an NSFWContent flag indicating whether the content was flagged.',
      },
      {
        name: 'NSFWContent (response)',
        type: 'boolean',
        description:
          'Returned in the image result when safety checking is enabled. True if the generated image was flagged as potentially inappropriate.',
      },
      {
        name: 'includeCost',
        type: 'boolean',
        required: false,
        default: 'true',
        description:
          'Include generation cost in the response. Useful for tracking usage and billing.',
      },
      {
        name: 'providerSettings.bfl.safetyTolerance',
        type: 'integer',
        required: false,
        range: '0-6',
        default: '2',
        description:
          'BFL-specific moderation strictness. 0 = strictest (blocks most content), 6 = most permissive. Only applies to BFL/FLUX models.',
      },
      {
        name: 'providerSettings.bria.contentModeration',
        type: 'boolean',
        required: false,
        default: 'true',
        description:
          'Bria-specific content moderation. When true, enforces commercial-safe content standards. Only applies to Bria models.',
      },
    ],

    examples: [
      {
        title: 'Enable safety checking for user-facing application',
        input: {
          positivePrompt: 'portrait photograph, studio lighting',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 1024,
          safety: {
            checkContent: true,
          },
          includeCost: true,
        },
        explanation:
          'Enables content safety checking for a user-facing application. The response will include NSFWContent: true/false for each generated image, allowing the application to filter or flag results before displaying them.',
      },
      {
        title: 'BFL model with custom safety tolerance',
        input: {
          positivePrompt: 'fine art figure study, classical painting style',
          model: 'bfl:1@1',
          width: 1024,
          height: 1024,
          providerSettings: {
            bfl: {
              safetyTolerance: 4,
            },
          },
        },
        explanation:
          'Uses BFL safetyTolerance set to 4 (moderately permissive) for an art context where some figure content is expected and appropriate. The default of 2 would be more restrictive.',
      },
    ],

    tips: [
      'Always enable safety.checkContent for user-facing applications. Check the NSFWContent flag in the response before displaying images.',
      'BFL safetyTolerance 0-2 is appropriate for general audiences. 3-4 suits art and creative platforms. 5-6 is only for unrestricted contexts.',
      'Bria contentModeration defaults to true and is recommended for commercial use cases where brand safety is important.',
      'Safety checking adds minimal latency to generation. The performance cost is negligible compared to the risk of displaying inappropriate content.',
      'Provider-specific safety settings only apply when using that provider\'s models. The API-level safety.checkContent works with any model.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/providers/bfl',
      'runware://docs/providers/bria',
    ],
  },
  lastUpdated: '2026-02-05',
};
