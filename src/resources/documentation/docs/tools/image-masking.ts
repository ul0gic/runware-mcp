import type { DocResource } from '../../types.js';

export const imageMaskingDoc: DocResource = {
  id: 'image-masking',
  category: 'tools',
  title: 'Image Masking',
  summary: 'Detect and generate masks for faces, hands, facial features, and people for use in inpainting workflows',
  tags: ['masking', 'detection', 'face', 'hands', 'inpainting', 'YOLOv8', 'MediaPipe'],
  content: {
    description:
      'The imageMasking tool detects specific elements in images and generates binary masks for inpainting. ' +
      'It supports face detection (2D and realistic), facial feature detection (eyes, nose, lips), ' +
      'hand detection, and full person segmentation. 15 specialized models cover different detection targets. ' +
      'The generated mask can be used directly with imageInference for inpainting — white areas in the mask ' +
      'indicate regions to edit. Detection results include bounding box coordinates for each found element. ' +
      'Configurable confidence threshold, max detections, mask padding, and mask blur for fine control.',
    parameters: [
      {
        name: 'inputImage',
        type: 'string',
        required: true,
        description: 'Image to analyze. Accepts UUID, URL, base64, or data URI.',
      },
      {
        name: 'model',
        type: 'string',
        default: 'runware:35@1',
        description: 'Detection model. Face: 35@1 (yolov8n), 35@2 (yolov8s), 35@6-8 (mediapipe). Features: 35@9-15 (eyes/nose/lips). Hands: 35@3. Person: 35@4-5.',
      },
      {
        name: 'confidence',
        type: 'number',
        range: '0-1',
        default: '0.25',
        description: 'Confidence threshold. Lower values detect more elements (may include false positives). Higher values are more accurate.',
      },
      {
        name: 'maxDetections',
        type: 'integer',
        range: '1-20',
        default: '6',
        description: 'Maximum number of elements to detect.',
      },
      {
        name: 'maskPadding',
        type: 'integer',
        default: '4',
        description: 'Pixels to extend (positive) or shrink (negative) the mask area around detections.',
      },
      {
        name: 'maskBlur',
        type: 'integer',
        range: '0+',
        default: '4',
        description: 'Fade-out effect at mask edges in pixels. Smoother transitions for inpainting.',
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
        title: 'Detect and mask faces for inpainting',
        input: {
          inputImage: 'abc12345-uuid-of-portrait',
          model: 'runware:35@1',
          confidence: 0.3,
          maxDetections: 4,
          maskPadding: 8,
          maskBlur: 6,
        },
        explanation: 'Detects faces using YOLOv8 and creates a mask. The mask UUID can be used as maskImage in imageInference for face inpainting.',
      },
      {
        title: 'Detect eyes only for detailed editing',
        input: {
          inputImage: 'https://example.com/close-up-portrait.jpg',
          model: 'runware:35@9',
          confidence: 0.4,
          maskPadding: 12,
        },
        explanation: 'Uses MediaPipe face mesh to detect eye regions only. Higher padding extends the mask for natural-looking inpainting results.',
      },
    ],
    tips: [
      'Use the mask output directly as maskImage in imageInference for targeted inpainting.',
      'Lower confidence (0.15-0.25) catches more faces but may include false positives. Higher confidence (0.4-0.6) is more precise.',
      'Increase maskPadding (8-16) for inpainting to give the model more context around the edited area.',
      'maskBlur creates softer mask edges for smoother inpainting transitions. 4-8 pixels is a good range.',
      'Combine with maskMargin in imageInference for zoomed inpainting — the mask defines the area, maskMargin adds context.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/image-upload',
    ],
  },
  lastUpdated: '2026-02-05',
};
