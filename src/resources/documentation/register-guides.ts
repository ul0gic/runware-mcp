/**
 * Registers all how-to guide documentation resources.
 *
 * Imports the 5 guide documents and calls registerDoc() for each,
 * populating the documentation registry with practical workflow guides.
 */

import { batchProcessingDoc } from './docs/guides/batch-processing.js';
import { choosingProvidersDoc } from './docs/guides/choosing-providers.js';
import { combiningFeaturesDoc } from './docs/guides/combining-features.js';
import { costOptimizationDoc } from './docs/guides/cost-optimization.js';
import { qualityTuningDoc } from './docs/guides/quality-tuning.js';
import { registerDoc } from './registry.js';

registerDoc(batchProcessingDoc);
registerDoc(costOptimizationDoc);
registerDoc(qualityTuningDoc);
registerDoc(combiningFeaturesDoc);
registerDoc(choosingProvidersDoc);
