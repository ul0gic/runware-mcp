import type { DocResource } from '../../types.js';

export const choosingProvidersDoc: DocResource = {
  id: 'choosing-providers',
  category: 'guides',
  title: 'Choosing Providers',
  summary: 'Decision matrix for selecting the right Runware provider by use case: commercial photography, artistic images, professional video, lip sync, and more',
  tags: ['providers', 'selection', 'comparison', 'decision', 'BFL', 'Bria', 'Ideogram', 'KlingAI', 'PixVerse', 'Veo', 'Sync', 'ByteDance', 'Alibaba'],
  content: {
    description:
      'Runware aggregates multiple AI providers, each with different strengths. Choosing the right provider for ' +
      'your use case significantly impacts quality, cost, and available features.\n\n' +
      'Image Providers:\n' +
      '- BFL (Black Forest Labs): FLUX models. High-quality general-purpose generation with prompt upsampling, ' +
      'safety tolerance control, and raw output mode. Best for professional quality with fast iteration.\n' +
      '- Bria: Commercially licensed, content-safe generation. Offers photography and art medium modes, prompt ' +
      'enhancement, image enhancement, and strict content moderation. Best for commercial photography and brand-safe content.\n' +
      '- Ideogram: Excels at text rendering in images. 65+ artistic style presets, magic prompt enhancement, custom ' +
      'color palettes, and rendering speed control. Best for artistic images with embedded text or logos.\n' +
      '- ByteDance: Sequential image generation for narratives (up to 15 images in a sequence). Prompt optimization ' +
      'modes. Best for storyboards, comic strips, and sequential visual narratives.\n\n' +
      'Video Providers:\n' +
      '- KlingAI: Comprehensive video generation with 10 models from 1.0 to 2.1. Native audio, camera lock, ' +
      'original sound preservation, video-to-video support. Best for professional video with audio.\n' +
      '- PixVerse: Creative video with 20 viral effects (jiggle, explode, morph, etc.) and 21 camera movements ' +
      '(zoom, pan, orbit, dolly, etc.). Multi-clip cinematic generation. Best for social media and effects-driven content.\n' +
      '- Google Veo: High-quality video with prompt enhancement. Veo 3 adds native audio generation. Best for ' +
      'professional, high-fidelity video with natural motion.\n' +
      '- Alibaba (Wan): Prompt extension, single/multi-shot composition, and native audio. Best for narrative video ' +
      'with structured shot types.\n' +
      '- Sync.so: Specialized lip-sync video. Audio-driven, speaker detection, occlusion handling, segment-based ' +
      'editing. Best for talking head videos and voice-over synchronization.',
    examples: [
      {
        title: 'Commercial product photography with Bria',
        input: {
          positivePrompt: 'Professional product photo of a luxury watch on marble surface, studio lighting',
          model: 'bria:1@1',
          width: 1024,
          height: 1024,
          providerSettings: {
            bria: {
              medium: 'photography',
              promptEnhancement: true,
              contentModeration: true,
              mode: 'high_control',
            },
          },
        },
        explanation:
          'Bria in photography mode with content moderation ensures commercially safe, photorealistic output suitable for marketing materials.',
      },
      {
        title: 'Social media video with PixVerse effects',
        input: {
          positivePrompt: 'A colorful smoothie bowl on a table in morning sunlight',
          model: 'pixverse:3.5@1',
          duration: 5,
          pixverse: {
            effect: 'jiggle',
            cameraMovement: 'zoom_in',
          },
        },
        explanation:
          'PixVerse 3.5 with jiggle effect and zoom creates an engaging, attention-grabbing social media video.',
      },
      {
        title: 'Artistic image with Ideogram text rendering',
        input: {
          positivePrompt: 'A neon sign that reads "OPEN 24/7" in a rainy cyberpunk alley',
          model: 'ideogram:1@1',
          width: 1024,
          height: 1024,
          providerSettings: {
            ideogram: {
              styleType: 'CINEMATIC',
              magicPrompt: 'ON',
              renderingSpeed: 'QUALITY',
            },
          },
        },
        explanation:
          'Ideogram excels at rendering legible text within images. The magic prompt enhances the scene description, and QUALITY rendering speed maximizes detail.',
      },
      {
        title: 'Lip-sync video with Sync.so',
        input: {
          positivePrompt: 'Professional spokesperson delivering a message',
          model: 'sync:1.9.1@1',
          duration: 30,
          frameImages: [{ inputImage: 'uuid-of-portrait-image', frame: 'first' }],
          inputAudios: [{ inputAudio: 'uuid-of-speech-audio' }],
          sync: {
            speakerDetection: true,
            occlusionHandling: true,
          },
        },
        explanation:
          'Sync.so creates a 30-second lip-synced video from a portrait and audio. Speaker detection automatically identifies and tracks the face.',
      },
    ],
    tips: [
      'For commercial use, prefer Bria -- it provides commercially licensed output with content moderation built in.',
      'For text in images (signs, labels, logos), Ideogram significantly outperforms other providers at text rendering accuracy.',
      'For highest image quality, BFL FLUX models are a strong default. Enable promptUpsampling for automatic prompt enhancement.',
      'For social media video content, PixVerse offers the most creative effects. Combine viral effects with camera movements for maximum engagement.',
      'For professional video with audio, KlingAI 2.0+ or Veo 3 provide the best quality. KlingAI offers more control, Veo 3 produces more natural motion.',
      'For lip-sync video, Sync.so is the only specialized option. It supports up to 60-second clips with segment-based audio editing.',
      'For sequential narratives (comics, storyboards), ByteDance supports up to 15 sequential images with character consistency.',
      'For cost-sensitive workflows, community models on CivitAI (accessed via civitai: AIR prefix) are generally cheaper than premium providers.',
      'Use listVideoModels and getVideoModelInfo to explore available video models and their exact capabilities before committing to a provider.',
    ],
    relatedDocs: [
      'runware://docs/providers/bfl',
      'runware://docs/providers/bria',
      'runware://docs/providers/ideogram',
      'runware://docs/providers/bytedance',
      'runware://docs/providers/kling-ai',
      'runware://docs/providers/pixverse',
      'runware://docs/providers/veo',
      'runware://docs/providers/alibaba',
      'runware://docs/providers/sync',
      'runware://docs/tools/image-inference',
      'runware://docs/tools/video-inference',
    ],
  },
  lastUpdated: '2026-02-05',
};
