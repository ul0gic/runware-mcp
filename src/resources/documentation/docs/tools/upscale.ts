import type { DocResource } from '../../types.js';

export const upscaleDoc: DocResource = {
  id: 'upscale',
  category: 'tools',
  title: 'Image Upscaling',
  summary: 'Enhance image resolution with 2x or 4x upscale factors using Clarity, SwinIR, or Real-ESRGAN models',
  tags: ['upscale', 'resolution', 'enhancement', 'super-resolution', 'SwinIR', 'Real-ESRGAN'],
  content: {
    description:
      'The imageUpscale tool enhances image resolution and quality. It supports 2x and 4x upscale factors ' +
      'across multiple models. The maximum input image size is 1,048,576 pixels (1024x1024 or 1MP). ' +
      'Five model variants are available ranging from Clarity Upscaler to Real-ESRGAN. ' +
      'Only SwinIR and Real-ESRGAN support 4x upscaling. The tool accepts images via UUID, URL, ' +
      'base64, or data URI and returns the upscaled image with UUID and URL.',
    parameters: [
      {
        name: 'inputImage',
        type: 'string',
        required: true,
        description: 'Image to upscale. Accepts UUID, URL, base64, or data URI. Max input: 1,048,576 pixels.',
      },
      {
        name: 'upscaleFactor',
        type: 'integer',
        default: '2',
        description: 'Upscale multiplier: 2 (all models) or 4 (SwinIR and Real-ESRGAN only).',
      },
      {
        name: 'model',
        type: 'string',
        description: 'Upscale model identifier. Available: Clarity Upscaler, SwinIR (supports 4x), Real-ESRGAN (supports 4x).',
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
        description: 'Image format: "JPG", "PNG", or "WEBP".',
      },
      {
        name: 'outputQuality',
        type: 'integer',
        range: '20-99',
        default: '95',
        description: 'Compression quality for lossy formats.',
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
        title: 'Basic 2x upscale',
        input: {
          inputImage: 'abc12345-uuid-of-image',
          upscaleFactor: 2,
        },
        explanation: 'Doubles the resolution of the image using the default model. A 512x512 image becomes 1024x1024.',
      },
      {
        title: '4x upscale with Real-ESRGAN',
        input: {
          inputImage: 'https://example.com/small-image.jpg',
          upscaleFactor: 4,
          model: 'runware:xxx@3',
          outputFormat: 'PNG',
        },
        explanation: 'Quadruples resolution using Real-ESRGAN. A 256x256 image becomes 1024x1024. Best for illustrations and graphics.',
      },
    ],
    tips: [
      'Input images must be under 1,048,576 pixels (1MP). Resize larger images before upscaling.',
      'Only SwinIR and Real-ESRGAN support 4x upscaling. Other models are limited to 2x.',
      '2x upscaling is faster and cheaper. Use 4x only when you need very high resolution from a small source.',
      'Upscaled images can be passed to imageInference for further processing using the result imageUUID.',
      'For best quality on photos, use Clarity Upscaler. For illustrations, try Real-ESRGAN.',
    ],
    relatedDocs: [
      'runware://docs/concepts/output-types',
      'runware://docs/tools/image-inference',
      'runware://docs/tools/image-upload',
    ],
  },
  lastUpdated: '2026-02-05',
};
