import type { DocResource } from '../../types.js';

export const promptEnhancerDoc: DocResource = {
  id: 'prompt-enhancer',
  category: 'tools',
  title: 'Prompt Enhancement',
  summary: 'Refine and diversify image generation prompts by adding descriptive keywords and variations',
  tags: ['prompt', 'enhancement', 'keywords', 'variations', 'optimization'],
  content: {
    description:
      'The promptEnhance tool refines image generation prompts by incorporating additional descriptive keywords. ' +
      'It can generate multiple enhanced variations of a single input prompt. Each variation adds different ' +
      'artistic, stylistic, and descriptive details to produce more vivid and diverse image generation results. ' +
      'Note that enhanced prompts may not maintain exact subject focus — they are designed to produce varied ' +
      'results rather than guaranteed superior outcomes. Use promptVersions to generate multiple alternatives ' +
      'and pick the best one.',
    parameters: [
      {
        name: 'prompt',
        type: 'string',
        required: true,
        range: '1-300 characters',
        description: 'Input text to enhance. Keep it concise — the enhancer adds detail.',
      },
      {
        name: 'promptVersions',
        type: 'integer',
        range: '1-5',
        default: '1',
        description: 'Number of enhanced prompt variations to generate.',
      },
      {
        name: 'promptMaxLength',
        type: 'integer',
        range: '12-400',
        description: 'Maximum length of the enhanced prompt in tokens. Approximately 100 tokens equals 75 words.',
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
        title: 'Basic prompt enhancement',
        input: {
          prompt: 'a cat sitting on a windowsill',
          promptVersions: 1,
        },
        explanation: 'Enhances the simple prompt with additional descriptive keywords like lighting, mood, style, and detail.',
      },
      {
        title: 'Multiple variations for selection',
        input: {
          prompt: 'futuristic city skyline',
          promptVersions: 3,
          promptMaxLength: 200,
        },
        explanation: 'Generates 3 different enhanced versions of the prompt, each with different artistic directions. Max 200 tokens per variation.',
      },
    ],
    tips: [
      'Start with a short, focused prompt (10-30 words) and let the enhancer add the descriptive detail.',
      'Generate 2-3 versions and pick the one that best matches your intent before passing to imageInference.',
      'Enhanced prompts work best with general-purpose models. Specialized models may already have built-in prompt optimization.',
      'The enhanced prompt text can be passed directly as positivePrompt to imageInference.',
      'Set promptMaxLength to control verbosity. Shorter prompts (50-100 tokens) give the model more freedom.',
    ],
    relatedDocs: [
      'runware://docs/tools/image-inference',
      'runware://docs/tools/caption',
    ],
  },
  lastUpdated: '2026-02-05',
};
