/**
 * Kling AI Provider — Provider Documentation
 *
 * Video generation provider specializing in native audio,
 * camera control, and multi-version model lineup.
 */

import type { DocResource } from '../../types.js';

export const klingAiDoc: DocResource = {
  id: 'kling-ai',
  category: 'providers',
  title: 'Kling AI (Video)',
  summary:
    'Video generation provider with 10 models spanning versions 1.0-2.1, supporting native audio, camera control, and video-to-video',
  tags: ['kling-ai', 'video', 'provider', 'audio', 'camera-control'],
  content: {
    description:
      'Kling AI is a leading video generation provider with the largest model lineup on Runware (10 models). Their models span versions 1.0 through 2.1, with Standard and Pro tiers at each version. Choose Kling AI when you need native audio generation (available from v1.5+), camera position control (v2.0+), video-to-video transformation (v2.0+), or 1080p output (v1.6+). Kling AI models support text-to-video and image-to-video across all versions, making them versatile for most video generation use cases. The latest 2.1 models offer improved motion quality and extended duration.',

    parameters: [
      {
        name: 'providerSettings.klingai.sound',
        type: 'boolean',
        required: false,
        description:
          'Enable native audio generation for the video. Available on models v1.5 and later. The AI generates appropriate ambient sound, music, or effects matching the video content.',
      },
      {
        name: 'providerSettings.klingai.keepOriginalSound',
        type: 'boolean',
        required: false,
        description:
          'Preserve the original audio from the input video when doing video-to-video transformation. Only applicable when using video input with v2.0+ models.',
      },
      {
        name: 'providerSettings.klingai.cameraFixed',
        type: 'boolean',
        required: false,
        description:
          'Lock the camera position during video generation. Prevents camera movement in the output, producing a static-camera shot. Useful for product showcases, interviews, or scenes requiring a fixed perspective.',
      },
    ],

    examples: [
      {
        title: 'Text-to-video with native audio',
        input: {
          positivePrompt:
            'a busy coffee shop interior, morning light streaming through windows, people chatting',
          model: 'klingai:1.6@2',
          width: 1920,
          height: 1080,
          duration: 5,
          providerSettings: {
            klingai: {
              sound: true,
            },
          },
        },
        explanation:
          'Generates a 1080p video of a coffee shop scene with AI-generated ambient audio (coffee machine sounds, background chatter, soft music). Uses Kling 1.6 Pro for 1080p support with native audio.',
      },
      {
        title: 'Fixed-camera product showcase',
        input: {
          positivePrompt:
            'a luxury watch rotating slowly on a dark velvet surface, studio lighting, close-up',
          model: 'klingai:2@1',
          width: 1920,
          height: 1080,
          duration: 5,
          providerSettings: {
            klingai: {
              cameraFixed: true,
              sound: false,
            },
          },
        },
        explanation:
          'Creates a product showcase video with a locked camera position using Kling 2.0 Master. The camera stays fixed while the watch rotates, ideal for e-commerce or advertising content.',
      },
    ],

    tips: [
      'Model selection guide: v1.0-1.5 Standard for budget work, v1.6 Pro for general 1080p, v2.0+ for camera control and video-to-video, v2.1 Pro for best motion quality.',
      'Enable sound only when audio adds value. AI-generated audio works best for ambient scenes (nature, city, interiors) and may be less suitable for dialogue or specific music.',
      'Pro tier models support extended duration (up to 10 seconds) vs Standard models (5 seconds). Choose Pro when longer clips are needed.',
      'Kling 2.0+ supports video-to-video: transform existing video clips by providing a video input with a text prompt describing the desired changes.',
      'Use cameraFixed for any scene where camera stability is important: product shots, interviews, still-life compositions.',
    ],

    relatedDocs: [
      'runware://docs/tools/video-inference',
      'runware://docs/providers/pixverse',
      'runware://docs/providers/veo',
      'runware://docs/providers/alibaba',
    ],
  },
  lastUpdated: '2026-02-05',
};
