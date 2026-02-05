import type { DocResource } from '../../types.js';

export const batchProcessingDoc: DocResource = {
  id: 'batch-processing',
  category: 'guides',
  title: 'Batch Processing Guide',
  summary: 'When to use processFolder vs batchImageInference vs watchFolder for bulk image operations, with concurrency settings and error handling tips',
  tags: ['batch', 'folder', 'concurrency', 'bulk', 'processFolder', 'batchImageInference', 'watchFolder'],
  content: {
    description:
      'Runware offers three tools for handling multiple images in a single workflow. Choosing the right one depends ' +
      'on whether you are processing existing files, generating new images from prompts, or monitoring a folder for ' +
      'incoming files.\n\n' +
      'processFolder: Applies a single operation (upscale, removeBackground, caption, vectorize, or controlNetPreprocess) ' +
      'to all images in a directory. Best for bulk post-processing of existing files. Supports recursive subdirectory ' +
      'scanning, configurable concurrency (1-5), and optional output folder. Maximum 100 files per invocation.\n\n' +
      'batchImageInference: Generates images from an array of text prompts with shared model settings (dimensions, steps, ' +
      'CFGScale, scheduler). Best for creating variations or processing multiple creative briefs at once. Up to 20 prompts ' +
      'per batch with configurable concurrency (1-5).\n\n' +
      'watchFolder: Starts a persistent file watcher on a directory that automatically processes new images as they ' +
      'appear. Supports the same operations as processFolder. Best for continuous workflows such as design pipelines ' +
      'where files arrive over time. Use start/stop/list/status actions to manage watchers. Watchers are in-memory ' +
      'and do not persist across server restarts.',
    examples: [
      {
        title: 'Upscale all images in a folder',
        input: {
          folderPath: '/Users/designer/raw-photos',
          operation: 'upscale',
          operationParams: { upscaleFactor: 4 },
          concurrency: 3,
          maxFiles: 50,
          outputFolder: '/Users/designer/upscaled-photos',
          recursive: false,
        },
        explanation:
          'Uses processFolder to upscale up to 50 images with 4x resolution at concurrency 3. Results go to a separate output folder.',
      },
      {
        title: 'Generate product image variations from prompts',
        input: {
          prompts: [
            'A sleek white sneaker on a marble pedestal, studio lighting',
            'A sleek white sneaker floating against gradient blue background',
            'A sleek white sneaker in a forest clearing, morning light',
            'A sleek white sneaker on a city rooftop at sunset',
          ],
          model: 'civitai:101195@128078',
          width: 1024,
          height: 1024,
          steps: 30,
          concurrency: 2,
        },
        explanation:
          'Uses batchImageInference to generate 4 product photography variations from different prompts with shared model and quality settings.',
      },
      {
        title: 'Watch a drop folder for automatic background removal',
        input: {
          action: 'start',
          folderPath: '/Users/designer/dropbox-incoming',
          operation: 'removeBackground',
          outputFolder: '/Users/designer/transparent-output',
        },
        explanation:
          'Uses watchFolder to start monitoring a directory. When new images appear, backgrounds are automatically removed and results saved to the output folder.',
      },
      {
        title: 'Batch caption images for cataloging',
        input: {
          folderPath: '/Users/photographer/portfolio',
          operation: 'caption',
          recursive: true,
          maxFiles: 100,
          concurrency: 4,
        },
        explanation:
          'Uses processFolder to caption up to 100 images recursively through subdirectories. Captions are returned in results for each file.',
      },
    ],
    tips: [
      'Set concurrency to 2-3 for API stability. Higher values (4-5) are faster but increase the chance of rate limiting.',
      'Use stopOnError: false (default) for batch operations to continue processing remaining files even when individual items fail.',
      'For processFolder, set includeCost: true to track total spend. The response includes totalCost aggregated across all files.',
      'Use the costEstimate tool before large batches to estimate total cost: multiply per-item estimate by the expected file count.',
      'watchFolder watchers are in-memory only -- they do not survive server restarts. Use the list action to check active watchers.',
      'processFolder supports a maxFiles limit (1-100). For larger folders, invoke it multiple times or use watchFolder for continuous processing.',
      'batchImageInference applies the same negativePrompt, scheduler, and CFGScale to all prompts. For per-prompt control, use individual imageInference calls.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/guides/cost-optimization',
      'runware://docs/tools/remove-background',
      'runware://docs/tools/upscale',
      'runware://docs/tools/caption',
      'runware://docs/tools/vectorize',
      'runware://docs/tools/controlnet-preprocess',
    ],
  },
  lastUpdated: '2026-02-05',
};
