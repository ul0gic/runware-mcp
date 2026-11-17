// Does:  Supplies minimal Runware response bodies for contract tests.
// Holds: Shapes match the public Runware API documentation as reviewed on 2026-07-24.

import type { AsyncTaskResponse } from '../../src/shared/types.js';

interface ThreeDInferenceResult extends AsyncTaskResponse {
  readonly outputs: { readonly files: readonly { readonly uuid: string; readonly url: string }[] };
}

export const CURRENT_TEXT_RESULT = {
  taskType: 'textInference',
  taskUUID: 'a770f077-f413-47de-9dac-be0b26a35da6',
  text: 'Ocean breathes the dawn',
  finishReason: 'stop',
  usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
  cost: 0.0005,
};

export const CURRENT_THREE_D_RESULT = {
  taskType: '3dInference',
  taskUUID: 'a770f077-f413-47de-9dac-be0b26a35da6',
  status: 'success',
  outputs: {
    files: [
      {
        uuid: '8c2e6d99-7404-43e6-a8f0-7a3b8d8d9f0c',
        url: 'https://im.runware.ai/example.glb',
      },
    ],
  },
  cost: 0.3,
} satisfies ThreeDInferenceResult;
