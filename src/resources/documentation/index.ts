/**
 * Documentation resource provider module.
 *
 * Re-exports the provider, registry operations, and types
 * for the Runware documentation resource system.
 *
 * Side-effect imports below populate the registry at load time.
 */

// Side-effect import: registers feature + provider docs in the registry
import './register-features-providers.js';

export { documentationProvider } from './provider.js';

export {
  getDocCount,
  getDocResource,
  listDocResources,
  registerDoc,
} from './registry.js';

export type {
  DocCategory,
  DocContent,
  DocExample,
  DocParameter,
  DocResource,
} from './types.js';
