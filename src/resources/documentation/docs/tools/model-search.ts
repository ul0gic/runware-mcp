import type { DocResource } from '../../types.js';

export const modelSearchDoc: DocResource = {
  id: 'model-search',
  category: 'tools',
  title: 'Model Search',
  summary: 'Discover available AI models on Runware by searching names, tags, category, architecture, and type',
  tags: ['model', 'search', 'discovery', 'AIR', 'checkpoint', 'LoRA', 'ControlNet', 'VAE'],
  content: {
    description:
      'The modelSearch tool discovers available AI models on the Runware platform. It searches across model ' +
      'names, versions, tags, and metadata with weighted relevance scoring. Results can be filtered by category ' +
      '(checkpoint, LoRA, Lycoris, ControlNet, VAE, embeddings), type (base, inpainting, refiner), ' +
      'architecture (FLUX.1-dev, FLUX.1-schnell, SDXL, SD1.5, SD3, etc.), and visibility (public, private). ' +
      'Each result includes the AIR identifier needed for API calls, plus recommended defaults (width, height, ' +
      'steps, CFG scale, scheduler) and trigger words. Pagination is supported with limit and offset.',
    parameters: [
      {
        name: 'search',
        type: 'string',
        description: 'Search term to match against model names, versions, and tags.',
      },
      {
        name: 'tags',
        type: 'array of strings',
        description: 'Filter by model tags (e.g., ["photorealistic", "portrait"]).',
      },
      {
        name: 'category',
        type: 'string',
        description: 'Filter by category: "checkpoint", "LoRA", "Lycoris", "ControlNet", "VAE", or "embeddings".',
      },
      {
        name: 'type',
        type: 'string',
        description: 'Filter by checkpoint type: "base", "inpainting", or "refiner".',
      },
      {
        name: 'architecture',
        type: 'string',
        description: 'Filter by architecture: "FLUX.1-dev", "FLUX.1-schnell", "FLUX.1-pro", "Imagen", "SD1.5", "SDXL", "SD3", "Playground", "Pony".',
      },
      {
        name: 'conditioning',
        type: 'string',
        description: 'Filter by ControlNet conditioning type.',
      },
      {
        name: 'visibility',
        type: 'string',
        default: 'all',
        description: 'Visibility filter: "public", "private", or "all".',
      },
      {
        name: 'limit',
        type: 'integer',
        range: '1-100',
        default: '20',
        description: 'Number of results per page.',
      },
      {
        name: 'offset',
        type: 'integer',
        range: '0+',
        default: '0',
        description: 'Number of results to skip for pagination.',
      },
    ],
    examples: [
      {
        title: 'Search for FLUX checkpoints',
        input: {
          search: 'realistic portrait',
          category: 'checkpoint',
          architecture: 'FLUX.1-dev',
          limit: 10,
        },
        explanation: 'Finds FLUX.1-dev checkpoint models matching "realistic portrait". Results include AIR identifiers and recommended defaults.',
      },
      {
        title: 'Find LoRA models by tag',
        input: {
          category: 'LoRA',
          tags: ['anime', 'style'],
          limit: 20,
        },
        explanation: 'Searches for anime-style LoRA models. Use the AIR identifier from results in the lora array of imageInference.',
      },
    ],
    tips: [
      'Always use modelSearch to find AIR identifiers rather than guessing them.',
      'The response includes defaultWidth, defaultHeight, defaultSteps, and defaultCFG — use these as starting parameters.',
      'Check positiveTriggerWords — some models require specific trigger words in the prompt for best results.',
      'Filter by architecture to ensure compatibility with your target features (ControlNet, LoRA, etc.).',
      'Use offset and limit for pagination when browsing large result sets. totalResults shows the full count.',
    ],
    relatedDocs: [
      'runware://docs/concepts/air-identifiers',
      'runware://docs/tools/image-inference',
      'runware://docs/tools/video-inference',
    ],
  },
  lastUpdated: '2026-02-05',
};
