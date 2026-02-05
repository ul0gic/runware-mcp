/**
 * Thumbnail prompt template.
 *
 * Creates engaging thumbnails for videos, articles, and social media
 * with configurable platform targeting, visual style, and emotional hooks.
 * Instructs Claude to use the imageInference tool with dimensions and
 * composition optimized for each target platform.
 */

import type { PromptMessage, PromptTemplate } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

const PROMPT_NAME = 'thumbnail';
const PROMPT_DESCRIPTION = 'Create engaging thumbnails for YouTube, blogs, social media, and more with platform-optimized dimensions.';

const DEFAULT_PLATFORM = 'youtube';
const DEFAULT_STYLE = 'bold-text';
const DEFAULT_EMOTION = 'curious';

const VALID_PLATFORMS = ['youtube', 'blog', 'twitter', 'instagram', 'linkedin'] as const;
const VALID_STYLES = ['bold-text', 'face-reaction', 'split-screen', 'before-after', 'minimal'] as const;
const VALID_EMOTIONS = ['shocking', 'curious', 'exciting', 'informative'] as const;

// ============================================================================
// Platform Dimensions
// ============================================================================

interface PlatformDimensions {
  readonly width: number;
  readonly height: number;
  readonly label: string;
}

const PLATFORM_DIMENSIONS: Record<string, PlatformDimensions> = {
  youtube: { width: 1280, height: 720, label: '16:9 YouTube thumbnail' },
  blog: { width: 1200, height: 630, label: '1.91:1 Open Graph blog header' },
  twitter: { width: 1200, height: 675, label: '16:9 Twitter/X card image' },
  instagram: { width: 1080, height: 1080, label: '1:1 Instagram square post' },
  linkedin: { width: 1200, height: 627, label: '1.91:1 LinkedIn post image' },
};

// ============================================================================
// Descriptors
// ============================================================================

const STYLE_DESCRIPTORS: Record<string, string> = {
  'bold-text': 'bold, large text overlay, attention-grabbing typography, high contrast text on vibrant background',
  'face-reaction': 'expressive face reaction, emotional close-up, exaggerated expression, eye-catching human element',
  'split-screen': 'split-screen comparison layout, left and right contrast, dividing line, dual perspective',
  'before-after': 'before and after transformation, clear progression, labeled sides, dramatic difference',
  minimal: 'minimalist design, clean composition, single focal point, elegant simplicity, whitespace',
};

const EMOTION_DESCRIPTORS: Record<string, string> = {
  shocking: 'jaw-dropping, unexpected revelation, high-impact visual, urgent attention-grabber',
  curious: 'intriguing, thought-provoking, mystery element, makes you want to click and learn more',
  exciting: 'high energy, dynamic action, vibrant colors, excitement and anticipation',
  informative: 'clear, educational, structured layout, trustworthy, value-promising visual',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns the platform-specific note based on platform selection.
 */
function getPlatformNote(platform: string, dimensionLabel: string): string {
  if (platform === 'youtube') {
    return '- YouTube: Ensure the thumbnail works at small sizes (126x70). Keep text large and readable. Faces and bold text perform best.';
  }
  if (platform === 'instagram') {
    return '- Instagram: Square 1:1 format. Focus on visual impact over text. Bold colors and clean composition win.';
  }
  return `- ${platform}: Optimize for the ${dimensionLabel} aspect ratio. Ensure key elements are centered for cropping.`;
}

/**
 * Returns the text overlay tip based on whether text overlay is provided.
 */
function getTextOverlayTip(textOverlay: string | undefined): string {
  if (textOverlay !== undefined && textOverlay.length > 0) {
    return '- Note: AI image generation may struggle with exact text rendering. Consider adding text overlay in post-processing or use a model known for text accuracy (e.g., Ideogram via provider settings).';
  }
  return '- Consider adding a textOverlay argument if you want bold text on the thumbnail.';
}

// ============================================================================
// Template
// ============================================================================

/**
 * Thumbnail prompt template.
 */
export const thumbnail: PromptTemplate = {
  name: PROMPT_NAME,
  description: PROMPT_DESCRIPTION,
  arguments: [
    {
      name: 'topic',
      description: 'What the content is about (e.g., "10 JavaScript tips", "AI revolution in healthcare").',
      required: true,
    },
    {
      name: 'platform',
      description: `Target platform: ${VALID_PLATFORMS.join(', ')}. Default: "${DEFAULT_PLATFORM}".`,
      required: false,
    },
    {
      name: 'style',
      description: `Visual style: ${VALID_STYLES.join(', ')}. Default: "${DEFAULT_STYLE}".`,
      required: false,
    },
    {
      name: 'emotion',
      description: `Emotional hook: ${VALID_EMOTIONS.join(', ')}. Default: "${DEFAULT_EMOTION}".`,
      required: false,
    },
    {
      name: 'textOverlay',
      description: 'Optional text to overlay on the thumbnail (e.g., "TOP 10", "NEW!").',
      required: false,
    },
  ],

  generate(args: Record<string, string>): readonly PromptMessage[] {
    const topic = args.topic ?? 'content';
    const platform = args.platform ?? DEFAULT_PLATFORM;
    const style = args.style ?? DEFAULT_STYLE;
    const emotion = args.emotion ?? DEFAULT_EMOTION;
    const textOverlay = args.textOverlay;

    const styleDesc = STYLE_DESCRIPTORS[style] ?? STYLE_DESCRIPTORS[DEFAULT_STYLE] ?? '';
    const emotionDesc = EMOTION_DESCRIPTORS[emotion] ?? EMOTION_DESCRIPTORS[DEFAULT_EMOTION] ?? '';
    const dimensions = PLATFORM_DIMENSIONS[platform] ?? PLATFORM_DIMENSIONS[DEFAULT_PLATFORM];

    const dimensionWidth = dimensions?.width ?? 1280;
    const dimensionHeight = dimensions?.height ?? 720;
    const dimensionLabel = dimensions?.label ?? 'thumbnail';

    const textClause = textOverlay !== undefined && textOverlay.length > 0
      ? ` Bold text overlay reading "${textOverlay}" in large, impactful font.`
      : '';

    const prompt = [
      `Eye-catching thumbnail about "${topic}".`,
      `${styleDesc}.`,
      `${emotionDesc}.`,
      textClause,
      'Vibrant, high-contrast, scroll-stopping visual.',
      `Optimized for ${dimensionLabel} format.`,
      'Professional graphic design, sharp details, no blur.',
    ].join(' ');

    const content = [
      'Generate a thumbnail using the imageInference tool:',
      '',
      `Prompt: "${prompt}"`,
      '',
      'Recommended settings:',
      '- Model: civitai:943001@1055701 (or a model strong at graphic design from modelSearch)',
      `- Width: ${String(dimensionWidth)}, Height: ${String(dimensionHeight)} (${dimensionLabel})`,
      '- Steps: 25',
      '- CFGScale: 7',
      '- Output format: PNG',
      '',
      'Platform-specific notes:',
      getPlatformNote(platform, dimensionLabel),
      '',
      'Tips:',
      `- The "${style}" style tends to perform well for ${emotion} content.`,
      '- Use promptEnhance to refine the visual description for better generation results.',
      getTextOverlayTip(textOverlay),
      '- Generate multiple variations (numberResults: 4) and pick the most engaging one.',
    ].join('\n');

    return [{ role: 'user', content }];
  },
};
