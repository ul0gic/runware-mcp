import type { DocResource } from '../../types.js';

export const controlnetPreprocessDoc: DocResource = {
  id: 'controlnet-preprocess',
  category: 'tools',
  title: 'ControlNet Preprocessing',
  summary: 'Transform images into guide images for ControlNet-guided generation using 12 preprocessor types',
  tags: ['ControlNet', 'preprocessing', 'canny', 'depth', 'openpose', 'guide image', 'edge detection'],
  content: {
    description:
      'The controlNetPreprocess tool transforms input images into guide images for ControlNet-guided ' +
      'image generation. 12 preprocessor types are available, each producing a different type of structural ' +
      'guide: canny (edge detection), depth (depth map), mlsd (line segments), normalbae (surface normals), ' +
      'openpose (human pose), tile (tile-based), seg (semantic segmentation), lineart (line art), ' +
      'lineart_anime (anime-style lines), shuffle (content shuffling), scribble (rough sketch), and ' +
      'softedge (soft edges). The generated guide image UUID is then passed to imageInference in the ' +
      'controlNet array to guide generation while following the structural layout.',
    parameters: [
      {
        name: 'inputImage',
        type: 'string',
        required: true,
        description: 'Image to preprocess. Accepts UUID, URL, base64, or data URI.',
      },
      {
        name: 'preprocessor',
        type: 'string',
        required: true,
        description: 'Preprocessing algorithm: "canny", "depth", "mlsd", "normalbae", "openpose", "tile", "seg", "lineart", "lineart_anime", "shuffle", "scribble", "softedge".',
      },
      {
        name: 'height',
        type: 'integer',
        range: '64-2048',
        description: 'Optional resize height for the output guide image.',
      },
      {
        name: 'width',
        type: 'integer',
        range: '64-2048',
        description: 'Optional resize width for the output guide image.',
      },
      {
        name: 'lowThresholdCanny',
        type: 'integer',
        range: '0-255',
        description: 'Low threshold for Canny edge detection. Only used when preprocessor is "canny".',
      },
      {
        name: 'highThresholdCanny',
        type: 'integer',
        range: '0-255',
        description: 'High threshold for Canny edge detection. Only used when preprocessor is "canny".',
      },
      {
        name: 'includeHandsAndFaceOpenPose',
        type: 'boolean',
        description: 'Include detailed hand and face outlines in OpenPose output. Only used when preprocessor is "openpose".',
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
        title: 'Canny edge detection for structural guidance',
        input: {
          inputImage: 'abc12345-uuid-of-reference',
          preprocessor: 'canny',
          lowThresholdCanny: 100,
          highThresholdCanny: 200,
        },
        explanation: 'Extracts edges from the reference image. Use the resulting guideImageUUID in imageInference controlNet array for edge-guided generation.',
      },
      {
        title: 'OpenPose for human pose transfer',
        input: {
          inputImage: 'https://example.com/person-photo.jpg',
          preprocessor: 'openpose',
          includeHandsAndFaceOpenPose: true,
          width: 1024,
          height: 1024,
        },
        explanation: 'Extracts human pose skeleton with hands and face detail. The guide image drives pose-accurate generation in imageInference.',
      },
    ],
    tips: [
      'Canny is the most versatile preprocessor — good for transferring composition from any image.',
      'Depth maps work well for landscape/architectural scenes where spatial depth matters.',
      'OpenPose is essential for consistent human poses. Enable includeHandsAndFaceOpenPose for better hand/face detail.',
      'Lineart and lineart_anime are ideal for illustration-style generation from sketches or existing art.',
      'The guide image dimensions should match the target generation dimensions for best results.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/image-upload',
      'runware://docs/concepts/air-identifiers',
    ],
  },
  lastUpdated: '2026-02-05',
};
