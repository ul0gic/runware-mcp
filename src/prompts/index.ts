// Does:  Maps each prompt name to its template.
// Holds: A template is reachable over MCP only once it has a key here.
export type { PromptTemplate } from './types.js';

import { avatarGenerator } from './avatar-generator/index.js';
import { musicComposition } from './music-composition/index.js';
import { productPhoto } from './product-photo/index.js';
import { styleTransfer } from './style-transfer/index.js';
import { thumbnail } from './thumbnail/index.js';
import { uiMockup } from './ui-mockup/index.js';
import { videoScene } from './video-scene/index.js';

import type { PromptTemplate } from './types.js';

// Holds: Keys are the prompt names clients send in MCP prompt requests.
export const PROMPT_TEMPLATES: Readonly<Record<string, PromptTemplate>> = {
  'product-photo': productPhoto,
  'avatar-generator': avatarGenerator,
  'video-scene': videoScene,
  'style-transfer': styleTransfer,
  'ui-mockup': uiMockup,
  thumbnail,
  'music-composition': musicComposition,
};
