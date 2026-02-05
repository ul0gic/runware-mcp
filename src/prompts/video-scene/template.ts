/**
 * Video Scene prompt template.
 *
 * Composes detailed video scene descriptions for video generation.
 * Instructs Claude to use the videoInference tool with appropriate
 * model selection, camera work, and atmospheric settings for
 * cinematic video production.
 */

import type { PromptMessage, PromptTemplate } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

const PROMPT_NAME = 'video-scene';
const PROMPT_DESCRIPTION = 'Compose video scene descriptions for cinematic video generation with configurable mood, camera work, and time of day.';

const DEFAULT_MOOD = 'cinematic';
const DEFAULT_CAMERA_WORK = 'static';
const DEFAULT_TIME_OF_DAY = 'day';

const VALID_MOODS = ['epic', 'calm', 'tense', 'joyful', 'mysterious'] as const;
const VALID_CAMERA_WORK = ['static', 'pan', 'zoom-in', 'tracking', 'aerial'] as const;
const VALID_TIMES = ['dawn', 'day', 'golden-hour', 'dusk', 'night'] as const;

// ============================================================================
// Descriptors
// ============================================================================

const MOOD_DESCRIPTORS: Record<string, string> = {
  epic: 'epic, grand scale, awe-inspiring, powerful atmosphere',
  calm: 'serene, peaceful, tranquil, gentle atmosphere',
  tense: 'suspenseful, tense, building anticipation, dramatic undertone',
  joyful: 'uplifting, bright, cheerful, warm-hearted atmosphere',
  mysterious: 'enigmatic, atmospheric fog, ethereal, haunting beauty',
};

const CAMERA_DESCRIPTORS: Record<string, string> = {
  static: 'static camera, locked-off shot, stable tripod composition',
  pan: 'slow cinematic pan, smooth horizontal camera movement revealing the scene',
  'zoom-in': 'gradual zoom-in, drawing focus toward the subject, increasing intimacy',
  tracking: 'tracking shot following the subject, dynamic movement, steadicam feel',
  aerial: 'aerial drone shot, sweeping overhead perspective, establishing scale',
};

const TIME_DESCRIPTORS: Record<string, string> = {
  dawn: 'early dawn light, soft pink and orange hues, gentle morning mist',
  day: 'bright daylight, clear skies, natural midday illumination',
  'golden-hour': 'golden hour warmth, long shadows, rich amber tones, cinematic glow',
  dusk: 'dusk twilight, deep purple and blue gradients, fading warm light',
  night: 'nighttime, moonlight and artificial light sources, deep shadows and highlights',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns camera work considerations based on the selected camera type.
 */
function getCameraConsideration(cameraWork: string): string {
  if (cameraWork === 'static') {
    return '- Static shot: The model will keep the camera position fixed. Focus on subject motion only.';
  }
  if (cameraWork === 'aerial') {
    return '- Aerial shot: Consider KlingAI or PixVerse models which support camera movement controls. Use the klingai.cameraFixed=false setting or pixverse.cameraMovement for fine control.';
  }
  return `- ${cameraWork} shot: Describe the camera movement explicitly in the prompt. Models with camera control (KlingAI, PixVerse) produce better results for complex movements.`;
}

// ============================================================================
// Template
// ============================================================================

/**
 * Video scene prompt template.
 */
export const videoScene: PromptTemplate = {
  name: PROMPT_NAME,
  description: PROMPT_DESCRIPTION,
  arguments: [
    {
      name: 'subject',
      description: 'Main subject or character in the scene (e.g., "a lone astronaut", "a wolf").',
      required: true,
    },
    {
      name: 'action',
      description: 'What is happening in the scene (e.g., "walking through a field", "running toward camera").',
      required: true,
    },
    {
      name: 'setting',
      description: 'Location or environment (e.g., "Mars surface", "dense forest", "neon-lit city street").',
      required: true,
    },
    {
      name: 'mood',
      description: `Atmosphere: ${VALID_MOODS.join(', ')}. Default: "${DEFAULT_MOOD}".`,
      required: false,
    },
    {
      name: 'cameraWork',
      description: `Camera movement: ${VALID_CAMERA_WORK.join(', ')}. Default: "${DEFAULT_CAMERA_WORK}".`,
      required: false,
    },
    {
      name: 'timeOfDay',
      description: `Time of day: ${VALID_TIMES.join(', ')}. Default: "${DEFAULT_TIME_OF_DAY}".`,
      required: false,
    },
  ],

  generate(args: Record<string, string>): readonly PromptMessage[] {
    const subject = args.subject ?? 'a figure';
    const action = args.action ?? 'standing still';
    const setting = args.setting ?? 'an open landscape';
    const mood = args.mood ?? DEFAULT_MOOD;
    const cameraWork = args.cameraWork ?? DEFAULT_CAMERA_WORK;
    const timeOfDay = args.timeOfDay ?? DEFAULT_TIME_OF_DAY;

    const moodDesc = MOOD_DESCRIPTORS[mood] ?? MOOD_DESCRIPTORS[DEFAULT_MOOD] ?? '';
    const cameraDesc = CAMERA_DESCRIPTORS[cameraWork] ?? CAMERA_DESCRIPTORS[DEFAULT_CAMERA_WORK] ?? '';
    const timeDesc = TIME_DESCRIPTORS[timeOfDay] ?? TIME_DESCRIPTORS[DEFAULT_TIME_OF_DAY] ?? '';

    const prompt = [
      `Cinematic video scene: ${subject} ${action} in ${setting}.`,
      `${timeDesc}.`,
      `${moodDesc}.`,
      `${cameraDesc}.`,
      'High production value, cinematic color grading, film grain, depth of field.',
      'Professional cinematography, 4K quality.',
    ].join(' ');

    const content = [
      'Generate a video scene using the videoInference tool:',
      '',
      `Prompt: "${prompt}"`,
      '',
      'Recommended settings:',
      '- Model: Use listVideoModels to find available models. Recommended providers:',
      '  - KlingAI (klingai:2@1) for high-quality cinematic scenes',
      '  - Veo (veo:3@1) for natural motion and optional audio',
      '  - MiniMax (minimax:2@1) for fast generation',
      '- Duration: 5 seconds (adjust based on scene complexity)',
      '- Width: 1280, Height: 720 (or 1920x1080 for supported models)',
      '- Steps: 30',
      '',
      'Camera work considerations:',
      getCameraConsideration(cameraWork),
      '',
      'Tips:',
      '- Use promptEnhance to refine the video prompt before generation.',
      '- For scenes with audio needs, Veo 3 (veo:3@1) supports native audio generation via veo.generateAudio=true.',
      `- The "${mood}" mood should be reinforced through color grading terms in the prompt.`,
      `- "${timeOfDay}" lighting dramatically affects the scene atmosphere.`,
    ].join('\n');

    return [{ role: 'user', content }];
  },
};
