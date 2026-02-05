/**
 * Prompt template registry for the Runware MCP server.
 *
 * Central registry that manages all prompt templates. Each template
 * generates a sequence of messages that guide Claude to use the
 * appropriate Runware tools with optimal settings for common
 * creative workflows.
 *
 * Re-exports the shared types and all template modules for convenience.
 */

export type { PromptArgument, PromptMessage, PromptTemplate } from './types.js';

export { avatarGenerator } from './avatar-generator/index.js';
export { musicComposition } from './music-composition/index.js';
export { productPhoto } from './product-photo/index.js';
export { styleTransfer } from './style-transfer/index.js';
export { thumbnail } from './thumbnail/index.js';
export { uiMockup } from './ui-mockup/index.js';
export { videoScene } from './video-scene/index.js';

// ============================================================================
// Template Registry
// ============================================================================

import { avatarGenerator } from './avatar-generator/index.js';
import { musicComposition } from './music-composition/index.js';
import { productPhoto } from './product-photo/index.js';
import { styleTransfer } from './style-transfer/index.js';
import { thumbnail } from './thumbnail/index.js';
import { uiMockup } from './ui-mockup/index.js';
import { videoScene } from './video-scene/index.js';

import type { PromptTemplate } from './types.js';

/**
 * All registered prompt templates keyed by name.
 *
 * The server iterates this record to handle prompt listing and retrieval.
 * Keys are the prompt template names used in MCP prompt requests.
 */
export const PROMPT_TEMPLATES: Readonly<Record<string, PromptTemplate>> = {
  'product-photo': productPhoto,
  'avatar-generator': avatarGenerator,
  'video-scene': videoScene,
  'style-transfer': styleTransfer,
  'ui-mockup': uiMockup,
  thumbnail,
  'music-composition': musicComposition,
};

/**
 * The set of valid prompt template names.
 */
export type PromptName = keyof typeof PROMPT_TEMPLATES;

/**
 * Finds a prompt template by name.
 *
 * @param name - The prompt template name to look up
 * @returns The matching template, or undefined if none matches
 */
export function findPromptTemplate(name: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES[name];
}

/**
 * Gets all registered prompt templates as an array.
 *
 * @returns Array of all prompt templates
 */
export function getAllPromptTemplates(): readonly PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES);
}
