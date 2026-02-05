import type { DocResource } from '../../types.js';

export const vectorizeDoc: DocResource = {
  id: 'vectorize',
  category: 'tools',
  title: 'SVG Vectorization',
  summary: 'Convert raster images (PNG, JPG, WEBP) into scalable vector graphics (SVG) for perfect clarity at any size',
  tags: ['vectorize', 'SVG', 'vector', 'scalable', 'logo', 'icon', 'Recraft', 'Picsart'],
  content: {
    description:
      'The vectorize tool converts raster images (PNG, JPG, WEBP) into scalable vector graphics (SVG). ' +
      'Unlike raster images that lose quality when scaled, SVGs maintain perfect clarity at any size. ' +
      'Ideal for logos, icons, illustrations, and design assets that need to work at multiple resolutions. ' +
      'Two models are available: Recraft Vectorize and Picsart Image Vectorizer. ' +
      'Output format is always SVG. Returns a vectorized image URL with UUID.',
    parameters: [
      {
        name: 'inputImage',
        type: 'string',
        required: true,
        description: 'Image to vectorize. Accepts UUID, URL, base64, or data URI. Supported: PNG, JPG, WEBP.',
      },
      {
        name: 'model',
        type: 'string',
        default: 'recraft:1@1',
        description: 'Vectorization model: "recraft:1@1" (Recraft Vectorize) or "picsart:1@1" (Picsart Image Vectorizer).',
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
        default: 'SVG',
        description: 'Output format. Only "SVG" is supported for vectorization.',
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
        title: 'Vectorize a logo',
        input: {
          inputImage: 'https://example.com/logo.png',
          model: 'recraft:1@1',
        },
        explanation: 'Converts a PNG logo to SVG using Recraft. The result is a scalable vector that looks sharp at any size.',
      },
      {
        title: 'Vectorize with Picsart model',
        input: {
          inputImage: 'abc12345-uuid-of-illustration',
          model: 'picsart:1@1',
          outputType: 'base64Data',
        },
        explanation: 'Uses Picsart vectorizer and returns base64-encoded SVG data for inline processing.',
      },
    ],
    tips: [
      'Best results come from clean, simple images: logos, icons, illustrations, line art.',
      'Complex photographic images may not vectorize well — the output will be a traced approximation.',
      'Recraft tends to produce cleaner paths for graphic design assets.',
      'SVG output can be directly embedded in web pages or design tools without quality loss.',
      'Consider removing the background first (removeBackground tool) before vectorizing for cleaner results.',
    ],
    relatedDocs: [
      'runware://docs/concepts/output-types',
      'runware://docs/tools/remove-background',
      'runware://docs/tools/image-upload',
    ],
  },
  lastUpdated: '2026-02-05',
};
