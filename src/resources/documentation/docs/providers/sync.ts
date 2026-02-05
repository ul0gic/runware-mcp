/**
 * Sync.so Provider — Provider Documentation
 *
 * Lip sync video provider specializing in audio-driven
 * face animation with speaker detection.
 */

import type { DocResource } from '../../types.js';

export const syncDoc: DocResource = {
  id: 'sync',
  category: 'providers',
  title: 'Sync.so (Lip Sync)',
  summary:
    'Professional lip-sync video provider with speaker detection, occlusion handling, and multi-audio segment editing',
  tags: ['sync', 'lip-sync', 'video', 'provider', 'audio-driven', 'speaker-detection'],
  content: {
    description:
      'Sync.so is a specialized provider for audio-driven lip synchronization. Unlike other video providers that generate video from text prompts, Sync.so takes an existing video or image of a person and synchronizes their lip movements to match provided audio. Choose Sync.so when you need dubbing, voiceover synchronization, audio-driven talking head videos, or multi-language lip adaptation. The model supports speaker detection for multi-person scenes, occlusion handling for partially hidden faces, and segment-based audio editing for precise multi-track control. Sync 1.9.1 supports up to 60 seconds of video at 1080p.',

    parameters: [
      {
        name: 'providerSettings.sync.speakerDetection',
        type: 'boolean',
        required: false,
        description:
          'Enable automatic speaker detection. Identifies and tracks individual speakers in multi-person scenes, applying lip sync only to the active speaker.',
      },
      {
        name: 'providerSettings.sync.occlusionHandling',
        type: 'boolean',
        required: false,
        description:
          'Enable occlusion handling. Improves lip sync quality when the face is partially covered by hands, objects, or other people. Uses inpainting to maintain natural appearance.',
      },
      {
        name: 'providerSettings.sync.audioSegments',
        type: 'array of AudioSegment objects',
        required: false,
        description:
          'Audio segments for multi-audio editing. Each segment specifies a time range (start/end in seconds) and an audio source (URL or UUID). Allows different audio tracks for different parts of the video.',
      },
      {
        name: 'audioSegments[].start',
        type: 'number',
        required: true,
        range: '0+',
        description: 'Start time of the audio segment in seconds.',
      },
      {
        name: 'audioSegments[].end',
        type: 'number',
        required: true,
        range: '0+',
        description: 'End time of the audio segment in seconds.',
      },
      {
        name: 'audioSegments[].audio',
        type: 'string',
        required: true,
        description: 'Audio source for this segment. Can be a URL or a Runware audio UUID.',
      },
    ],

    examples: [
      {
        title: 'Basic lip sync with speaker detection',
        input: {
          positivePrompt: 'professional talking head video, natural speech',
          model: 'sync:1.9.1@1',
          width: 1920,
          height: 1080,
          duration: 15,
          providerSettings: {
            sync: {
              speakerDetection: true,
              occlusionHandling: true,
            },
          },
        },
        explanation:
          'Synchronizes lip movements to provided audio with speaker detection for multi-person handling and occlusion support for natural appearance when the speaker moves their hands near their face.',
      },
      {
        title: 'Multi-segment audio for dubbing',
        input: {
          positivePrompt: 'dubbed interview video, natural lip movements',
          model: 'sync:1.9.1@1',
          width: 1920,
          height: 1080,
          duration: 30,
          providerSettings: {
            sync: {
              speakerDetection: true,
              audioSegments: [
                {
                  start: 0,
                  end: 12,
                  audio: 'https://example.com/intro-audio.mp3',
                },
                {
                  start: 12,
                  end: 25,
                  audio: 'https://example.com/main-audio.mp3',
                },
                {
                  start: 25,
                  end: 30,
                  audio: 'https://example.com/outro-audio.mp3',
                },
              ],
            },
          },
        },
        explanation:
          'Uses audio segments to apply different audio tracks to different parts of the video. This is useful for dubbing workflows where different takes or languages need to be spliced into a continuous video.',
      },
    ],

    tips: [
      'Sync.so works with both video and image inputs. Use a video for natural motion with synced lips, or an image for a talking head from a still photo.',
      'Enable speakerDetection in any scene with more than one person visible. It prevents the model from incorrectly syncing non-speaking faces.',
      'Enable occlusionHandling when the subject is animated or expressive. Hands near the face, microphones, or drinking motions can disrupt lip sync without this.',
      'Audio segments must not overlap. Ensure each segment\'s end time matches the next segment\'s start time for seamless dubbing.',
      'Sync.so supports up to 60 seconds, much longer than other video providers. It is optimized for long-form talking head and dubbing content.',
      'For multi-language dubbing, generate the translated audio first (using audioInference or external TTS), then use Sync.so to match lip movements to the new language.',
    ],

    relatedDocs: [
      'runware://docs/tools/video-inference',
      'runware://docs/tools/audio-inference',
      'runware://docs/providers/kling-ai',
    ],
  },
  lastUpdated: '2026-02-05',
};
