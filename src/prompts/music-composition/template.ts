/**
 * Music Composition prompt template.
 *
 * Generates music and audio compositions with configurable genre,
 * mood, tempo, and instrumentation. Instructs Claude to use the
 * audioInference tool with appropriate model selection and settings
 * for the desired musical output.
 */

import type { PromptMessage, PromptTemplate } from '../types.js';

// ============================================================================
// Constants
// ============================================================================

const PROMPT_NAME = 'music-composition';
const PROMPT_DESCRIPTION = 'Generate music and audio compositions with configurable genre, mood, tempo, and instrumentation.';

const DEFAULT_PURPOSE = 'background';
const DEFAULT_TEMPO = 'moderate';
const DEFAULT_DURATION = '30';

const VALID_GENRES = ['ambient', 'electronic', 'classical', 'jazz', 'rock', 'hip-hop', 'cinematic', 'lo-fi'] as const;
const VALID_MOODS = ['uplifting', 'melancholic', 'energetic', 'peaceful', 'dramatic', 'mysterious'] as const;
const VALID_PURPOSES = ['background', 'intro', 'outro', 'highlight', 'meditation'] as const;
const VALID_TEMPOS = ['slow', 'moderate', 'fast'] as const;

// ============================================================================
// Descriptors
// ============================================================================

const GENRE_DESCRIPTORS: Record<string, string> = {
  ambient: 'ambient soundscape, evolving textures, atmospheric pads, drone elements',
  electronic: 'electronic music, synthesizers, drum machines, digital production, bass-driven',
  classical: 'classical orchestral composition, acoustic instruments, symphonic arrangement, dynamic range',
  jazz: 'jazz composition, swing rhythm, improvisation feel, complex harmonies, warm tone',
  rock: 'rock music, electric guitars, driving drums, powerful bass, raw energy',
  'hip-hop': 'hip-hop beat, boom-bap or trap rhythm, bass-heavy, rhythmic groove, urban feel',
  cinematic: 'cinematic score, orchestral swells, emotional build, film soundtrack quality, epic scope',
  'lo-fi': 'lo-fi chill beat, vinyl crackle, mellow piano, warm analog feel, relaxing vibe',
};

const MOOD_DESCRIPTORS: Record<string, string> = {
  uplifting: 'uplifting, hopeful, ascending melodies, major key, bright and positive energy',
  melancholic: 'melancholic, introspective, minor key, emotional depth, bittersweet beauty',
  energetic: 'high-energy, driving rhythm, powerful dynamics, adrenaline-fueling intensity',
  peaceful: 'peaceful, calm, gentle flow, soothing tones, meditative stillness',
  dramatic: 'dramatic, tension-building, dynamic contrasts, powerful climactic moments',
  mysterious: 'mysterious, suspenseful, unusual harmonies, enigmatic atmosphere, dark undertones',
};

const PURPOSE_DESCRIPTORS: Record<string, string> = {
  background: 'suitable as background music, non-intrusive, consistent energy, loopable',
  intro: 'attention-grabbing intro, building energy, establishing tone, hook-driven opening',
  outro: 'resolving outro, gradually fading, satisfying conclusion, wind-down energy',
  highlight: 'highlight moment music, peak energy, impactful climax, memorable motif',
  meditation: 'meditation and relaxation, extremely gentle, minimal, breathing-pace rhythm',
};

const TEMPO_BPM: Record<string, string> = {
  slow: '60-80 BPM, relaxed pace, breathing room between notes',
  moderate: '90-120 BPM, comfortable walking pace, balanced energy',
  fast: '130-160 BPM, high energy, driving rhythm, urgent pace',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns the model recommendation based on genre.
 */
function getModelRecommendation(genre: string): string {
  if (genre === 'classical' || genre === 'cinematic') {
    return 'elevenlabs:1@1 (best for orchestral and cinematic compositions)';
  }
  if (genre === 'electronic' || genre === 'hip-hop') {
    return 'elevenlabs:1@1 (strong for beat-driven genres)';
  }
  return 'elevenlabs:1@1 or mirelo:1@1 (both support music generation)';
}

/**
 * Returns the purpose-specific tip.
 */
function getPurposeTip(purpose: string): string {
  if (purpose === 'background') {
    return '- For background music, ensure the composition is non-intrusive and maintains consistent energy for seamless looping.';
  }
  if (purpose === 'meditation') {
    return '- For meditation, use the slow tempo and emphasize gentle, breathing-paced rhythms with minimal progression.';
  }
  return `- For "${purpose}" purpose, shape the energy arc of the composition accordingly.`;
}

/**
 * Returns the instrument tip based on whether instruments were specified.
 */
function getInstrumentTip(instruments: string | undefined): string {
  if (instruments !== undefined && instruments.length > 0) {
    return `- The specified instruments (${instruments}) should be prominently featured in the composition.`;
  }
  return '- Consider specifying instruments for more targeted results (e.g., "piano, strings, synth").';
}

/**
 * Parses and clamps the duration to a safe value.
 */
function parseSafeDuration(duration: string): number {
  const parsed = Number.parseInt(duration, 10);
  if (Number.isNaN(parsed) || parsed < 10) {
    return 30;
  }
  return Math.min(parsed, 300);
}

// ============================================================================
// Template
// ============================================================================

/**
 * Music composition prompt template.
 */
export const musicComposition: PromptTemplate = {
  name: PROMPT_NAME,
  description: PROMPT_DESCRIPTION,
  arguments: [
    {
      name: 'genre',
      description: `Music genre: ${VALID_GENRES.join(', ')}.`,
      required: true,
    },
    {
      name: 'mood',
      description: `Musical mood: ${VALID_MOODS.join(', ')}.`,
      required: true,
    },
    {
      name: 'purpose',
      description: `Use case: ${VALID_PURPOSES.join(', ')}. Default: "${DEFAULT_PURPOSE}".`,
      required: false,
    },
    {
      name: 'tempo',
      description: `Speed: ${VALID_TEMPOS.join(', ')}. Default: "${DEFAULT_TEMPO}".`,
      required: false,
    },
    {
      name: 'instruments',
      description: 'Preferred instruments (e.g., "piano, strings, synth"). Optional.',
      required: false,
    },
    {
      name: 'duration',
      description: `Desired length in seconds. Default: "${DEFAULT_DURATION}".`,
      required: false,
    },
  ],

  generate(args: Record<string, string>): readonly PromptMessage[] {
    const genre = args.genre ?? 'ambient';
    const mood = args.mood ?? 'peaceful';
    const purpose = args.purpose ?? DEFAULT_PURPOSE;
    const tempo = args.tempo ?? DEFAULT_TEMPO;
    const instruments = args.instruments;
    const duration = args.duration ?? DEFAULT_DURATION;

    const genreDesc = GENRE_DESCRIPTORS[genre] ?? GENRE_DESCRIPTORS.ambient ?? '';
    const moodDesc = MOOD_DESCRIPTORS[mood] ?? MOOD_DESCRIPTORS.peaceful ?? '';
    const purposeDesc = PURPOSE_DESCRIPTORS[purpose] ?? PURPOSE_DESCRIPTORS[DEFAULT_PURPOSE] ?? '';
    const tempoDesc = TEMPO_BPM[tempo] ?? TEMPO_BPM[DEFAULT_TEMPO] ?? '';

    const instrumentClause = instruments !== undefined && instruments.length > 0
      ? ` Featuring: ${instruments}.`
      : '';

    const prompt = [
      `${genre} music composition.`,
      `${genreDesc}.`,
      `${moodDesc}.`,
      `${tempoDesc}.`,
      `${purposeDesc}.`,
      instrumentClause,
      'Professional studio quality, well-mixed, polished production.',
    ].join(' ');

    const safeDuration = parseSafeDuration(duration);

    const lines = [
      'Generate a music composition using the audioInference tool:',
      '',
      `Prompt: "${prompt}"`,
      '',
      'Recommended settings:',
      `- Model: ${getModelRecommendation(genre)}`,
      `- Duration: ${String(safeDuration)} seconds`,
      '- Output format: MP3',
      '',
      'Audio model options:',
      '- elevenlabs:1@1 - ElevenLabs Music: Best quality, supports composition plans, up to 300 seconds',
      '- elevenlabs:2@1 - ElevenLabs SFX: Best for sound effects, shorter clips',
      '- mirelo:1@1 - Mirelo Music: Alternative music model',
      '- mirelo:2@1 - Mirelo SFX: Alternative SFX model',
      '',
      'Tips:',
      `- For "${genre}" genre with "${mood}" mood, the prompt emphasis on tempo and emotional words is key.`,
      `- The "${purpose}" purpose determines whether the composition should loop cleanly or have a clear arc.`,
      getPurposeTip(purpose),
      getInstrumentTip(instruments),
    ];

    if (safeDuration > 60) {
      lines.push(`- For longer compositions (${String(safeDuration)}s), ensure the model supports the duration. ElevenLabs supports up to 300 seconds.`);
    }

    const content = lines.join('\n');

    return [{ role: 'user', content }];
  },
};
