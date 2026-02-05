import type { DocResource } from '../../types.js';

export const captionDoc: DocResource = {
  id: 'caption',
  category: 'tools',
  title: 'Image Captioning',
  summary: 'Generate descriptive text from images using LLaVA, CLIP, and Qwen vision-language models, including age detection',
  tags: ['caption', 'description', 'vision', 'LLaVA', 'CLIP', 'Qwen', 'age detection'],
  content: {
    description:
      'The imageCaption tool generates descriptive text from images using vision-language models. ' +
      'It supports general captioning (comprehensive descriptions), content analysis (objects, scenes, ' +
      'composition), and age detection (demographic analysis). Multiple models are available: ' +
      'LLaVA-1.6-Mistral-7B for rich detailed descriptions, OpenAI CLIP ViT-L/14 for semantic understanding, ' +
      'Qwen2.5-VL for instruction-following analysis, and specialized age detection models. ' +
      'An optional prompt parameter guides the analysis focus. Returns text or structured data.',
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
        default: 'runware:150@2',
        description: 'Caption model. Options: runware:150@2 (LLaVA), runware:151@1 (CLIP), runware:152@1 (Qwen 3B), runware:152@2 (Qwen 7B), runware:153@1 (ViT Age), runware:154@1 (Open Age), runware:152@50 (Qwen Age).',
      },
      {
        name: 'prompt',
        type: 'string',
        description: 'Optional instructions guiding the analysis. When omitted, the model provides a comprehensive image description.',
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
        title: 'General image description',
        input: {
          inputImage: 'abc12345-uuid-of-uploaded-image',
          model: 'runware:150@2',
        },
        explanation: 'Uses LLaVA to generate a comprehensive description of the image, including subjects, setting, mood, and visual style.',
      },
      {
        title: 'Guided analysis with custom prompt',
        input: {
          inputImage: 'https://example.com/product-photo.jpg',
          model: 'runware:152@2',
          prompt: 'Describe the product in this image, including color, material, and approximate dimensions.',
        },
        explanation: 'Qwen 7B follows the custom prompt instruction to focus on specific aspects of the image.',
      },
      {
        title: 'Age detection',
        input: {
          inputImage: 'def12345-uuid-of-portrait',
          model: 'runware:152@50',
        },
        explanation: 'Returns structured age detection data instead of plain text. Uses the Qwen age detection model.',
      },
    ],
    tips: [
      'LLaVA (runware:150@2) provides the most detailed narrative descriptions. Best for generating image-to-text prompts.',
      'CLIP (runware:151@1) focuses on semantic tags and understanding. Better for classification-like tasks.',
      'Qwen models (runware:152@1/2) support instruction-following via the prompt parameter for targeted analysis.',
      'Age detection models return structuredData instead of plain text — check that field in the response.',
      'Caption output can be passed directly to imageInference as a positivePrompt for image recreation or variation.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/image-upload',
      'runware://docs/tools/prompt-enhancer',
    ],
  },
  lastUpdated: '2026-02-05',
};
