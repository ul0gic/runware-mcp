/**
 * Documentation resource registry.
 *
 * Central registry for all documentation resources. Stores
 * documents keyed by `{category}/{id}` and provides lookup,
 * listing, and count helpers.
 *
 * The registry starts empty and is populated by doc content
 * modules calling `registerDoc()` during import.
 */

import { airIdentifiersDoc } from './docs/concepts/air-identifiers.js';
import { asyncDeliveryDoc } from './docs/concepts/async-delivery.js';
import { connectionDoc } from './docs/concepts/connection.js';
import { outputTypesDoc } from './docs/concepts/output-types.js';
import { taskResponsesDoc } from './docs/concepts/task-responses.js';
import { audioInferenceDoc } from './docs/tools/audio-inference.js';
import { captionDoc } from './docs/tools/caption.js';
import { controlnetPreprocessDoc } from './docs/tools/controlnet-preprocess.js';
import { imageInferenceDoc } from './docs/tools/image-inference.js';
import { imageMaskingDoc } from './docs/tools/image-masking.js';
import { imageUploadDoc } from './docs/tools/image-upload.js';
import { modelSearchDoc } from './docs/tools/model-search.js';
import { promptEnhancerDoc } from './docs/tools/prompt-enhancer.js';
import { removeBackgroundDoc } from './docs/tools/remove-background.js';
import { transcriptionDoc } from './docs/tools/transcription.js';
import { upscaleDoc } from './docs/tools/upscale.js';
import { vectorizeDoc } from './docs/tools/vectorize.js';
import { videoInferenceDoc } from './docs/tools/video-inference.js';

import type { DocResource } from './types.js';

// ============================================================================
// Registry Store
// ============================================================================

/**
 * Internal mutable store for documentation resources.
 * Keyed by `{category}/{id}` for O(1) lookup.
 */
const registry = new Map<string, DocResource>();

// ============================================================================
// Registry Operations
// ============================================================================

/**
 * Builds the registry key for a documentation resource.
 *
 * @param category - The documentation category
 * @param id - The document identifier
 * @returns The registry key in `{category}/{id}` format
 */
function buildKey(category: string, id: string): string {
  return `${category}/${id}`;
}

/**
 * Registers a documentation resource in the registry.
 *
 * The document is keyed by `{category}/{id}`. If a document
 * with the same key already exists, it is overwritten.
 *
 * @param doc - The documentation resource to register
 */
export function registerDoc(doc: DocResource): void {
  const key = buildKey(doc.category, doc.id);
  registry.set(key, doc);
}

/**
 * Retrieves a documentation resource by category and id.
 *
 * @param category - The documentation category
 * @param id - The document identifier
 * @returns The documentation resource, or undefined if not found
 */
export function getDocResource(category: string, id: string): DocResource | undefined {
  const key = buildKey(category, id);
  return registry.get(key);
}

/**
 * Lists all documentation resources in the registry.
 *
 * @returns Array of all registered documentation resources
 */
export function listDocResources(): readonly DocResource[] {
  return [...registry.values()];
}

/**
 * Returns the number of documentation resources in the registry.
 *
 * @returns The count of registered documents
 */
export function getDocCount(): number {
  return registry.size;
}

// ============================================================================
// Register All Documents
// ============================================================================

// Concepts (5)
registerDoc(airIdentifiersDoc);
registerDoc(taskResponsesDoc);
registerDoc(outputTypesDoc);
registerDoc(asyncDeliveryDoc);
registerDoc(connectionDoc);

// Tools (13)
registerDoc(imageInferenceDoc);
registerDoc(videoInferenceDoc);
registerDoc(audioInferenceDoc);
registerDoc(removeBackgroundDoc);
registerDoc(upscaleDoc);
registerDoc(captionDoc);
registerDoc(imageMaskingDoc);
registerDoc(promptEnhancerDoc);
registerDoc(controlnetPreprocessDoc);
registerDoc(vectorizeDoc);
registerDoc(imageUploadDoc);
registerDoc(modelSearchDoc);
registerDoc(transcriptionDoc);
