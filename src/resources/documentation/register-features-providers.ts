import { featureDocs } from './docs/features/index.js';
import { providerDocs } from './docs/providers/index.js';
import { registerDoc } from './registry.js';

for (const doc of featureDocs) {
  registerDoc(doc);
}

for (const doc of providerDocs) {
  registerDoc(doc);
}
