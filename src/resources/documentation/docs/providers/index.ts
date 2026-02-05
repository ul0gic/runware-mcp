/**
 * Provider documentation barrel export.
 *
 * Re-exports all 9 provider documentation resources
 * as an array for bulk registration.
 */

import { alibabaDoc } from './alibaba.js';
import { bflDoc } from './bfl.js';
import { briaDoc } from './bria.js';
import { bytedanceDoc } from './bytedance.js';
import { ideogramDoc } from './ideogram.js';
import { klingAiDoc } from './kling-ai.js';
import { pixverseDoc } from './pixverse.js';
import { syncDoc } from './sync.js';
import { veoDoc } from './veo.js';

import type { DocResource } from '../../types.js';

/**
 * All provider documentation resources.
 */
export const providerDocs: readonly DocResource[] = [
  alibabaDoc,
  bflDoc,
  briaDoc,
  bytedanceDoc,
  ideogramDoc,
  klingAiDoc,
  pixverseDoc,
  syncDoc,
  veoDoc,
];
