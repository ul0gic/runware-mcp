/**
 * Alibaba / Wan Provider — Provider Documentation
 *
 * Video generation provider specializing in prompt extension,
 * shot composition, and native audio.
 */

import type { DocResource } from '../../types.js';

export const alibabaDoc: DocResource = {
  id: 'alibaba',
  category: 'providers',
  title: 'Alibaba / Wan (Video)',
  summary:
    'Video generation provider with LLM-based prompt extension, single/multi-shot composition, and native audio generation',
  tags: ['alibaba', 'wan', 'video', 'provider', 'prompt-extend', 'shot-types', 'audio'],
  content: {
    description:
      'Alibaba offers the Wan video model family with two tiers: Wan 2.1 (720p, 5s) and Wan 2.1 Pro (1080p, up to 10s). Choose Alibaba/Wan when you need LLM-based prompt extension (the model rewrites your prompt with richer detail for better results), shot composition control (single continuous shot vs multi-shot with scene transitions), or cost-effective native audio generation. Wan models support text-to-video and image-to-video. The prompt extension feature is particularly valuable when working with brief prompts, as the LLM enriches them with cinematic details, camera descriptions, and atmospheric elements.',

    parameters: [
      {
        name: 'providerSettings.alibaba.promptExtend',
        type: 'boolean',
        required: false,
        description:
          'Enable LLM-based prompt rewriting. The prompt is expanded with additional cinematic details, scene descriptions, and atmospheric elements for enhanced video quality. Recommended for short or simple prompts.',
      },
      {
        name: 'providerSettings.alibaba.shotType',
        type: 'string (enum)',
        required: false,
        description:
          'Shot composition type. "single" creates one continuous shot. "multi" creates a video with multiple shot compositions and scene transitions for a more cinematic result.',
      },
      {
        name: 'providerSettings.alibaba.audio',
        type: 'boolean',
        required: false,
        description:
          'Enable native audio generation. The AI generates appropriate sound effects, ambient audio, or music that matches the video content.',
      },
    ],

    examples: [
      {
        title: 'Prompt extension for cinematic quality',
        input: {
          positivePrompt: 'a samurai walking through cherry blossoms',
          model: 'wan:1@2',
          width: 1920,
          height: 1080,
          duration: 8,
          providerSettings: {
            alibaba: {
              promptExtend: true,
              audio: true,
            },
          },
        },
        explanation:
          'The brief prompt is automatically expanded by the LLM into a detailed cinematic description (camera angles, lighting, atmosphere). Combined with native audio, this produces a rich cinematic clip from a simple input. Uses Wan 2.1 Pro for 1080p and extended duration.',
      },
      {
        title: 'Multi-shot composition for storytelling',
        input: {
          positivePrompt:
            'a day in the life of a street food vendor in Bangkok, colorful market, cooking, customers',
          model: 'wan:1@2',
          width: 1920,
          height: 1080,
          duration: 10,
          providerSettings: {
            alibaba: {
              shotType: 'multi',
              promptExtend: true,
            },
          },
        },
        explanation:
          'Uses multi-shot composition to create a sequence of connected shots showing different moments: establishing shot of the market, close-up of cooking, customer interactions. Prompt extension enriches each shot with cinematic detail.',
      },
    ],

    tips: [
      'Enable promptExtend when your prompt is short or simple. The LLM adds cinematic detail that significantly improves video quality.',
      'Disable promptExtend when your prompt is already detailed and specific. The LLM rewriting might alter your intended composition.',
      'Use "multi" shotType for narrative content, documentaries, or storytelling sequences. Use "single" for focused scenes, product shots, or continuous motion.',
      'Wan 2.1 Pro (wan:1@2) offers 1080p and up to 10 seconds. Wan 2.1 (wan:1@1) is more cost-effective at 720p and 5 seconds.',
      'Combining promptExtend + multi shotType + audio produces the richest output from the simplest input. Ideal when you want maximum quality with minimal prompt engineering.',
    ],

    relatedDocs: [
      'runware://docs/tools/video-inference',
      'runware://docs/providers/kling-ai',
      'runware://docs/providers/veo',
    ],
  },
  lastUpdated: '2026-02-05',
};
