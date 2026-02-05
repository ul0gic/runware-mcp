/**
 * Style Transfer prompt template.
 *
 * Applies artistic styles to image generation with configurable
 * style type, intensity, and color palette. Instructs Claude to use
 * the imageInference tool with prompts crafted for artistic stylization.
 */

import type { PromptMessage, PromptTemplate } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

const PROMPT_NAME = 'style-transfer';
const PROMPT_DESCRIPTION = 'Apply artistic styles to image generation with configurable style, intensity, and color palette.';

const DEFAULT_INTENSITY = 'moderate';
const DEFAULT_COLOR_PALETTE = 'vibrant';

const VALID_STYLES = [
  'oil-painting', 'watercolor', 'pencil-sketch', 'pop-art',
  'impressionist', 'cyberpunk', 'studio-ghibli', 'art-deco',
  'minimalist', 'surrealist',
] as const;
const VALID_INTENSITIES = ['subtle', 'moderate', 'strong'] as const;
const VALID_PALETTES = ['warm', 'cool', 'monochrome', 'vibrant', 'pastel'] as const;

// ============================================================================
// Descriptors
// ============================================================================

const STYLE_DESCRIPTORS: Record<string, string> = {
  'oil-painting': 'classical oil painting, visible brushstrokes, rich texture, canvas feel, impasto technique',
  watercolor: 'delicate watercolor painting, soft color bleeds, translucent washes, wet-on-wet technique, paper texture',
  'pencil-sketch': 'detailed pencil sketch, fine hatching, cross-hatching shading, graphite on paper, hand-drawn quality',
  'pop-art': 'bold pop art style, Ben-Day dots, strong outlines, flat vivid colors, Andy Warhol inspired',
  impressionist: 'impressionist painting, loose brushwork, emphasis on light and color, Monet-inspired, plein air quality',
  cyberpunk: 'cyberpunk aesthetic, neon glow, holographic elements, dystopian tech, rain-slicked surfaces, chromatic aberration',
  'studio-ghibli': 'Studio Ghibli anime style, whimsical, lush environments, hand-painted backgrounds, Miyazaki-inspired',
  'art-deco': 'Art Deco design, geometric patterns, gold accents, symmetrical composition, 1920s glamour, luxurious feel',
  minimalist: 'minimalist art, clean lines, negative space, reduced color palette, essential forms only, modern simplicity',
  surrealist: 'surrealist art, dreamlike imagery, impossible geometry, melting forms, Dali-inspired, subconscious symbolism',
};

const INTENSITY_DESCRIPTORS: Record<string, string> = {
  subtle: 'with a subtle artistic touch that preserves the original subject clarity',
  moderate: 'with a balanced blend of artistic style and subject detail',
  strong: 'with heavy stylization where the artistic style dominates the composition',
};

const PALETTE_DESCRIPTORS: Record<string, string> = {
  warm: 'warm color palette with reds, oranges, ambers, and golden tones',
  cool: 'cool color palette with blues, teals, purples, and silver tones',
  monochrome: 'monochromatic palette, single color family with tonal variations, dramatic contrast',
  vibrant: 'vibrant, saturated colors with high contrast and visual impact',
  pastel: 'soft pastel palette, muted colors, gentle tones, dreamy quality',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns the CFGScale value based on intensity.
 */
function getCfgScale(intensity: string): number {
  if (intensity === 'subtle') {
    return 5;
  }
  if (intensity === 'strong') {
    return 10;
  }
  return 7;
}

/**
 * Returns the style-specific tip based on the selected art style.
 */
function getStyleTip(style: string): string {
  if (style === 'pencil-sketch') {
    return '- For pencil sketches, consider using a monochrome palette and lower saturation in the prompt.';
  }
  if (style === 'cyberpunk') {
    return '- For cyberpunk, higher step counts (35-40) help render neon glow and reflections accurately.';
  }
  if (style === 'studio-ghibli') {
    return '- For Studio Ghibli style, use modelSearch to find anime-specialized models for better results.';
  }
  return `- For "${style}" style, the default model works well. Experiment with CFGScale between 5-10.`;
}

// ============================================================================
// Template
// ============================================================================

/**
 * Style transfer prompt template.
 */
export const styleTransfer: PromptTemplate = {
  name: PROMPT_NAME,
  description: PROMPT_DESCRIPTION,
  arguments: [
    {
      name: 'subject',
      description: 'What to depict (e.g., "a mountain landscape", "a portrait of a cat").',
      required: true,
    },
    {
      name: 'style',
      description: `Artistic style: ${VALID_STYLES.join(', ')}.`,
      required: true,
    },
    {
      name: 'intensity',
      description: `Style strength: ${VALID_INTENSITIES.join(', ')}. Default: "${DEFAULT_INTENSITY}".`,
      required: false,
    },
    {
      name: 'colorPalette',
      description: `Color guidance: ${VALID_PALETTES.join(', ')}. Default: "${DEFAULT_COLOR_PALETTE}".`,
      required: false,
    },
  ],

  generate(args: Record<string, string>): readonly PromptMessage[] {
    const subject = args.subject ?? 'a landscape';
    const style = args.style ?? 'oil-painting';
    const intensity = args.intensity ?? DEFAULT_INTENSITY;
    const colorPalette = args.colorPalette ?? DEFAULT_COLOR_PALETTE;

    const styleDesc = STYLE_DESCRIPTORS[style] ?? STYLE_DESCRIPTORS['oil-painting'] ?? '';
    const intensityDesc = INTENSITY_DESCRIPTORS[intensity] ?? INTENSITY_DESCRIPTORS[DEFAULT_INTENSITY] ?? '';
    const paletteDesc = PALETTE_DESCRIPTORS[colorPalette] ?? PALETTE_DESCRIPTORS[DEFAULT_COLOR_PALETTE] ?? '';

    const cfgScale = getCfgScale(intensity);

    const prompt = [
      `${subject} rendered in ${style} style.`,
      `${styleDesc}.`,
      `${intensityDesc}.`,
      `${paletteDesc}.`,
      'Masterful artistic execution, high detail, gallery-quality artwork.',
    ].join(' ');

    const content = [
      'Generate a stylized image using the imageInference tool:',
      '',
      `Prompt: "${prompt}"`,
      '',
      'Recommended settings:',
      '- Model: civitai:943001@1055701 (or use modelSearch to find a model specialized for this art style)',
      '- Width: 1024, Height: 1024',
      '- Steps: 35',
      `- CFGScale: ${String(cfgScale)} (${intensity} intensity - lower preserves subject, higher emphasizes style)`,
      '- Output format: PNG',
      '',
      'Style-specific tips:',
      getStyleTip(style),
      '',
      'Advanced options:',
      '- Use promptEnhance to add more artistic detail to the prompt.',
      '- Consider using controlNet with a reference image for style transfer from an existing artwork.',
      `- The "${colorPalette}" palette directive guides overall color temperature and mood.`,
    ].join('\n');

    return [{ role: 'user', content }];
  },
};
