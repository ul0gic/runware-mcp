/**
 * Google Veo Provider — Provider Documentation
 *
 * Video generation provider from Google with prompt enhancement
 * and native audio generation (Veo 3).
 */

import type { DocResource } from '../../types.js';

export const veoDoc: DocResource = {
  id: 'veo',
  category: 'providers',
  title: 'Google Veo (Video)',
  summary:
    'Google video generation with Veo 2/3 models offering prompt enhancement and native audio generation',
  tags: ['veo', 'google', 'video', 'provider', 'prompt-enhancement', 'audio'],
  content: {
    description:
      'Google Veo is a premium video generation provider offering three models: Veo 2 (1080p, optional prompt enhancement), Veo 2 HD (1080p, higher quality), and Veo 3 (1080p, native audio with always-on prompt enhancement). Choose Veo when you need high-fidelity video with Google-level quality, especially for cinematic content. Veo 3 is unique in that its prompt enhancement is always enabled and it generates synchronized audio natively. All Veo models support text-to-video and image-to-video at 1080p resolution.',

    parameters: [
      {
        name: 'providerSettings.veo.enhancePrompt',
        type: 'boolean',
        required: false,
        description:
          'Enable automatic prompt enhancement. Google\'s AI rewrites the prompt for optimal video generation results. Always enabled for Veo 3 regardless of this setting.',
      },
      {
        name: 'providerSettings.veo.generateAudio',
        type: 'boolean',
        required: false,
        description:
          'Generate synchronized audio for the video. Only available on Veo 3. Produces ambient sound, music, and effects matched to the video content.',
      },
    ],

    examples: [
      {
        title: 'Veo 2 with prompt enhancement',
        input: {
          positivePrompt: 'aerial drone shot of a coral reef, crystal clear water, tropical fish',
          model: 'veo:2@1',
          width: 1920,
          height: 1080,
          duration: 8,
          providerSettings: {
            veo: {
              enhancePrompt: true,
            },
          },
        },
        explanation:
          'Uses Veo 2 with prompt enhancement to produce a high-quality aerial nature shot. The prompt enhancement adds cinematic details like camera motion, lighting, and composition guidance that improve the output quality.',
      },
      {
        title: 'Veo 3 with native audio',
        input: {
          positivePrompt:
            'a thunderstorm rolling over a prairie at sunset, dramatic clouds, lightning in the distance',
          model: 'veo:3@1',
          width: 1920,
          height: 1080,
          duration: 8,
          providerSettings: {
            veo: {
              generateAudio: true,
            },
          },
        },
        explanation:
          'Veo 3 generates both video and synchronized audio: thunder rumbles, wind sounds, rain in the distance. Prompt enhancement is always on with Veo 3, so the prompt is automatically enriched.',
      },
    ],

    tips: [
      'Veo 3 always enhances prompts regardless of the enhancePrompt setting. Write prompts that describe the desired outcome, not the exact generation process.',
      'Use Veo 2 when you want precise prompt control (enhancePrompt: false) or when audio is not needed.',
      'Use Veo 2 HD (veo:2@2) for the highest visual quality when audio is not required.',
      'Use Veo 3 when audio adds value to the content: nature scenes, cityscapes, action sequences, weather events.',
      'Veo models produce up to 8 seconds of video. For longer content, generate multiple clips and compose them externally.',
    ],

    relatedDocs: [
      'runware://docs/tools/video-inference',
      'runware://docs/providers/kling-ai',
      'runware://docs/providers/alibaba',
    ],
  },
  lastUpdated: '2026-02-05',
};
