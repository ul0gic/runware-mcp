/**
 * Minimal response fixtures matching the public Runware API documentation
 * reviewed on 2026-07-24.
 */

export const CURRENT_ACCOUNT_DETAILS = {
  taskType: 'accountManagement',
  taskUUID: 'f4dd3dfe-955f-49d5-a785-7e3b633d6e7a',
  operation: 'getDetails',
  organizationUUID: 'a6379343-9ff2-46a0-996b-e4a7b3057c88',
  organizationName: 'Acme Corporation',
  balance: {
    amount: 2450.75,
    freeBalance: 120,
    currency: 'USD',
  },
};

export const CURRENT_TASK_DETAILS = {
  taskType: 'getTaskDetails',
  taskUUID: 'a770f077-f413-47de-9dac-be0b26a35da6',
  request: [
    {
      taskType: 'imageInference',
      model: 'runware:101@1',
      positivePrompt: 'a cat',
    },
  ],
  response: {
    data: [
      {
        taskType: 'imageInference',
        imageUUID: '77da2d99-a6d3-44d9-b8c0-ae9fb06b6200',
      },
    ],
  },
};

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
};
