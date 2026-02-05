import type { DocResource } from '../../types.js';

export const imageInferenceDoc: DocResource = {
  id: 'image-inference',
  category: 'tools',
  title: 'Image Generation',
  summary: 'Generate images from text prompts or transform existing images with support for ControlNet, LoRA, IP-Adapters, identity preservation, and provider-specific features',
  tags: ['image', 'generation', 'text-to-image', 'img2img', 'inpainting', 'outpainting', 'ControlNet', 'LoRA'],
  content: {
    description:
      'The imageInference tool is the primary image generation tool. It supports four core operations: ' +
      'text-to-image (provide positivePrompt + model), image-to-image (add seedImage + strength), ' +
      'inpainting (add seedImage + maskImage), and outpainting (add seedImage + outpaint). ' +
      'Advanced features include ControlNet for structural guidance, LoRA for style adaptation, ' +
      'IP-Adapters for image-prompted generation, identity preservation (PuLID, ACE++), ' +
      'embeddings for custom concepts, refiner models for two-stage generation, and acceleration ' +
      'options for faster output. Returns one or more generated images with UUIDs, URLs, and optional cost.',
    parameters: [
      {
        name: 'positivePrompt',
        type: 'string',
        required: true,
        range: '2-3000 characters',
        description: 'Text description of the desired image. Supports prompt weighting with Compel syntax (word:1.5).',
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        description: 'Model in AIR format (e.g., "civitai:101195@128078"). Use modelSearch to find models.',
      },
      {
        name: 'width',
        type: 'integer',
        range: '512-2048',
        default: '1024',
        description: 'Image width in pixels. Must be a multiple of 64.',
      },
      {
        name: 'height',
        type: 'integer',
        range: '512-2048',
        default: '1024',
        description: 'Image height in pixels. Must be a multiple of 64.',
      },
      {
        name: 'steps',
        type: 'integer',
        range: '1-100',
        default: '20',
        description: 'Number of diffusion steps. More steps = higher quality but slower. 20-30 is typical.',
      },
      {
        name: 'CFGScale',
        type: 'number',
        range: '0-50',
        default: '7',
        description: 'Classifier-Free Guidance scale. Higher values follow the prompt more closely. 5-10 is recommended.',
      },
      {
        name: 'seed',
        type: 'integer',
        range: '1-9223372036854776000',
        description: 'Random seed for reproducible generation. Omit for random seed.',
      },
      {
        name: 'numberResults',
        type: 'integer',
        range: '1-20',
        default: '1',
        description: 'Number of images to generate in a single call.',
      },
      {
        name: 'negativePrompt',
        type: 'string',
        description: 'Text describing what to avoid in the generated image.',
      },
      {
        name: 'seedImage',
        type: 'string',
        description: 'Reference image for img2img or inpainting. Accepts UUID, URL, base64, or data URI.',
      },
      {
        name: 'maskImage',
        type: 'string',
        description: 'Mask image for inpainting. White areas are edited, black areas are preserved.',
      },
      {
        name: 'strength',
        type: 'number',
        range: '0-1',
        default: '0.8',
        description: 'Denoising strength for img2img. Higher = more changes from the seed image.',
      },
      {
        name: 'controlNet',
        type: 'array',
        description: 'Array of ControlNet configs (max 4). Each has model, guideImage, weight, startStep, endStep, controlMode.',
      },
      {
        name: 'lora',
        type: 'array',
        description: 'Array of LoRA configs (max 5). Each has model and weight (-4 to 4).',
      },
      {
        name: 'ipAdapters',
        type: 'array',
        description: 'Array of IP-Adapter configs (max 4). Each has model, guideImages, weight, mode (style_transfer, composition, face_id, plus, plus_face).',
      },
      {
        name: 'acceleration',
        type: 'string',
        description: 'Speed preset: "none", "low", "medium", or "high". Higher acceleration may reduce quality.',
      },
      {
        name: 'outputType',
        type: 'string',
        default: 'URL',
        description: 'Output delivery: "URL", "base64Data", or "dataURI".',
      },
      {
        name: 'outputFormat',
        type: 'string',
        default: 'JPG',
        description: 'Image format: "JPG", "PNG", or "WEBP". Use PNG for transparency.',
      },
      {
        name: 'outputQuality',
        type: 'integer',
        range: '20-99',
        default: '95',
        description: 'Compression quality for lossy formats.',
      },
      {
        name: 'scheduler',
        type: 'string',
        description: 'Scheduler/sampler algorithm for the diffusion process (e.g., "euler", "dpmpp_2m_karras").',
      },
      {
        name: 'providerSettings',
        type: 'object',
        description: 'Provider-specific configuration. Nested by provider: alibaba, bfl, bria, ideogram, bytedance.',
      },
      {
        name: 'includeCost',
        type: 'boolean',
        default: 'true',
        description: 'Include USD cost in the response.',
      },
    ],
    examples: [
      {
        title: 'Basic text-to-image',
        input: {
          positivePrompt: 'a serene mountain landscape at golden hour, photorealistic, 8k',
          model: 'runware:101@1',
          width: 1024,
          height: 1024,
          steps: 25,
          cfgScale: 7,
        },
        explanation: 'Minimal text-to-image call. Uses default SDXL model, 1024x1024 resolution, 25 steps for good quality.',
      },
      {
        title: 'Image-to-image with LoRA style',
        input: {
          positivePrompt: 'cyberpunk city street at night, neon lights, rain reflections',
          model: 'civitai:101195@128078',
          seedImage: 'https://example.com/reference.jpg',
          strength: 0.65,
          lora: [{ model: 'civitai:943001@1055701', weight: 0.8 }],
          width: 1024,
          height: 768,
          steps: 30,
        },
        explanation: 'Transforms a reference image with a LoRA style. Strength 0.65 preserves some of the original composition while allowing significant changes.',
      },
      {
        title: 'Inpainting with face enhancement',
        input: {
          positivePrompt: 'a smiling woman with natural makeup, professional portrait',
          model: 'runware:101@1',
          seedImage: 'abc12345-1234-5678-abcd-123456789abc',
          maskImage: 'def12345-1234-5678-abcd-123456789abc',
          maskMargin: 64,
          strength: 0.85,
          ultralytics: { confidence: 0.5 },
        },
        explanation: 'Inpaints the masked area with face enhancement. maskMargin adds surrounding context for better blending. Ultralytics detects and refines faces.',
      },
    ],
    tips: [
      'Start with the model defaults from modelSearch (defaultSteps, defaultCFG, defaultWidth, defaultHeight) and adjust from there.',
      'For img2img, strength 0.5-0.7 preserves composition while allowing style changes. 0.8+ creates more dramatic transformations.',
      'Use acceleration: "medium" for a good speed/quality tradeoff. "high" is fastest but may reduce detail.',
      'ControlNet + LoRA can be combined — use ControlNet for structure and LoRA for style in a single call.',
      'Set numberResults > 1 to generate variations and pick the best result. Each result uses a different seed.',
    ],
    relatedDocs: [
      'runware://docs/concepts/air-identifiers',
      'runware://docs/concepts/output-types',
      'runware://docs/tools/controlnet-preprocess',
      'runware://docs/tools/image-masking',
      'runware://docs/tools/prompt-enhancer',
      'runware://docs/tools/model-search',
    ],
  },
  lastUpdated: '2026-02-05',
};
