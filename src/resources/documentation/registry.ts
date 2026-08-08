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
import { unifiedApiDoc } from './docs/tools/unified-api.js';
import { upscaleDoc } from './docs/tools/upscale.js';
import { vectorizeDoc } from './docs/tools/vectorize.js';
import { videoInferenceDoc } from './docs/tools/video-inference.js';

import type { DocResource } from './types.js';

const registry = new Map<string, DocResource>();

function buildKey(category: string, id: string): string {
  return `${category}/${id}`;
}

/** Keyed by `{category}/{id}` — re-registering the same key overwrites silently. */
export function registerDoc(doc: DocResource): void {
  const key = buildKey(doc.category, doc.id);
  registry.set(key, doc);
}

export function getDocResource(category: string, id: string): DocResource | undefined {
  const key = buildKey(category, id);
  return registry.get(key);
}

export function listDocResources(): readonly DocResource[] {
  return [...registry.values()];
}

export function getDocCount(): number {
  return registry.size;
}

registerDoc(airIdentifiersDoc);
registerDoc(taskResponsesDoc);
registerDoc(outputTypesDoc);
registerDoc(asyncDeliveryDoc);
registerDoc(connectionDoc);

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
registerDoc(unifiedApiDoc);
