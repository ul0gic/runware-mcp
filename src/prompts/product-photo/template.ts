/**
 * Product Photo prompt template.
 *
 * Generates professional e-commerce product photography prompts
 * with configurable style, background, lighting, and camera angle.
 * Instructs Claude to use the imageInference tool with photorealistic
 * model settings optimized for commercial product photography.
 */

import type { PromptMessage, PromptTemplate } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

const PROMPT_NAME = 'product-photo';
const PROMPT_DESCRIPTION = 'Generate professional e-commerce product photography with configurable style, background, lighting, and camera angle.';

const DEFAULT_STYLE = 'studio';
const DEFAULT_BACKGROUND = 'white';
const DEFAULT_LIGHTING = 'soft';
const DEFAULT_ANGLE = '45-degree';

const VALID_STYLES = ['studio', 'lifestyle', 'flat-lay', 'hero'] as const;
const VALID_BACKGROUNDS = ['white', 'gradient', 'contextual', 'transparent'] as const;
const VALID_LIGHTINGS = ['soft', 'dramatic', 'natural', 'rim'] as const;
const VALID_ANGLES = ['front', '45-degree', 'top-down', 'eye-level'] as const;

// ============================================================================
// Style Descriptors
// ============================================================================

const STYLE_DESCRIPTIONS: Record<string, string> = {
  studio: 'Clean studio photography style with controlled environment',
  lifestyle: 'Lifestyle photography in a natural, real-world setting',
  'flat-lay': 'Flat-lay overhead arrangement on a styled surface',
  hero: 'Hero shot with dramatic presentation and bold composition',
};

const LIGHTING_DESCRIPTIONS: Record<string, string> = {
  soft: 'Soft, diffused lighting with gentle shadows for even illumination',
  dramatic: 'Dramatic lighting with strong shadows and highlights for depth',
  natural: 'Natural window light with organic shadows and warmth',
  rim: 'Rim lighting with backlight edge glow for product separation',
};

const ANGLE_DESCRIPTIONS: Record<string, string> = {
  front: 'straight-on front-facing',
  '45-degree': 'three-quarter 45-degree',
  'top-down': 'top-down bird\'s eye',
  'eye-level': 'eye-level perspective',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns the background tip line based on the selected background type.
 */
function getBackgroundTip(background: string): string {
  if (background === 'transparent') {
    return '- Use PNG output format to preserve transparency. Consider using imageBackgroundRemoval as a post-processing step if the model does not natively support transparent backgrounds.';
  }
  return `- The "${background}" background should be clean and distraction-free.`;
}

// ============================================================================
// Template
// ============================================================================

/**
 * Product photo prompt template.
 */
export const productPhoto: PromptTemplate = {
  name: PROMPT_NAME,
  description: PROMPT_DESCRIPTION,
  arguments: [
    {
      name: 'product',
      description: 'The product to photograph (e.g., "coffee mug", "sneaker", "perfume bottle").',
      required: true,
    },
    {
      name: 'style',
      description: `Photography style: ${VALID_STYLES.join(', ')}. Default: "${DEFAULT_STYLE}".`,
      required: false,
    },
    {
      name: 'background',
      description: `Background type: ${VALID_BACKGROUNDS.join(', ')}. Default: "${DEFAULT_BACKGROUND}".`,
      required: false,
    },
    {
      name: 'lighting',
      description: `Lighting setup: ${VALID_LIGHTINGS.join(', ')}. Default: "${DEFAULT_LIGHTING}".`,
      required: false,
    },
    {
      name: 'angle',
      description: `Camera angle: ${VALID_ANGLES.join(', ')}. Default: "${DEFAULT_ANGLE}".`,
      required: false,
    },
  ],

  generate(args: Record<string, string>): readonly PromptMessage[] {
    const product = args.product ?? 'product';
    const style = args.style ?? DEFAULT_STYLE;
    const background = args.background ?? DEFAULT_BACKGROUND;
    const lighting = args.lighting ?? DEFAULT_LIGHTING;
    const angle = args.angle ?? DEFAULT_ANGLE;

    const styleDesc = STYLE_DESCRIPTIONS[style] ?? STYLE_DESCRIPTIONS[DEFAULT_STYLE] ?? '';
    const lightingDesc = LIGHTING_DESCRIPTIONS[lighting] ?? LIGHTING_DESCRIPTIONS[DEFAULT_LIGHTING] ?? '';
    const angleDesc = ANGLE_DESCRIPTIONS[angle] ?? ANGLE_DESCRIPTIONS[DEFAULT_ANGLE] ?? '';

    const backgroundClause = background === 'transparent'
      ? 'on a transparent background (use PNG output format)'
      : `on a ${background} background`;

    const prompt = [
      `Professional ${style} photography of a ${product}.`,
      `${styleDesc}.`,
      `${lightingDesc}.`,
      `Shot from a ${angleDesc} angle ${backgroundClause}.`,
      'Commercial quality, tack-sharp focus on product, clean and professional composition.',
      '8K resolution, product photography, high detail.',
    ].join(' ');

    const content = [
      'Generate a professional product photo using the imageInference tool:',
      '',
      `Prompt: "${prompt}"`,
      '',
      'Recommended settings:',
      '- Model: civitai:943001@1055701 (or any photorealistic model)',
      '- Width: 1024, Height: 1024',
      '- Steps: 30',
      '- CFGScale: 7',
      '- Output format: PNG',
      '- Scheduler: DPMSolverMultistepKarras',
      '',
      'Tips:',
      `- For "${style}" style, ensure the composition matches commercial ${style} photography standards.`,
      `- The "${lighting}" lighting should be reflected in the prompt emphasis.`,
      getBackgroundTip(background),
    ].join('\n');

    return [{ role: 'user', content }];
  },
};
