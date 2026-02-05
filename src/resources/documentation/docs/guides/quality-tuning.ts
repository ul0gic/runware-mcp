/* eslint-disable @typescript-eslint/naming-convention -- CFGScale is the Runware API parameter name */
import type { DocResource } from '../../types.js';

/** Example SDXL checkpoint model used in documentation examples. */
const EXAMPLE_MODEL = 'civitai:101195@128078';

export const qualityTuningDoc: DocResource = {
  id: 'quality-tuning',
  category: 'guides',
  title: 'Quality Tuning',
  summary: 'How to maximize image quality through CFGScale, steps, schedulers, seeds, negative prompts, and resolution control',
  tags: ['quality', 'CFGScale', 'steps', 'scheduler', 'seed', 'negative-prompt', 'resolution'],
  content: {
    description:
      'Image generation quality depends on several interacting parameters. Understanding each parameter and how they ' +
      'interact allows you to produce consistently high-quality results.\n\n' +
      'CFGScale (Classifier-Free Guidance): Controls how closely the image follows the prompt. Range 0-50.\n' +
      '- Low values (1-4): More creative, abstract, dreamlike results. Good for artistic experimentation.\n' +
      '- Medium values (5-8): Balanced quality and prompt adherence. Recommended starting point.\n' +
      '- High values (9-15): Strict prompt following. Can produce oversaturated or artifact-heavy results if too high.\n' +
      '- Very high values (15+): Usually counterproductive. Use only if the model specifically recommends it.\n\n' +
      'Steps: Number of denoising iterations. More steps generally improve quality but with diminishing returns.\n' +
      '- 10-15 steps: Quick previews, rough composition checks.\n' +
      '- 20-30 steps: Good balance of quality and speed for most models.\n' +
      '- 30-50 steps: High quality, fine details. Best for final renders.\n' +
      '- 50+ steps: Rarely needed. May cause over-processing artifacts.\n\n' +
      'Scheduler: The sampling algorithm that guides the denoising process. Different schedulers produce different ' +
      'aesthetics and convergence properties. Common options include Euler, DPM++ 2M, DPM++ 2M Karras, DDIM, and UniPC.\n\n' +
      'Seed: An integer that initializes the random number generator. Same seed + same parameters = same output. ' +
      'Crucial for reproducibility and iterative refinement.\n\n' +
      'Negative Prompt: Text describing what to avoid. Effective for eliminating common artifacts.',
    examples: [
      {
        title: 'Balanced quality for photorealistic portrait',
        input: {
          positivePrompt: 'Professional portrait of a woman, natural lighting, shallow depth of field',
          negativePrompt: 'blurry, distorted, extra fingers, bad anatomy, low quality, watermark',
          model: EXAMPLE_MODEL,
          width: 1024,
          height: 1024,
          steps: 30,
          CFGScale: 7,
          scheduler: 'DPM++ 2M Karras',
          seed: 42,
        },
        explanation:
          'A well-balanced configuration for photorealistic output. CFGScale 7 gives good prompt adherence without artifacts. 30 steps provides fine detail. DPM++ 2M Karras is reliable across many models.',
      },
      {
        title: 'Creative artistic generation with low guidance',
        input: {
          positivePrompt: 'Abstract dreamscape, flowing colors, ethereal atmosphere',
          model: EXAMPLE_MODEL,
          width: 1024,
          height: 1024,
          steps: 25,
          CFGScale: 3,
        },
        explanation:
          'Low CFGScale (3) allows the model more creative freedom, producing varied and unexpected results. Good for abstract or artistic pieces where strict prompt adherence is not needed.',
      },
      {
        title: 'High-quality final render with seed locking',
        input: {
          positivePrompt: 'A medieval castle on a cliff at sunrise, cinematic composition, 8K detail',
          negativePrompt: 'cartoon, anime, low resolution, noise, compression artifacts',
          model: EXAMPLE_MODEL,
          width: 1536,
          height: 1024,
          steps: 40,
          CFGScale: 7.5,
          seed: 987_654_321,
          scheduler: 'DPM++ 2M Karras',
          numberResults: 1,
        },
        explanation:
          'Final render with high resolution (1536x1024 landscape), 40 steps for fine detail, and a locked seed for exact reproducibility. The negative prompt explicitly excludes unwanted aesthetics.',
      },
    ],
    tips: [
      'Start with CFGScale 7 and steps 25-30. These are safe defaults for most models and architectures.',
      'Use seed to lock a composition you like, then iterate on the prompt, CFGScale, or steps while keeping the same seed.',
      'Add a negative prompt for every generation. Common useful terms: "blurry, distorted, bad anatomy, low quality, watermark, text, logo".',
      'DPM++ 2M Karras is a reliable all-purpose scheduler. Switch to Euler or UniPC if you observe convergence issues.',
      'Resolution affects quality and composition. Use 1:1 (1024x1024) for portraits, 3:2 (1536x1024) for landscapes, 2:3 (1024x1536) for full-body shots.',
      'Check model search results for defaultSteps, defaultCFG, and defaultScheduler -- these are the model author recommendations.',
      'For Flux models, CFGScale has less effect. Flux models often work best with CFGScale 1-3.5 due to their architecture.',
      'More steps does not always mean better. Many SDXL models peak at 25-30 steps. Run a comparison at 20, 30, and 40 steps with the same seed to find the sweet spot.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/model-search',
      'runware://docs/features/refiner-models',
      'runware://docs/guides/cost-optimization',
      'runware://docs/guides/combining-features',
    ],
  },
  lastUpdated: '2026-02-05',
};
