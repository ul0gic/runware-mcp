/* eslint-disable @typescript-eslint/naming-convention -- CFGScale is the Runware API parameter name */
import type { DocResource } from '../../types.js';

/** Example SDXL checkpoint model used in documentation examples. */
const EXAMPLE_CHECKPOINT = 'civitai:101195@128078';

/** Example ControlNet model used in documentation examples. */
const EXAMPLE_CONTROLNET = 'civitai:272689@307084';

/** Example LoRA model used in documentation examples. */
const EXAMPLE_LORA = 'civitai:943001@1055701';

export const combiningFeaturesDoc: DocResource = {
  id: 'combining-features',
  category: 'guides',
  title: 'Combining Features',
  summary: 'How to stack ControlNet, LoRA, IP-Adapters, embeddings, and identity preservation features together with weight balancing and compatibility rules',
  tags: ['ControlNet', 'LoRA', 'IP-Adapters', 'PuLID', 'embeddings', 'stacking', 'composition'],
  content: {
    description:
      'Runware image inference supports combining multiple advanced features in a single generation. ' +
      'Understanding compatibility rules and weight balancing is critical for predictable results.\n\n' +
      'Stacking rules and limits:\n' +
      '- ControlNet: Up to 4 ControlNet configurations per generation. Each uses a preprocessed guide image to ' +
      'enforce structural constraints (edges, depth, pose, segmentation).\n' +
      '- LoRA: Up to 5 LoRA models per generation. Each adds stylistic or subject emphasis with a configurable weight.\n' +
      '- IP-Adapters: Multiple IP-Adapters supported. Each uses guide images to inject visual style, composition, or ' +
      'face identity into the generation.\n' +
      '- Embeddings: Up to 5 textual inversion embeddings. Each adds custom trained concepts with a weight parameter.\n' +
      '- PuLID/ACE++: Identity preservation from reference face images. Use one identity method per generation.\n\n' +
      'Compatible combinations:\n' +
      '- ControlNet + LoRA: Fully compatible. ControlNet provides structure, LoRA provides style. This is the most ' +
      'common advanced combination.\n' +
      '- IP-Adapters + ControlNet: Compatible. IP-Adapter sets the visual style/composition while ControlNet enforces ' +
      'spatial structure. Powerful for guided creative generation.\n' +
      '- PuLID + LoRA: Compatible. PuLID preserves facial identity while LoRA applies artistic style. Good for ' +
      'stylized portraits of specific people.\n' +
      '- Embeddings + LoRA: Fully compatible. Embeddings define custom concepts, LoRA applies style.\n' +
      '- Refiner + everything: The refiner runs as a second pass and is compatible with all features above.\n\n' +
      'Weight balancing:\n' +
      '- ControlNet startPercentage/endPercentage control when the guidance applies during diffusion steps.\n' +
      '- LoRA weight (0-2) controls influence. Start at 0.7-1.0 and adjust.\n' +
      '- When using multiple ControlNets, reduce individual weights to avoid conflicts (e.g., 0.5 each for 2 ControlNets).\n' +
      '- When combining LoRAs, keep total weights reasonable. Two LoRAs at weight 1.0 each is generally fine; five at 1.0 each may cause artifacts.',
    examples: [
      {
        title: 'ControlNet depth + LoRA style for architectural rendering',
        input: {
          positivePrompt: 'Modern architecture office building, glass facade, sunset lighting',
          model: EXAMPLE_CHECKPOINT,
          controlNet: [
            {
              model: EXAMPLE_CONTROLNET,
              guideImage: 'uuid-of-depth-preprocessed-image',
              weight: 0.8,
              startPercentage: 0,
              endPercentage: 80,
            },
          ],
          lora: [
            {
              model: EXAMPLE_LORA,
              weight: 0.9,
            },
          ],
          steps: 30,
          CFGScale: 7,
        },
        explanation:
          'ControlNet depth map enforces the building structure (active for first 80% of steps), while the LoRA applies an architectural photography style. The ControlNet weight at 0.8 provides strong structural guidance without being rigid.',
      },
      {
        title: 'IP-Adapter composition + ControlNet pose for character illustration',
        input: {
          positivePrompt: 'Anime character, dynamic pose, colorful outfit, detailed background',
          model: EXAMPLE_CHECKPOINT,
          controlNet: [
            {
              model: EXAMPLE_CONTROLNET,
              guideImage: 'uuid-of-openpose-preprocessed-image',
              weight: 0.7,
            },
          ],
          ipAdapters: [
            {
              model: 'ip-adapter-plus',
              guideImages: ['uuid-of-style-reference-image'],
              weight: 0.6,
              mode: 'style_transfer',
            },
          ],
          steps: 30,
          CFGScale: 7,
        },
        explanation:
          'The ControlNet OpenPose enforces body pose while the IP-Adapter in style_transfer mode applies the visual aesthetic from the reference image. Moderate weights (0.7 and 0.6) prevent either from overpowering the other.',
      },
      {
        title: 'PuLID identity + LoRA style for stylized portrait',
        input: {
          positivePrompt: 'Portrait in watercolor art style, soft lighting, artistic background',
          model: EXAMPLE_CHECKPOINT,
          pulid: {
            inputImages: ['uuid-of-face-reference'],
            idWeight: 1.2,
          },
          lora: [
            {
              model: EXAMPLE_LORA,
              weight: 0.8,
            },
          ],
          steps: 30,
          CFGScale: 7,
        },
        explanation:
          'PuLID preserves facial identity from the reference image with idWeight 1.2 for strong likeness, while the LoRA applies a watercolor artistic style at weight 0.8.',
      },
    ],
    tips: [
      'Start with one feature at a time. Add a second feature only after confirming the first produces the expected result.',
      'When combining ControlNets, reduce each weight proportionally. Two ControlNets at 0.5 weight each is a good starting point.',
      'LoRA weights above 1.0 increase stylistic influence but may cause artifacts. Stay between 0.5 and 1.2 for most use cases.',
      'Use ControlNet startPercentage and endPercentage to control when guidance applies. Early guidance (0-60%) affects composition; late guidance (40-100%) affects detail.',
      'IP-Adapter mode matters: "style_transfer" for aesthetics, "composition" for layout, "face_id" for facial features, "plus" for general similarity.',
      'Do not combine PuLID and ACE++ in the same generation. Choose one identity preservation method per request.',
      'Embeddings with weight < 0 create a "negative embedding" effect, reducing that concept from the output.',
      'When stacking many features, increase steps to 30-40 to give the model enough iterations to resolve all guidance signals.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/features/controlnet-guide',
      'runware://docs/features/lora-guide',
      'runware://docs/features/ip-adapters-guide',
      'runware://docs/features/identity-preservation',
      'runware://docs/features/embeddings',
      'runware://docs/tools/controlnet-preprocess',
      'runware://docs/guides/quality-tuning',
    ],
  },
  lastUpdated: '2026-02-05',
};
