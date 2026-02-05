import type { DocResource } from '../../types.js';

export const videoInferenceDoc: DocResource = {
  id: 'video-inference',
  category: 'tools',
  title: 'Video Generation',
  summary: 'Generate videos from text prompts, images, or existing videos using KlingAI, PixVerse, Alibaba, Veo, and Sync.so providers',
  tags: ['video', 'generation', 'text-to-video', 'image-to-video', 'async', 'KlingAI', 'PixVerse', 'Alibaba', 'Veo'],
  content: {
    description:
      'The videoInference tool generates videos from text descriptions, reference images, or existing videos. ' +
      'Video generation is asynchronous — the MCP server submits the task and polls for results automatically. ' +
      'Multiple providers are supported, each with unique capabilities: KlingAI (sound generation, camera lock), ' +
      'PixVerse (20 viral effects, 21 camera movements, multi-clip), Alibaba/Wan (prompt extend, multi-shot), ' +
      'Google Veo (prompt enhancement, Veo 3 audio), and Sync.so (lip-sync with audio). ' +
      'Returns a video URL with UUID, cost, and polling metadata.',
    parameters: [
      {
        name: 'positivePrompt',
        type: 'string',
        required: true,
        range: '2+ characters',
        description: 'Text description of the desired video content.',
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        description: 'Video model in AIR format. Provider determines available features.',
      },
      {
        name: 'duration',
        type: 'integer',
        required: true,
        range: '1-10',
        description: 'Video duration in seconds.',
      },
      {
        name: 'width',
        type: 'integer',
        range: '256-1920',
        description: 'Video width in pixels. Must be a multiple of 8.',
      },
      {
        name: 'height',
        type: 'integer',
        range: '256-1080',
        description: 'Video height in pixels. Must be a multiple of 8.',
      },
      {
        name: 'fps',
        type: 'integer',
        range: '15-60',
        default: '24',
        description: 'Frames per second.',
      },
      {
        name: 'steps',
        type: 'integer',
        range: '10-50',
        description: 'Number of denoising steps.',
      },
      {
        name: 'CFGScale',
        type: 'number',
        range: '0-50',
        description: 'Classifier-Free Guidance scale. 6-10 recommended for video.',
      },
      {
        name: 'seed',
        type: 'integer',
        description: 'Random seed for reproducible generation.',
      },
      {
        name: 'frameImages',
        type: 'array',
        description: 'Constrained frame images at specific positions. Each has inputImage and frame ("first", "last", or frame number).',
      },
      {
        name: 'referenceImages',
        type: 'array',
        description: 'Reference images for style/composition guidance (max 4).',
      },
      {
        name: 'referenceVideos',
        type: 'array',
        description: 'Reference videos for motion/style influence.',
      },
      {
        name: 'inputAudios',
        type: 'array',
        description: 'Input audio files for audio-driven generation (lip-sync, music-driven).',
      },
      {
        name: 'speech',
        type: 'object',
        description: 'Text-to-speech config: { text, voice }. 14 voices available.',
      },
      {
        name: 'lora',
        type: 'array',
        description: 'LoRA adapters for video style customization.',
      },
      {
        name: 'outputFormat',
        type: 'string',
        default: 'MP4',
        description: 'Video format: "MP4", "WEBM", or "MOV".',
      },
      {
        name: 'outputQuality',
        type: 'integer',
        range: '20-99',
        default: '95',
        description: 'Compression quality.',
      },
      {
        name: 'safety',
        type: 'object',
        description: 'Content safety: { mode: "none" | "fast" | "full" }. Controls frame-by-frame checking.',
      },
      {
        name: 'alibaba',
        type: 'object',
        description: 'Alibaba settings: { promptExtend, shotType, audio }.',
      },
      {
        name: 'klingai',
        type: 'object',
        description: 'KlingAI settings: { sound, keepOriginalSound, cameraFixed }.',
      },
      {
        name: 'pixverse',
        type: 'object',
        description: 'PixVerse settings: { effect, cameraMovement, multiClip }.',
      },
      {
        name: 'veo',
        type: 'object',
        description: 'Veo settings: { enhancePrompt, generateAudio }.',
      },
      {
        name: 'sync',
        type: 'object',
        description: 'Sync.so settings for lip-sync: speaker detection, audio segments, occlusion handling.',
      },
    ],
    examples: [
      {
        title: 'Basic text-to-video',
        input: {
          positivePrompt: 'a drone flying over a tropical beach at sunset, cinematic, 4K',
          model: 'klingai:1@2',
          duration: 5,
          width: 1280,
          height: 720,
        },
        explanation: 'Simple text-to-video with KlingAI. The MCP server handles async polling and returns the final video URL.',
      },
      {
        title: 'Image-to-video with PixVerse effects',
        input: {
          positivePrompt: 'the subject starts dancing with smooth movements',
          model: 'pixverse:1@1',
          duration: 4,
          frameImages: [{ inputImage: 'abc12345-uuid-here', frame: 'first' }],
          pixverse: { effect: 'jiggle' },
        },
        explanation: 'Animates a still image using PixVerse viral effects. The first frame is constrained to the input image.',
      },
    ],
    tips: [
      'Video generation is async and can take 30-120 seconds. The MCP server polls automatically.',
      'KlingAI excels at realistic motion. PixVerse excels at creative effects. Alibaba/Wan is best for prompt-driven content.',
      'Use frameImages with frame: "first" for image-to-video — this constrains the starting frame.',
      'For lip-sync, use Sync.so provider with inputAudios containing the speech audio.',
      'Higher resolution and longer duration increase both cost and generation time significantly.',
    ],
    relatedDocs: [
      'runware://docs/concepts/async-delivery',
      'runware://docs/concepts/air-identifiers',
      'runware://docs/tools/audio-inference',
      'runware://docs/tools/transcription',
    ],
  },
  lastUpdated: '2026-02-05',
};
