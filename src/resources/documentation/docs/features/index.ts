// Does:  Collects the ten feature docs into featureDocs.
// Holds: Every file in docs/features is listed here, or register-features-providers.ts never registers it.
import { accelerationDoc } from './acceleration.js';
import { controlnetGuideDoc } from './controlnet-guide.js';
import { embeddingsDoc } from './embeddings.js';
import { identityPreservationDoc } from './identity-preservation.js';
import { ipAdaptersGuideDoc } from './ip-adapters-guide.js';
import { loraGuideDoc } from './lora-guide.js';
import { outpaintingDoc } from './outpainting.js';
import { promptWeightingDoc } from './prompt-weighting.js';
import { refinerModelsDoc } from './refiner-models.js';
import { safetyFilteringDoc } from './safety-filtering.js';

import type { DocResource } from '../../types.js';

export const featureDocs: readonly DocResource[] = [
  accelerationDoc,
  controlnetGuideDoc,
  embeddingsDoc,
  identityPreservationDoc,
  ipAdaptersGuideDoc,
  loraGuideDoc,
  outpaintingDoc,
  promptWeightingDoc,
  refinerModelsDoc,
  safetyFilteringDoc,
];
