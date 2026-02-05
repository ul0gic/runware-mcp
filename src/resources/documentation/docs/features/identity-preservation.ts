/**
 * Identity Preservation — Feature Guide Documentation
 *
 * Covers PuLID, ACE++, and PhotoMaker for face and
 * identity consistency in generated images.
 */

import type { DocResource } from '../../types.js';

export const identityPreservationDoc: DocResource = {
  id: 'identity-preservation',
  category: 'features',
  title: 'Identity Preservation (PuLID / ACE++ / PhotoMaker)',
  summary:
    'Preserve specific facial identity and character consistency across generated images using PuLID, ACE++, or PhotoMaker',
  tags: [
    'identity',
    'face',
    'pulid',
    'ace++',
    'photomaker',
    'character-consistency',
    'image-generation',
  ],
  content: {
    description:
      'Identity preservation techniques allow you to generate images that maintain a specific person\'s facial features, expression characteristics, or overall appearance. Runware supports three approaches: PuLID (Pure and Lightning ID Customization) for fast, high-fidelity identity transfer; ACE++ for character-consistent generation across different scenes and poses with portrait, subject, and local editing modes; and PhotoMaker for photorealistic identity results via the dedicated photoMaker tool. Choose based on your use case: PuLID excels at single-image identity transfer with speed, ACE++ excels at multi-scene character consistency, and PhotoMaker targets photorealistic portrait results.',

    parameters: [
      {
        name: 'pulid',
        type: 'object',
        required: false,
        description:
          'PuLID configuration for fast identity transfer. Provides high-fidelity facial identity from reference images.',
      },
      {
        name: 'pulid.inputImages',
        type: 'array of image inputs',
        required: true,
        range: '1-4 images',
        description:
          'Reference face images for identity extraction. Multiple images improve identity accuracy.',
      },
      {
        name: 'pulid.idWeight',
        type: 'number',
        required: false,
        range: '0-3',
        description:
          'Identity preservation strength. Higher values enforce stronger facial similarity. Start with 1.0.',
      },
      {
        name: 'pulid.trueCFGScale',
        type: 'number',
        required: false,
        range: '1-3',
        description:
          'True CFG scale for PuLID. Controls the balance between identity fidelity and prompt adherence.',
      },
      {
        name: 'pulid.startStep',
        type: 'integer',
        required: false,
        range: '0+',
        description:
          'Absolute step number where PuLID identity injection begins. Delaying allows the base composition to form first.',
      },
      {
        name: 'pulid.maxTimestep',
        type: 'integer',
        required: false,
        description: 'Maximum timestep for PuLID influence. Controls how late in the process identity is applied.',
      },
      {
        name: 'acePlusPlus',
        type: 'object',
        required: false,
        description:
          'ACE++ configuration for character-consistent generation across scenes.',
      },
      {
        name: 'acePlusPlus.referenceImage',
        type: 'string (UUID | URL | base64 | dataURI)',
        required: true,
        description:
          'Reference image for character consistency. Should clearly show the character or subject.',
      },
      {
        name: 'acePlusPlus.mode',
        type: 'string (enum)',
        required: false,
        description:
          'Generation mode. "portrait" for face-focused consistency, "subject" for full-body/object consistency, "local_editing" for targeted edits on the reference.',
      },
      {
        name: 'acePlusPlus.weight',
        type: 'number',
        required: false,
        range: '0-1',
        description:
          'Reference influence weight. Higher values enforce stronger character consistency.',
      },
    ],

    examples: [
      {
        title: 'PuLID identity transfer for portrait generation',
        input: {
          positivePrompt: 'professional headshot, studio lighting, business attire',
          model: 'civitai:133005@357609',
          width: 768,
          height: 1024,
          pulid: {
            inputImages: ['https://example.com/face-reference.jpg'],
            idWeight: 1.2,
            trueCFGScale: 1.5,
          },
        },
        explanation:
          'Generates a professional headshot while preserving the facial identity from the reference image. idWeight 1.2 provides strong but not over-fitted identity preservation. trueCFGScale 1.5 balances identity with prompt adherence.',
      },
      {
        title: 'ACE++ character consistency across scenes',
        input: {
          positivePrompt: 'fantasy warrior standing on a cliff, dramatic sunset, epic landscape',
          model: 'civitai:133005@357609',
          width: 1024,
          height: 768,
          acePlusPlus: {
            referenceImage: 'https://example.com/character-sheet.jpg',
            mode: 'subject',
            weight: 0.8,
          },
        },
        explanation:
          'Uses ACE++ in subject mode to maintain full character appearance (outfit, body, face) from the reference while placing the character in a completely new scene. Weight 0.8 ensures strong consistency while allowing natural scene integration.',
      },
    ],

    tips: [
      'PuLID is fastest for single identity transfer from 1-4 face photos. Best for portraits and headshots where facial accuracy is paramount.',
      'ACE++ "portrait" mode focuses on facial consistency and is best for generating the same face in different scenarios. "subject" mode preserves the entire character including clothing and body.',
      'ACE++ "local_editing" mode allows targeted modifications to a reference image while keeping the rest intact. Useful for outfit changes or background swaps.',
      'For best PuLID results, use clear frontal face photos with good lighting. Multiple reference images (2-3) improve identity accuracy.',
      'PhotoMaker is available as a separate tool (photoMaker) optimized for photorealistic portrait generation. Use it when photorealism is the primary goal.',
      'Do not combine PuLID and ACE++ in the same generation. Choose one approach based on your use case.',
    ],

    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/features/ip-adapters-guide',
      'runware://docs/features/controlnet-guide',
    ],
  },
  lastUpdated: '2026-02-05',
};
