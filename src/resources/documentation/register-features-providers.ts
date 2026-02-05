/**
 * Registration module for feature and provider documentation.
 *
 * Imports all 10 feature guide docs and 9 provider docs,
 * then registers each in the documentation registry.
 *
 * This module is imported for its side effects: calling
 * `registerDoc()` populates the global registry at startup.
 */

import { featureDocs } from './docs/features/index.js';
import { providerDocs } from './docs/providers/index.js';
import { registerDoc } from './registry.js';

// Register all feature documentation resources (10)
for (const doc of featureDocs) {
  registerDoc(doc);
}

// Register all provider documentation resources (9)
for (const doc of providerDocs) {
  registerDoc(doc);
}
