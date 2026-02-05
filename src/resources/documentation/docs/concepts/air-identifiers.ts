import type { DocResource } from '../../types.js';

export const airIdentifiersDoc: DocResource = {
  id: 'air-identifiers',
  category: 'concepts',
  title: 'AIR Model Identifiers',
  summary: 'How to specify AI models using the AIR format (provider:model@version)',
  tags: ['models', 'AIR', 'identifiers', 'configuration'],
  content: {
    description:
      'Runware uses AIR (AI Resource) identifiers to uniquely reference AI models across the platform. ' +
      'Every model — whether a checkpoint, LoRA, ControlNet, VAE, or embedding — is addressed by an AIR string ' +
      'in the format `provider:modelId@versionId`. The provider indicates the source platform (e.g., civitai, ' +
      'runware, recraft), the modelId is the numeric or named identifier on that platform, and the versionId ' +
      'specifies the exact version. AIR identifiers are required in the `model` parameter of most tools.',
    parameters: [
      {
        name: 'model',
        type: 'string',
        required: true,
        description:
          'Model in AIR format: provider:modelId@versionId. Used in imageInference, videoInference, ' +
          'audioInference, removeBackground, upscale, caption, imageMasking, controlNetPreprocess, and vectorize.',
      },
    ],
    examples: [
      {
        title: 'CivitAI checkpoint model',
        input: { model: 'civitai:101195@128078' },
        explanation:
          'References a specific CivitAI model. The number before @ is the model ID, the number after is the version ID.',
      },
      {
        title: 'Runware built-in model',
        input: { model: 'runware:101@1' },
        explanation:
          'Runware hosts its own optimized models with the "runware:" prefix. These are maintained by Runware and often have lower latency.',
      },
      {
        title: 'LoRA model for style adaptation',
        input: { model: 'civitai:943001@1055701' },
        explanation:
          'LoRA models use the same AIR format. Pass them in the lora array with a weight parameter to control influence.',
      },
      {
        title: 'ControlNet model',
        input: { model: 'civitai:272689@307084' },
        explanation:
          'ControlNet models follow the same AIR format. Use in the controlNet array with a guideImage.',
      },
    ],
    tips: [
      'Use the modelSearch tool to discover available models and their AIR identifiers — search by name, tag, category, or architecture.',
      'Model search results include defaultWidth, defaultHeight, defaultSteps, and defaultCFG — use these as starting parameters for best results.',
      'Some models require trigger words in the prompt. Check the positiveTriggerWords field from model search results.',
      'The architecture field (FLUX.1-dev, SDXL, SD1.5, etc.) determines which features are compatible — ControlNet, LoRA, and acceleration options vary by architecture.',
    ],
    relatedDocs: [
      'runware://docs/tools/model-search',
      'runware://docs/tools/image-inference',
      'runware://docs/tools/video-inference',
    ],
  },
  lastUpdated: '2026-02-05',
};
