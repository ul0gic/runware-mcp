import type { DocResource } from '../../types.js';

export const outputTypesDoc: DocResource = {
  id: 'output-types',
  category: 'concepts',
  title: 'Output Types & Formats',
  summary: 'How to control output delivery (URL, base64Data, dataURI) and image format (JPG, PNG, WEBP) across all tools',
  tags: ['output', 'URL', 'base64', 'dataURI', 'format', 'quality', 'JPG', 'PNG', 'WEBP'],
  content: {
    description:
      'Runware tools return generated media in one of three output types: URL (a temporary hosted link), ' +
      'base64Data (raw base64-encoded bytes), or dataURI (a data URI string with MIME type prefix). ' +
      'The outputFormat parameter controls the image encoding (JPG, PNG, WEBP for images; MP4, WEBM, MOV for video; ' +
      'MP3, WAV, OGG for audio). The outputQuality parameter (20-99) controls compression for lossy formats. ' +
      'URL outputs are temporary — they expire based on the ttl parameter (minimum 60 seconds). ' +
      'Use PNG when transparency is required (background removal, LayerDiffuse). ' +
      'SVG is the only format for the vectorize tool.',
    parameters: [
      {
        name: 'outputType',
        type: 'string',
        default: 'URL',
        description: 'How to deliver the result. "URL" returns a hosted link, "base64Data" returns raw base64, "dataURI" returns a data URI string.',
      },
      {
        name: 'outputFormat',
        type: 'string',
        default: 'JPG',
        description: 'Image format: "JPG" (smallest, lossy), "PNG" (lossless, transparency), "WEBP" (efficient, lossy/lossless). Video: "MP4", "WEBM", "MOV". Audio: "MP3", "WAV", "OGG".',
      },
      {
        name: 'outputQuality',
        type: 'integer',
        range: '20-99',
        default: '95',
        description: 'Compression quality for lossy formats (JPG, WEBP). Higher values = better quality but larger file size.',
      },
      {
        name: 'ttl',
        type: 'integer',
        range: '60+',
        description: 'Time-to-live in seconds for URL outputs. After expiration, the URL is no longer accessible. Minimum 60 seconds.',
      },
    ],
    examples: [
      {
        title: 'URL output (default, most common)',
        input: { outputType: 'URL', outputFormat: 'JPG', outputQuality: 95 },
        explanation: 'Returns a temporary URL to the generated image. Best for most use cases — the URL can be displayed, downloaded, or passed to other tools.',
      },
      {
        title: 'Base64 output for inline processing',
        input: { outputType: 'base64Data', outputFormat: 'PNG' },
        explanation: 'Returns raw base64 data without a URL. Useful when you need to process the image data directly without an HTTP fetch.',
      },
      {
        title: 'PNG with transparency for background removal',
        input: { outputType: 'URL', outputFormat: 'PNG' },
        explanation: 'PNG is required when the output includes transparency (background removal, LayerDiffuse). JPG does not support alpha channels.',
      },
    ],
    tips: [
      'Use URL output type for most operations — it is the most efficient and avoids large base64 payloads in the response.',
      'Use PNG format only when transparency is needed. JPG is smaller and faster for opaque images.',
      'WEBP offers the best quality-to-size ratio but may not be supported by all downstream tools.',
      'Set a longer ttl if you need to reference the URL later. The default expiration varies by operation.',
      'For video output, MP4 is the most widely compatible format. WEBM is smaller but less universally supported.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/remove-background',
      'runware://docs/tools/vectorize',
    ],
  },
  lastUpdated: '2026-02-05',
};
