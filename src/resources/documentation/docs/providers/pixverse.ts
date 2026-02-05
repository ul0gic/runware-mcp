/**
 * PixVerse Provider — Provider Documentation
 *
 * Video generation provider specializing in viral effects,
 * camera movements, and multi-clip cinematic generation.
 */

import type { DocResource } from '../../types.js';

export const pixverseDoc: DocResource = {
  id: 'pixverse',
  category: 'providers',
  title: 'PixVerse (Video)',
  summary:
    'Video generation provider with 20 viral effects, 21 camera movements, and multi-clip cinematic capabilities',
  tags: ['pixverse', 'video', 'provider', 'effects', 'camera-movements', 'multi-clip'],
  content: {
    description:
      'PixVerse specializes in creative video generation with an extensive library of visual effects and camera movements. Choose PixVerse when you need viral-style video effects (jiggle, inflate, melt, explode, morph), precise camera control (zoom, pan, dolly, orbit, crane, track), or multi-clip cinematic sequences. PixVerse offers 3 models: v3.0 (720p, effects + camera), v3.5 (1080p, adds multi-clip), and v4.0 (1080p, adds video-to-video and extended duration). This is the go-to provider for social media content, creative shorts, and effects-driven videos.',

    parameters: [
      {
        name: 'providerSettings.pixverse.effect',
        type: 'string',
        required: false,
        description:
          'Viral effect to apply to the video. 20 available effects: jiggle, inflate, melt, explode, squish, transform, dance, swim, fly, grow, shrink, bounce, spin, wave, pulse, shake, twist, morph, dissolve, emerge.',
      },
      {
        name: 'providerSettings.pixverse.cameraMovement',
        type: 'string',
        required: false,
        description:
          'Camera movement to apply. 21 options: zoom_in, zoom_out, pan_left, pan_right, pan_up, pan_down, dolly_in, dolly_out, dolly_left, dolly_right, tilt_up, tilt_down, orbit_left, orbit_right, crane_up, crane_down, track_left, track_right, push_in, pull_out, static.',
      },
      {
        name: 'providerSettings.pixverse.multiClip',
        type: 'boolean',
        required: false,
        description:
          'Enable multi-clip cinematic generation. Creates multiple connected video shots that form a cohesive sequence. Available on v3.5+ models.',
      },
    ],

    examples: [
      {
        title: 'Viral jiggle effect for social media',
        input: {
          positivePrompt: 'cute puppy sitting on a couch, looking at camera, living room',
          model: 'pixverse:3.5@1',
          width: 1080,
          height: 1920,
          duration: 4,
          providerSettings: {
            pixverse: {
              effect: 'jiggle',
            },
          },
        },
        explanation:
          'Applies the popular jiggle effect to a puppy video in portrait orientation for social media (TikTok/Reels). The jiggle effect adds playful wobbling motion that drives engagement.',
      },
      {
        title: 'Cinematic orbit shot with multi-clip',
        input: {
          positivePrompt:
            'ancient temple ruins in a misty jungle, golden sunlight filtering through canopy, epic cinematic',
          model: 'pixverse:3.5@1',
          width: 1920,
          height: 1080,
          duration: 8,
          providerSettings: {
            pixverse: {
              cameraMovement: 'orbit_right',
              multiClip: true,
            },
          },
        },
        explanation:
          'Creates a multi-clip cinematic sequence of temple ruins with an orbiting camera. Multi-clip generates connected shots that create a documentary-style reveal sequence as the camera circles the ruins.',
      },
    ],

    tips: [
      'Effects work best with image-to-video: provide a seed image of the subject, then apply an effect like jiggle or morph for the most predictable results.',
      'Camera movements are categorized: zoom (in/out), pan (left/right/up/down), dolly (physical camera movement), tilt (camera angle), orbit (circle around subject), crane (vertical), track (horizontal following).',
      'Use "static" camera movement explicitly when you want zero camera motion and no effects, overriding any default camera behavior.',
      'Multi-clip works best with longer durations (6-8 seconds) to allow enough time for multiple connected shots.',
      'PixVerse v4.0 supports video-to-video: apply effects and camera movements to existing video clips for creative transformations.',
      'For viral social media content, combine portrait orientation (1080x1920) with effects like jiggle, bounce, or dance.',
    ],

    relatedDocs: [
      'runware://docs/tools/video-inference',
      'runware://docs/providers/kling-ai',
      'runware://docs/providers/veo',
    ],
  },
  lastUpdated: '2026-02-05',
};
