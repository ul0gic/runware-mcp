/**
 * UI Mockup prompt template.
 *
 * Generates UI/UX design mockups for various application types with
 * configurable design system, color scheme, and fidelity level.
 * Instructs Claude to use the imageInference tool with settings
 * optimized for clean, readable interface designs.
 */

import type { PromptMessage, PromptTemplate } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

const PROMPT_NAME = 'ui-mockup';
const PROMPT_DESCRIPTION = 'Generate UI/UX design mockups for mobile apps, web apps, dashboards, and more.';

const DEFAULT_DESIGN_SYSTEM = 'modern';
const DEFAULT_COLOR_SCHEME = 'light';
const DEFAULT_COMPLEXITY = 'high-fidelity';

const VALID_APP_TYPES = ['mobile-app', 'web-app', 'dashboard', 'landing-page', 'e-commerce'] as const;
const VALID_DESIGN_SYSTEMS = ['material', 'ios', 'fluent', 'tailwind', 'custom'] as const;
const VALID_COLOR_SCHEMES = ['light', 'dark', 'blue', 'purple', 'green'] as const;
const VALID_COMPLEXITIES = ['wireframe', 'low-fidelity', 'high-fidelity'] as const;

// ============================================================================
// Descriptors
// ============================================================================

const APP_TYPE_DESCRIPTORS: Record<string, string> = {
  'mobile-app': 'mobile application UI on a smartphone screen, native mobile interface, touch-friendly elements',
  'web-app': 'web application interface in a browser window, responsive layout, navigation bar and content area',
  dashboard: 'data dashboard with charts, metrics cards, data tables, sidebar navigation, KPI widgets',
  'landing-page': 'marketing landing page, hero section, feature highlights, call-to-action buttons, testimonials',
  'e-commerce': 'e-commerce product page, product gallery, pricing, add-to-cart button, reviews section',
};

const DESIGN_SYSTEM_DESCRIPTORS: Record<string, string> = {
  material: 'Google Material Design 3, rounded corners, elevation shadows, ripple effects, Material You color system',
  ios: 'Apple iOS Human Interface Guidelines, SF symbols, translucent elements, system fonts, native iOS feel',
  fluent: 'Microsoft Fluent Design, acrylic backgrounds, subtle animations, depth and motion, Windows 11 aesthetic',
  tailwind: 'Tailwind UI inspired, utility-first aesthetic, clean typography, modern component design',
  custom: 'modern custom design system, unique brand identity, consistent spacing and typography',
};

const COLOR_SCHEME_DESCRIPTORS: Record<string, string> = {
  light: 'light theme with white backgrounds, subtle gray borders, dark text, clean and airy feel',
  dark: 'dark theme with charcoal backgrounds, subtle borders, light text, reduced eye strain, OLED-friendly',
  blue: 'blue accent color scheme, professional blue primary, complementary grays, trust-evoking palette',
  purple: 'purple accent color scheme, creative purple primary, gradient accents, modern and bold palette',
  green: 'green accent color scheme, natural green primary, fresh and clean, growth-oriented palette',
};

const COMPLEXITY_DESCRIPTORS: Record<string, string> = {
  wireframe: 'basic wireframe, grayscale, placeholder boxes, structural layout only, no imagery or color',
  'low-fidelity': 'low-fidelity mockup, basic colors, simple shapes, content placeholders, layout-focused',
  'high-fidelity': 'high-fidelity mockup, pixel-perfect, realistic content, proper typography, production-ready visual',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns the layout consideration line based on app type and mobile flag.
 */
function getLayoutConsideration(appType: string, isMobile: boolean): string {
  if (isMobile) {
    return '- Mobile: Use portrait orientation (512x1024). Include status bar, navigation, and bottom bar elements.';
  }
  if (appType === 'dashboard') {
    return '- Dashboard: Use wide landscape (1280x832). Include sidebar navigation, header bar, and grid of data widgets.';
  }
  return `- ${appType}: Use landscape orientation (1280x832) for optimal readability.`;
}

// ============================================================================
// Template
// ============================================================================

/**
 * UI mockup prompt template.
 */
export const uiMockup: PromptTemplate = {
  name: PROMPT_NAME,
  description: PROMPT_DESCRIPTION,
  arguments: [
    {
      name: 'appType',
      description: `Application type: ${VALID_APP_TYPES.join(', ')}.`,
      required: true,
    },
    {
      name: 'description',
      description: 'What the UI should show (e.g., "a fitness tracking app with workout history").',
      required: true,
    },
    {
      name: 'designSystem',
      description: `Design system style: ${VALID_DESIGN_SYSTEMS.join(', ')}. Default: "${DEFAULT_DESIGN_SYSTEM}".`,
      required: false,
    },
    {
      name: 'colorScheme',
      description: `Color scheme: ${VALID_COLOR_SCHEMES.join(', ')}. Default: "${DEFAULT_COLOR_SCHEME}".`,
      required: false,
    },
    {
      name: 'complexity',
      description: `Detail level: ${VALID_COMPLEXITIES.join(', ')}. Default: "${DEFAULT_COMPLEXITY}".`,
      required: false,
    },
  ],

  generate(args: Record<string, string>): readonly PromptMessage[] {
    const appType = args.appType ?? 'web-app';
    const description = args.description ?? 'a modern application';
    const designSystem = args.designSystem ?? DEFAULT_DESIGN_SYSTEM;
    const colorScheme = args.colorScheme ?? DEFAULT_COLOR_SCHEME;
    const complexity = args.complexity ?? DEFAULT_COMPLEXITY;

    const appTypeDesc = APP_TYPE_DESCRIPTORS[appType] ?? APP_TYPE_DESCRIPTORS['web-app'] ?? '';
    const designDesc = DESIGN_SYSTEM_DESCRIPTORS[designSystem] ?? DESIGN_SYSTEM_DESCRIPTORS[DEFAULT_DESIGN_SYSTEM] ?? '';
    const colorDesc = COLOR_SCHEME_DESCRIPTORS[colorScheme] ?? COLOR_SCHEME_DESCRIPTORS[DEFAULT_COLOR_SCHEME] ?? '';
    const complexityDesc = COMPLEXITY_DESCRIPTORS[complexity] ?? COMPLEXITY_DESCRIPTORS[DEFAULT_COMPLEXITY] ?? '';

    const isMobile = appType === 'mobile-app';
    const width = isMobile ? 512 : 1280;
    const height = isMobile ? 1024 : 832;

    const prompt = [
      `UI/UX design mockup of ${description}.`,
      `${appTypeDesc}.`,
      `${designDesc}.`,
      `${colorDesc}.`,
      `${complexityDesc}.`,
      'Clean typography, proper spacing, realistic UI elements, Dribbble-quality design.',
      'Single screen view, no device frame, flat design render.',
    ].join(' ');

    const complexityTip = complexity === 'wireframe'
      ? 'keep the prompt focused on layout structure without visual embellishment'
      : 'include specific UI element descriptions for better accuracy';

    const content = [
      'Generate a UI mockup using the imageInference tool:',
      '',
      `Prompt: "${prompt}"`,
      '',
      'Recommended settings:',
      '- Model: civitai:943001@1055701 (general purpose works well for UI mockups)',
      `- Width: ${String(width)}, Height: ${String(height)}`,
      '- Steps: 30',
      '- CFGScale: 7',
      '- Output format: PNG',
      '',
      'Layout considerations:',
      getLayoutConsideration(appType, isMobile),
      '',
      'Tips:',
      `- For "${complexity}" detail level, ${complexityTip}.`,
      '- Use promptEnhance to add more design-specific detail.',
      '- Consider generating multiple variations to explore different layout options.',
      `- The "${designSystem}" design system should be reflected in corner radii, shadows, and component styles.`,
    ].join('\n');

    return [{ role: 'user', content }];
  },
};
