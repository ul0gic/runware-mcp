import type { DocResource } from '../../types.js';

export const costOptimizationDoc: DocResource = {
  id: 'cost-optimization',
  category: 'guides',
  title: 'Cost Optimization',
  summary: 'How to minimize Runware API credits through efficient model selection, resolution control, acceleration features, and pre-estimation',
  tags: ['cost', 'optimization', 'credits', 'acceleration', 'budget', 'efficiency'],
  content: {
    description:
      'Runware charges per operation based on model complexity, resolution, step count, and output type. ' +
      'This guide covers strategies for reducing costs without sacrificing the quality you need.\n\n' +
      'Key cost factors:\n' +
      '- Model: Premium providers (BFL, Veo 3) cost more than community models on CivitAI.\n' +
      '- Resolution: Cost scales with pixel count. A 512x512 image costs significantly less than 2048x2048.\n' +
      '- Steps: More diffusion steps increase cost. Many models produce good results at 20-30 steps.\n' +
      '- Acceleration: TeaCache (for Flux/SD3 transformer models) and DeepCache (for SDXL/SD1.5 UNet models) ' +
      'reduce computation without re-training, lowering cost per image.\n' +
      '- Video duration: Longer videos cost more per second. Start with short clips (5s) for iteration.\n' +
      '- Batch size: numberResults > 1 multiplies cost linearly.',
    examples: [
      {
        title: 'Low-cost draft iteration with reduced resolution and steps',
        input: {
          positivePrompt: 'A mountain landscape at golden hour',
          model: 'civitai:101195@128078',
          width: 512,
          height: 512,
          steps: 15,
          acceleration: 'medium',
          includeCost: true,
        },
        explanation:
          'Generates a quick draft at 512x512 with only 15 steps and medium acceleration. Once you are happy with the composition, increase resolution and steps for the final version.',
      },
      {
        title: 'Use costEstimate before a large batch',
        input: {
          taskType: 'imageInference',
          model: 'civitai:101195@128078',
          width: 1024,
          height: 1024,
          steps: 30,
          numberResults: 1,
        },
        explanation:
          'Calls costEstimate to preview per-image cost before committing to a batch of 50 images. Multiply the costPerUnit by 50 to get the expected total.',
      },
      {
        title: 'Enable TeaCache for Flux models',
        input: {
          positivePrompt: 'Professional headshot, studio lighting',
          model: 'bfl:flux1-dev@1',
          width: 1024,
          height: 1024,
          steps: 28,
          teaCache: true,
          includeCost: true,
        },
        explanation:
          'TeaCache accelerates Flux and SD3 transformer models by caching intermediate computations. Reduces cost while maintaining quality.',
      },
      {
        title: 'Check account balance before large operations',
        input: {},
        explanation:
          'Use the getAccountBalance tool (no parameters required) to check your remaining Runware credits before starting expensive operations.',
      },
    ],
    tips: [
      'Use 512x512 or 768x768 for drafts and iteration, then increase to 1024x1024 or higher for finals.',
      'Enable TeaCache for Flux/SD3 models or DeepCache for SDXL/SD1.5 models to reduce computation cost.',
      'Start with 20-25 steps. Going above 30 steps shows diminishing quality returns for most models.',
      'Use costEstimate to preview costs before batchImageInference or processFolder with many files.',
      'Monitor spending with getAccountBalance regularly during large batch operations.',
      'For video, start with 5-second clips at 720p. Only increase duration and resolution after validating the prompt.',
      'Community models on CivitAI are generally cheaper than premium provider models (BFL, Ideogram, Bria).',
      'Set includeCost: true on all operations to track actual costs in responses and compare against estimates.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/video-inference',
      'runware://docs/tools/audio-inference',
      'runware://docs/features/acceleration',
      'runware://docs/guides/batch-processing',
      'runware://docs/guides/quality-tuning',
    ],
  },
  lastUpdated: '2026-02-05',
};
