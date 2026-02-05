/**
 * Audio Models Constants
 *
 * Complete catalog of audio generation models and TTS voices supported by Runware API.
 * Models use AIR (AI Resource) identifiers in the format: provider:version@variant
 *
 * @remarks
 * The object keys use the AIR format which contains colons and at-signs.
 * This is intentional as it matches the Runware API model identifiers.
 */

/**
 * Audio model capabilities
 */
export type AudioCapability = 'music' | 'sfx' | 'speech' | 'ambient' | 'composition';

/**
 * Audio provider identifiers
 */
export type AudioProvider = 'elevenlabs' | 'mirelo';

/**
 * Audio model definition
 */
export interface AudioModel {
  /** AIR identifier (e.g., 'elevenlabs:1@1') */
  readonly id: string;
  /** Human-readable display name */
  readonly name: string;
  /** Provider name */
  readonly provider: AudioProvider;
  /** Supported audio generation capabilities */
  readonly capabilities: readonly AudioCapability[];
  /** Minimum duration in seconds */
  readonly minDuration: number;
  /** Maximum duration in seconds */
  readonly maxDuration: number;
  /** Whether model supports structured composition plans */
  readonly supportsComposition: boolean;
  /** Default sample rate in Hz */
  readonly defaultSampleRate: number;
  /** Default bitrate in kbps */
  readonly defaultBitrate: number;
  /** Estimated cost per second (USD) */
  readonly costPerSecond?: number;
  /** Additional notes */
  readonly notes?: string;
}

/**
 * Complete catalog of audio generation models
 *
 * Keys use AIR format (provider:version@variant) which is required by the Runware API.
 */
export const AUDIO_MODELS = {
  // =============================================================================
  // ElevenLabs Models
  // =============================================================================

  'elevenlabs:1@1': {
    id: 'elevenlabs:1@1',
    name: 'ElevenLabs Music',
    provider: 'elevenlabs',
    capabilities: ['music', 'speech', 'composition'] as const,
    minDuration: 10,
    maxDuration: 300,
    supportsComposition: true,
    defaultSampleRate: 44_100,
    defaultBitrate: 192,
    costPerSecond: 0.01,
    notes: 'Full-featured music generation with composition plans, global styles, sections, timing, and lyrics',
  },

  'elevenlabs:1@2': {
    id: 'elevenlabs:1@2',
    name: 'ElevenLabs Music HD',
    provider: 'elevenlabs',
    capabilities: ['music', 'speech', 'composition'] as const,
    minDuration: 10,
    maxDuration: 300,
    supportsComposition: true,
    defaultSampleRate: 48_000,
    defaultBitrate: 320,
    costPerSecond: 0.015,
    notes: 'High-definition audio output with enhanced fidelity',
  },

  // =============================================================================
  // Mirelo Models
  // =============================================================================

  'mirelo:1@1': {
    id: 'mirelo:1@1',
    name: 'Mirelo Audio',
    provider: 'mirelo',
    capabilities: ['sfx', 'ambient'] as const,
    minDuration: 5,
    maxDuration: 60,
    supportsComposition: false,
    defaultSampleRate: 44_100,
    defaultBitrate: 192,
    costPerSecond: 0.005,
    notes: 'Sound effects and ambient audio generation with temporal offset for video sync',
  },

  'mirelo:1@2': {
    id: 'mirelo:1@2',
    name: 'Mirelo Audio Pro',
    provider: 'mirelo',
    capabilities: ['sfx', 'ambient', 'music'] as const,
    minDuration: 5,
    maxDuration: 120,
    supportsComposition: false,
    defaultSampleRate: 48_000,
    defaultBitrate: 256,
    costPerSecond: 0.008,
    notes: 'Extended duration and music capability for longer ambient tracks',
  },
} as const satisfies Record<string, AudioModel>;

/**
 * Type for valid audio model IDs
 */
export type AudioModelId = keyof typeof AUDIO_MODELS;

/**
 * Text-to-Speech voice options
 * These are the available voices for TTS in video and audio generation
 */
export const TTS_VOICES = [
  // OpenAI-style voices
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer',
  // Character voices
  'adam',
  'bella',
  'chris',
  'dorothy',
  'emily',
  'freya',
  'george',
  'harry',
] as const;

/**
 * Type for valid TTS voice names
 */
export type TTSVoice = (typeof TTS_VOICES)[number];

/**
 * TTS voice metadata
 */
export interface TTSVoiceInfo {
  /** Voice identifier */
  readonly id: TTSVoice;
  /** Display name */
  readonly name: string;
  /** Voice gender */
  readonly gender: 'male' | 'female' | 'neutral';
  /** Voice style/character description */
  readonly style: string;
  /** Best use cases */
  readonly bestFor: readonly string[];
}

/**
 * Detailed TTS voice information
 */
export const TTS_VOICE_INFO: Record<TTSVoice, TTSVoiceInfo> = {
  // OpenAI-style voices
  alloy: {
    id: 'alloy',
    name: 'Alloy',
    gender: 'neutral',
    style: 'Balanced and versatile',
    bestFor: ['general narration', 'educational content', 'documentation'],
  },
  echo: {
    id: 'echo',
    name: 'Echo',
    gender: 'male',
    style: 'Warm and resonant',
    bestFor: ['storytelling', 'audiobooks', 'podcasts'],
  },
  fable: {
    id: 'fable',
    name: 'Fable',
    gender: 'neutral',
    style: 'Expressive and engaging',
    bestFor: ['children content', 'fantasy', 'animation'],
  },
  onyx: {
    id: 'onyx',
    name: 'Onyx',
    gender: 'male',
    style: 'Deep and authoritative',
    bestFor: ['announcements', 'trailers', 'professional content'],
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    gender: 'female',
    style: 'Bright and clear',
    bestFor: ['customer service', 'tutorials', 'presentations'],
  },
  shimmer: {
    id: 'shimmer',
    name: 'Shimmer',
    gender: 'female',
    style: 'Soft and soothing',
    bestFor: ['meditation', 'ASMR', 'relaxation'],
  },
  // Character voices
  adam: {
    id: 'adam',
    name: 'Adam',
    gender: 'male',
    style: 'Friendly and approachable',
    bestFor: ['casual content', 'vlogs', 'social media'],
  },
  bella: {
    id: 'bella',
    name: 'Bella',
    gender: 'female',
    style: 'Energetic and youthful',
    bestFor: ['marketing', 'entertainment', 'lifestyle'],
  },
  chris: {
    id: 'chris',
    name: 'Chris',
    gender: 'male',
    style: 'Professional and confident',
    bestFor: ['business', 'corporate', 'news'],
  },
  dorothy: {
    id: 'dorothy',
    name: 'Dorothy',
    gender: 'female',
    style: 'Mature and wise',
    bestFor: ['documentary', 'historical', 'educational'],
  },
  emily: {
    id: 'emily',
    name: 'Emily',
    gender: 'female',
    style: 'Warm and conversational',
    bestFor: ['interviews', 'dialogues', 'personal stories'],
  },
  freya: {
    id: 'freya',
    name: 'Freya',
    gender: 'female',
    style: 'Elegant and sophisticated',
    bestFor: ['luxury brands', 'fashion', 'art'],
  },
  george: {
    id: 'george',
    name: 'George',
    gender: 'male',
    style: 'Calm and measured',
    bestFor: ['technical content', 'science', 'explanations'],
  },
  harry: {
    id: 'harry',
    name: 'Harry',
    gender: 'male',
    style: 'Enthusiastic and dynamic',
    bestFor: ['sports', 'gaming', 'action content'],
  },
} as const;

/**
 * Get an audio model by its AIR identifier
 */
export function getAudioModel(modelId: string): AudioModel | undefined {
  if (isValidAudioModel(modelId)) {
    return AUDIO_MODELS[modelId];
  }
  return undefined;
}

/**
 * Get all audio models with a specific capability
 */
export function getAudioModelsByCapability(capability: AudioCapability): AudioModel[] {
  return Object.values(AUDIO_MODELS).filter((model: AudioModel) =>
    (model.capabilities).includes(capability),
  );
}

/**
 * Get all audio models from a specific provider
 */
export function getAudioModelsByProvider(provider: AudioProvider): AudioModel[] {
  return Object.values(AUDIO_MODELS).filter((model) => model.provider === provider);
}

/**
 * Get all unique audio provider names
 */
export function getAllAudioProviders(): AudioProvider[] {
  const providers = new Set(Object.values(AUDIO_MODELS).map((model) => model.provider));
  return [...providers];
}

/**
 * Get the default audio model (ElevenLabs Music)
 */
export function getDefaultAudioModel(): AudioModel {
  return AUDIO_MODELS['elevenlabs:1@1'];
}

/**
 * Get audio models that support composition plans
 */
export function getAudioModelsWithComposition(): AudioModel[] {
  return Object.values(AUDIO_MODELS).filter((model) => model.supportsComposition);
}

/**
 * Get audio models that support the specified minimum duration
 */
export function getAudioModelsByMinDuration(minDurationSeconds: number): AudioModel[] {
  return Object.values(AUDIO_MODELS).filter((model) => model.maxDuration >= minDurationSeconds);
}

/**
 * Check if a model ID is a valid audio model
 */
export function isValidAudioModel(modelId: string): modelId is AudioModelId {
  return modelId in AUDIO_MODELS;
}

/**
 * Check if a voice name is a valid TTS voice
 */
export function isValidTTSVoice(voice: string): voice is TTSVoice {
  return TTS_VOICES.includes(voice as TTSVoice);
}

/**
 * Get TTS voice information
 */
export function getTTSVoiceInfo(voice: TTSVoice): TTSVoiceInfo {
  return TTS_VOICE_INFO[voice];
}

/**
 * Get TTS voices by gender
 */
export function getTTSVoicesByGender(gender: 'male' | 'female' | 'neutral'): TTSVoice[] {
  return TTS_VOICES.filter((voice) => TTS_VOICE_INFO[voice].gender === gender);
}

/**
 * Get all audio model IDs
 */
export function getAllAudioModelIds(): AudioModelId[] {
  return Object.keys(AUDIO_MODELS) as AudioModelId[];
}

/**
 * Get all TTS voices as array
 */
export function getAllTTSVoices(): TTSVoice[] {
  return [...TTS_VOICES];
}
