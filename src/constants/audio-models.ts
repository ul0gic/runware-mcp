export type AudioCapability = 'music' | 'sfx' | 'speech' | 'ambient' | 'composition';

export type AudioProvider = 'elevenlabs' | 'mirelo';

export interface AudioModel {
  /** AIR identifier (e.g., 'elevenlabs:1@1') */
  readonly id: string;
  readonly name: string;
  readonly provider: AudioProvider;
  readonly capabilities: readonly AudioCapability[];
  /** Seconds. */
  readonly minDuration: number;
  /** Seconds. */
  readonly maxDuration: number;
  readonly supportsComposition: boolean;
  /** Hz. */
  readonly defaultSampleRate: number;
  /** kbps. */
  readonly defaultBitrate: number;
  /** USD. */
  readonly costPerSecond?: number;
  readonly notes?: string;
}

/** Keys use the AIR format (provider:version@variant) required by the Runware API. */
export const AUDIO_MODELS = {
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

export type AudioModelId = keyof typeof AUDIO_MODELS;

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

export type TTSVoice = (typeof TTS_VOICES)[number];

export interface TTSVoiceInfo {
  readonly id: TTSVoice;
  readonly name: string;
  readonly gender: 'male' | 'female' | 'neutral';
  readonly style: string;
  readonly bestFor: readonly string[];
}

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

export function getAudioModel(modelId: string): AudioModel | undefined {
  if (isValidAudioModel(modelId)) {
    return AUDIO_MODELS[modelId];
  }
  return undefined;
}

export function getAudioModelsByCapability(capability: AudioCapability): AudioModel[] {
  return Object.values(AUDIO_MODELS).filter((model: AudioModel) =>
    (model.capabilities).includes(capability),
  );
}

export function getAudioModelsByProvider(provider: AudioProvider): AudioModel[] {
  return Object.values(AUDIO_MODELS).filter((model) => model.provider === provider);
}

export function getAllAudioProviders(): AudioProvider[] {
  const providers = new Set(Object.values(AUDIO_MODELS).map((model) => model.provider));
  return [...providers];
}

export function getDefaultAudioModel(): AudioModel {
  return AUDIO_MODELS['elevenlabs:1@1'];
}

export function getAudioModelsWithComposition(): AudioModel[] {
  return Object.values(AUDIO_MODELS).filter((model) => model.supportsComposition);
}

export function getAudioModelsByMinDuration(minDurationSeconds: number): AudioModel[] {
  return Object.values(AUDIO_MODELS).filter((model) => model.maxDuration >= minDurationSeconds);
}

export function isValidAudioModel(modelId: string): modelId is AudioModelId {
  return modelId in AUDIO_MODELS;
}

export function isValidTTSVoice(voice: string): voice is TTSVoice {
  return TTS_VOICES.includes(voice as TTSVoice);
}

export function getTTSVoiceInfo(voice: TTSVoice): TTSVoiceInfo {
  return TTS_VOICE_INFO[voice];
}

export function getTTSVoicesByGender(gender: 'male' | 'female' | 'neutral'): TTSVoice[] {
  return TTS_VOICES.filter((voice) => TTS_VOICE_INFO[voice].gender === gender);
}

export function getAllAudioModelIds(): AudioModelId[] {
  return Object.keys(AUDIO_MODELS) as AudioModelId[];
}

export function getAllTTSVoices(): TTSVoice[] {
  return [...TTS_VOICES];
}
