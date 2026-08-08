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
