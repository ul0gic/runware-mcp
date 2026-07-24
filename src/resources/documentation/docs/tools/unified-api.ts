import type { DocResource } from '../../types.js';

export const unifiedApiDoc: DocResource = {
  id: 'unified-api',
  category: 'tools',
  title: 'Unified API, Discovery, Text, and 3D',
  summary: 'Live model discovery and schema validation plus text, 3D, training, storage, task, and account tools',
  tags: ['schema', 'models', 'text', '3d', 'training', 'storage', 'account', 'tasks'],
  content: {
    description:
      'Use listCapabilities and listModels to select a current curated model, then call modelSchema before ' +
      'runInference. The generic runner is restricted to non-administrative inference task types. Dedicated ' +
      'tools provide textInference, threeDInference, training, modelUpload, mediaStorage, getTaskDetails, and ' +
      'accountManagement. Mutation-capable tools remain separate so clients can apply MCP approval policies.',
    parameters: [
      {
        name: 'model',
        type: 'string',
        required: true,
        description: 'AIR identifier returned by listModels or modelSearch.',
      },
      {
        name: 'parameters',
        type: 'object',
        description: 'Model-specific request fields validated using the schema returned by modelSchema.',
      },
      {
        name: 'deliveryMethod',
        type: 'string',
        default: 'model dependent',
        description: 'Use sync or async. Video, audio, and 3D default to async polling.',
      },
    ],
    examples: [
      {
        title: 'Discover 3D models',
        input: { category: '3d', capability: 'io:text-to-3d' },
        explanation: 'Pass these filters to listModels, inspect modelSchema, then use threeDInference.',
      },
      {
        title: 'Recover a completed task',
        input: { taskUUID: 'a770f077-f413-47de-9dac-be0b26a35da6' },
        explanation: 'Pass the task UUID to getTaskDetails to retrieve its original request and response.',
      },
    ],
    tips: [
      'Prefer listModels for curated first-party integrations and modelSearch for community or uploaded models.',
      'Call modelSchema before using runInference with an unfamiliar model.',
      'Use explicit training, modelUpload, and mediaStorage tools for mutation-capable operations.',
      'mediaStorage delete permanently removes the supplied media UUID.',
      'Text SSE streaming is not exposed; use sync or async delivery through MCP.',
    ],
    relatedDocs: [
      'runware://docs/concepts/air-identifiers',
      'runware://docs/concepts/async-delivery',
      'runware://docs/tools/model-search',
    ],
  },
  lastUpdated: '2026-07-24',
};
