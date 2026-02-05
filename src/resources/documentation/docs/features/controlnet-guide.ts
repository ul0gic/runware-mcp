/**
 * ControlNet Guidance — Feature Guide Documentation
 *
 * Covers structural guidance for image generation using
 * preprocessed guide images with ControlNet.
 */

import type { DocResource } from '../../types.js';

const EXAMPLE_CHECKPOINT_MODEL = 'civitai:133005@357609';

export const controlnetGuideDoc: DocResource = {
  id: 'controlnet-guide',
  category: 'features',
  title: 'ControlNet Guidance',
  summary:
    'Structural guidance for image generation using preprocessed guide images and configurable influence',
  tags: ['controlnet', 'image-generation', 'guidance', 'preprocessing', 'structural-control'],
  content: {
    description:
      'ControlNet provides structural guidance during image generation by conditioning the diffusion process on preprocessed guide images. Instead of relying solely on the text prompt, ControlNet injects spatial information (edges, depth, pose, segmentation) that constrains the output layout, composition, and structure. This is essential when you need precise control over the generated image geometry while still allowing creative freedom in style, color, and detail. You can stack up to 4 ControlNets simultaneously and control when each one activates during the diffusion process using startStep and endStep.',

    parameters: [
      {
        name: 'controlNet',
        type: 'array of ControlNet configs',
        required: false,
        range: 'max 4 items',
        description:
          'Array of ControlNet configurations. Each entry specifies a guide image, preprocessor, and influence settings.',
      },
      {
        name: 'controlNet[].guideImage',
        type: 'string (UUID | URL | base64 | dataURI)',
        required: true,
        description:
          'The guide image that provides structural information. Can be a preprocessed image or a raw image that will be processed by the specified preprocessor.',
      },
      {
        name: 'controlNet[].preprocessor',
        type: 'string (enum)',
        required: true,
        description:
          'The preprocessor to apply to the guide image. Options: canny, depth, mlsd, normalbae, openpose, tile, seg, lineart, lineart_anime, shuffle, scribble, softedge.',
      },
      {
        name: 'controlNet[].model',
        type: 'string',
        required: false,
        description:
          'ControlNet model identifier. If omitted, a default model matching the preprocessor is used.',
      },
      {
        name: 'controlNet[].weight',
        type: 'number',
        required: false,
        range: '0-1',
        description:
          'How strongly the ControlNet influences the output. Higher values follow the guide image more closely. Start with 0.7 and adjust.',
      },
      {
        name: 'controlNet[].startStep',
        type: 'number',
        required: false,
        range: '0-1',
        description:
          'Normalized step at which ControlNet influence begins. 0 = start of generation, 1 = end. Useful for letting early steps establish composition freely.',
      },
      {
        name: 'controlNet[].endStep',
        type: 'number',
        required: false,
        range: '0-1',
        description:
          'Normalized step at which ControlNet influence ends. Setting this below 1 allows the model to refine details without ControlNet constraints.',
      },
    ],

    examples: [
      {
        title: 'Canny edge detection for architectural rendering',
        input: {
          positivePrompt: 'modern glass office building, photorealistic, sunset lighting',
          model: EXAMPLE_CHECKPOINT_MODEL,
          width: 1024,
          height: 1024,
          controlNet: [
            {
              guideImage: 'https://example.com/building-photo.jpg',
              preprocessor: 'canny',
              weight: 0.7,
            },
          ],
        },
        explanation:
          'Uses Canny edge detection to extract building outlines from a reference photo, then generates a photorealistic architectural render that follows the same structure. Weight 0.7 balances structural fidelity with creative freedom.',
      },
      {
        title: 'Depth map for scene layout preservation',
        input: {
          positivePrompt: 'enchanted forest with glowing mushrooms, fantasy art',
          model: EXAMPLE_CHECKPOINT_MODEL,
          width: 1024,
          height: 768,
          controlNet: [
            {
              guideImage: 'https://example.com/forest-reference.jpg',
              preprocessor: 'depth',
              weight: 0.8,
              endStep: 0.8,
            },
          ],
        },
        explanation:
          'Extracts depth information from a forest photo to maintain spatial relationships (foreground trees, background hills) while allowing the model to create a fantasy scene. EndStep 0.8 releases control in the final 20% of steps for natural detail refinement.',
      },
      {
        title: 'Multi-ControlNet: Pose + Edge for character illustration',
        input: {
          positivePrompt: 'anime warrior princess, detailed armor, dynamic pose',
          model: EXAMPLE_CHECKPOINT_MODEL,
          width: 768,
          height: 1024,
          controlNet: [
            {
              guideImage: 'https://example.com/pose-reference.jpg',
              preprocessor: 'openpose',
              weight: 0.8,
            },
            {
              guideImage: 'https://example.com/armor-design.jpg',
              preprocessor: 'lineart',
              weight: 0.5,
              startStep: 0.2,
              endStep: 0.7,
            },
          ],
        },
        explanation:
          'Combines OpenPose for body positioning with line art for armor detail. The pose ControlNet runs throughout generation for consistent positioning, while the lineart ControlNet activates only in the middle steps (0.2-0.7) to guide armor detail without over-constraining the final result.',
      },
    ],

    tips: [
      'All 12 preprocessors: canny (edges), depth (3D spatial), mlsd (straight lines), normalbae (surface normals), openpose (human pose), tile (texture detail), seg (semantic regions), lineart (clean lines), lineart_anime (anime lines), shuffle (creative variation), scribble (rough sketches), softedge (soft outlines).',
      'Start with weight 0.7 for most use cases. Increase toward 1.0 for strict structural adherence, decrease toward 0.3 for loose guidance.',
      'Use startStep and endStep to control when ControlNet is active. Early steps (0-0.3) establish composition; middle steps (0.3-0.7) add structure; late steps (0.7-1.0) refine details.',
      'When stacking multiple ControlNets, use lower individual weights (0.3-0.6) to prevent conflicts. Different preprocessor types combine better than similar ones.',
      'For architecture, prefer mlsd (straight lines) or canny (all edges). For characters, prefer openpose (body) combined with lineart or softedge (detail). For scenes, prefer depth (spatial layout).',
      'Pre-process your guide images using the controlNetPreprocess tool before passing them to imageInference for more predictable results.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/controlnet-preprocess',
      'runware://docs/features/ip-adapters-guide',
      'runware://docs/features/lora-guide',
    ],
  },
  lastUpdated: '2026-02-05',
};
