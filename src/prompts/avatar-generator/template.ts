/**
 * Avatar Generator prompt template.
 *
 * Generates profile pictures and character avatars with configurable
 * art style, mood/expression, and framing. Instructs Claude to use
 * the imageInference tool with settings optimized for portrait and
 * character generation.
 */

import type { PromptMessage, PromptTemplate } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

const PROMPT_NAME = 'avatar-generator';
const PROMPT_DESCRIPTION = 'Generate profile pictures and character avatars with configurable art style, mood, and framing.';

const DEFAULT_STYLE = 'photorealistic';
const DEFAULT_MOOD = 'friendly';
const DEFAULT_FRAMING = 'headshot';

const VALID_STYLES = ['photorealistic', 'cartoon', 'anime', 'pixel-art', '3d-render'] as const;
const VALID_MOODS = ['friendly', 'professional', 'mysterious', 'happy'] as const;
const VALID_FRAMINGS = ['headshot', 'bust', 'full-body'] as const;

// ============================================================================
// Style Descriptors
// ============================================================================

const STYLE_DESCRIPTORS: Record<string, string> = {
  photorealistic: 'photorealistic portrait photography, DSLR quality, natural skin texture',
  cartoon: 'cartoon illustration style, bold outlines, vibrant colors, stylized features',
  anime: 'anime art style, cel-shaded, large expressive eyes, manga-inspired',
  'pixel-art': 'pixel art style, retro 16-bit aesthetic, crisp pixel edges',
  '3d-render': '3D rendered character, Pixar-quality, subsurface scattering, ambient occlusion',
};

const MOOD_DESCRIPTORS: Record<string, string> = {
  friendly: 'warm, approachable smile, inviting expression',
  professional: 'confident, composed, business-appropriate demeanor',
  mysterious: 'enigmatic gaze, subtle expression, intriguing atmosphere',
  happy: 'bright, joyful expression, genuine smile, positive energy',
};

const FRAMING_DESCRIPTORS: Record<string, string> = {
  headshot: 'close-up headshot, face and shoulders, centered composition',
  bust: 'bust portrait, head to mid-chest, medium framing',
  'full-body': 'full-body portrait, complete figure visible, environmental context',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns the model recommendation based on style.
 */
function getModelRecommendation(style: string): string {
  if (style === 'photorealistic') {
    return 'civitai:943001@1055701 (or any photorealistic model)';
  }
  if (style === 'anime') {
    return 'An anime-specialized model from modelSearch';
  }
  return 'civitai:943001@1055701 (or search for a style-specific model with modelSearch)';
}

/**
 * Returns the style-specific step count tip.
 */
function getStepTip(style: string): string {
  if (style === 'photorealistic') {
    return '- For photorealistic avatars, higher step counts (30-40) produce more detailed results.';
  }
  return `- For "${style}" style, lower step counts (20-25) may be sufficient.`;
}

// ============================================================================
// Template
// ============================================================================

/**
 * Avatar generator prompt template.
 */
export const avatarGenerator: PromptTemplate = {
  name: PROMPT_NAME,
  description: PROMPT_DESCRIPTION,
  arguments: [
    {
      name: 'description',
      description: 'Character description (e.g., "young woman with red hair", "elderly man with glasses").',
      required: true,
    },
    {
      name: 'style',
      description: `Art style: ${VALID_STYLES.join(', ')}. Default: "${DEFAULT_STYLE}".`,
      required: false,
    },
    {
      name: 'mood',
      description: `Expression/mood: ${VALID_MOODS.join(', ')}. Default: "${DEFAULT_MOOD}".`,
      required: false,
    },
    {
      name: 'framing',
      description: `Framing: ${VALID_FRAMINGS.join(', ')}. Default: "${DEFAULT_FRAMING}".`,
      required: false,
    },
  ],

  generate(args: Record<string, string>): readonly PromptMessage[] {
    const description = args.description ?? 'a person';
    const style = args.style ?? DEFAULT_STYLE;
    const mood = args.mood ?? DEFAULT_MOOD;
    const framing = args.framing ?? DEFAULT_FRAMING;

    const styleDesc = STYLE_DESCRIPTORS[style] ?? STYLE_DESCRIPTORS[DEFAULT_STYLE] ?? '';
    const moodDesc = MOOD_DESCRIPTORS[mood] ?? MOOD_DESCRIPTORS[DEFAULT_MOOD] ?? '';
    const framingDesc = FRAMING_DESCRIPTORS[framing] ?? FRAMING_DESCRIPTORS[DEFAULT_FRAMING] ?? '';

    const isSquareFormat = framing !== 'full-body';
    const width = isSquareFormat ? 1024 : 768;
    const height = isSquareFormat ? 1024 : 1280;

    const prompt = [
      `Portrait of ${description}.`,
      `${framingDesc}.`,
      `${styleDesc}.`,
      `${moodDesc}.`,
      'High quality, detailed, well-lit, clean background, avatar-suitable composition.',
    ].join(' ');

    const content = [
      'Generate a character avatar using the imageInference tool:',
      '',
      `Prompt: "${prompt}"`,
      '',
      'Recommended settings:',
      `- Model: ${getModelRecommendation(style)}`,
      `- Width: ${String(width)}, Height: ${String(height)}`,
      '- Steps: 30',
      '- CFGScale: 7',
      '- Output format: PNG',
      '',
      'Tips:',
      `- For "${style}" style, the model choice significantly impacts quality. Use modelSearch to find specialized models.`,
      `- The "${framing}" framing determines aspect ratio: square for headshot/bust, portrait orientation for full-body.`,
      '- Consider using promptEnhance to refine the prompt before generation for better results.',
      getStepTip(style),
    ].join('\n');

    return [{ role: 'user', content }];
  },
};
