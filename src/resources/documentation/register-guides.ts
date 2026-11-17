// Does:  Registers the five guide docs when imported.
// Holds: Side-effect only; documentation/provider.ts imports it so the guides exist before list() runs.
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
