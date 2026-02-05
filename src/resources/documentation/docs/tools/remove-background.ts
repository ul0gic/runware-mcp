import type { DocResource } from '../../types.js';

export const removeBackgroundDoc: DocResource = {
  id: 'remove-background',
  category: 'tools',
  title: 'Background Removal',
  summary: 'Remove backgrounds from images to create transparent PNGs, with alpha matting for edge refinement',
  tags: ['background', 'removal', 'transparency', 'PNG', 'alpha matting', 'RemBG', 'Bria'],
  content: {
    description:
      'The imageBackgroundRemoval tool isolates subjects from their backgrounds, creating transparent images. ' +
      'Two model families are available: RemBG 1.4 (with advanced alpha matting settings) and Bria RMBG 2.0 ' +
      '(faster, with preserveAlpha option). Use PNG output format to preserve transparency. ' +
      'The tool accepts images via UUID, URL, base64, or data URI and returns processed images with the ' +
      'background removed. Ideal for product photography, portrait cutouts, and design asset preparation.',
    parameters: [
      {
        name: 'inputImage',
        type: 'string',
        required: true,
        description: 'Image to process. Accepts UUID of a previously uploaded/generated image, public URL, base64 data, or data URI.',
      },
      {
        name: 'model',
        type: 'string',
        default: 'runware:109@1',
        description: 'Background removal model. Default is RemBG 1.4. Also available: Bria RMBG 2.0.',
      },
      {
        name: 'settings',
        type: 'object',
        description: 'Advanced settings (RemBG 1.4 only): rgba, postProcessMask, returnOnlyMask, alphaMatting, alphaMattingForegroundThreshold (1-255), alphaMattingBackgroundThreshold (1-255), alphaMattingErodeSize (1-255).',
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
        description: 'Image format: "PNG" (required for transparency), "JPG", or "WEBP".',
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
        title: 'Basic background removal',
        input: {
          inputImage: 'https://example.com/product-photo.jpg',
          outputFormat: 'PNG',
        },
        explanation: 'Removes the background using the default RemBG 1.4 model and outputs as transparent PNG.',
      },
      {
        title: 'Advanced removal with alpha matting',
        input: {
          inputImage: 'abc12345-uuid-of-uploaded-image',
          model: 'runware:109@1',
          settings: {
            alphaMatting: true,
            alphaMattingForegroundThreshold: 240,
            alphaMattingBackgroundThreshold: 20,
            alphaMattingErodeSize: 10,
          },
          outputFormat: 'PNG',
        },
        explanation: 'Alpha matting refines edges for subjects with fine details like hair or fur. Adjust thresholds to balance foreground retention vs background removal.',
      },
    ],
    tips: [
      'Always use outputFormat: "PNG" when you need transparency. JPG does not support alpha channels.',
      'Alpha matting (RemBG 1.4 only) significantly improves results for subjects with hair, fur, or translucent edges.',
      'Use returnOnlyMask: true to get the mask for manual editing or use in inpainting workflows.',
      'The result imageUUID can be passed directly to imageInference as a seedImage for further processing.',
      'Bria RMBG 2.0 is faster but does not support alpha matting settings.',
    ],
    relatedDocs: [
      'runware://docs/concepts/output-types',
      'runware://docs/tools/image-inference',
      'runware://docs/tools/image-upload',
    ],
  },
  lastUpdated: '2026-02-05',
};
